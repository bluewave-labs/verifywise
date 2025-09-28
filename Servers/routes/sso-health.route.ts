/**
 * SSO Health Check Routes
 *
 * Provides comprehensive health monitoring endpoints for the SSO system.
 * Includes checks for Redis connectivity, provider status, rate limiting,
 * and overall system health for production monitoring.
 */

import express from 'express';
import { Request, Response } from 'express';
import { getRedisRateLimiter } from '../utils/redis-rate-limiter.utils';
import { ssoProviderFactory } from '../factories/sso-provider.factory';
import { SSOEnvironmentValidator } from '../utils/sso-env-validator.utils';
import { SSOProviderType } from '../interfaces/sso-provider.interface';

const router = express.Router();

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version?: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      responseTime?: number;
      details?: any;
    };
  };
}

/**
 * Basic health check endpoint
 * GET /api/sso-health/
 */
router.get('/', async (req: Request, res: Response) => {
  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {}
  };

  try {
    // Environment validation check
    const envResult = SSOEnvironmentValidator.validateEnvironment();
    result.checks.environment = {
      status: envResult.valid ? 'pass' : 'fail',
      message: envResult.valid ? 'Environment configuration valid' : 'Environment validation failed',
      details: {
        errors: envResult.errors,
        warnings: envResult.warnings
      }
    };

    if (!envResult.valid) {
      result.status = 'unhealthy';
    } else if (envResult.warnings.length > 0) {
      result.status = 'degraded';
    }

    res.status(result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503)
       .json(result);

  } catch (error) {
    result.status = 'unhealthy';
    result.checks.system = {
      status: 'fail',
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };

    res.status(503).json(result);
  }
});

/**
 * Detailed health check endpoint
 * GET /api/sso-health/detailed
 */
router.get('/detailed', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {}
  };

  let hasFailures = false;
  let hasWarnings = false;

  try {
    // 1. Environment validation
    const envStart = Date.now();
    try {
      const envResult = SSOEnvironmentValidator.validateEnvironment();
      result.checks.environment = {
        status: envResult.valid ? 'pass' : 'fail',
        responseTime: Date.now() - envStart,
        message: envResult.valid ? 'Environment configuration valid' : 'Environment validation failed',
        details: {
          errors: envResult.errors,
          warnings: envResult.warnings,
          redisConfigured: SSOEnvironmentValidator.isRedisConfigured(),
          isProduction: SSOEnvironmentValidator.isProduction()
        }
      };

      if (!envResult.valid) hasFailures = true;
      if (envResult.warnings.length > 0) hasWarnings = true;
    } catch (error) {
      result.checks.environment = {
        status: 'fail',
        responseTime: Date.now() - envStart,
        message: `Environment check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      hasFailures = true;
    }

    // 2. Redis connectivity check
    const redisStart = Date.now();
    try {
      const rateLimiter = getRedisRateLimiter();
      const redisHealth = await rateLimiter.healthCheck();
      result.checks.redis = {
        status: redisHealth.healthy ? 'pass' : 'fail',
        responseTime: Date.now() - redisStart,
        message: redisHealth.message || (redisHealth.healthy ? 'Redis connection healthy' : 'Redis connection failed')
      };

      if (!redisHealth.healthy) hasFailures = true;
    } catch (error) {
      result.checks.redis = {
        status: 'fail',
        responseTime: Date.now() - redisStart,
        message: `Redis check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      hasFailures = true;
    }

    // 3. Rate limiting functionality check
    const rateLimitStart = Date.now();
    try {
      const rateLimiter = getRedisRateLimiter();
      // Test rate limiting with a dummy request
      const testResult = await rateLimiter.getRateLimitStatus(req, 'login', 'test');

      result.checks.rateLimiting = {
        status: 'pass',
        responseTime: Date.now() - rateLimitStart,
        message: 'Rate limiting functional',
        details: {
          testAttempts: testResult.attempts,
          remaining: testResult.remaining,
          blocked: testResult.blocked
        }
      };
    } catch (error) {
      result.checks.rateLimiting = {
        status: 'warn',
        responseTime: Date.now() - rateLimitStart,
        message: `Rate limiting check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      hasWarnings = true;
    }

    // 4. SSO Provider factory health
    const factoryStart = Date.now();
    try {
      const supportedProviders = ssoProviderFactory.getSupportedProviders();
      const providerHealth = await ssoProviderFactory.healthCheckProviders();

      const healthyProviders = Array.from(providerHealth.entries()).filter(([_, health]) => health.healthy).length;
      const totalProviders = providerHealth.size;

      result.checks.ssoProviders = {
        status: healthyProviders === totalProviders ? 'pass' : (healthyProviders > 0 ? 'warn' : 'fail'),
        responseTime: Date.now() - factoryStart,
        message: `${healthyProviders}/${totalProviders} providers healthy`,
        details: {
          supportedProviders,
          providerStatus: Object.fromEntries(providerHealth)
        }
      };

      if (healthyProviders === 0) hasFailures = true;
      else if (healthyProviders < totalProviders) hasWarnings = true;
    } catch (error) {
      result.checks.ssoProviders = {
        status: 'fail',
        responseTime: Date.now() - factoryStart,
        message: `Provider factory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      hasFailures = true;
    }

    // 5. Memory and performance metrics
    const memoryStart = Date.now();
    try {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();

      // Convert bytes to MB for readability
      const memoryMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      };

      // Warn if memory usage is high
      const highMemoryThreshold = 500; // MB
      const isHighMemory = memoryMB.heapUsed > highMemoryThreshold;

      result.checks.performance = {
        status: isHighMemory ? 'warn' : 'pass',
        responseTime: Date.now() - memoryStart,
        message: isHighMemory ? 'High memory usage detected' : 'Performance metrics normal',
        details: {
          memory: memoryMB,
          uptimeSeconds: Math.round(uptime),
          uptimeHuman: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
        }
      };

      if (isHighMemory) hasWarnings = true;
    } catch (error) {
      result.checks.performance = {
        status: 'warn',
        responseTime: Date.now() - memoryStart,
        message: `Performance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      hasWarnings = true;
    }

    // Determine overall status
    if (hasFailures) {
      result.status = 'unhealthy';
    } else if (hasWarnings) {
      result.status = 'degraded';
    }

    const totalResponseTime = Date.now() - startTime;
    result.checks.overall = {
      status: result.status === 'healthy' ? 'pass' : (result.status === 'degraded' ? 'warn' : 'fail'),
      responseTime: totalResponseTime,
      message: `Health check completed in ${totalResponseTime}ms`
    };

    // Set appropriate HTTP status code
    const statusCode = result.status === 'healthy' ? 200 : (result.status === 'degraded' ? 200 : 503);
    res.status(statusCode).json(result);

  } catch (error) {
    result.status = 'unhealthy';
    result.checks.system = {
      status: 'fail',
      responseTime: Date.now() - startTime,
      message: `Health check system error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };

    res.status(503).json(result);
  }
});

