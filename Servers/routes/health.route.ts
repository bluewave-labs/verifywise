import { Router } from "express";
import {
  getLiveness,
  getReadiness,
  getDeepHealth,
  getComponentsHealth,
  getBasicHealth,
  getCircuitBreakerStatus,
  getServiceCircuitBreakerStatus,
  resetCircuitBreaker,
} from "../controllers/health.ctrl";

const router = Router();

/**
 * Health Check Routes
 * Provides comprehensive health monitoring endpoints for the VerifyWise backend
 */

// Basic health status (default endpoint)
router.get("/", getBasicHealth);

// Liveness probe - basic service availability check
// Used by Docker/Kubernetes to determine if container should be restarted
router.get("/live", getLiveness);

// Readiness probe - service ready to accept traffic
// Used by load balancers to determine if instance should receive requests
router.get("/ready", getReadiness);

// Deep health check - comprehensive system status
// Used by monitoring dashboards and detailed analysis
router.get("/deep", getDeepHealth);

// Component-specific health status
// Used for debugging individual service components
router.get("/components", getComponentsHealth);

// Circuit breaker monitoring endpoints
// Circuit breaker status for all services
router.get("/circuit-breakers", getCircuitBreakerStatus);

// Specific circuit breaker status
router.get("/circuit-breakers/:serviceName", getServiceCircuitBreakerStatus);

// Reset a specific circuit breaker (manual intervention)
router.post("/circuit-breakers/:serviceName/reset", resetCircuitBreaker);

export default router;