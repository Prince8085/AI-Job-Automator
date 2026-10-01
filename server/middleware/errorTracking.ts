/**
 * Error Monitoring & Logging Service
 * Console-based error tracking. Sentry was removed because the
 * `@sentry/express` package does not exist on npm and `@sentry/react` v7
 * is incompatible with React 19 (peer dependency conflict).
 * Swap in a real error-tracking provider here when needed.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Initialize error tracking (no-op placeholder)
 */
export const initializeSentry = (app: any) => {
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    console.warn(
      '⚠️ SENTRY_DSN is set but Sentry is not bundled. Error tracking falls back to console logging.'
    );
  }
  return app;
};

/**
 * Apply error handler middleware (no-op placeholder)
 */
export const applySentryErrorHandler = (app: any) => {
  return app;
};

/**
 * Custom error logger for console
 */
export class ErrorLogger {
  /**
   * Log an error with context
   */
  static captureException(
    error: Error,
    context: {
      userId?: string;
      action?: string;
      resourceId?: string;
      severity?: 'fatal' | 'error' | 'warning' | 'info';
      tags?: Record<string, string>;
      extra?: Record<string, any>;
    }
  ) {
    const severity = context.severity || 'error';

    console.error(`[${severity.toUpperCase()}] ${error.message}`, {
      action: context.action,
      userId: context.userId,
      resourceId: context.resourceId,
      stack: error.stack,
    });
  }

  /**
   * Log a message with context
   */
  static captureMessage(
    message: string,
    context: {
      userId?: string;
      action?: string;
      level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
      tags?: Record<string, string>;
      extra?: Record<string, any>;
    }
  ) {
    const level = context.level || 'info';

    console.log(`[${level.toUpperCase()}] ${message}`, {
      action: context.action,
      userId: context.userId,
    });
  }
}

/**
 * Express middleware for error handling
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = (err as any).statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Extract useful context
  const context = {
    userId: (req as any).userId,
    action: `${req.method} ${req.path}`,
    severity: (statusCode >= 500 ? 'error' : 'warning') as 'error' | 'warning',
    tags: {
      method: req.method,
      path: req.path,
    },
    extra: {
      query: req.query,
      body: isDevelopment ? req.body : undefined,
    },
  };

  // Log the error
  ErrorLogger.captureException(err, context);

  // Send response to client
  return res.status(statusCode).json({
    success: false,
    error: isDevelopment ? err.message : 'An error occurred',
    ...(isDevelopment && { stack: err.stack }),
    retryable: statusCode >= 500,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Async error wrapper for route handlers
 * Wraps async functions to catch errors automatically
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      ErrorLogger.captureException(error, {
        userId: (req as any).userId,
        action: `${req.method} ${req.path}`,
        severity: 'error',
      });
      next(error);
    });
  };
};

/**
 * Performance monitoring middleware
 */
export const performanceMonitor = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Hook into response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Warn if slow
    if (duration > 5000) {
      ErrorLogger.captureMessage(
        `Slow request: ${req.method} ${req.path} took ${duration}ms`,
        {
          level: 'warning',
          action: `${req.method} ${req.path}`,
          extra: { durationMs: duration },
        }
      );
    }

    // Log performance metrics
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`⏱️  Slow endpoint: ${req.method} ${req.path} (${duration}ms)`);
    }
  });

  next();
};

/**
 * Request logging middleware
 */
export const requestLogger = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  console.log(
    `📨 ${req.method} ${req.path}`,
    req.query && Object.keys(req.query).length > 0 ? `?${new URLSearchParams(req.query as any).toString()}` : ''
  );

  next();
};
