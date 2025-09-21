/**
 * @file customAxios.ts
 * @description Enhanced Axios instance with comprehensive resilience patterns including:
 * - Circuit breaker awareness and health monitoring
 * - Exponential backoff retry logic with jitter
 * - Correlation ID support for request tracing
 * - Advanced error handling and recovery mechanisms
 * - Network status awareness and offline handling
 * - Request timing and performance metrics
 * - Smart token refresh with queue management
 *
 * Resilience Features:
 * - Automatic retries with exponential backoff
 * - Circuit breaker integration with backend health status
 * - Correlation ID tracking for distributed tracing
 * - Network-aware request handling
 * - Request/response performance monitoring
 * - Enhanced error categorization and handling
 *
 * This setup ensures maximum reliability and observability for all HTTP communications.
 */

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { store } from "../../application/redux/store";
import { ENV_VARs } from "../../../env.vars";
import { clearAuthState, setAuthToken } from "../../application/redux/auth/authSlice";
import { AlertProps } from "../../domain/interfaces/iAlert";

// Enhanced resilience patterns interfaces
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryCondition: (error: AxiosError) => boolean;
}

interface RequestMetrics {
  correlationId: string;
  startTime: number;
  retryCount: number;
  endpoint: string;
  method: string;
}


// Health monitoring for circuit breaker awareness
class HealthMonitor {
  private static instance: HealthMonitor;
  private healthStatus: Map<string, boolean> = new Map();
  private lastHealthCheck = 0;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  static getInstance(): HealthMonitor {
    if (!this.instance) {
      this.instance = new HealthMonitor();
    }
    return this.instance;
  }

  async checkBackendHealth(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL) {
      return this.healthStatus.get('backend') ?? true;
    }

    try {
      const response = await axios.get('/health/live', {
        timeout: 5000,
        baseURL: `${ENV_VARs.URL}`,
      });
      const isHealthy = response.status === 200;
      this.healthStatus.set('backend', isHealthy);
      this.lastHealthCheck = now;
      return isHealthy;
    } catch (error) {
      this.healthStatus.set('backend', false);
      this.lastHealthCheck = now;
      return false;
    }
  }

  isServiceHealthy(service: string): boolean {
    return this.healthStatus.get(service) ?? true;
  }
}

// Request correlation and metrics tracking
class RequestTracker {
  private static instance: RequestTracker;
  private activeRequests = new Map<string, RequestMetrics>();
  private requestCounter = 0;

  static getInstance(): RequestTracker {
    if (!this.instance) {
      this.instance = new RequestTracker();
    }
    return this.instance;
  }

  generateCorrelationId(): string {
    this.requestCounter++;
    return `client_${Date.now()}_${this.requestCounter}_${Math.random().toString(36).substr(2, 6)}`;
  }

  startRequest(config: InternalAxiosRequestConfig): string {
    const correlationId = config.headers['X-Correlation-ID'] as string || this.generateCorrelationId();

    const metrics: RequestMetrics = {
      correlationId,
      startTime: Date.now(),
      retryCount: 0,
      endpoint: config.url || 'unknown',
      method: config.method?.toUpperCase() || 'GET',
    };

    this.activeRequests.set(correlationId, metrics);
    return correlationId;
  }

  recordRetry(correlationId: string): void {
    const metrics = this.activeRequests.get(correlationId);
    if (metrics) {
      metrics.retryCount++;
    }
  }

  endRequest(correlationId: string, success: boolean, statusCode?: number): void {
    const metrics = this.activeRequests.get(correlationId);
    if (metrics) {
      const duration = Date.now() - metrics.startTime;

      // Log performance metrics (in development)
      if (process.env.NODE_ENV === 'development') {
        console.debug(`Request ${correlationId}: ${metrics.method} ${metrics.endpoint}`, {
          duration,
          retries: metrics.retryCount,
          success,
          statusCode,
        });
      }

      this.activeRequests.delete(correlationId);
    }
  }

  getActiveRequestsCount(): number {
    return this.activeRequests.size;
  }
}

