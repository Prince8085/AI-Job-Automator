/**
 * Production Express Server with Enterprise Architecture
 * Integrates all middleware, services, and error handling
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { ResponseFormatter, AppError } from './utils/errors';
import { metricsCollector } from './utils/metrics';
import { cacheManager } from './utils/cache';
import { dbService } from './services/databaseService';
import { nvidiaClient } from './utils/apiClient';
import {
  requestInterceptor,
  responseInterceptor,
  performanceMonitor,
} from './middleware/interceptor';
import { scrapeInternshala, scrapeLinkedInJobs } from './scrapers/index.js';
import { enhancedJobSearchService } from './services/enhancedJobSearchService';
import { JobService } from '../db/services/jobService';
import { createPaymentRoutes } from './routes/payment';
import { createUserDataRoutes } from './routes/userData';

// Initialize Express app
const app: Express = express();
const PORT = config.PORT;

/**
 * Security Middleware
 */
/**
 * CORS Configuration
 */
// Security headers (CSP disabled — the frontend loads Tailwind CDN, esm.sh
// imports and third-party fonts/scripts; enabling a strict CSP here would break it)
app.use(helmet({ contentSecurityPolicy: false }));

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5176',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5176',
      ...(config.isProduction() ? [process.env.FRONTEND_URL] : []),
    ].filter((origin): origin is string => Boolean(origin)),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  })
);

/**
 * Body Parser
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/**
 * Global Request Interceptors
 */
app.use(requestInterceptor);
app.use(responseInterceptor);
app.use(performanceMonitor);

/**
 * Rate Limiting
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: (req) => req.method !== 'POST',
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Stricter limit for AI endpoints
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/ai/', aiLimiter);

/**
 * Database Connection Check
 */
app.use(async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const isHealthy = await dbService.getHealth();
    if (!isHealthy && req.path !== '/api/health') {
      logger.warn('Database connection unstable', {
        path: req.path,
        method: req.method,
      });
    }
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Routes
 */
createPaymentRoutes(app);
createUserDataRoutes(app);

/**
 * Health Check Endpoint
 */
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const dbHealth = await dbService.getHealth();
    const metrics = metricsCollector.getHealth();

    res.json({ 
          success: true,
      database: dbHealth,
      health: metrics,
      cache: cacheManager.getStats(),
      metrics: metricsCollector.getSummary(),
    });
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(503).json({
      success: false,
      error: 'Service unavailable',
    });
  }
});

/**
 * Metrics Endpoint (Admin Only)
 */
app.get('/api/metrics', async (_req: Request, res: Response) => {
  try {
    const summary = metricsCollector.getSummary();

    res.json(ResponseFormatter.success(summary, 'Metrics retrieved', (_req as any).id));
  } catch (error) {
    res.json(ResponseFormatter.error(error as Error, (_req as any).id));
  }
});

/**
 * Cache Status Endpoint
 */
app.get('/api/cache/stats', (_req: Request, res: Response) => {
  try {
    const stats = cacheManager.getStats();
    res.json(ResponseFormatter.success(stats, 'Cache stats retrieved', (_req as any).id));
  } catch (error) {
    res.json(ResponseFormatter.error(error as Error, (_req as any).id));
  }
});

/**
 * AI Chat Proxy Endpoint (avoids browser CORS issues with NVIDIA direct calls)
 */
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { prompt, model, maxTokens, temperature, topP } = req.body || {};

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 2) {
      return res.status(400).json(
        ResponseFormatter.error(new Error('Valid prompt is required'), (req as any).id)
      );
    }

    const content = await nvidiaClient.generateText(prompt, {
      model: typeof model === 'string' ? model : undefined,
      maxTokens: Number.isFinite(Number(maxTokens))
        ? Math.min(Math.max(Number(maxTokens), 32), 2048)
        : 1024,
      temperature: Number.isFinite(Number(temperature)) ? Number(temperature) : 0.7,
      topP: Number.isFinite(Number(topP)) ? Number(topP) : 0.95,
      timeout: 90000,
      retries: 1,
    });

    return res.json(
      ResponseFormatter.success(
        { content },
        'AI response generated',
        (req as any).id
      )
    );
  } catch (error) {
    logger.error('AI proxy request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      action: 'ai.chat.proxy.error',
    });
    return res.status(500).json(
      ResponseFormatter.error(error as Error, (req as any).id)
    );
  }
});

