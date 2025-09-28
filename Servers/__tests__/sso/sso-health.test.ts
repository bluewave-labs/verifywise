/**
 * SSO Health Check Integration Tests
 *
 * Tests for SSO health check endpoints, monitoring functionality,
 * and production readiness verification.
 */

// Set required environment variables for SSO tests BEFORE any imports
process.env.SSO_STATE_SECRET = 'test-state-secret-for-tests';
process.env.JWT_SECRET = 'test-jwt-secret';

import request from 'supertest';
import express from 'express';
import ssoHealthRoutes from '../../routes/sso-health.route';

// Mock dependencies
jest.mock('../../utils/redis-rate-limiter.utils');
jest.mock('../../factories/sso-provider.factory');
jest.mock('../../utils/sso-env-validator.utils');

import { getRedisRateLimiter } from '../../utils/redis-rate-limiter.utils';
import { ssoProviderFactory } from '../../factories/sso-provider.factory';
import { SSOEnvironmentValidator } from '../../utils/sso-env-validator.utils';
import { SSOProviderType } from '../../interfaces/sso-provider.interface';

const mockGetRedisRateLimiter = getRedisRateLimiter as jest.MockedFunction<typeof getRedisRateLimiter>;
const mockSSOProviderFactory = ssoProviderFactory as jest.Mocked<typeof ssoProviderFactory>;
const mockSSOEnvironmentValidator = SSOEnvironmentValidator as jest.Mocked<typeof SSOEnvironmentValidator>;

