// Error Tracking for PostHog Analytics

import { trackEvent } from './posthog';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error categories
 */
export enum ErrorCategory {
  JAVASCRIPT = 'javascript',
  NETWORK = 'network',
  REACT = 'react',
  API = 'api',
  AUTH = 'authentication',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown',
}

/**
 * Check if an error should be ignored (dev tools, known benign errors, etc.)
 */
const shouldIgnoreError = (errorMessage: string, errorStack?: string): boolean => {
  // List of patterns to ignore
  const ignorePatterns = [
    // React Query DevTools popup errors
    'Failed to open popup',
    'picture-in-picture',

    // React DevTools
    'react-devtools',
    'devtools',

    // Chrome extensions
    'chrome-extension://',
    'moz-extension://',

    // ResizeObserver errors (common and harmless)
    'ResizeObserver loop',

    // Common browser errors we can't control
    'Script error.',

    // Vite HMR errors in development
    'hmr update',
    '[vite]',
  ];

  const messageToCheck = errorMessage.toLowerCase();
  const stackToCheck = (errorStack || '').toLowerCase();

  return ignorePatterns.some(pattern =>
    messageToCheck.includes(pattern.toLowerCase()) ||
    stackToCheck.includes(pattern.toLowerCase())
  );
};

/**
 * Track JavaScript errors
 */
export const trackJavaScriptError = (
  error: Error,
  errorInfo?: any,
  context?: Record<string, any>
) => {
  try {
    // Ignore benign errors
    if (shouldIgnoreError(error.message, error.stack)) {
      if (import.meta.env.DEV) {
        console.log('PostHog: Ignored benign JavaScript error:', error.message);
      }
      return;
    }

    trackEvent('javascript_error', {
      error_message: error.message,
      error_name: error.name,
      error_stack: error.stack,
      error_info: errorInfo,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.JAVASCRIPT,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      user_agent: navigator.userAgent,
      ...context,
    });

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.error('PostHog: JavaScript Error Tracked:', {
        message: error.message,
        stack: error.stack,
        context,
      });
    }
  } catch (trackingError) {
    console.error('Failed to track JavaScript error:', trackingError);
  }
};

/**
 * Track React component errors
 */
export const trackReactError = (
  error: Error,
  errorInfo: { componentStack: string },
  context?: Record<string, any>
) => {
  try {
    trackEvent('react_error', {
      error_message: error.message,
      error_name: error.name,
      error_stack: error.stack,
      component_stack: errorInfo.componentStack,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.REACT,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...context,
    });

    if (import.meta.env.DEV) {
      console.error('PostHog: React Error Tracked:', {
        message: error.message,
        componentStack: errorInfo.componentStack,
        context,
      });
    }
  } catch (trackingError) {
    console.error('Failed to track React error:', trackingError);
  }
};

/**
 * Track network/API errors
 */
export const trackNetworkError = (
  url: string,
  method: string,
  statusCode: number,
  error: any,
  context?: Record<string, any>
) => {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);

    trackEvent('network_error', {
      error_message: errorMessage,
      url,
      method,
      status_code: statusCode,
      severity: statusCode >= 500 ? ErrorSeverity.CRITICAL : ErrorSeverity.HIGH,
      category: ErrorCategory.NETWORK,
      timestamp: new Date().toISOString(),
      is_timeout: errorMessage.includes('timeout'),
      is_network_failure: statusCode === 0,
      ...context,
    });

    if (import.meta.env.DEV) {
      console.error('PostHog: Network Error Tracked:', {
        url,
        method,
        statusCode,
        error: errorMessage,
      });
    }
  } catch (trackingError) {
    console.error('Failed to track network error:', trackingError);
  }
};

/**
 * Track promise rejection errors
 */
export const trackPromiseRejection = (
  reason: any,
  _promise: Promise<any>,
  context?: Record<string, any>
) => {
  try {
    const errorMessage = reason instanceof Error ? reason.message : String(reason);
    const errorStack = reason instanceof Error ? reason.stack : undefined;

    // Ignore benign errors
    if (shouldIgnoreError(errorMessage, errorStack)) {
      if (import.meta.env.DEV) {
        console.log('PostHog: Ignored benign promise rejection:', errorMessage);
      }
      return;
    }

    trackEvent('promise_rejection', {
      error_message: errorMessage,
      error_stack: errorStack,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.JAVASCRIPT,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...context,
    });

    if (import.meta.env.DEV) {
      console.error('PostHog: Promise Rejection Tracked:', {
        reason: errorMessage,
        stack: errorStack,
      });
    }
  } catch (trackingError) {
    console.error('Failed to track promise rejection:', trackingError);
  }
};

/**
 * Track authentication errors
 */
export const trackAuthError = (
  errorType: string,
  message: string,
  context?: Record<string, any>
) => {
  try {
    trackEvent('auth_error', {
      error_type: errorType,
      error_message: message,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.AUTH,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...context,
    });
  } catch (trackingError) {
    console.error('Failed to track auth error:', trackingError);
  }
};

/**
 * Track validation errors
 */
export const trackValidationError = (
  formName: string,
  fieldErrors: Record<string, string>,
  context?: Record<string, any>
) => {
  try {
    trackEvent('validation_error', {
      form_name: formName,
      field_errors: fieldErrors,
      error_count: Object.keys(fieldErrors).length,
      severity: ErrorSeverity.LOW,
      category: ErrorCategory.VALIDATION,
      timestamp: new Date().toISOString(),
      ...context,
    });
  } catch (trackingError) {
    console.error('Failed to track validation error:', trackingError);
  }
};

/**
 * Track permission/authorization errors
 */
export const trackPermissionError = (
  action: string,
  resource: string,
  context?: Record<string, any>
) => {
  try {
    trackEvent('permission_error', {
      action,
      resource,
      error_message: `Permission denied for ${action} on ${resource}`,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.PERMISSION,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...context,
    });
  } catch (trackingError) {
    console.error('Failed to track permission error:', trackingError);
  }
};

/**
 * Track custom errors
 */
export const trackCustomError = (
  errorName: string,
  errorMessage: string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context?: Record<string, any>
) => {
  try {
    trackEvent('custom_error', {
      error_name: errorName,
      error_message: errorMessage,
      severity,
      category: ErrorCategory.UNKNOWN,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...context,
    });
  } catch (trackingError) {
    console.error('Failed to track custom error:', trackingError);
  }
};

/**
 * Initialize global error handlers
 */
export const initializeErrorTracking = () => {
  if (typeof window === 'undefined') return;

  // Track uncaught JavaScript errors
  window.addEventListener('error', (event: ErrorEvent) => {
    trackJavaScriptError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    trackPromiseRejection(event.reason, event.promise);
  });

  // Track console errors (optional - can be noisy)
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Call original console.error
    originalConsoleError.apply(console, args);

    // Track to PostHog (only in production to avoid dev noise)
    if (!import.meta.env.DEV) {
      const errorMessage = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      trackCustomError('console_error', errorMessage, ErrorSeverity.LOW);
    }
  };
};

/**
 * Get error context from browser
 */
export const getErrorContext = (): Record<string, any> => {
  return {
    url: window.location.href,
    user_agent: navigator.userAgent,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    online: navigator.onLine,
    language: navigator.language,
    referrer: document.referrer,
    timestamp: new Date().toISOString(),
  };
};