/**
 * Redis-specific health check
 * GET /api/sso-health/redis
 */
router.get('/redis', async (req: Request, res: Response) => {
  try {
    const rateLimiter = getRedisRateLimiter();
    const health = await rateLimiter.healthCheck();

    res.status(health.healthy ? 200 : 503).json({
      status: health.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      redis: health
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * SSO Providers health check
 * GET /api/sso-health/providers
 */
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const providerHealth = await ssoProviderFactory.healthCheckProviders();
    const supportedProviders = ssoProviderFactory.getSupportedProviders();

    const healthyCount = Array.from(providerHealth.values()).filter(h => h.healthy).length;
    const isHealthy = healthyCount === providerHealth.size;

    res.status(isHealthy ? 200 : 207).json({
      status: isHealthy ? 'healthy' : 'partial',
      timestamp: new Date().toISOString(),
      summary: {
        total: providerHealth.size,
        healthy: healthyCount,
        supported: supportedProviders
      },
      providers: Object.fromEntries(providerHealth)
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Rate limiting status check
 * GET /api/sso-health/rate-limiting
 */
router.get('/rate-limiting', async (req: Request, res: Response) => {
  try {
    const rateLimiter = getRedisRateLimiter();

    // Test all operation types
    const operations: Array<'login' | 'callback' | 'token'> = ['login', 'callback', 'token'];
    const results: Record<string, any> = {};

    for (const operation of operations) {
      try {
        const status = await rateLimiter.getRateLimitStatus(req, operation, 'test');
        results[operation] = {
          status: 'operational',
          ...status
        };
      } catch (error) {
        results[operation] = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    const allOperational = Object.values(results).every(r => r.status === 'operational');

    res.status(allOperational ? 200 : 207).json({
      status: allOperational ? 'healthy' : 'partial',
      timestamp: new Date().toISOString(),
      rateLimiting: results
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Readiness probe (for Kubernetes)
 * GET /api/sso-health/ready
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check critical dependencies only
    const envResult = SSOEnvironmentValidator.validateEnvironment();

    if (!envResult.valid) {
      return res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        reason: 'Environment validation failed',
        errors: envResult.errors
      });
    }

    // Quick Redis check
    const rateLimiter = getRedisRateLimiter();
    const redisHealth = await rateLimiter.healthCheck();

    if (!redisHealth.healthy) {
      return res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        reason: 'Redis not available',
        message: redisHealth.message
      });
    }

    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString(),
      message: 'SSO system ready'
    });

  } catch (error) {
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Liveness probe (for Kubernetes)
 * GET /api/sso-health/live
 */
router.get('/live', (req: Request, res: Response) => {
  // Simple liveness check - just verify the process is running
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

export default router;