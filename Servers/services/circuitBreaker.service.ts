import { correlationLogger } from "../utils/correlationLogger";

enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: CircuitState;
  successCount: number;
  requestCount: number;
  lastSuccessTime: number;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  timeout: number;
  resetTimeout: number;
  monitoringWindow: number;
  successThreshold: number; // successes needed in HALF_OPEN to go to CLOSED
}

interface ServiceMetrics {
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
  averageResponseTime: number;
  lastUpdateTime: number;
  availability: number;
}

class InternalServiceCircuitBreaker {
  private services = new Map<string, CircuitBreakerState>();
  private configs = new Map<string, CircuitBreakerConfig>();
  private metrics = new Map<string, ServiceMetrics>();

  constructor() {
    // Initialize configurations for internal services only
    // Note: Excluding bias service as per requirements

    this.configs.set("database", {
      failureThreshold: 3,
      timeout: 5000,
      resetTimeout: 15000,
      monitoringWindow: 30000,
      successThreshold: 2,
    });

    this.configs.set("internal-api", {
      failureThreshold: 5,
      timeout: 10000,
      resetTimeout: 30000,
      monitoringWindow: 60000,
      successThreshold: 3,
    });

    this.configs.set("file-system", {
      failureThreshold: 3,
      timeout: 8000,
      resetTimeout: 20000,
      monitoringWindow: 45000,
      successThreshold: 2,
    });

    this.configs.set("auth-service", {
      failureThreshold: 5,
      timeout: 6000,
      resetTimeout: 25000,
      monitoringWindow: 60000,
      successThreshold: 3,
    });

    // Initialize default metrics for all services
    for (const serviceName of this.configs.keys()) {
      this.metrics.set(serviceName, {
        totalRequests: 0,
        totalFailures: 0,
        totalSuccesses: 0,
        averageResponseTime: 0,
        lastUpdateTime: Date.now(),
        availability: 100,
      });
    }
  }