// ============================================
// JOB SEARCH ENDPOINTS
// ============================================

/**
 * Search Internshala internships (India)
 */
app.get('/api/jobs/internshala', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyword, location } = req.query;

    logger.info('Internshala job search started', {
      keyword,
      location,
      action: 'internshala.search',
    });

    const cacheKey = `internshala:${keyword}:${location}`;
    const cachedJobs = cacheManager.get(cacheKey);

    if (cachedJobs) {
      metricsCollector.recordHttpRequest('/api/jobs/internshala', 'GET', 200, 50);
      return res.json(
        ResponseFormatter.success(
          cachedJobs,
          'Jobs from cache',
          (req as any).id
        )
      );
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Internshala scraping timeout')),
        25000
      )
    );

    const jobs = (await Promise.race([
      scrapeInternshala(keyword?.toString() || 'developer', location?.toString() || ''),
      timeoutPromise,
    ])) as any[];

    // Cache results for 30 minutes
    cacheManager.set(cacheKey, jobs, 30 * 60 * 1000);

    metricsCollector.recordHttpRequest('/api/jobs/internshala', 'GET', 200, 100);

    res.json(
      ResponseFormatter.success(
        {
          source: 'internshala',
          count: jobs.length,
          jobs,
          cached: false,
        },
        'Jobs retrieved from Internshala',
        (req as any).id
      )
    );
  } catch (error) {
    const statusCode = (error as any).message?.includes('timeout') ? 504 : 500;
    metricsCollector.recordHttpRequest('/api/jobs/internshala', 'GET', statusCode, 0);

    logger.error('Internshala scraping failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    next(error);
  }
});

/**
 * Search LinkedIn Jobs
 */
app.get('/api/jobs/linkedin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyword, location } = req.query;

    logger.info('LinkedIn job search started', {
      keyword,
      location,
      action: 'linkedin.search',
    });

    const cacheKey = `linkedin:${keyword}:${location}`;
    const cachedJobs = cacheManager.get(cacheKey);

    if (cachedJobs) {
      metricsCollector.recordHttpRequest('/api/jobs/linkedin', 'GET', 200, 50);
      return res.json(
        ResponseFormatter.success(
          cachedJobs,
          'Jobs from cache',
          (req as any).id
        )
      );
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('LinkedIn scraping timeout')),
        25000
      )
    );

    const jobs = (await Promise.race([
      scrapeLinkedInJobs(
        keyword?.toString() || 'developer',
        location?.toString() || 'India'
      ),
      timeoutPromise,
    ])) as any[];

    // Cache results for 30 minutes
    cacheManager.set(cacheKey, jobs, 30 * 60 * 1000);

    metricsCollector.recordHttpRequest('/api/jobs/linkedin', 'GET', 200, 100);

    res.json(
      ResponseFormatter.success(
        {
          source: 'linkedin',
          count: jobs.length,
          jobs,
          cached: false,
        },
        'Jobs retrieved from LinkedIn',
        (req as any).id
      )
    );
  } catch (error) {
    const statusCode = (error as any).message?.includes('timeout') ? 504 : 500;
    metricsCollector.recordHttpRequest('/api/jobs/linkedin', 'GET', statusCode, 0);

    logger.error('LinkedIn scraping failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    next(error);
  }
});

/**
 * Enhanced Job Search Endpoint (NEW - Aggregates from multiple sources)
 */
