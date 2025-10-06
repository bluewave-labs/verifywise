/**
 * @fileoverview Comprehensive Input Validation and Sanitization Middleware
 *
 * Provides secure, reusable validation middleware for all API endpoints.
 * Implements defense-in-depth validation strategy with multiple layers
 * of input sanitization and security checks.
 *
 * **Security Features:**
 * - XSS prevention through HTML entity encoding
 * - SQL injection prevention via input sanitization
 * - NoSQL injection prevention
 * - Path traversal attack prevention
 * - File type validation for uploads
 * - Rate limiting parameter validation
 * - Unicode normalization
 *
 * **Key Benefits:**
 * - Centralized validation logic
 * - Consistent error responses
 * - Type-safe validation schemas
 * - Extensible validation rules
 *
 * @created 2025-10-06
 */

import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult, FieldValidationError } from 'express-validator';

/**
 * Standard validation error response format
 */
interface ValidationErrorResponse {
  status: 'validation_error';
  message: string;
  errors: Array<{
    field: string;
    value: any;
    message: string;
    location: 'body' | 'query' | 'params' | 'headers';
  }>;
  timestamp: string;
}

/**
 * Validation options for different security levels
 */
export interface ValidationOptions {
  sanitizeHTML?: boolean;
  normalizeUnicode?: boolean;
  preventPathTraversal?: boolean;
  maxLength?: number;
  allowEmptyStrings?: boolean;
  customSanitizer?: (value: string) => string;
}

/**
 * XSS-safe HTML sanitization
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') return input;

  // Basic HTML entity encoding
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * SQL injection prevention
 */
export function sanitizeSQL(input: string): string {
  if (typeof input !== 'string') return input;

  // Remove or escape potentially dangerous SQL characters
  return input
    .replace(/'/g, "''")  // Escape single quotes
    .replace(/;/g, '')    // Remove semicolons
    .replace(/--/g, '')   // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL comment start
    .replace(/\*\//g, '') // Remove SQL comment end
    .replace(/xp_/gi, '') // Remove extended stored procedures
    .replace(/sp_/gi, ''); // Remove stored procedures
}

/**
 * NoSQL injection prevention
 */
export function sanitizeNoSQL(input: any): any {
  if (typeof input === 'string') {
    // Remove MongoDB operators
    return input.replace(/\$\w+/g, '');
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeNoSQL);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // Skip keys that start with $ (MongoDB operators)
      if (!key.startsWith('$')) {
        sanitized[key] = sanitizeNoSQL(value);
      }
    }
    return sanitized;
  }

  return input;
}

/**
 * Path traversal attack prevention
 */
