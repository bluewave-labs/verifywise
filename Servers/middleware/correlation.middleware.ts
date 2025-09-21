import { Request, Response, NextFunction } from "express";
import { correlationLogger } from "../utils/correlationLogger";

// Extend Express Request interface to include correlation context
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      startTime?: number;
    }
  }
}

/**
 * Correlation middleware for request tracing
 * Adds correlation ID to all requests and logs request lifecycle
 */
export const correlationMiddleware = (serviceName: string = "verifywise-backend") => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip health checks from detailed logging to reduce noise
    const isHealthCheck = req.path.startsWith("/health");

    // Start request tracking
    const correlationId = correlationLogger.startRequest(req, serviceName);
    req.correlationId = correlationId;
    req.startTime = Date.now();

    // Add correlation ID to response headers for client-side tracing
    res.setHeader("X-Correlation-ID", correlationId);

    // Override res.json to capture response details
    const originalJson = res.json;
    res.json = function (data: any) {
      const statusCode = res.statusCode;
      const duration = req.startTime ? Date.now() - req.startTime : 0;

      // Log response details (except for health checks to reduce noise)
      if (!isHealthCheck) {
        correlationLogger.endRequest(correlationId, statusCode);
      }

      return originalJson.call(this, data);
    };

    // Override res.send to capture non-JSON responses
    const originalSend = res.send;
    res.send = function (data: any) {
      const statusCode = res.statusCode;

      // Log response details (except for health checks)
      if (!isHealthCheck) {
        correlationLogger.endRequest(correlationId, statusCode);
      }

      return originalSend.call(this, data);
    };

    // Handle errors
    const originalNext = next;
    next = (error?: any) => {
      if (error) {
        correlationLogger.endRequest(correlationId, 500, error);
      }
      return originalNext(error);
    };

    // Continue to next middleware
    next();
  };
};

/**
 * Error handling middleware with correlation context
 * Should be used as the last middleware in the chain
 */
export const correlationErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const correlationId = req.correlationId || "unknown";

  // Log the error with correlation context
  correlationLogger.error("Unhandled error", error, correlationId);

  // Ensure the request is marked as completed
  if (req.correlationId) {
    correlationLogger.endRequest(req.correlationId, 500, error);
  }

  // Send error response with correlation ID
  const errorResponse = {
    error: "Internal Server Error",
    correlationId,
    timestamp: new Date().toISOString(),
  };

  // Include error details in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.error = error.message;
    (errorResponse as any).stack = error.stack;
  }

  res.status(500).json(errorResponse);
};

/**
 * Database query interceptor for logging database operations
 * Can be used with Sequelize hooks
 */
export const logDatabaseQuery = (
  query: string,
  duration: number,
  correlationId?: string,
  error?: any
) => {
  correlationLogger.logDatabaseQuery(
    correlationId || "unknown",
    query,
    duration,
    !error,
    error
  );
};

/**
 * Service call logger helper
 * Use this when making calls to external services
 */
export const logServiceCall = async <T>(
  correlationId: string,
  serviceName: string,
  operation: string,
  serviceCall: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();

  try {
    const result = await serviceCall();
    const duration = Date.now() - startTime;

    correlationLogger.logServiceCall(
      correlationId,
      serviceName,
      operation,
      true,
      duration
    );

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    correlationLogger.logServiceCall(
      correlationId,
      serviceName,
      operation,
      false,
      duration,
      error
    );

    throw error;
  }
};

/**
 * Authentication logger helper
 */
export const logAuthEvent = (
  req: Request,
  event: string,
  success: boolean = true,
  details?: any
) => {
  correlationLogger.logAuthEvent(
    req.correlationId || "unknown",
    event,
    req.userId?.toString(),
    success,
    details
  );
};

/**
 * Cleanup middleware for long-running requests
 * Should be called periodically to clean up stale request contexts
 */
export const cleanupMiddleware = () => {
  setInterval(() => {
    correlationLogger.cleanupOldRequests(300000); // 5 minutes
  }, 60000); // Run every minute
};

export { correlationLogger };