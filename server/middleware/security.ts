/**
 * Security & Rate Limiting Middleware
 * Add these to server/index.ts
 */

import rateLimit from 'express-rate-limit';
import { body, validationResult, query } from 'express-validator';
import express from 'express';

// ============================================
// RATE LIMITERS
// ============================================

/**
 * General API limiter - 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip limiter for health checks
    if (req.path === '/api/health') return true;
    return false;
  },
});

/**
 * AI request limiter - 10 AI calls per minute per user
 * Prevents burning through Gemini quota
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI requests per minute
  message: 'Too many AI requests, please try again in a few moments',
  keyGenerator: (req) => {
    // Use user ID from request if available, fallback to IP
    return (req as any).userId || req.ip || 'anonymous';
  },
});

/**
 * Job scraping limiter - 50 scrapes per hour
 */
export const scrapingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 scraping requests per hour
  message: 'Job scraping quota exceeded, try again in an hour',
  keyGenerator: (req) => {
    return (req as any).userId || req.ip || 'anonymous';
  },
});

/**
 * Login limiter - 5 attempts per 15 minutes
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
});

/**
 * Payment limiter - 5 payment attempts per 5 minutes
 */
export const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Too many payment requests, please try again later',
  keyGenerator: (req) => {
    return (req as any).userId || req.ip || 'anonymous';
  },
});

// ============================================
// INPUT VALIDATION MIDDLEWARE
// ============================================

/**
 * Validate job search request
 */
export const validateJobSearch = [
  query('keyword')
    .trim()
    .notEmpty()
    .withMessage('Search keyword required')
    .isLength({ max: 100 })
    .withMessage('Search keyword too long'),
  query('location')
    .trim()
    .notEmpty()
    .withMessage('Location required')
    .isLength({ max: 100 })
    .withMessage('Location too long'),
  query('timeFilter')
    .optional()
    .isIn(['any', '1h', '24h', '7d', '30d'])
    .withMessage('Invalid time filter'),
];

/**
 * Validate payment verification request
 */
export const validatePaymentVerify = [
  body('orderId')
    .trim()
    .notEmpty()
    .withMessage('Order ID required')
    .isLength({ max: 100 })
    .withMessage('Order ID invalid'),
  body('paymentId')
    .trim()
    .notEmpty()
    .withMessage('Payment ID required')
    .isLength({ max: 100 })
    .withMessage('Payment ID invalid'),
  body('signature')
    .trim()
    .notEmpty()
    .withMessage('Signature required')
    .isLength({ max: 500 })
    .withMessage('Signature invalid'),
  body('userId')
    .trim()
    .notEmpty()
    .withMessage('User ID required')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('credits')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Credits must be between 1 and 10000'),
];

/**
 * Validate LinkedIn scraper request
 */
export const validateLinkedInScrape = [
  body('hashtag')
    .optional()
    .trim()
    .matches(/^#[\w]{1,50}$/)
    .withMessage('Invalid hashtag format'),
  body('companyUrl')
    .optional()
    .isURL()
    .withMessage('Invalid company URL'),
  body('profileUrl')
    .optional()
    .isURL()
    .withMessage('Invalid profile URL'),
];

/**
 * Validate resume generation request
 */
export const validateResumeGeneration = [
  body('jobDescription')
    .trim()
    .notEmpty()
    .withMessage('Job description required')
    .isLength({ min: 50, max: 50000 })
    .withMessage('Job description must be 50-50000 characters'),
  body('userId')
    .trim()
    .notEmpty()
    .withMessage('User ID required')
    .isUUID()
    .withMessage('Invalid user ID format'),
];

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Request validation failed',
      details: errors.array().map((err: any) => ({
        field: err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};

// ============================================
// SANITIZATION & ERROR HANDLING
// ============================================

/**
 * Sanitize request inputs  
 */
export const sanitizeInputs = (
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) => {
  // Remove potentially dangerous fields
  if (req.body) {
    delete (req.body as any).admin;
    delete (req.body as any).Role;
    delete (req.body as any).__proto__;
  }

  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Strict Transport Security (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};

/**
 * CSRF Protection - Simple token validation
 * In production, use csrf package for better protection
 */
export const validateCsrfToken = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // Skip CSRF check for GET requests
  if (req.method === 'GET') {
    return next();
  }

  const token = req.headers['x-csrf-token'];

  if (!token) {
    // In development mode, allow without token
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'CSRF token missing',
      retryable: false,
    });
  }

  next();
};

/**
 * Usage in server/index.ts:
 *
 * import {
 *   generalLimiter,
 *   aiLimiter,
 *   scrapingLimiter,
 *   paymentLimiter,
 *   validateJobSearch,
 *   validatePaymentVerify,
 *   handleValidationErrors,
 *   sanitizeInputs,
 *   securityHeaders
 * } from './middleware/security';
 *
 * // Apply global middleware
 * app.use(generalLimiter);
 * app.use(sanitizeInputs);
 * app.use(securityHeaders);
 *
 * // Apply route-specific middleware
 * app.get('/api/jobs/search', scrapingLimiter, validateJobSearch, handleValidationErrors, searchJobs);
 * app.post('/api/payments/verify', paymentLimiter, validatePaymentVerify, handleValidationErrors, verifyPayment);
 * app.post('/api/resume/generate', aiLimiter, validateResumeGeneration, handleValidationErrors, generateResume);
 */