export function sanitizePath(input: string): string {
  if (typeof input !== 'string') return input;

  return input
    .replace(/\.\./g, '')     // Remove parent directory references
    .replace(/\\/g, '')       // Remove backslashes
    .replace(/\/+/g, '/')     // Normalize multiple slashes
    .replace(/^\//, '')       // Remove leading slash
    .replace(/\/$/, '');      // Remove trailing slash
}

/**
 * Unicode normalization for consistent handling
 */
export function normalizeUnicode(input: string): string {
  if (typeof input !== 'string') return input;
  return input.normalize('NFC');
}

/**
 * Comprehensive string sanitization
 */
export function sanitizeString(input: string, options: ValidationOptions = {}): string {
  if (typeof input !== 'string') return input;

  let sanitized = input;

  // Apply Unicode normalization
  if (options.normalizeUnicode !== false) {
    sanitized = normalizeUnicode(sanitized);
  }

  // Apply HTML sanitization
  if (options.sanitizeHTML !== false) {
    sanitized = sanitizeHTML(sanitized);
  }

  // Apply path traversal protection
  if (options.preventPathTraversal) {
    sanitized = sanitizePath(sanitized);
  }

  // Apply custom sanitizer
  if (options.customSanitizer) {
    sanitized = options.customSanitizer(sanitized);
  }

  // Apply length limits
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
}

/**
 * Validation error handler middleware
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: any) => ({
      field: error.path || error.param || error.type,
      value: error.value,
      message: error.msg,
      location: error.location as 'body' | 'query' | 'params' | 'headers'
    }));

    const response: ValidationErrorResponse = {
      status: 'validation_error',
      message: 'Request validation failed',
      errors: formattedErrors,
      timestamp: new Date().toISOString()
    };

    res.status(400).json(response);
    return;
  }

  next();
}

/**
 * Outbox Events Query Parameters Validation
 */
export const validateOutboxEventsQuery = [
  query('event_type')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Event type must be 1-100 characters')
    .custom((value) => {
      if (value && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
        throw new Error('Event type must contain only letters, numbers, and underscores');
      }
      return true;
    })
    .customSanitizer((value) => sanitizeString(value, { maxLength: 100 })),

  query('aggregate_type')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Aggregate type must be 1-100 characters')
    .custom((value) => {
      if (value && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
        throw new Error('Aggregate type must contain only letters, numbers, and underscores');
      }
      return true;
    })
    .customSanitizer((value) => sanitizeString(value, { maxLength: 100 })),

  query('status')
    .optional()
    .isIn(['pending', 'processed', 'all', 'failed'])
    .withMessage('Status must be one of: pending, processed, all, failed'),

  query('exclude_acknowledged')
    .optional()
    .isBoolean()
    .withMessage('exclude_acknowledged must be a boolean')
    .toBoolean(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
    .toInt(),

  query('order_by')
    .optional()
    .isIn(['id', 'created_at', 'processed_at', 'event_type', 'aggregate_type', 'attempts', 'available_at', 'tenant'])
    .withMessage('Invalid order_by field'),

  query('order_dir')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('order_dir must be ASC or DESC')
    .customSanitizer((value) => value ? value.toUpperCase() : value),

  handleValidationErrors
];

/**
 * Event Acknowledgment Request Body Validation
 */
export const validateEventAcknowledgment = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer')
    .toInt(),

  body('status')
    .optional()
    .isIn(['processed', 'failed', 'skipped', 'in_progress'])
    .withMessage('Status must be one of: processed, failed, skipped, in_progress'),

  body('processor')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Processor must be 1-100 characters')
    .custom((value) => {
      if (value && !/^[a-zA-Z0-9._-]+$/.test(value)) {
        throw new Error('Processor must contain only letters, numbers, dots, hyphens, and underscores');
      }
      return true;
    })
    .customSanitizer((value) => sanitizeString(value, { maxLength: 100 })),

  body('metadata')
    .optional()
    .custom((value) => {
      if (value !== null && value !== undefined) {
        if (typeof value !== 'object') {
          throw new Error('Metadata must be an object or null');
        }

        // Check for deeply nested objects (prevent DoS)
        const depth = getObjectDepth(value);
        if (depth > 5) {
          throw new Error('Metadata object is too deeply nested (max 5 levels)');
        }

        // Check object size
        const jsonString = JSON.stringify(value);
        if (jsonString.length > 10000) {
          throw new Error('Metadata object is too large (max 10KB)');
        }
      }
      return true;
    })
    .customSanitizer((value) => sanitizeNoSQL(value)),

  handleValidationErrors
];

/**
 * General ID Parameter Validation
 */
export const validateIdParam = (paramName: string = 'id') => [
  param(paramName)
    .isInt({ min: 1 })
    .withMessage(`${paramName} must be a positive integer`)
    .toInt(),

  handleValidationErrors
];

/**
 * Pagination Query Parameters Validation
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('sort')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Sort field must be 1-50 characters')
    .custom((value) => {
      if (value && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
        throw new Error('Sort field must contain only letters, numbers, and underscores');
      }
      return true;
    }),

  query('order')
    .optional()
    .isIn(['asc', 'desc', 'ASC', 'DESC'])
    .withMessage('Order must be asc or desc')
    .customSanitizer((value) => value ? value.toUpperCase() : 'ASC'),

  handleValidationErrors
];

/**
 * Helper function to calculate object depth
 */
function getObjectDepth(obj: any, depth: number = 0): number {
  if (depth > 10) return depth; // Prevent infinite recursion

  if (typeof obj !== 'object' || obj === null) {
    return depth;
  }

  if (Array.isArray(obj)) {
    return Math.max(depth, ...obj.map(item => getObjectDepth(item, depth + 1)));
  }

  const values = Object.values(obj);
  if (values.length === 0) {
    return depth;
  }

  return Math.max(depth, ...values.map(value => getObjectDepth(value, depth + 1)));
}

/**
 * Security headers validation for file uploads (future use)
 */
export const validateFileUpload = [
  body('file')
    .custom((value, { req }) => {
      if (!req.file) {
        return true; // No file is acceptable
      }

      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'text/csv'
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        throw new Error('Invalid file type');
      }

      // Check file size (10MB max)
      if (req.file.size > 10 * 1024 * 1024) {
        throw new Error('File too large (max 10MB)');
      }

      return true;
    }),

  handleValidationErrors
];

/**
 * Custom sanitization middleware for request body
 */
export function sanitizeRequestBody(options: ValidationOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, options);
    }
    next();
  };
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any, options: ValidationOptions): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj, options);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options));
  }

  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize both key and value
      const cleanKey = sanitizeString(key, { maxLength: 100 });
      sanitized[cleanKey] = sanitizeObject(value, options);
    }
    return sanitized;
  }

  return obj;
}

// Export helper functions
export type { ValidationErrorResponse };