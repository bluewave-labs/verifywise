/**
 * Redis-based Rate Limiter for SSO Operations
 *
 * Provides distributed rate limiting that works across multiple server instances
 * and persists across server restarts. Uses Redis for storage with automatic
 * cleanup and configurable limits per operation type.
 */

import Redis from 'ioredis';
import crypto from 'crypto';
import { Request } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  attempts?: number;
  remaining?: number;
}

export class RedisRateLimiter {
  private redis: Redis;
  private keyPrefix: string;

  // Rate limiting configurations for different SSO operations
  private static readonly configs: Record<string, RateLimitConfig> = {
    login: { windowMs: 15 * 60 * 1000, maxAttempts: 10, blockDurationMs: 30 * 60 * 1000 }, // 10 attempts per 15 min, block 30 min
    callback: { windowMs: 5 * 60 * 1000, maxAttempts: 20, blockDurationMs: 15 * 60 * 1000 }, // 20 attempts per 5 min, block 15 min
    token: { windowMs: 10 * 60 * 1000, maxAttempts: 15, blockDurationMs: 20 * 60 * 1000 } // 15 attempts per 10 min, block 20 min
  };

  constructor(redisClient?: Redis, keyPrefix: string = 'sso_rate_limit') {
    this.keyPrefix = keyPrefix;

    if (redisClient) {
      this.redis = redisClient;
    } else {
      // Create Redis client with fallback to environment variables
      const redisUrl = process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING;

      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          family: 4, // IPv4
        });
      } else {
        // Fallback to localhost Redis
        this.redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0'),
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          family: 4,
        });
      }
    }

    // Handle Redis connection events (set up for all Redis clients)
    this.redis.on('error', (error) => {
      console.error('Redis rate limiter connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Redis rate limiter connected successfully');
    });
  }

  /**
   * Check rate limiting for a specific operation
   */
  async checkRateLimit(
    req: Request,
    operation: 'login' | 'callback' | 'token',
    providerType: string
  ): Promise<RateLimitResult> {
    const config = RedisRateLimiter.configs[operation];
    if (!config) {
      throw new Error(`Unknown operation type: ${operation}`);
    }

    const clientId = this.getClientIdentifier(req);
    const key = `${this.keyPrefix}:${providerType}:${operation}:${clientId}`;
    const blockKey = `${key}:blocked`;
    const now = Date.now();

    try {
      // Check if currently blocked
      const blockedUntil = await this.redis.get(blockKey);
      if (blockedUntil && now < parseInt(blockedUntil)) {
        const retryAfter = Math.ceil((parseInt(blockedUntil) - now) / 1000);
        return { allowed: false, retryAfter };
      }

      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();

      // Get current attempt count and timestamp
      pipeline.hgetall(key);

      const results = await pipeline.exec();
      const data = results?.[0]?.[1] as Record<string, string> || {};

      const attempts = parseInt(data.attempts || '0');
      const firstAttempt = parseInt(data.firstAttempt || now.toString());

      // Check if window has expired
      if (now - firstAttempt > config.windowMs) {
        // Reset window
        await this.redis.hmset(key, {
          attempts: '1',
          firstAttempt: now.toString()
        });
        await this.redis.expire(key, Math.ceil(config.windowMs / 1000));

        return {
          allowed: true,
          attempts: 1,
          remaining: config.maxAttempts - 1
        };
      }

      // Increment attempts
      const newAttempts = attempts + 1;

      if (newAttempts > config.maxAttempts) {
        // Block the client
        const blockUntil = now + config.blockDurationMs;
        await this.redis.setex(blockKey, Math.ceil(config.blockDurationMs / 1000), blockUntil.toString());

        const retryAfter = Math.ceil(config.blockDurationMs / 1000);
        return { allowed: false, retryAfter, attempts: newAttempts };
      }

      // Update attempt count
      await this.redis.hmset(key, {
        attempts: newAttempts.toString(),
        firstAttempt: firstAttempt.toString()
      });
      await this.redis.expire(key, Math.ceil(config.windowMs / 1000));

      return {
        allowed: true,
        attempts: newAttempts,
        remaining: config.maxAttempts - newAttempts
      };

    } catch (error) {
      console.error('Redis rate limiter error:', error);

      // Fail open - allow the request if Redis is down
      // In production, you might want to fail closed instead
      return { allowed: true };
    }
  }

  /**
   * Get client identifier for rate limiting
   */
  private getClientIdentifier(req: Request): string {
    // Use IP + User-Agent for better identification while preserving privacy
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Create a hash for privacy
    return crypto.createHash('sha256')
      .update(`${ip}-${userAgent}`)
      .digest('hex')
      .substring(0, 16); // Truncate for storage efficiency
  }

  /**
   * Reset rate limit for a specific client and operation (for testing/admin purposes)
   */
  async resetRateLimit(
    req: Request,
    operation: 'login' | 'callback' | 'token',
    providerType: string
  ): Promise<void> {
    const clientId = this.getClientIdentifier(req);
    const key = `${this.keyPrefix}:${providerType}:${operation}:${clientId}`;
    const blockKey = `${key}:blocked`;

    try {
      await this.redis.del(key, blockKey);
    } catch (error) {
      console.error('Failed to reset rate limit:', error);
      throw error;
    }
  }

  /**
   * Get rate limit status for a client without incrementing
   */
  async getRateLimitStatus(
    req: Request,
    operation: 'login' | 'callback' | 'token',
    providerType: string
  ): Promise<{ attempts: number; remaining: number; blocked: boolean; blockUntil?: number }> {
    const config = RedisRateLimiter.configs[operation];
    const clientId = this.getClientIdentifier(req);
    const key = `${this.keyPrefix}:${providerType}:${operation}:${clientId}`;
    const blockKey = `${key}:blocked`;
    const now = Date.now();

    try {
      const [data, blockedUntil] = await Promise.all([
        this.redis.hgetall(key),
        this.redis.get(blockKey)
      ]);

      const attempts = parseInt(data.attempts || '0');
      const firstAttempt = parseInt(data.firstAttempt || now.toString());

      // Check if blocked
      if (blockedUntil && now < parseInt(blockedUntil)) {
        return {
          attempts,
          remaining: 0,
          blocked: true,
          blockUntil: parseInt(blockedUntil)
        };
      }

      // Check if window has expired
      if (now - firstAttempt > config.windowMs) {
        return {
          attempts: 0,
          remaining: config.maxAttempts,
          blocked: false
        };
      }

      return {
        attempts,
        remaining: Math.max(0, config.maxAttempts - attempts),
        blocked: false
      };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return {
        attempts: 0,
        remaining: config.maxAttempts,
        blocked: false
      };
    }
  }

  /**
   * Clean up expired rate limit entries (called periodically)
   */
  async cleanup(): Promise<number> {
    try {
      const pattern = `${this.keyPrefix}:*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      // Redis will automatically expire keys, but this helps with cleanup
      // of any keys that might not have TTL set properly
      let cleaned = 0;
      const now = Date.now();

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) {
          // Key exists but has no TTL - set a reasonable TTL
          await this.redis.expire(key, 3600); // 1 hour default TTL
          cleaned++;
        }
      }

      return cleaned;
    } catch (error) {
      console.error('Failed to cleanup rate limit entries:', error);
      return 0;
    }
  }

  /**
   * Get rate limiter health status
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      if (latency > 100) {
        return {
          healthy: true,
          message: `Redis responding but slow (${latency}ms latency)`
        };
      }

      return {
        healthy: true,
        message: `Redis healthy (${latency}ms latency)`
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
}

// Create singleton instance
let rateLimiterInstance: RedisRateLimiter | null = null;

export function getRedisRateLimiter(): RedisRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RedisRateLimiter();
  }
  return rateLimiterInstance;
}

export default RedisRateLimiter;