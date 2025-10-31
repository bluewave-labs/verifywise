// API Performance Interceptor for tracking all HTTP requests

import { trackAPIPerformance } from './performance-monitoring';
import { trackApiError } from './posthog-advanced';

// Store for tracking ongoing API requests
const apiRequestTimes = new Map<string, { startTime: number; endpoint: string; method: string }>();

/**
 * Generate a unique request ID
 */
const generateRequestId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Extract endpoint name from URL
 */
const extractEndpoint = (url: string): string => {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.pathname;
  } catch {
    return url;
  }
};

/**
 * Intercept fetch requests to track performance
 */
export const setupFetchInterceptor = () => {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;

  window.fetch = async function(...args): Promise<Response> {
    const requestId = generateRequestId();
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
    const method = (args[1]?.method || 'GET').toUpperCase();
    const endpoint = extractEndpoint(url);

    // Store request start time
    const startTime = performance.now();
    apiRequestTimes.set(requestId, { startTime, endpoint, method });

    try {
      const response = await originalFetch.apply(this, args);
      const duration = performance.now() - startTime;

      // Track API performance
      trackAPIPerformance(
        endpoint,
        method,
        duration,
        response.status,
        response.ok
      );

      // Track errors separately
      if (!response.ok) {
        trackApiError(endpoint, response.status, {
          message: `HTTP ${response.status}`,
          method,
          duration_ms: Math.round(duration),
        }, {});
      }

      // Clean up
      apiRequestTimes.delete(requestId);

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;

      // Track network errors
      trackAPIPerformance(endpoint, method, duration, 0, false);
      trackApiError(endpoint, 0, error, {
        method,
        duration_ms: Math.round(duration),
        error_type: 'network_error',
      });

      // Clean up
      apiRequestTimes.delete(requestId);

      throw error;
    }
  };

  console.log('API performance interceptor enabled');
};

/**
 * Intercept XMLHttpRequest to track performance
 */
export const setupXHRInterceptor = () => {
  if (typeof window === 'undefined') return;

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(
    method: string,
    url: string,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ) {
    (this as any)._method = method.toUpperCase();
    (this as any)._url = url;
    (this as any)._endpoint = extractEndpoint(url);
    return originalOpen.call(this, method, url, async ?? true, username, password);
  };

  XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
    const startTime = performance.now();
    const method = (this as any)._method || 'GET';
    const endpoint = (this as any)._endpoint || 'unknown';

    // Add load event listener
    this.addEventListener('load', function() {
      const duration = performance.now() - startTime;
      trackAPIPerformance(
        endpoint,
        method,
        duration,
        this.status,
        this.status >= 200 && this.status < 300
      );

      if (this.status >= 400) {
        trackApiError(endpoint, this.status, {
          message: `HTTP ${this.status}`,
          method,
          duration_ms: Math.round(duration),
        }, {});
      }
    });

    // Add error event listener
    this.addEventListener('error', function() {
      const duration = performance.now() - startTime;
      trackAPIPerformance(endpoint, method, duration, 0, false);
      trackApiError(endpoint, 0, new Error('Network error'), {
        method,
        duration_ms: Math.round(duration),
        error_type: 'network_error',
      });
    });

    return originalSend.call(this, body);
  };

  console.log('XHR performance interceptor enabled');
};

/**
 * Initialize all API performance interceptors
 */
export const initializeAPIPerformanceTracking = () => {
  setupFetchInterceptor();
  setupXHRInterceptor();
  console.log('API performance tracking initialized');
};
