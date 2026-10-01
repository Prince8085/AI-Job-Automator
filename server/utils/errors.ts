/**
 * Error Handling & API Response Formatter
 * Production-ready error handling and consistent API responses
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code || 'UNKNOWN_ERROR',
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
      },
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(500, message, 'INTERNAL_SERVER_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, message, 'RATE_LIMIT_EXCEEDED');
  }
}

export class AIServiceError extends AppError {
  constructor(message: string) {
    super(503, message, 'AI_SERVICE_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(500, message, 'DATABASE_ERROR');
  }
}

/**
 * API Response Wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    version: string;
  };
}

export class ResponseFormatter {
  static success<T>(
    data: T,
    _message?: string,
    requestId?: string
  ): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0',
      },
    };
  }

  static error(error: AppError | Error, requestId?: string): ApiResponse {
    if (error instanceof AppError) {
      return {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message,
          statusCode: error.statusCode,
          details: error.details,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          version: '1.0',
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
        statusCode: 500,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0',
      },
    };
  }

  static paginated<T>(
    items: T[],
    totalCount: number,
    page: number,
    pageSize: number,
    requestId?: string
  ): ApiResponse<T[]> {
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      success: true,
      data: items,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0',
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      } as any,
    };
  }
}

export default ResponseFormatter;