  async executeWithCircuitBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
    correlationId?: string
  ): Promise<T> {
    const state = this.getServiceState(serviceName);
    const config = this.configs.get(serviceName);

    if (!config) {
      throw new Error(`Circuit breaker not configured for service: ${serviceName}`);
    }

    const startTime = Date.now();

    // Check circuit breaker state
    if (state.state === CircuitState.OPEN) {
      if (Date.now() - state.lastFailureTime > config.resetTimeout) {
        // Move to HALF_OPEN for testing
        state.state = CircuitState.HALF_OPEN;
        state.successCount = 0;
        correlationLogger.logCircuitBreakerEvent(
          serviceName,
          "state_change",
          "HALF_OPEN",
          correlationId
        );
      } else {
        // Circuit is open, use fallback or throw error
        correlationLogger.logCircuitBreakerEvent(
          serviceName,
          "circuit_open",
          "OPEN",
          correlationId
        );

        if (fallback) {
          correlationLogger.info(
            `Using fallback for ${serviceName}`,
            { serviceName, state: state.state },
            correlationId
          );
          return await fallback();
        }
        throw new Error(
          `Service ${serviceName} is currently unavailable (circuit breaker OPEN)`
        );
      }
    }

    try {
      const result = await Promise.race([
        operation(),
        this.createTimeoutPromise<T>(config.timeout),
      ]);

      const responseTime = Date.now() - startTime;

      // Success - update metrics and reset failure count
      this.recordSuccess(serviceName, responseTime);
      this.updateMetrics(serviceName, true, responseTime);

      correlationLogger.logServiceCall(
        correlationId || "unknown",
        serviceName,
        "circuit_breaker_execute",
        true,
        responseTime
      );

      return result;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      // Failure - increment failure count and update metrics
      this.recordFailure(serviceName);
      this.updateMetrics(serviceName, false, responseTime);

      correlationLogger.logServiceCall(
        correlationId || "unknown",
        serviceName,
        "circuit_breaker_execute",
        false,
        responseTime,
        error
      );

      if (fallback) {
        correlationLogger.info(
          `Using fallback for ${serviceName} after failure`,
          { serviceName, error: error.message },
          correlationId
        );
        return await fallback();
      }
      throw error;
    }
  }

  // Database operations with circuit breaker
  async executeDatabaseQuery<T>(
    query: () => Promise<T>,
    fallback?: () => Promise<T>,
    correlationId?: string
  ): Promise<T> {
    return this.executeWithCircuitBreaker(
      "database",
      query,
      fallback,
      correlationId
    );
  }

  // Internal API calls with circuit breaker
  async executeInternalApiCall<T>(
    apiCall: () => Promise<T>,
    fallback?: () => Promise<T>,
    correlationId?: string
  ): Promise<T> {
    return this.executeWithCircuitBreaker(
      "internal-api",
      apiCall,
      fallback,
      correlationId
    );
  }

  // File system operations with circuit breaker
  async executeFileSystemOperation<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
    correlationId?: string
  ): Promise<T> {
    return this.executeWithCircuitBreaker(
      "file-system",
      operation,
      fallback,
      correlationId
    );
  }

  // Authentication operations with circuit breaker
  async executeAuthOperation<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
    correlationId?: string
  ): Promise<T> {
    return this.executeWithCircuitBreaker(
      "auth-service",
      operation,
      fallback,
      correlationId
    );
  }

  private getServiceState(serviceName: string): CircuitBreakerState {
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, {
        failures: 0,
        lastFailureTime: 0,
        state: CircuitState.CLOSED,
        successCount: 0,
        requestCount: 0,
        lastSuccessTime: Date.now(),
      });
    }
    return this.services.get(serviceName)!;
  }

  private recordSuccess(serviceName: string, responseTime: number): void {
    const state = this.getServiceState(serviceName);
    const config = this.configs.get(serviceName)!;

    state.lastSuccessTime = Date.now();
    state.requestCount++;

    if (state.state === CircuitState.HALF_OPEN) {
      state.successCount++;
      if (state.successCount >= config.successThreshold) {
        // Enough successes, close the circuit
        state.state = CircuitState.CLOSED;
        state.failures = 0;
        state.successCount = 0;
        correlationLogger.logCircuitBreakerEvent(
          serviceName,
          "state_change",
          "CLOSED"
        );
      }
    } else if (state.state === CircuitState.CLOSED) {
      // Reset failure count on success
      state.failures = 0;
    }
  }

  private recordFailure(serviceName: string): void {
    const state = this.getServiceState(serviceName);
    const config = this.configs.get(serviceName)!;

    state.failures++;
    state.lastFailureTime = Date.now();
    state.requestCount++;

    if (state.failures >= config.failureThreshold) {
      const previousState = state.state;
      state.state = CircuitState.OPEN;

      if (previousState !== CircuitState.OPEN) {
        correlationLogger.logCircuitBreakerEvent(
          serviceName,
          "state_change",
          "OPEN"
        );
      }
    }
  }

  private updateMetrics(
    serviceName: string,
    success: boolean,
    responseTime: number
  ): void {
    const metrics = this.metrics.get(serviceName);
    if (!metrics) return;

    metrics.totalRequests++;
    if (success) {
      metrics.totalSuccesses++;
    } else {
      metrics.totalFailures++;
    }

    // Update average response time (rolling average)
    metrics.averageResponseTime =
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) /
      metrics.totalRequests;

    // Update availability percentage
    metrics.availability =
      (metrics.totalSuccesses / metrics.totalRequests) * 100;

    metrics.lastUpdateTime = Date.now();
  }

  private createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Operation timeout")), timeout);
    });
  }

  // Monitoring and metrics
  getCircuitBreakerStatus(): Record<string, any> {
    const status: Record<string, any> = {};

    for (const [serviceName, state] of this.services) {
      const metrics = this.metrics.get(serviceName);

      status[serviceName] = {
        state: state.state,
        failures: state.failures,
        successCount: state.successCount,
        requestCount: state.requestCount,
        lastFailureTime: state.lastFailureTime
          ? new Date(state.lastFailureTime).toISOString()
          : null,
        lastSuccessTime: state.lastSuccessTime
          ? new Date(state.lastSuccessTime).toISOString()
          : null,
        healthy: state.state === CircuitState.CLOSED,
        metrics: metrics || {},
      };
    }

    return status;
  }

  // Get specific service status
  getServiceStatus(serviceName: string): any {
    const state = this.services.get(serviceName);
    const metrics = this.metrics.get(serviceName);
    const config = this.configs.get(serviceName);

    if (!state || !config) {
      return null;
    }

    return {
      serviceName,
      state: state.state,
      healthy: state.state === CircuitState.CLOSED,
      configuration: config,
      statistics: {
        failures: state.failures,
        successCount: state.successCount,
        requestCount: state.requestCount,
        lastFailureTime: state.lastFailureTime
          ? new Date(state.lastFailureTime).toISOString()
          : null,
        lastSuccessTime: state.lastSuccessTime
          ? new Date(state.lastSuccessTime).toISOString()
          : null,
      },
      metrics: metrics || {},
    };
  }

  // Reset circuit breaker for a specific service (for manual intervention)
  resetCircuitBreaker(serviceName: string): boolean {
    const state = this.services.get(serviceName);
    if (!state) return false;

    state.state = CircuitState.CLOSED;
    state.failures = 0;
    state.successCount = 0;
    state.lastSuccessTime = Date.now();

    correlationLogger.logCircuitBreakerEvent(
      serviceName,
      "manual_reset",
      "CLOSED"
    );

    return true;
  }

  // Get overall health status
  getOverallHealth(): {
    healthy: boolean;
    degraded: boolean;
    down: string[];
    total: number;
  } {
    const services = Array.from(this.services.entries());
    const down = services
      .filter(([_, state]) => state.state === CircuitState.OPEN)
      .map(([name]) => name);

    const degraded = services.some(
      ([_, state]) => state.state === CircuitState.HALF_OPEN
    );

    return {
      healthy: down.length === 0 && !degraded,
      degraded,
      down,
      total: services.length,
    };
  }
}

export const circuitBreaker = new InternalServiceCircuitBreaker();
export { CircuitState, CircuitBreakerConfig, ServiceMetrics };