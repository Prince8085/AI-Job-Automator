/**
 * Validation Middleware
 * Centralized validation using express-validator
 */

import {
  body,
  query,
  param,
  validationResult,
  ValidationChain,
} from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Validate request and pass errors to next middleware
 */
export const validateRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err: any) => ({
      field: err.param || 'unknown',
      message: err.msg,
      value: err.value,
    }));

    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: errorMessages,
    });

    const error = new ValidationError(
      'Validation failed',
      errorMessages
    );
    return next(error);
  }

  next();
};

/**
 * Common validation chains
 */
export const validators = {
  // User validators
  registerUser: [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
  ],

  loginUser: [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio must be less than 500 characters'),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Invalid phone number'),
  ],

  // Job validators
  createJob: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Job title is required')
      .isLength({ min: 3, max: 200 })
      .withMessage('Job title must be between 3 and 200 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Job description is required'),
    body('company')
      .trim()
      .notEmpty()
      .withMessage('Company name is required'),
    body('location')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Location must be less than 200 characters'),
    body('salary')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Salary must be a positive number'),
    body('jobType')
      .isIn(['full-time', 'part-time', 'contract', 'freelance'])
      .withMessage('Invalid job type'),
  ],

  updateJob: [
    body('id').isUUID().withMessage('Invalid job ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Job title must be between 3 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Job description cannot be empty if provided'),
    body('status')
      .optional()
      .isIn(['draft', 'published', 'closed', 'archived'])
      .withMessage('Invalid job status'),
  ],

  // Payment validators
  createPayment: [
    body('amount')
      .isFloat({ min: 1 })
      .withMessage('Amount must be at least 1'),
    body('currency')
      .optional()
      .default('INR')
      .isLength({ min: 3, max: 3 })
      .matches(/^[A-Z]{3}$/)
      .withMessage('Invalid currency code'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
  ],

  // Pagination validators
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be greater than 0')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    query('sort')
      .optional()
      .trim()
      .matches(/^-?[a-zA-Z_]+$/)
      .withMessage('Invalid sort field'),
  ],

  // ID validators
  userId: [param('userId').isUUID().withMessage('Invalid user ID')],
  jobId: [param('jobId').isUUID().withMessage('Invalid job ID')],
  paymentId: [
    param('paymentId').isUUID().withMessage('Invalid payment ID'),
  ],

  // Email validators
  email: [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  ],

  // Resume validators
  uploadResume: [
    body('fileName')
      .notEmpty()
      .withMessage('File name is required')
      .matches(/\.(pdf|doc|docx)$/)
      .withMessage('File must be PDF, DOC, or DOCX'),
    body('fileSize')
      .isInt({ min: 0, max: 5242880 })
      .withMessage('File size must be less than 5MB'),
  ],

  // Cover letter validators
  generateCoverLetter: [
    body('jobTitle')
      .notEmpty()
      .withMessage('Job title is required')
      .isLength({ min: 3 })
      .withMessage('Job title is too short'),
    body('company')
      .notEmpty()
      .withMessage('Company name is required'),
    body('skills')
      .optional()
      .isArray()
      .withMessage('Skills must be an array'),
  ],

  // AI prompt validators
  generateAIContent: [
    body('prompt')
      .notEmpty()
      .withMessage('Prompt is required')
      .isLength({ min: 10, max: 5000 })
      .withMessage('Prompt must be between 10 and 5000 characters'),
    body('contentType')
      .isIn([
        'cover-letter',
        'interview-questions',
        'follow-up',
        'outreach',
        'career-plan',
      ])
      .withMessage('Invalid content type'),
  ],
};

/**
 * Chainable validation builder
 */
export class ValidationBuilder {
  private chains: ValidationChain[] = [];

  string(field: string, options: { min?: number; max?: number } = {}) {
    this.chains.push(
      body(field)
        .trim()
        .notEmpty()
        .withMessage(`${field} is required`)
        .isLength({ min: options.min || 1, max: options.max || 1000 })
        .withMessage(
          `${field} must be between ${options.min || 1} and ${options.max || 1000} characters`
        )
    );
    return this;
  }

  email(field: string = 'email') {
    this.chains.push(
      body(field).isEmail().normalizeEmail().withMessage('Invalid email')
    );
    return this;
  }

  number(
    field: string,
    options: { min?: number; max?: number } = {}
  ) {
    this.chains.push(
      body(field)
        .isFloat(options)
        .withMessage(`${field} must be a valid number`)
    );
    return this;
  }

  optional() {
    if (this.chains.length > 0) {
      const lastChain = this.chains[this.chains.length - 1];
      this.chains[this.chains.length - 1] = lastChain.optional();
    }
    return this;
  }

  build(): ValidationChain[] {
    return this.chains;
  }
}

export default {
  validateRequest,
  validators,
  ValidationBuilder,
};
