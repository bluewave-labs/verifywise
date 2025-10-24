/**
 * @fileoverview Rate Limiting Middleware
 *
 * Provides rate limiting protection for expensive operations to prevent denial-of-service attacks.
 * Implements different rate limits for various types of operations based on their resource intensity.
 *
 * Rate Limiters:
 * - fileOperationsLimiter: For file uploads, downloads, and deletions (15 requests per 15 minutes per IP)
 * - generalApiLimiter: For general API endpoints (100 requests per 15 minutes per IP)
 *
 * Features:
 * - IP-based rate limiting
 * - Configurable time windows and request limits
 * - Standard HTTP 429 (Too Many Requests) responses
 * - Skip rate limiting for trusted IPs (if needed)
 * - Standardized error responses
 *
 * @module middleware/rateLimit
 */

import rateLimit from 'express-rate-limit';
import { STATUS_CODE } from '../utils/statusCode.utils';

/**
 * Rate limiter for file operations (upload, download, delete)
 * More restrictive due to the expensive nature of file I/O operations
 *
 * Limits: 15 requests per 15 minutes per IP
 */
export const fileOperationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 requests per windowMs
  message: STATUS_CODE[429]('Too many file operation requests from this IP, please try again after 15 minutes'),
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests that don't consume resources
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false,
  // Use IP address for rate limiting
  // Express's req.ip is populated from X-Forwarded-For based on trust proxy setting
  keyGenerator: (req) => {
    if (!req.ip) {
      throw new Error('Unable to identify client IP for rate limiting');
    }
    return req.ip;
  },
});

/**
 * General API rate limiter for standard endpoints
 * Less restrictive for typical CRUD operations
 *
 * Limits: 100 requests per 15 minutes per IP
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: STATUS_CODE[429]('Too many requests from this IP, please try again after 15 minutes'),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  // Express's req.ip is populated from X-Forwarded-For based on trust proxy setting
  keyGenerator: (req) => {
    if (!req.ip) {
      throw new Error('Unable to identify client IP for rate limiting');
    }
    return req.ip;
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Very restrictive to prevent brute force attacks
 *
 * Limits: 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: STATUS_CODE[429]('Too many authentication attempts from this IP, please try again after 15 minutes'),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  // Express's req.ip is populated from X-Forwarded-For based on trust proxy setting
  keyGenerator: (req) => {
    if (!req.ip) {
      throw new Error('Unable to identify client IP for rate limiting');
    }
    return req.ip;
  },
});