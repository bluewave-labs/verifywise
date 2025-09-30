import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { SSOAuditLogger } from '../utils/sso-audit-logger.utils';

/**
 * Rate limiting middleware for SSO authentication endpoints
 * Implements multiple tiers of rate limiting for different endpoints
 */

/**
 * Strict rate limiting for SSO login initiation
 * Prevents brute force attacks on SSO endpoints
 */
export const ssoLoginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for login initiation
  message: {
    success: false,
    error: 'Too many SSO login attempts. Please try again in 15 minutes.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: Request, defaultGenerator: any) => {
    // Use default generator for proper IPv6 handling, then customize with organization
    const organizationId = req.params.organizationId || 'unknown';
    const baseKey = defaultGenerator(req);
    return `sso_login:${baseKey}:${organizationId}`;
  },
  handler: (req: Request, res: Response) => {
    const organizationId = req.params.organizationId || 'unknown';
    console.warn(`SSO login rate limit exceeded for IP ${req.ip} and organization ${organizationId}`);

    // Audit log the rate limit violation
    SSOAuditLogger.logRateLimitExceeded(req, organizationId, 'login');

    res.status(429).json({
      success: false,
      error: 'Too many SSO login attempts. Please try again in 15 minutes.',
      retryAfter: 15 * 60 * 1000
    });
  }
});

/**
 * Very strict rate limiting for SSO callback endpoint
 * Callbacks should be less frequent than login initiations
 */
export const ssoCallbackRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for callbacks
  message: {
    success: false,
    error: 'Too many SSO callback attempts. Please try again in 5 minutes.',
    retryAfter: 5 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request, defaultGenerator: any) => {
    const organizationId = req.params.organizationId || 'unknown';
    const baseKey = defaultGenerator(req);
    return `sso_callback:${baseKey}:${organizationId}`;
  },
  handler: (req: Request, res: Response) => {
    const organizationId = req.params.organizationId || 'unknown';
    console.warn(`SSO callback rate limit exceeded for IP ${req.ip} and organization ${organizationId}`);

    // Audit log the rate limit violation
    SSOAuditLogger.logRateLimitExceeded(req, organizationId, 'callback');

    // Redirect to frontend with error instead of JSON response
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/login?error=rate_limit_exceeded`);
  }
});

/**
 * Moderate rate limiting for SSO configuration endpoints
 * Administrative endpoints need protection but higher limits
 */
export const ssoConfigRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // Limit each IP to 30 requests per windowMs for config operations
  message: {
    success: false,
    error: 'Too many SSO configuration requests. Please try again in 10 minutes.',
    retryAfter: 10 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request, defaultGenerator: any) => {
    // Include user ID if available for authenticated requests
    const userId = (req as any).user?.userId || 'anonymous';
    const baseKey = defaultGenerator(req);
    return `sso_config:${baseKey}:${userId}`;
  },
  handler: (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || 'anonymous';
    const organizationId = req.params.organizationId || 'unknown';
    console.warn(`SSO config rate limit exceeded for IP ${req.ip} and user ${userId}`);

    // Audit log the rate limit violation
    SSOAuditLogger.logRateLimitExceeded(req, organizationId, 'configuration');

    res.status(429).json({
      success: false,
      error: 'Too many SSO configuration requests. Please try again in 10 minutes.',
      retryAfter: 10 * 60 * 1000
    });
  }
});

/**
 * General rate limiting for all SSO-related endpoints
 * Fallback protection for any SSO endpoint
 */
export const generalSsoRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs for general SSO operations
  message: {
    success: false,
    error: 'Too many SSO requests. Please try again later.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request, defaultGenerator: any) => {
    const baseKey = defaultGenerator(req);
    return `sso_general:${baseKey}`;
  },
  handler: (req: Request, res: Response) => {
    const organizationId = req.params.organizationId || 'unknown';
    console.warn(`General SSO rate limit exceeded for IP ${req.ip}`);

    // Audit log the rate limit violation
    SSOAuditLogger.logRateLimitExceeded(req, organizationId, 'general');

    res.status(429).json({
      success: false,
      error: 'Too many SSO requests. Please try again later.',
      retryAfter: 15 * 60 * 1000
    });
  }
});

/**
 * Rate limiting configuration for Redis store (optional)
 * Uncomment and configure if Redis is available
 */
/*
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

export const ssoLoginRateLimitRedis = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 10,
  // ... other options
});
*/