/**
 * Request/Response Interceptor Middleware
 * Logs all requests and responses, tracks performance metrics
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Extended Express Request with custom properties
 */
declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
      userId?: string;
      userEmail?: string;
    }
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 9);
  return `req-${timestamp}-${randomStr}`;
}

/**
 * Request interceptor - logs incoming requests
 */
export const requestInterceptor = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Generate unique request ID
  req.id = req.get('x-request-id') || generateRequestId();

  // Capture start time for performance tracking
  req.startTime = Date.now();

  // Extract user info from Clerk middleware (if available)
  const userId = (req as any).auth?.userId;
  if (userId) {
    req.userId = userId;
  }

  // Log incoming request
  logger.setContext({
    requestId: req.id,
    userId: req.userId,
    action: `${req.method} ${req.path}`,
  });

  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  next();
};

/**
 * Response interceptor - logs outgoing responses
 */
export const responseInterceptor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Capture original send function
  const originalSend = res.send;

  // Override send to capture response
  res.send = function (data: any) {
    const duration = Date.now() - req.startTime;
    const statusCode = res.statusCode;

    // Prepare response for logging
    let responseData: any = undefined;

    if (typeof data === 'string') {
      if (data.length < 500) {
        try {
          responseData = JSON.parse(data);
        } catch {
          responseData = data.substring(0, 100);
        }
      }
    } else if (typeof data === 'object') {
      responseData = data;
    }

    // Log based on status code
    if (statusCode >= 500) {
      logger.error('Request failed', {
        statusCode,
        duration: `${duration}ms`,
        path: req.path,
        error: responseData?.error || 'Unknown error',
      });
    } else if (statusCode >= 400) {
      logger.warn('Bad request', {
        statusCode,
        duration: `${duration}ms`,
        path: req.path,
        error: responseData?.error,
      });
    } else {
      logger.info('Request completed', {
        statusCode,
        duration: `${duration}ms`,
        path: req.path,
      });
    }

    // Call original send
    return originalSend.call(this, data);
  };

  // Set request ID header for client reference
  res.setHeader('x-request-id', req.id);

  next();
};

/**
 * Performance monitoring middleware
 */
export const performanceMonitor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const originalJson = res.json;

  res.json = function (data: any) {
    const duration = Date.now() - req.startTime;

    // Log slow requests (> 1000ms)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        path: req.path,
        method: req.method,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
      });
    }

    // Add performance data to response
    if (data && typeof data === 'object') {
      data.meta = data.meta || {};
      data.meta.responseTime = `${duration}ms`;
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Error logging middleware
 */
export const errorInterceptor = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const duration = Date.now() - req.startTime;

  logger.error('Unhandled error in request', {
    path: req.path,
    method: req.method,
    statusCode: res.statusCode,
    errorMessage: error.message,
    errorStack: error.stack?.split('\n').slice(0, 3).join(' | '),
    duration: `${duration}ms`,
  });

  // Send error response
  const statusCode = (error as any).statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: (error as any).code || 'INTERNAL_SERVER_ERROR',
      message: error.message,
      requestId: req.id,
    },
  });
};

export default {
  requestInterceptor,
  responseInterceptor,
  performanceMonitor,
  errorInterceptor,
};

