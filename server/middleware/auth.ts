/**
 * Authentication & Authorization Middleware
 * Handles Clerk authentication and role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

/**
 * Extend Express Request with auth properties
 */
declare global {
  namespace Express {
    interface Request {
      auth?: { userId?: string; userMetadata?: Record<string, any>; permissions?: string[] };
      userId?: string;
      userEmail?: string;
      userRole?: string;
    }
  }
}

/**
 * Require authentication
 * Placeholder — wire in Clerk's express middleware (@clerk/express)
 * when server-side auth is integrated.
 */
export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).auth?.userId || (req as any).userId;
    if (!userId) {
      throw new AuthenticationError('No authentication provided');
    }
    req.userId = userId;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication (doesn't fail if not authenticated)
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).auth?.userId;
    if (userId) {
      req.userId = userId;
      logger.setContext({ userId });
    }
    next();
  } catch (error) {
    next();
  }
};

/**
 * Enhanced auth with role extraction
 */
export const enhancedAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const auth = (req as any).auth;

    if (!auth?.userId) {
      throw new AuthenticationError('No authentication provided');
    }

    req.userId = auth.userId;

    // Extract user metadata for role
    const userMetadata = auth.userMetadata || {};
    req.userRole = userMetadata.role || 'user';

    logger.setContext({
      userId: req.userId,
      userRole: req.userRole,
    });

    next();
  } catch (error) {
    logger.error('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(new AuthenticationError());
  }
};

/**
 * Role-based access control
 */
export const requireRole =
  (...allowedRoles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.userId) {
        throw new AuthenticationError('Authentication required');
      }

      const userRole = req.userRole || 'user';

      if (!allowedRoles.includes(userRole)) {
        logger.warn('Unauthorized access attempt', {
          userId: req.userId,
          userRole,
          allowedRoles,
          path: req.path,
        });

        throw new AuthorizationError(
          `This action requires one of the following roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

/**
 * Permission-based access control
 */
export const requirePermission =
  (permission: string) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.userId) {
        throw new AuthenticationError('Authentication required');
      }

      const auth = (req as any).auth;
      const permissions = auth?.permissions || [];

      if (!permissions.includes(permission)) {
        logger.warn('Permission denied', {
          userId: req.userId,
          permission,
          path: req.path,
        });

        throw new AuthorizationError(
          `This action requires the ${permission} permission`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

/**
 * Owner-only access (user can only access their own resources)
 */
export const ownerOnly =
  (resourceIdParam: string = 'userId') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.userId) {
        throw new AuthenticationError('Authentication required');
      }

      const resourceUserId = req.params[resourceIdParam];

      if (req.userId !== resourceUserId) {
        logger.warn('Owner-only access denied', {
          userId: req.userId,
          resourceUserId,
          path: req.path,
        });

        throw new AuthorizationError(
          'You can only access your own resources'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

/**
 * Rate limiting by user
 */
const userRateLimits = new Map<
  string,
  { count: number; resetTime: number }
>();

export const rateLimitByUser =
  (maxRequests: number = 100, windowMs: number = 60000) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.userId) {
        return next();
      }

      const now = Date.now();
      const limit = userRateLimits.get(req.userId);

      if (!limit || now > limit.resetTime) {
        userRateLimits.set(req.userId, {
          count: 1,
          resetTime: now + windowMs,
        });
        next();
      } else if (limit.count < maxRequests) {
        limit.count++;
        next();
      } else {
        logger.warn('User rate limit exceeded', {
          userId: req.userId,
          limit: maxRequests,
          window: `${windowMs}ms`,
        });

        res.header('X-RateLimit-Limit', maxRequests.toString());
        res.header('X-RateLimit-Remaining', '0');
        res.header(
          'X-RateLimit-Reset',
          Math.ceil(limit.resetTime / 1000).toString()
        );

        next(
          new Error(`Rate limit exceeded: ${maxRequests} requests per minute`)
        );
      }
    } catch (error) {
      next(error);
    }
  };

/**
 * Get user info from request
 */
export const getUserInfo = (req: Request) => {
  return {
    userId: req.userId,
    userRole: req.userRole || 'user',
    isAuthenticated: Boolean(req.userId),
  };
};

/**
 * Check if user has specific role
 */
export const hasRole = (req: Request, role: string): boolean => {
  return req.userRole === role;
};

/**
 * Check if user is admin
 */
export const isAdmin = (req: Request): boolean => {
  return hasRole(req, 'admin');
};

/**
 * Check if user is moderator
 */
export const isModerator = (req: Request): boolean => {
  return hasRole(req, 'moderator') || isAdmin(req);
};

export default {
  requireAuth,
  optionalAuth,
  enhancedAuth,
  requireRole,
  requirePermission,
  ownerOnly,
  rateLimitByUser,
  getUserInfo,
  hasRole,
  isAdmin,
  isModerator,
};
