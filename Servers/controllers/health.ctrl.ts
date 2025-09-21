import { Request, Response } from "express";
import { healthService } from "../services/health.service";
import { circuitBreaker } from "../services/circuitBreaker.service";

/**
 * Health Controller
 * Provides multiple health check endpoints for different monitoring needs
 */

/**
 * GET /health/live
 * Basic liveness probe - checks if the service is running
 * Used by Docker/Kubernetes for basic health checks
 */
export const getLiveness = async (req: Request, res: Response) => {
  try {
    const result = await healthService.getLiveness();
    res.status(200).json(result);
  } catch (error: any) {
    res.status(503).json({
      status: "down",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};

/**
 * GET /health/ready
 * Readiness probe - checks if the service is ready to accept traffic
 * Used by load balancers to determine if instance should receive requests
 */
export const getReadiness = async (req: Request, res: Response) => {
  try {
    const result = await healthService.getReadiness();
    const statusCode = result.status === "ready" ? 200 : 503;
    res.status(statusCode).json(result);
  } catch (error: any) {
    res.status(503).json({
      status: "not_ready",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};

/**
 * GET /health/deep
 * Comprehensive health check - detailed system status
 * Used by monitoring dashboards and detailed health analysis
 */
export const getDeepHealth = async (req: Request, res: Response) => {
  try {
    const useCache = req.query.cache !== "false";
    const requestId = (req.headers["x-request-id"] as string) ||
                     (req.headers["x-correlation-id"] as string) ||
                     `req_${Date.now()}`;

    const result = await healthService.getHealthSummary(useCache, requestId);

    const statusCode = result.overall === "healthy" ? 200 :
                      result.overall === "degraded" ? 200 : 503;

    res.status(statusCode).json(result);
  } catch (error: any) {
    res.status(503).json({
      overall: "down",
      timestamp: new Date().toISOString(),
      error: error.message,
      metadata: {
        requestId: `error_${Date.now()}`,
        responseTime: 0,
        checks: {
          performed: 0,
          passed: 0,
          failed: 1,
        },
      },
    });
  }
};

/**
 * GET /health/components
 * Individual component health status
 * Used for debugging specific service issues
 */
export const getComponentsHealth = async (req: Request, res: Response) => {
  try {
    const requestId = (req.headers["x-request-id"] as string) ||
                     (req.headers["x-correlation-id"] as string) ||
                     `comp_${Date.now()}`;

    const result = await healthService.getHealthSummary(false, requestId);

    const componentsOnly = {
      timestamp: result.timestamp,
      components: result.components,
      metadata: result.metadata,
    };

    res.status(200).json(componentsOnly);
  } catch (error: any) {
    res.status(503).json({
      timestamp: new Date().toISOString(),
      components: [],
      error: error.message,
    });
  }
};

/**
 * GET /health (default endpoint)
 * Basic health status - returns overall system health
 * Used for simple health monitoring
 */
export const getBasicHealth = async (req: Request, res: Response) => {
  try {
    const result = await healthService.getHealthSummary(true);

    const basicHealth = {
      status: result.overall,
      timestamp: result.timestamp,
      uptime: result.uptime,
      version: result.version,
      environment: result.environment,
      responseTime: result.metadata.responseTime,
    };

    const statusCode = result.overall === "healthy" ? 200 :
                      result.overall === "degraded" ? 200 : 503;

    res.status(statusCode).json(basicHealth);
  } catch (error: any) {
    res.status(503).json({
      status: "down",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};

/**
 * GET /health/circuit-breakers
 * Circuit breaker status for all services
 * Used for monitoring resilience patterns
 */
export const getCircuitBreakerStatus = async (req: Request, res: Response) => {
  try {
    const status = circuitBreaker.getCircuitBreakerStatus();
    const overallHealth = circuitBreaker.getOverallHealth();

    const response = {
      timestamp: new Date().toISOString(),
      overall: overallHealth,
      services: status,
    };

    const statusCode = overallHealth.healthy ? 200 :
                      overallHealth.down.length > 0 ? 503 : 200;

    res.status(statusCode).json(response);
  } catch (error: any) {
    res.status(503).json({
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};

/**
 * GET /health/circuit-breakers/:serviceName
 * Specific circuit breaker status
 * Used for debugging individual service circuit breakers
 */
export const getServiceCircuitBreakerStatus = async (req: Request, res: Response) => {
  try {
    const serviceName = req.params.serviceName;
    const status = circuitBreaker.getServiceStatus(serviceName);

    if (!status) {
      return res.status(404).json({
        error: `Circuit breaker not found for service: ${serviceName}`,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json(status);
  } catch (error: any) {
    res.status(503).json({
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};

/**
 * POST /health/circuit-breakers/:serviceName/reset
 * Reset a specific circuit breaker
 * Used for manual intervention
 */
export const resetCircuitBreaker = async (req: Request, res: Response) => {
  try {
    const serviceName = req.params.serviceName;
    const success = circuitBreaker.resetCircuitBreaker(serviceName);

    if (!success) {
      return res.status(404).json({
        error: `Circuit breaker not found for service: ${serviceName}`,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      message: `Circuit breaker reset successfully for service: ${serviceName}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};