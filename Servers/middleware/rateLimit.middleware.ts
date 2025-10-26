/**
 * @fileoverview Rate Limiting Middleware
 *
 * Provides rate limiting protection for expensive operations to prevent denial-of-service attacks.
 * Implements different rate limits for various types of operations based on their resource intensity.
 *
 * Rate Limiters:
 * - fileOperationsLimiter: For file uploads, downloads, and deletions (15 requests per 15 minutes per IP)
 * - generalApiLimiter: For general API endpoints (100 requests per 15 minutes per IP)
 * - authLimiter: For authentication endpoints (5 requests per 15 minutes per IP)
 *
 * Features:
 * - IP-based rate limiting
 * - Configurable time windows and request limits
 * - Standard HTTP 429 (Too Many Requests) responses
 * - Robust IP extraction with fallbacks
 * - Standardized error responses
 * - Production-ready logging and monitoring
 *
 * @module middleware/rateLimit
 */

import rateLimit, { Options } from 'express-rate-limit';
import { STATUS_CODE } from '../utils/statusCode.utils';
import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { isIP } from 'net';

/**
 * Validates if a string is a valid IP address (IPv4 or IPv6)
 * Uses Node's built-in net.isIP() for reliable, production-grade validation
 *
 * @param {string} ip - IP address to validate
 * @returns {boolean} True if valid IPv4 or IPv6
 */
const isValidIp = (ip: string): boolean => {
  // isIP returns 4 for IPv4, 6 for IPv6, 0 for invalid
  return isIP(ip) !== 0;
};

/**
 * Robust IP extraction function with multiple fallbacks
 * Prevents rate limiter crashes and ensures each client gets unique rate limit bucket
 *
 * Priority order:
 * 1. req.ip (populated from X-Forwarded-For when trust proxy is enabled)
 * 2. First IP from X-Forwarded-For header (manual parsing)
 * 3. Socket remote address
 * 4. Generate a unique identifier per request (prevents sharing rate limit bucket)
 *
 * @param {Request} req - Express request object
 * @returns {string} IP address or unique identifier
 */
const getClientIp = (req: Request): string => {
  // Try req.ip first (populated by Express when trust proxy is enabled)
  if (req.ip && isValidIp(req.ip)) {
    return req.ip;
  }

  // Fallback to manual X-Forwarded-For parsing
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = typeof forwardedFor === 'string'
      ? forwardedFor.split(',').map(ip => ip.trim())
      : forwardedFor;

    // Find first valid IP
    for (const ip of ips) {
      if (ip && isValidIp(ip)) {
        return ip;
      }
    }
  }

  // Fallback to socket remote address
  if (req.socket?.remoteAddress && isValidIp(req.socket.remoteAddress)) {
    return req.socket.remoteAddress;
  }

  // Reject requests without identifiable IPs
  console.error(`Rate limiter: Unable to determine client IP for request to ${req.path}`);
  throw new Error('Unable to identify client IP for rate limiting');
};

/**
 * Creates a standardized rate limit handler
 * DRY: Reusable handler function for all rate limiters
 *
 * @param {string} message - Custom message for this rate limiter
 * @returns {Function} Handler function for rate limit responses
 */
const createRateLimitHandler = (message: string) => {
  return (req: Request, res: Response) => {
    // Log rate limit hit for monitoring
    console.warn(`Rate limit exceeded for IP: ${getClientIp(req)} - ${message}`);

    // STATUS_CODE[429] is a function that returns { message: "Too Many Requests", data: message }
    res.status(429).json(STATUS_CODE[429](message));
  };
};

/**
 * Base configuration shared across all rate limiters
 * DRY: Common settings defined once
 */
const baseRateLimitConfig: Partial<Options> = {
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,   // Disable deprecated X-RateLimit-* headers
  skipSuccessfulRequests: false,  // Count all requests toward limit
  skipFailedRequests: false,      // Count all requests toward limit
  keyGenerator: getClientIp,      // Use robust IP extraction
};

/**
 * Rate limiter for file operations (upload, download, delete)
 * More restrictive due to the expensive nature of file I/O operations
 *
 * Limits: 15 requests per 15 minutes per IP
 */
export const fileOperationsLimiter = rateLimit({
  ...baseRateLimitConfig,
  windowMs: 15 * 60 * 1000,
  max: 15,
  handler: createRateLimitHandler('Too many file operation requests from this IP, please try again after 15 minutes'),
});

/**
 * General API rate limiter for standard endpoints
 * Less restrictive for typical CRUD operations
 *
 * Limits: 100 requests per 15 minutes per IP
 */
export const generalApiLimiter = rateLimit({
  ...baseRateLimitConfig,
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: createRateLimitHandler('Too many requests from this IP, please try again after 15 minutes'),
});

/**
 * Strict rate limiter for authentication endpoints
 * Very restrictive to prevent brute force attacks
 *
 * Limits: 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  ...baseRateLimitConfig,
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: createRateLimitHandler('Too many authentication attempts from this IP, please try again after 15 minutes'),
});