app.get('/api/jobs/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyword, location, timeFilter = 'any_time', limit = 50, offset = 0 } = req.query;

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length < 2) {
      return res.status(400).json(
        ResponseFormatter.error(
          new Error('Keyword query parameter required (minimum 2 characters)'),
          (req as any).id
        )
      );
    }

    logger.info('Enhanced job search initiated', {
      keyword,
      location: location || 'any',
      timeFilter,
      limit,
      offset,
      action: 'job.search.enhanced',
    });

    const allowedTimeFilters = new Set([
      'any_time',
      'any',
      'last_hour',
      '1h',
      'last_24_hours',
      '24h',
      'last_week',
      '7d',
      'last_month',
      '30d',
    ]);

    const normalizedTimeFilter = String(timeFilter || 'any_time');
    if (!allowedTimeFilters.has(normalizedTimeFilter)) {
      return res.status(400).json(
        ResponseFormatter.error(
          new Error('Invalid timeFilter value'),
          (req as any).id
        )
      );
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit as string, 10) || 50, 1), 200);
    const parsedOffset = Math.max(parseInt(offset as string, 10) || 0, 0);

    // Check cache
    const cacheKey = `job-search:${keyword}:${location || 'any'}:${normalizedTimeFilter}`;
    const cachedResults = cacheManager.get(cacheKey) as any[] | undefined;

    if (cachedResults) {
      metricsCollector.recordHttpRequest('/api/jobs/search', 'GET', 200, 50);
      return res.json(
        ResponseFormatter.success(
          {
            source: 'cache',
            keyword,
            location: location || 'any',
            totalResults: cachedResults.length,
            displayedResults: cachedResults.slice(parsedOffset, parsedOffset + parsedLimit).length,
            pagination: {
              limit: parsedLimit,
              offset: parsedOffset,
              hasMore: cachedResults.length > parsedOffset + parsedLimit,
            },
            results: cachedResults.slice(parsedOffset, parsedOffset + parsedLimit),
            diagnostics: enhancedJobSearchService.getDiagnostics(),
            cached: true,
          },
          'Jobs retrieved from cache',
          (req as any).id
        )
      );
    }

    // Perform search with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Search timeout')), 45000)
    );

    const jobs = await Promise.race([
      enhancedJobSearchService.search({
        keyword: keyword.toString(),
        location: location?.toString(),
        timeFilter: normalizedTimeFilter,
        limit: parsedLimit,
        offset: parsedOffset,
      }),
      timeoutPromise,
    ]) as any[];

    // Cache results for 20 minutes
    if (jobs.length > 0) {
      cacheManager.set(cacheKey, jobs, 20 * 60 * 1000);
    }

    metricsCollector.recordHttpRequest('/api/jobs/search', 'GET', 200, jobs.length);

    const totalResults = jobs.length;
    const paginatedResults = jobs.slice(parsedOffset, parsedOffset + parsedLimit);
    const diagnostics = enhancedJobSearchService.getDiagnostics();

    res.json(
      ResponseFormatter.success(
        {
          source: 'enhanced-aggregation',
          keyword,
          location: location || 'any',
          timeFilter: normalizedTimeFilter,
          totalResults,
          displayedResults: paginatedResults.length,
          pagination: {
            limit: parsedLimit,
            offset: parsedOffset,
            hasMore: totalResults > (parsedOffset + parsedLimit),
          },
          results: paginatedResults,
          diagnostics,
          cached: false,
        },
        `Found ${paginatedResults.length} jobs from multiple trusted sources`,
        (req as any).id
      )
    );
  } catch (error) {
    const statusCode = (error as any).message?.includes('timeout') ? 504 : 500;
    metricsCollector.recordHttpRequest('/api/jobs/search', 'GET', statusCode, 0);

    logger.error('Enhanced job search failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      action: 'job.search.enhanced.error',
    });

    next(error);
  }
});

/**
 * Job Search by Title and Location (Database search)
 */
