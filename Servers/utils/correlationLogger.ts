import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

interface RequestContext {
  correlationId: string;
  userId?: string;
  organizationId?: string;
  tenantId?: string;
  service: string;
  method: string;
  path: string;
  startTime: number;
  userAgent?: string;
}

interface ServiceCallContext {
  correlationId: string;
  targetService: string;
  operation: string;
  startTime: number;
  success?: boolean;
  duration?: number;
  error?: string;
}

class CorrelationLogger {
  private logger: winston.Logger;
  private activeRequests = new Map<string, RequestContext>();

  constructor() {
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), "logs");

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss.SSS",
        }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta,
          });
        })
      ),
      transports: [
        // Console logging for development
        new winston.transports.Console({
          level: process.env.NODE_ENV === "production" ? "warn" : "debug",
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        // Application logs
        new DailyRotateFile({
          filename: path.join(logsDir, "app-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          maxSize: process.env.LOG_MAX_SIZE || "20m",
          maxFiles: process.env.LOG_MAX_FILES || "14d",
          level: "info",
        }),
        // Error logs
        new DailyRotateFile({
          filename: path.join(logsDir, "error-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          level: "error",
          maxSize: process.env.LOG_MAX_SIZE || "20m",
          maxFiles: "30d",
        }),
        // Request tracing logs
        new DailyRotateFile({
          filename: path.join(logsDir, "requests-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          maxSize: process.env.LOG_MAX_SIZE || "20m",
          maxFiles: "7d",
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ],
    });

    // Handle uncaught exceptions and rejections
    this.logger.exceptions.handle(
      new DailyRotateFile({
        filename: path.join(logsDir, "exceptions-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        maxSize: "20m",
        maxFiles: "30d",
      })
    );

    this.logger.rejections.handle(
      new DailyRotateFile({
        filename: path.join(logsDir, "rejections-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        maxSize: "20m",
        maxFiles: "30d",
      })
    );
  }

  generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startRequest(req: any, service: string): string {
    const correlationId =
      req.headers["x-correlation-id"] ||
      req.headers["x-request-id"] ||
      this.generateCorrelationId();

    const context: RequestContext = {
      correlationId,
      userId: req.userId,
      organizationId: req.organizationId,
      tenantId: req.tenantId,
      service,
      method: req.method,
      path: req.path,
      startTime: Date.now(),
      userAgent: req.headers["user-agent"],
    };

    this.activeRequests.set(correlationId, context);

    this.logger.info("Request started", {
      ...context,
      event: "request_start",
      ip: req.ip || req.connection?.remoteAddress,
      timestamp: new Date().toISOString(),
    });

    // Add correlation ID to request for downstream services
    req.correlationId = correlationId;

    return correlationId;
  }

  endRequest(correlationId: string, statusCode: number, error?: any): void {
    const context = this.activeRequests.get(correlationId);
    if (!context) return;

    const duration = Date.now() - context.startTime;

    this.logger.info("Request completed", {
      ...context,
      event: "request_end",
      statusCode,
      duration,
      success: statusCode < 400,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            code: error.code,
          }
        : undefined,
      timestamp: new Date().toISOString(),
    });

    this.activeRequests.delete(correlationId);
  }

  logServiceCall(
    correlationId: string,
    targetService: string,
    operation: string,
    success: boolean,
    duration: number,
    error?: any
  ): void {
    const context = this.activeRequests.get(correlationId);

    this.logger.info("Service call", {
      correlationId,
      userId: context?.userId,
      organizationId: context?.organizationId,
      event: "service_call",
      targetService,
      operation,
      success,
      duration,
      error: error
        ? {
            message: error.message,
            code: error.code,
          }
        : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  logCircuitBreakerEvent(
    serviceName: string,
    event: string,
    state: string,
    correlationId?: string
  ): void {
    this.logger.warn("Circuit breaker event", {
      correlationId,
      event: "circuit_breaker",
      serviceName,
      circuitEvent: event,
      state,
      timestamp: new Date().toISOString(),
    });
  }

  logHealthCheckEvent(
    component: string,
    status: string,
    duration: number,
    details?: any
  ): void {
    this.logger.info("Health check", {
      event: "health_check",
      component,
      status,
      duration,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  logAuthEvent(
    correlationId: string,
    event: string,
    userId?: string,
    success: boolean = true,
    details?: any
  ): void {
    this.logger.info("Authentication event", {
      correlationId,
      event: "auth",
      authEvent: event,
      userId,
      success,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  logDatabaseQuery(
    correlationId: string,
    query: string,
    duration: number,
    success: boolean,
    error?: any
  ): void {
    this.logger.debug("Database query", {
      correlationId,
      event: "database_query",
      query: query.substring(0, 200), // Truncate long queries
      duration,
      success,
      error: error
        ? {
            message: error.message,
            code: error.code,
          }
        : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  // General purpose logging methods with correlation context
  info(message: string, meta?: any, correlationId?: string): void {
    this.logger.info(message, {
      correlationId,
      ...meta,
      timestamp: new Date().toISOString(),
    });
  }

  error(message: string, error?: any, correlationId?: string): void {
    this.logger.error(message, {
      correlationId,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            code: error.code,
          }
        : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  warn(message: string, meta?: any, correlationId?: string): void {
    this.logger.warn(message, {
      correlationId,
      ...meta,
      timestamp: new Date().toISOString(),
    });
  }

  debug(message: string, meta?: any, correlationId?: string): void {
    this.logger.debug(message, {
      correlationId,
      ...meta,
      timestamp: new Date().toISOString(),
    });
  }

  // Get current request contexts for monitoring
  getActiveRequestsCount(): number {
    return this.activeRequests.size;
  }

  getActiveRequests(): RequestContext[] {
    return Array.from(this.activeRequests.values());
  }

  // Cleanup old requests (safety mechanism)
  cleanupOldRequests(maxAgeMs: number = 300000): void {
    const now = Date.now();
    for (const [id, context] of this.activeRequests.entries()) {
      if (now - context.startTime > maxAgeMs) {
        this.logger.warn("Cleaning up old request context", {
          correlationId: id,
          event: "context_cleanup",
          age: now - context.startTime,
        });
        this.activeRequests.delete(id);
      }
    }
  }
}

export const correlationLogger = new CorrelationLogger();
export { RequestContext, ServiceCallContext };