// Enhanced retry logic with exponential backoff
class RetryHandler {
  private static defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    retryCondition: (error: AxiosError) => {
      // Retry on network errors or 5xx server errors
      return !error.response || (error.response.status >= 500 && error.response.status < 600);
    },
  };

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    correlationId?: string
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    let lastError: Error;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0 && correlationId) {
          RequestTracker.getInstance().recordRetry(correlationId);
        }

        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry if this is the last attempt or if retry condition is not met
        if (attempt === finalConfig.maxRetries ||
            (error instanceof Error && 'isAxiosError' in error &&
             !finalConfig.retryCondition(error as AxiosError))) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          finalConfig.baseDelay * Math.pow(2, attempt),
          finalConfig.maxDelay
        );
        const jitter = delay * 0.1 * Math.random(); // Add up to 10% jitter

        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }

    throw lastError!;
  }
}

// Network status awareness
class NetworkMonitor {
  private static instance: NetworkMonitor;
  private isOnline = navigator.onLine;

  static getInstance(): NetworkMonitor {
    if (!this.instance) {
      this.instance = new NetworkMonitor();
      this.instance.setupEventListeners();
    }
    return this.instance;
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  isNetworkAvailable(): boolean {
    return this.isOnline;
  }
}

const performLogout = () => {
  store.dispatch(clearAuthState());
  window.location.href = '/login';
};

// Create a global callback for showing alerts
let showAlertCallback: ((alert: AlertProps) => void) | null = null;

// Function to set the alert callback
export const setShowAlertCallback = (callback: (alert: AlertProps) => void) => {
  showAlertCallback = callback;
};

// Initialize resilience monitoring
const healthMonitor = HealthMonitor.getInstance();
const requestTracker = RequestTracker.getInstance();
const networkMonitor = NetworkMonitor.getInstance();

// Create an enhanced instance of axios with resilience configurations
const CustomAxios = axios.create({
  baseURL: `${ENV_VARs.URL}/api`,
  timeout: 30000, // Increased timeout for better resilience
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // Don't send credentials by default
  withCredentials: false,
  // Enhanced axios configurations for resilience
  validateStatus: (status) => {
    // Accept all status codes, handle them in interceptors for better control
    return status >= 200 && status < 600;
  },
});

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
// Store pending requests that should be retried after token refresh
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Enhanced request interceptor with resilience patterns
CustomAxios.interceptors.request.use(
  async (config) => {
    // Check network availability
    if (!networkMonitor.isNetworkAvailable()) {
      throw new Error('Network unavailable. Please check your internet connection.');
    }

    // Check backend health for non-health endpoints
    if (!config.url?.includes('/health')) {
      const isHealthy = await healthMonitor.checkBackendHealth();
      if (!isHealthy) {
        console.warn('Backend health check failed, proceeding with request but expect possible failures');
      }
    }

    // Start request tracking and add correlation ID
    const correlationId = requestTracker.startRequest(config);
    config.headers['X-Correlation-ID'] = correlationId;
    config.headers['X-Request-ID'] = correlationId; // Alternative header name
    config.headers['X-Client-Version'] = process.env.REACT_APP_VERSION || '1.0.0';
    config.headers['X-Client-Timestamp'] = new Date().toISOString();

    // Add authorization token
    const state = store.getState();
    const token = state.auth.authToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Enable credentials for auth-related endpoints
    if (config.url?.includes('/users/login') || config.url?.includes('/users/refresh-token')) {
      config.withCredentials = true;
    }

    // Store the correlation ID in config for later use
    (config as any)._correlationId = correlationId;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with resilience patterns and metrics
CustomAxios.interceptors.response.use(
  (response: AxiosResponse) => {
    // Track successful response
    const correlationId = (response.config as any)._correlationId;
    if (correlationId) {
      requestTracker.endRequest(correlationId, true, response.status);
    }

    // Log backend correlation ID if present
    const backendCorrelationId = response.headers['x-correlation-id'];
    if (backendCorrelationId && process.env.NODE_ENV === 'development') {
      console.debug(`Request completed with backend correlation ID: ${backendCorrelationId}`);
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
      _correlationId?: string;
    };
    const responseData = (error.response?.data as { message?: string, correlationId?: string });

    // Track failed response
    const correlationId = originalRequest._correlationId;
    if (correlationId) {
      requestTracker.endRequest(correlationId, false, error.response?.status);
    }

    // Enhanced error logging with correlation context
    if (process.env.NODE_ENV === 'development') {
      console.error(`Request failed [${correlationId}]:`, {
        method: originalRequest.method?.toUpperCase(),
        url: originalRequest.url,
        status: error.response?.status,
        message: error.message,
        backendCorrelationId: responseData?.correlationId,
      });
    }

    // Handle specific status codes with enhanced logic
    if (error.response?.status === 404) {
      const errorMessage = responseData?.message || 'Resource not found';
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).correlationId = correlationId;
      (enhancedError as any).statusCode = 404;
      return Promise.reject(enhancedError);
    }

    // Handle server errors with retry logic (5xx errors)
    if (error.response?.status && error.response.status >= 500 &&
        !originalRequest._retry && !originalRequest.url?.includes('refresh-token')) {

      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      // Implement exponential backoff retry for server errors
      if (originalRequest._retryCount <= 3) {
        return RetryHandler.executeWithRetry(
          () => CustomAxios(originalRequest),
          {
            maxRetries: 1, // Single retry per interceptor call
            baseDelay: 1000 * originalRequest._retryCount,
            maxDelay: 5000,
            retryCondition: () => true, // Always retry server errors
          },
          correlationId
        );
      }
    }

    if (
      error.response?.status === 403 &&
      (
        responseData?.message === 'User does not belong to this organization' ||
        responseData?.message === 'Not allowed to access'
      )
    ) {
      if (showAlertCallback) {
        showAlertCallback({
          variant: "info",
          title: "Access Denied",
          body: "Please login again to continue.",
        });
      }
      setTimeout(() => {
        performLogout();
      }, 1000);

      const enhancedError = new Error(responseData?.message || 'Forbidden');
      (enhancedError as any).correlationId = correlationId;
      (enhancedError as any).statusCode = 403;
      return Promise.reject(enhancedError);
    }

    // If error is 406 (Token Expired) and we haven't tried to refresh yet
    if (error.response?.status === 406 && !originalRequest._retry) {
      // If this is the refresh token request itself returning 406
      if (originalRequest.url === '/users/refresh-token') {
        // Show alert using the callback
        if (showAlertCallback) {
          showAlertCallback({
            variant: "warning",
            title: "Session Expired",
            body: "Please login again to continue.",
          });
        }
        return Promise.reject(error);
      }

      // For other APIs returning 406, try to refresh the token
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return CustomAxios(originalRequest);
          })
          .catch((err) => {
            // If refresh token fails, redirect to login
            if (err.response?.status === 406) {
              store.dispatch(setAuthToken(""));
            }
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await CustomAxios.post(
          `/users/refresh-token`,
          {},
          { withCredentials: true }
        );

        if (response.status === 200) {
          const newToken = response.data.data.token;
          store.dispatch(setAuthToken(newToken));
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return CustomAxios(originalRequest);
        }
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        // If refresh token request fails with 406, redirect to login
        if (refreshError.response?.status === 406) {
          store.dispatch(setAuthToken(""));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Enhanced error handling for all other cases
    const enhancedError = new Error(error.message || 'Request failed');
    (enhancedError as any).originalError = error;
    (enhancedError as any).correlationId = correlationId;
    (enhancedError as any).statusCode = error.response?.status;
    (enhancedError as any).backendCorrelationId = responseData?.correlationId;
    (enhancedError as any).url = originalRequest.url;
    (enhancedError as any).method = originalRequest.method?.toUpperCase();

    // Add network error specific information
    if (!error.response) {
      (enhancedError as any).networkError = true;
      (enhancedError as any).isTimeout = error.code === 'ECONNABORTED';
      (enhancedError as any).isOffline = !networkMonitor.isNetworkAvailable();
    }

    return Promise.reject(enhancedError);
  }
);

// Export enhanced axios instance with resilience patterns
export default CustomAxios;

// Export resilience monitoring functions for external use
export const getNetworkStatus = () => networkMonitor.isNetworkAvailable();
export const getActiveRequestsCount = () => requestTracker.getActiveRequestsCount();
export const checkBackendHealth = () => healthMonitor.checkBackendHealth();

// Enhanced request wrapper with automatic retry for critical operations
export const resilientRequest = async <T>(
  requestConfig: any,
  retryConfig?: Partial<RetryConfig>
): Promise<T> => {
  return RetryHandler.executeWithRetry(
    () => CustomAxios(requestConfig),
    retryConfig
  );
};
