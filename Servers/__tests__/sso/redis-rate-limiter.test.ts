/**
 * Redis Rate Limiter Tests
 *
 * Comprehensive test suite for Redis-based rate limiting functionality.
 * Tests rate limiting logic, Redis connectivity, error handling, and
 * security scenarios for production reliability.
 */

import { Request } from 'express';
import { RedisRateLimiter } from '../../utils/redis-rate-limiter.utils';
import Redis from 'ioredis';

// Mock Redis client
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

describe('RedisRateLimiter', () => {
  let rateLimiter: RedisRateLimiter;
  let mockRedis: jest.Mocked<Redis>;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock Redis instance
    mockRedis = {
      get: jest.fn(),
      hgetall: jest.fn(),
      hmset: jest.fn(),
      setex: jest.fn(),
      expire: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      ttl: jest.fn(),
      ping: jest.fn(),
      quit: jest.fn(),
      pipeline: jest.fn(),
      on: jest.fn(),
    } as any;

    // Mock pipeline
    const mockPipeline = {
      hgetall: jest.fn().mockReturnThis(),
      exec: jest.fn()
    };
    mockRedis.pipeline.mockReturnValue(mockPipeline as any);

    MockedRedis.mockImplementation(() => mockRedis);

    // Create rate limiter instance
    rateLimiter = new RedisRateLimiter(mockRedis);

    // Mock request object
    mockRequest = {
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'test-agent'
      },
      socket: {
        remoteAddress: '192.168.1.1'
      }
    };
  });

  afterEach(async () => {
    await rateLimiter.close();
  });

  describe('Rate Limiting Logic', () => {
    it('should allow first request within limits', async () => {
      // Mock pipeline execution - no existing data
      const mockPipeline = mockRedis.pipeline();
      mockPipeline.exec.mockResolvedValue([[null, {}]]);

      const result = await rateLimiter.checkRateLimit(mockRequest as Request, 'login', 'azure_ad');

      expect(result.allowed).toBe(true);
      expect(result.attempts).toBe(1);
      expect(result.remaining).toBe(9); // 10 max attempts for login - 1
      expect(mockRedis.hmset).toHaveBeenCalled();
      expect(mockRedis.expire).toHaveBeenCalled();
    });

    it('should increment attempts within window', async () => {
      const now = Date.now();
      const existingData = {
        attempts: '3',
        firstAttempt: now.toString()
      };

      // Mock pipeline execution - existing data
      const mockPipeline = mockRedis.pipeline();
      mockPipeline.exec.mockResolvedValue([[null, existingData]]);

      const result = await rateLimiter.checkRateLimit(mockRequest as Request, 'login', 'azure_ad');

      expect(result.allowed).toBe(true);
      expect(result.attempts).toBe(4);
      expect(result.remaining).toBe(6); // 10 - 4
      expect(mockRedis.hmset).toHaveBeenCalledWith(
        expect.stringContaining('login'),
        {
          attempts: '4',
          firstAttempt: now.toString()
        }
      );
    });

    it('should block when rate limit exceeded', async () => {
      const now = Date.now();
      const existingData = {
        attempts: '10', // At the limit
        firstAttempt: now.toString()
      };

      // Mock pipeline execution
      const mockPipeline = mockRedis.pipeline();
      mockPipeline.exec.mockResolvedValue([[null, existingData]]);

      const result = await rateLimiter.checkRateLimit(mockRequest as Request, 'login', 'azure_ad');

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(1800); // 30 minutes for login
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('blocked'),
        1800,
        expect.any(String)
      );
    });

    it('should reset window when expired', async () => {
      const now = Date.now();
      const oldTimestamp = now - (16 * 60 * 1000); // 16 minutes ago (window is 15 minutes)
      const existingData = {
        attempts: '5',
        firstAttempt: oldTimestamp.toString()
      };

      // Mock pipeline execution
      const mockPipeline = mockRedis.pipeline();
      mockPipeline.exec.mockResolvedValue([[null, existingData]]);

      const result = await rateLimiter.checkRateLimit(mockRequest as Request, 'login', 'azure_ad');

      expect(result.allowed).toBe(true);
      expect(result.attempts).toBe(1);
      expect(result.remaining).toBe(9);
      expect(mockRedis.hmset).toHaveBeenCalledWith(
        expect.stringContaining('login'),
        {
          attempts: '1',
          firstAttempt: expect.any(String)
        }
      );
    });

    it('should respect existing block', async () => {
      const futureTime = Date.now() + (10 * 60 * 1000); // 10 minutes in future
      mockRedis.get.mockResolvedValue(futureTime.toString());

      const result = await rateLimiter.checkRateLimit(mockRequest as Request, 'login', 'azure_ad');

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(mockRedis.pipeline).not.toHaveBeenCalled(); // Should return early
    });
  });

  describe('Different Operation Types', () => {
    it('should handle callback operation with different limits', async () => {
      // Mock pipeline execution - no existing data
      const mockPipeline = mockRedis.pipeline();
      mockPipeline.exec.mockResolvedValue([[null, {}]]);

      const result = await rateLimiter.checkRateLimit(mockRequest as Request, 'callback', 'azure_ad');

      expect(result.allowed).toBe(true);
      expect(result.attempts).toBe(1);
      expect(result.remaining).toBe(19); // 20 max attempts for callback - 1
    });

    it('should handle token operation with different limits', async () => {
      // Mock pipeline execution - no existing data
      const mockPipeline = mockRedis.pipeline();
      mockPipeline.exec.mockResolvedValue([[null, {}]]);

      const result = await rateLimiter.checkRateLimit(mockRequest as Request, 'token', 'azure_ad');

      expect(result.allowed).toBe(true);
      expect(result.attempts).toBe(1);
      expect(result.remaining).toBe(14); // 15 max attempts for token - 1
    });

    it('should throw error for unknown operation type', async () => {
      await expect(
        rateLimiter.checkRateLimit(mockRequest as Request, 'unknown' as any, 'azure_ad')
      ).rejects.toThrow('Unknown operation type: unknown');
    });
  });

  describe('Client Identification', () => {
    it('should handle x-forwarded-for header', async () => {
      mockRequest.headers = {
        'x-forwarded-for': '10.0.0.1, 192.168.1.1',
        'user-agent': 'test-agent'
      };

      const mockPipeline = mockRedis.pipeline();
      mockPipeline.exec.mockResolvedValue([[null, {}]]);

      await rateLimiter.checkRateLimit(mockRequest as Request, 'login', 'azure_ad');

      // Should use first IP from forwarded header
      expect(mockRedis.hmset).toHaveBeenCalledWith(
        expect.stringMatching(/^sso_rate_limit:azure_ad:login:[a-f0-9]{16}$/),
        expect.any(Object)
      );
    });

    it('should handle missing user agent', async () => {
      mockRequest.headers = {
        'x-forwarded-for': '192.168.1.1'
        // No user-agent
      };

      const mockPipeline = mockRedis.pipeline();
      mockPipeline.exec.mockResolvedValue([[null, {}]]);

      await rateLimiter.checkRateLimit(mockRequest as Request, 'login', 'azure_ad');

      expect(mockRedis.hmset).toHaveBeenCalled();
    });

    it('should handle missing IP information', async () => {
      mockRequest.headers = {};
      mockRequest.socket = {};

      const mockPipeline = mockRedis.pipeline();
      mockPipeline.exec.mockResolvedValue([[null, {}]]);

      await rateLimiter.checkRateLimit(mockRequest as Request, 'login', 'azure_ad');

      expect(mockRedis.hmset).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should fail open when Redis is unavailable', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await rateLimiter.checkRateLimit(mockRequest as Request, 'login', 'azure_ad');

      expect(result.allowed).toBe(true);
      // Should not have retryAfter when failing open
      expect(result.retryAfter).toBeUndefined();
    });

    it('should handle pipeline execution errors', async () => {
      mockRedis.get.mockResolvedValue(null); // No existing block
      const mockPipeline = mockRedis.pipeline();
      mockPipeline.exec.mockRejectedValue(new Error('Pipeline execution failed'));

      const result = await rateLimiter.checkRateLimit(mockRequest as Request, 'login', 'azure_ad');

      expect(result.allowed).toBe(true);
    });

    it('should handle hmset errors gracefully', async () => {
      const mockPipeline = mockRedis.pipeline();
      mockPipeline.exec.mockResolvedValue([[null, {}]]);
      mockRedis.hmset.mockRejectedValue(new Error('HMSET failed'));

      const result = await rateLimiter.checkRateLimit(mockRequest as Request, 'login', 'azure_ad');

      expect(result.allowed).toBe(true);
    });
  });

  describe('Rate Limit Status', () => {
    it('should return correct status for active limits', async () => {
      const now = Date.now();
      const data = {
        attempts: '5',
        firstAttempt: now.toString()
      };

      mockRedis.hgetall.mockResolvedValue(data);
      mockRedis.get.mockResolvedValue(null); // Not blocked

      const status = await rateLimiter.getRateLimitStatus(mockRequest as Request, 'login', 'azure_ad');

      expect(status.attempts).toBe(5);
      expect(status.remaining).toBe(5); // 10 - 5
      expect(status.blocked).toBe(false);
    });

    it('should return blocked status', async () => {
      const futureTime = Date.now() + (5 * 60 * 1000);
      mockRedis.hgetall.mockResolvedValue({ attempts: '11' });
      mockRedis.get.mockResolvedValue(futureTime.toString());

      const status = await rateLimiter.getRateLimitStatus(mockRequest as Request, 'login', 'azure_ad');

      expect(status.blocked).toBe(true);
      expect(status.blockUntil).toBe(futureTime);
      expect(status.remaining).toBe(0);
    });

    it('should handle expired windows in status check', async () => {
      const oldTime = Date.now() - (20 * 60 * 1000); // 20 minutes ago
      const data = {
        attempts: '8',
        firstAttempt: oldTime.toString()
      };

      mockRedis.hgetall.mockResolvedValue(data);
      mockRedis.get.mockResolvedValue(null);

      const status = await rateLimiter.getRateLimitStatus(mockRequest as Request, 'login', 'azure_ad');

      expect(status.attempts).toBe(0);
      expect(status.remaining).toBe(10);
      expect(status.blocked).toBe(false);
    });
  });

  describe('Reset Rate Limit', () => {
    it('should reset rate limit for specific client and operation', async () => {
      mockRedis.del.mockResolvedValue(2); // Deleted 2 keys

      await rateLimiter.resetRateLimit(mockRequest as Request, 'login', 'azure_ad');

      expect(mockRedis.del).toHaveBeenCalledWith(
        expect.stringContaining('login'),
        expect.stringContaining('blocked')
      );
    });

    it('should handle reset errors', async () => {
      mockRedis.del.mockRejectedValue(new Error('Delete failed'));

      await expect(
        rateLimiter.resetRateLimit(mockRequest as Request, 'login', 'azure_ad')
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when Redis is responsive', async () => {
      mockRedis.ping.mockResolvedValue('PONG');

      const health = await rateLimiter.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.message).toContain('Redis healthy');
    });

    it('should return unhealthy status when Redis fails', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection refused'));

      const health = await rateLimiter.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.message).toContain('Redis connection failed');
    });

    it('should warn about slow Redis response', async () => {
      // Mock slow response
      mockRedis.ping.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve('PONG'), 150))
      );

      const health = await rateLimiter.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.message).toContain('slow');
    });
  });

  describe('Cleanup', () => {
    it('should clean up expired entries', async () => {
      const keys = [
        'sso_rate_limit:azure_ad:login:abc123',
        'sso_rate_limit:azure_ad:login:def456'
      ];

      mockRedis.keys.mockResolvedValue(keys);
      mockRedis.ttl.mockResolvedValueOnce(-1); // No TTL
      mockRedis.ttl.mockResolvedValueOnce(300); // Has TTL
      mockRedis.expire.mockResolvedValue(1);

      const cleaned = await rateLimiter.cleanup();

      expect(cleaned).toBe(1);
      expect(mockRedis.expire).toHaveBeenCalledWith(keys[0], 3600);
      expect(mockRedis.expire).not.toHaveBeenCalledWith(keys[1], expect.any(Number));
    });

    it('should handle cleanup errors gracefully', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Keys command failed'));

      const cleaned = await rateLimiter.cleanup();

      expect(cleaned).toBe(0);
    });
  });

  describe('Connection Management', () => {
    it('should handle Redis connection events', () => {
      // Verify event handlers are registered
      expect(mockRedis.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedis.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    it('should close Redis connection properly', async () => {
      mockRedis.quit.mockResolvedValue('OK');

      await rateLimiter.close();

      expect(mockRedis.quit).toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      mockRedis.quit.mockRejectedValue(new Error('Quit failed'));

      // Should not throw
      await expect(rateLimiter.close()).resolves.toBeUndefined();
    });
  });
});