app.get('/api/jobs/database', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, company, location, jobType, experienceLevel, limit = 20, offset = 0 } = req.query;

    logger.info('Database job search initiated', {
      title,
      company,
      location,
      jobType,
      experienceLevel,
      action: 'job.search.database',
    });

    const jobs = await JobService.searchJobs({
      title: title?.toString(),
      company: company?.toString(),
      location: location?.toString(),
      jobType: jobType?.toString(),
      experienceLevel: experienceLevel?.toString(),
      limit: Math.min(parseInt(limit as string) || 20, 100),
      offset: parseInt(offset as string) || 0,
    });

    metricsCollector.recordHttpRequest('/api/jobs/database', 'GET', 200, jobs.length);

    res.json(
      ResponseFormatter.success(
        {
          source: 'database',
          total: jobs.length,
          results: jobs,
        },
        'Jobs retrieved from database',
        (req as any).id
      )
    );
  } catch (error) {
    metricsCollector.recordHttpRequest('/api/jobs/database', 'GET', 500, 0);

    logger.error('Database job search failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    next(error);
  }
});

/**
 * Get Job Details by ID
 */
app.get('/api/jobs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(
        ResponseFormatter.error(
          new Error('Job ID required'),
          (req as any).id
        )
      );
    }

    const job = await JobService.getJobById(id);

    if (!job) {
      return res.status(404).json(
        ResponseFormatter.error(
          new Error('Job not found'),
          (req as any).id
        )
      );
    }

    metricsCollector.recordHttpRequest('/api/jobs/:id', 'GET', 200, 1);

    res.json(
      ResponseFormatter.success(
        job,
        'Job details retrieved',
        (req as any).id
      )
    );
  } catch (error) {
    metricsCollector.recordHttpRequest('/api/jobs/:id', 'GET', 500, 0);
    next(error);
  }
});

/**
 * Post a New Job
 */
app.post('/api/jobs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobData = req.body;

    const newJob = await JobService.createJob(jobData);

    metricsCollector.recordHttpRequest('/api/jobs', 'POST', 201, 1);

    res.status(201).json(
      ResponseFormatter.success(
        newJob,
        'Job posted successfully',
        (req as any).id
      )
    );
  } catch (error) {
    metricsCollector.recordHttpRequest('/api/jobs', 'POST', 500, 0);
    logger.error('Failed to post job', { error });
    next(error);
  }
});
app.use((req: Request, res: Response) => {
  res.status(404).json(
    ResponseFormatter.error(new Error('Endpoint not found'), (req as any).id)
  );
});

/**
 * Global Error Handler
 */
app.use((error: any, req: Request, res: Response, _next: NextFunction) => {
  // Log error
  logger.error('Unhandled error', {
    error: error.message || 'Unknown error',
    stack: error.stack?.split('\n').slice(0, 3).join(' | '),
    path: req.path,
    method: req.method,
  });

  // Record metrics
  metricsCollector.recordHttpRequest(
    req.path,
    req.method,
    error.statusCode || 500,
    0
  );

  // Send response
  const statusCode = error.statusCode || 500;
  const response =
    error instanceof AppError
      ? error.toJSON()
      : ResponseFormatter.error(error, (req as any).id);

  res
    .status(statusCode)
    .header('x-request-id', (req as any).id)
    .json(response);
});

/**
 * Start Server
 */
const server = app.listen(PORT, () => {
  logger.info('🚀 Production Server Started', {
    port: PORT,
    environment: config.NODE_ENV,
    timestamps: new Date().toISOString(),
  });

  // Log config validation
  if (config.isValidated()) {
    logger.info('✅ All required environment variables configured');
  } else {
    logger.warn('⚠️ Some environment variables may be missing');
  }
});

/**
 * Graceful Shutdown
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');

  server.close(() => {
    logger.info('HTTP server closed');
    cacheManager.resetStats();
    metricsCollector.resetMetrics();
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
