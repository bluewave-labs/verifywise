// Enhanced response interface with resilience patterns support
interface EnhancedResponse {
  message: string;
  data?: any;
  error?: any;
  correlationId?: string;
  timestamp?: string;
  requestId?: string;
  service?: string;
  version?: string;
  duration?: number;
  metadata?: {
    retryCount?: number;
    circuitBreakerState?: string;
    fallbackUsed?: boolean;
  };
}

interface ResponseOptions {
  correlationId?: string;
  requestId?: string;
  service?: string;
  startTime?: number;
  retryCount?: number;
  circuitBreakerState?: string;
  fallbackUsed?: boolean;
}

export class STATUS_CODE {
  // Enhanced response builder
  private static buildResponse(
    message: string,
    statusCode: number,
    data?: any,
    error?: any,
    options?: ResponseOptions
  ): EnhancedResponse {
    const response: EnhancedResponse = {
      message,
      timestamp: new Date().toISOString(),
    };

    // Add data or error
    if (data !== undefined) {
      response.data = data;
    }
    if (error !== undefined) {
      response.error = error;
    }

    // Add correlation and request tracking
    if (options?.correlationId) {
      response.correlationId = options.correlationId;
    }
    if (options?.requestId) {
      response.requestId = options.requestId;
    }

    // Add service information
    if (options?.service) {
      response.service = options.service;
    }
    response.version = process.env.npm_package_version || "1.0.0";

    // Add timing information
    if (options?.startTime) {
      response.duration = Date.now() - options.startTime;
    }

    // Add resilience metadata
    if (options?.retryCount || options?.circuitBreakerState || options?.fallbackUsed) {
      response.metadata = {
        retryCount: options.retryCount,
        circuitBreakerState: options.circuitBreakerState,
        fallbackUsed: options.fallbackUsed,
      };
    }

    return response;
  }

  // 1XX informational response
  static 100 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Continue", 100, data, undefined, options);
  };
  static 101 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Switching Protocols", 101, data, undefined, options);
  };
  static 102 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Processing", 102, data, undefined, options);
  };
  static 103 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Early Hints", 103, data, undefined, options);
  };

  // 2XX success
  static 200 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("OK", 200, data, undefined, options);
  };
  static 201 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Created", 201, data, undefined, options);
  };
  static 202 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Accepted", 202, data, undefined, options);
  };
  static 203 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Non-Authoritative Information", 203, data, undefined, options);
  };
  static 204 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("No Content", 204, data, undefined, options);
  };

  // 3XX redirection
  static 300 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Multiple Choices", 300, data, undefined, options);
  };
  static 301 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Moved Permanently", 301, data, undefined, options);
  };
  static 302 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Found", 302, data, undefined, options);
  };

  // 4XX client errors
  static 400 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Bad Request", 400, undefined, data, options);
  };
  static 401 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Unauthorized", 401, undefined, data, options);
  };
  static 402 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Payment Required", 402, undefined, data, options);
  };
  static 403 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Forbidden", 403, undefined, data, options);
  };
  static 404 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Not Found", 404, undefined, data, options);
  };
  static 405 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Method Not Allowed", 405, undefined, data, options);
  };
  static 406 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Not Acceptable", 406, undefined, data, options);
  };
  static 407 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Proxy Authentication Required", 407, undefined, data, options);
  };
  static 408 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Request Timeout", 408, undefined, data, options);
  };
  static 409 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Conflict", 409, undefined, data, options);
  };
  static 422 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Unprocessable Entity", 422, undefined, data, options);
  };
  static 429 = (data: any, options?: ResponseOptions) => {
    return this.buildResponse("Too Many Requests", 429, undefined, data, options);
  };

  // 5XX server errors
  static 500 = (error: any, options?: ResponseOptions) => {
    return this.buildResponse("Internal Server Error", 500, undefined, error, options);
  };
  static 501 = (error: any, options?: ResponseOptions) => {
    return this.buildResponse("Not Implemented", 501, undefined, error, options);
  };
  static 502 = (error: any, options?: ResponseOptions) => {
    return this.buildResponse("Bad Gateway", 502, undefined, error, options);
  };
  static 503 = (error: any, options?: ResponseOptions) => {
    return this.buildResponse("Service Unavailable", 503, undefined, error, options);
  };
  static 504 = (error: any, options?: ResponseOptions) => {
    return this.buildResponse("Gateway Timeout", 504, undefined, error, options);
  };

  // Convenience methods for common resilience patterns
  static circuitBreakerOpen = (serviceName: string, options?: ResponseOptions) => {
    return this.buildResponse(
      "Service Temporarily Unavailable",
      503,
      undefined,
      { reason: "Circuit breaker is open", service: serviceName },
      { ...options, circuitBreakerState: "OPEN" }
    );
  };

  static fallbackResponse = (data: any, originalError: any, options?: ResponseOptions) => {
    return this.buildResponse(
      "Partial Response (Fallback)",
      200,
      data,
      undefined,
      { ...options, fallbackUsed: true }
    );
  };

  static retryExhausted = (error: any, retryCount: number, options?: ResponseOptions) => {
    return this.buildResponse(
      "Request Failed After Retries",
      503,
      undefined,
      error,
      { ...options, retryCount }
    );
  };

  static healthCheckFailed = (component: string, details: any, options?: ResponseOptions) => {
    return this.buildResponse(
      "Health Check Failed",
      503,
      undefined,
      { component, details },
      options
    );
  };

  // Helper method to extract correlation context from Express request
  static withCorrelationContext = (req: any): ResponseOptions => {
    return {
      correlationId: req.correlationId,
      requestId: req.headers['x-request-id'],
      service: 'verifywise-backend',
      startTime: req.startTime,
    };
  };
}