describe('SSO Health Check Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/sso-health', ssoHealthRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks for successful scenarios
    mockSSOEnvironmentValidator.validateEnvironment.mockReturnValue({
      valid: true,
      errors: [],
      warnings: []
    });

    mockSSOEnvironmentValidator.isRedisConfigured.mockReturnValue(true);
    mockSSOEnvironmentValidator.isProduction.mockReturnValue(false);

    const mockRateLimiter = {
      healthCheck: jest.fn().mockResolvedValue({ healthy: true, message: 'Redis healthy' }),
      getRateLimitStatus: jest.fn().mockResolvedValue({
        attempts: 0,
        remaining: 10,
        blocked: false
      })
    };
    mockGetRedisRateLimiter.mockReturnValue(mockRateLimiter as any);

    mockSSOProviderFactory.getSupportedProviders.mockReturnValue([SSOProviderType.AZURE_AD]);
    mockSSOProviderFactory.healthCheckProviders.mockResolvedValue(
      new Map([[SSOProviderType.AZURE_AD, { healthy: true, message: 'Azure AD healthy' }]])
    );
  });

  describe('GET /api/sso-health/', () => {
    it('should return healthy status when all checks pass', async () => {
      const response = await request(app)
        .get('/api/sso-health/')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.checks.environment.status).toBe('pass');
    });

    it('should return unhealthy status when environment validation fails', async () => {
      mockSSOEnvironmentValidator.validateEnvironment.mockReturnValue({
        valid: false,
        errors: ['Missing required environment variable: SSO_STATE_SECRET'],
        warnings: []
      });

      const response = await request(app)
        .get('/api/sso-health/')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.checks.environment.status).toBe('fail');
      expect(response.body.checks.environment.details.errors).toContain(
        'Missing required environment variable: SSO_STATE_SECRET'
      );
    });

    it('should return degraded status when there are warnings', async () => {
      mockSSOEnvironmentValidator.validateEnvironment.mockReturnValue({
        valid: true,
        errors: [],
        warnings: ['REDIS_PASSWORD not set - consider using authentication in production']
      });

      const response = await request(app)
        .get('/api/sso-health/')
        .expect(200);

      expect(response.body.status).toBe('degraded');
      expect(response.body.checks.environment.details.warnings).toContain(
        'REDIS_PASSWORD not set - consider using authentication in production'
      );
    });

    it('should handle system errors gracefully', async () => {
      mockSSOEnvironmentValidator.validateEnvironment.mockImplementation(() => {
        throw new Error('Validation system error');
      });

      const response = await request(app)
        .get('/api/sso-health/')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.checks.system.status).toBe('fail');
      expect(response.body.checks.system.message).toContain('Validation system error');
    });
  });

  describe('GET /api/sso-health/detailed', () => {
    it('should return comprehensive health information', async () => {
      const response = await request(app)
        .get('/api/sso-health/detailed')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.checks).toHaveProperty('environment');
      expect(response.body.checks).toHaveProperty('redis');
      expect(response.body.checks).toHaveProperty('rateLimiting');
      expect(response.body.checks).toHaveProperty('ssoProviders');
      expect(response.body.checks).toHaveProperty('performance');
      expect(response.body.checks).toHaveProperty('overall');

      // Verify response times are included
      expect(response.body.checks.environment.responseTime).toBeDefined();
      expect(response.body.checks.redis.responseTime).toBeDefined();
      expect(response.body.checks.overall.responseTime).toBeDefined();
    });

    it('should detect Redis connectivity issues', async () => {
      const mockRateLimiter = {
        healthCheck: jest.fn().mockResolvedValue({ healthy: false, message: 'Connection refused' }),
        getRateLimitStatus: jest.fn().mockResolvedValue({
          attempts: 0,
          remaining: 10,
          blocked: false
        })
      };
      mockGetRedisRateLimiter.mockReturnValue(mockRateLimiter as any);

      const response = await request(app)
        .get('/api/sso-health/detailed')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.checks.redis.status).toBe('fail');
      expect(response.body.checks.redis.message).toContain('Connection refused');
    });

    it('should detect SSO provider issues', async () => {
      mockSSOProviderFactory.healthCheckProviders.mockResolvedValue(
        new Map([
          [SSOProviderType.AZURE_AD, { healthy: true, message: 'Azure AD healthy' }],
          [SSOProviderType.GOOGLE, { healthy: false, message: 'Google SSO unavailable' }]
        ])
      );

      const response = await request(app)
        .get('/api/sso-health/detailed')
        .expect(200);

      expect(response.body.status).toBe('degraded');
      expect(response.body.checks.ssoProviders.status).toBe('warn');
      expect(response.body.checks.ssoProviders.message).toContain('1/2 providers healthy');
    });

    it('should warn about high memory usage', async () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        rss: 600 * 1024 * 1024, // 600 MB
        heapTotal: 600 * 1024 * 1024,
        heapUsed: 600 * 1024 * 1024, // High memory usage
        external: 50 * 1024 * 1024,
        arrayBuffers: 10 * 1024 * 1024
      }) as any;

      const response = await request(app)
        .get('/api/sso-health/detailed')
        .expect(200);

      expect(response.body.status).toBe('degraded');
      expect(response.body.checks.performance.status).toBe('warn');
      expect(response.body.checks.performance.message).toContain('High memory usage');

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });

    it('should handle rate limiting check failures gracefully', async () => {
      const mockRateLimiter = {
        healthCheck: jest.fn().mockResolvedValue({ healthy: true }),
        getRateLimitStatus: jest.fn().mockRejectedValue(new Error('Rate limit check failed'))
      };
      mockGetRedisRateLimiter.mockReturnValue(mockRateLimiter as any);

      const response = await request(app)
        .get('/api/sso-health/detailed')
        .expect(200);

      expect(response.body.checks.rateLimiting.status).toBe('warn');
      expect(response.body.checks.rateLimiting.message).toContain('Rate limit check failed');
    });
  });

  describe('GET /api/sso-health/redis', () => {
    it('should return Redis health status', async () => {
      const response = await request(app)
        .get('/api/sso-health/redis')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.redis.healthy).toBe(true);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return unhealthy status when Redis fails', async () => {
      const mockRateLimiter = {
        healthCheck: jest.fn().mockResolvedValue({ healthy: false, message: 'Connection failed' })
      };
      mockGetRedisRateLimiter.mockReturnValue(mockRateLimiter as any);

      const response = await request(app)
        .get('/api/sso-health/redis')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.redis.healthy).toBe(false);
    });

    it('should handle Redis client creation errors', async () => {
      mockGetRedisRateLimiter.mockImplementation(() => {
        throw new Error('Redis client creation failed');
      });

      const response = await request(app)
        .get('/api/sso-health/redis')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.error).toContain('Redis client creation failed');
    });
  });

  describe('GET /api/sso-health/providers', () => {
    it('should return provider health status', async () => {
      const response = await request(app)
        .get('/api/sso-health/providers')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.summary.total).toBe(1);
      expect(response.body.summary.healthy).toBe(1);
      expect(response.body.providers[SSOProviderType.AZURE_AD].healthy).toBe(true);
    });

    it('should return partial status when some providers are unhealthy', async () => {
      mockSSOProviderFactory.healthCheckProviders.mockResolvedValue(
        new Map([
          [SSOProviderType.AZURE_AD, { healthy: true, message: 'Azure AD healthy' }],
          [SSOProviderType.GOOGLE, { healthy: false, message: 'Google SSO unavailable' }]
        ])
      );

      const response = await request(app)
        .get('/api/sso-health/providers')
        .expect(207);

      expect(response.body.status).toBe('partial');
      expect(response.body.summary.total).toBe(2);
      expect(response.body.summary.healthy).toBe(1);
    });

    it('should handle provider factory errors', async () => {
      mockSSOProviderFactory.healthCheckProviders.mockRejectedValue(
        new Error('Provider factory error')
      );

      const response = await request(app)
        .get('/api/sso-health/providers')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.error).toContain('Provider factory error');
    });
  });

  describe('GET /api/sso-health/rate-limiting', () => {
    it('should return rate limiting status for all operations', async () => {
      const response = await request(app)
        .get('/api/sso-health/rate-limiting')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.rateLimiting).toHaveProperty('login');
      expect(response.body.rateLimiting).toHaveProperty('callback');
      expect(response.body.rateLimiting).toHaveProperty('token');

      expect(response.body.rateLimiting.login.status).toBe('operational');
      expect(response.body.rateLimiting.callback.status).toBe('operational');
      expect(response.body.rateLimiting.token.status).toBe('operational');
    });

    it('should detect rate limiting errors', async () => {
      const mockRateLimiter = {
        getRateLimitStatus: jest.fn()
          .mockResolvedValueOnce({ attempts: 0, remaining: 10, blocked: false }) // login
          .mockRejectedValueOnce(new Error('Callback rate limit failed')) // callback
          .mockResolvedValueOnce({ attempts: 0, remaining: 15, blocked: false }) // token
      };
      mockGetRedisRateLimiter.mockReturnValue(mockRateLimiter as any);

      const response = await request(app)
        .get('/api/sso-health/rate-limiting')
        .expect(207);

      expect(response.body.status).toBe('partial');
      expect(response.body.rateLimiting.login.status).toBe('operational');
      expect(response.body.rateLimiting.callback.status).toBe('error');
      expect(response.body.rateLimiting.token.status).toBe('operational');
    });

    it('should handle complete rate limiting failure', async () => {
      mockGetRedisRateLimiter.mockImplementation(() => {
        throw new Error('Rate limiter unavailable');
      });

      const response = await request(app)
        .get('/api/sso-health/rate-limiting')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.error).toContain('Rate limiter unavailable');
    });
  });

  describe('GET /api/sso-health/ready', () => {
    it('should return ready when all critical dependencies are available', async () => {
      const response = await request(app)
        .get('/api/sso-health/ready')
        .expect(200);

      expect(response.body.ready).toBe(true);
      expect(response.body.message).toBe('SSO system ready');
    });

    it('should return not ready when environment validation fails', async () => {
      mockSSOEnvironmentValidator.validateEnvironment.mockReturnValue({
        valid: false,
        errors: ['Missing required environment variable: SSO_STATE_SECRET'],
        warnings: []
      });

      const response = await request(app)
        .get('/api/sso-health/ready')
        .expect(503);

      expect(response.body.ready).toBe(false);
      expect(response.body.reason).toBe('Environment validation failed');
      expect(response.body.errors).toContain('Missing required environment variable: SSO_STATE_SECRET');
    });

    it('should return not ready when Redis is unavailable', async () => {
      const mockRateLimiter = {
        healthCheck: jest.fn().mockResolvedValue({ healthy: false, message: 'Connection failed' })
      };
      mockGetRedisRateLimiter.mockReturnValue(mockRateLimiter as any);

      const response = await request(app)
        .get('/api/sso-health/ready')
        .expect(503);

      expect(response.body.ready).toBe(false);
      expect(response.body.reason).toBe('Redis not available');
    });

    it('should handle readiness check errors', async () => {
      mockSSOEnvironmentValidator.validateEnvironment.mockImplementation(() => {
        throw new Error('Environment check crashed');
      });

      const response = await request(app)
        .get('/api/sso-health/ready')
        .expect(503);

      expect(response.body.ready).toBe(false);
      expect(response.body.error).toContain('Environment check crashed');
    });
  });

  describe('GET /api/sso-health/live', () => {
    it('should always return alive for liveness probe', async () => {
      const response = await request(app)
        .get('/api/sso-health/live')
        .expect(200);

      expect(response.body.alive).toBe(true);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.pid).toBeDefined();
    });
  });

  describe('Response Format Validation', () => {
    it('should include required fields in health responses', async () => {
      const response = await request(app)
        .get('/api/sso-health/')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('checks');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
    });

    it('should include response times in detailed checks', async () => {
      const response = await request(app)
        .get('/api/sso-health/detailed')
        .expect(200);

      Object.keys(response.body.checks).forEach(checkName => {
        expect(response.body.checks[checkName]).toHaveProperty('responseTime');
        expect(typeof response.body.checks[checkName].responseTime).toBe('number');
      });
    });

    it('should use consistent timestamp format', async () => {
      const response = await request(app)
        .get('/api/sso-health/')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });
  });
});