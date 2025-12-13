/**
 * @fileoverview useDeadlineWarnings Hook
 *
 * Custom React hook for managing deadline warning state and data fetching.
 * Provides automatic refresh, error handling, and performance optimization.
 *
 * @package hooks
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  fetchDeadlineAnalytics,
  clearDeadlineCache,
  DeadlineApiError,
} from "../../infrastructure/api/deadlineService";
import {
  DeadlineAnalytics,
  LoadingState,
  DeadlineError,
  DeadlineWarningMetrics,
  DeadlineFilterState,
} from "../components/DeadlineWarningBox/types";

/**
 * Hook configuration options
 */
interface UseDeadlineWarningsOptions {
  /**
   * Auto-refresh interval in milliseconds (0 = disabled)
   * @default 60000 (1 minute)
   */
  refreshInterval?: number;

  /**
   * Enable/disable caching
   * @default true
   */
  enableCache?: boolean;

  /**
   * Retry delay in milliseconds on error
   * @default 5000 (5 seconds)
   */
  retryDelay?: number;

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Enable performance metrics collection
   * @default false
   */
  enableMetrics?: boolean;

  /**
   * Callback for successful data fetch
   */
  onSuccess?: (data: DeadlineAnalytics) => void;

  /**
   * Callback for error during fetch
   */
  onError?: (error: DeadlineError) => void;

  /**
   * Callback for loading state changes
   */
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * Hook return value
 */
interface UseDeadlineWarningsReturn {
  /**
   * Deadline analytics data
   */
  data: DeadlineAnalytics | null;

  /**
   * Current loading state
   */
  loadingState: LoadingState;

  /**
   * Error information (if any)
   */
  error: DeadlineError | null;

  /**
   * Total count of overdue items
   */
  totalOverdue: number;

  /**
   * Total count of due-soon items
   */
  totalDueSoon: number;

  /**
   * Whether there are any warnings to display
   */
  hasWarnings: boolean;

  /**
   * Performance metrics (if enabled)
   */
  metrics: DeadlineWarningMetrics | null;

  /**
   * Currently active filters
   */
  activeFilters: DeadlineFilterState;

  /**
   * Retry fetching data
   */
  retry: () => void;

  /**
   * Refresh data (ignoring cache)
   */
  refresh: () => void;

  /**
   * Clear cache and refetch
   */
  clearCache: () => void;

  /**
   * Set active filters
   */
  setActiveFilters: (filters: DeadlineFilterState) => void;

  /**
   * Toggle filter for specific entity and severity
   */
  toggleFilter: (entityType: string, severity: "overdue" | "dueSoon") => void;

  /**
   * Clear all filters
   */
  clearFilters: () => void;

  /**
   * Abort current request
   */
  abortRequest: () => void;
}

/**
 * Default hook configuration
 */
const DEFAULT_CONFIG: Required<Omit<UseDeadlineWarningsOptions, "onSuccess" | "onError" | "onLoadingChange">> = {
  refreshInterval: 60000,
  enableCache: true,
  retryDelay: 5000,
  maxRetries: 3,
  enableMetrics: false,
};

/**
 * Custom hook for managing deadline warnings
 *
 * @param options - Hook configuration options
 * @returns Hook return value with state and actions
 */
export function useDeadlineWarnings(
  options: UseDeadlineWarningsOptions = {}
): UseDeadlineWarningsReturn {
  const config = { ...DEFAULT_CONFIG, ...options };

  // State management
  const [data, setData] = useState<DeadlineAnalytics | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<DeadlineError | null>(null);
  const [activeFilters, setActiveFilters] = useState<DeadlineFilterState>({});
  const [metrics, setMetrics] = useState<DeadlineWarningMetrics | null>(null);

  // Refs for cleanup and request management
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);

  // Computed values - calculate totals from entity data
  const totalOverdue = useMemo(() => {
    if (!data) return 0;
    return Object.values(data).reduce((total, entity: any) => {
      return total + (entity?.overdue || 0);
    }, 0);
  }, [data]);

  const totalDueSoon = useMemo(() => {
    if (!data) return 0;
    return Object.values(data).reduce((total, entity: any) => {
      return total + (entity?.dueSoon || 0);
    }, 0);
  }, [data]);

  const hasWarnings = totalOverdue > 0 || totalDueSoon > 0;

  /**
   * Update performance metrics
   */
  const updateMetrics = useCallback((operation: string, duration: number) => {
    if (!config.enableMetrics) return;

    setMetrics(prev => ({
      renderTime: prev?.renderTime ?? 0,
      apiResponseTime: duration,
      lastRefreshTime: Date.now(),
      refreshCount: (prev?.refreshCount ?? 0) + 1,
      errorCount: operation === "error" ? (prev?.errorCount ?? 0) + 1 : (prev?.errorCount ?? 0),
    }));
  }, [config.enableMetrics]);

  /**
   * Handle API errors
   */
  const handleError = useCallback((err: unknown) => {
    let deadlineError: DeadlineError;

    if (err instanceof DeadlineApiError) {
      deadlineError = {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        timestamp: new Date().toISOString(),
      };
    } else if (err instanceof Error) {
      deadlineError = {
        message: err.message,
        timestamp: new Date().toISOString(),
      };
    } else {
      deadlineError = {
        message: "An unknown error occurred",
        timestamp: new Date().toISOString(),
      };
    }

    setError(deadlineError);
    setLoadingState("error");
    config.onError?.(deadlineError);
    updateMetrics("error", 0);

    // Auto-retry if configured
    if (retryCountRef.current < config.maxRetries) {
      retryTimeoutRef.current = setTimeout(() => {
        retryCountRef.current++;
        fetchData(true);
      }, config.retryDelay);
    }
  }, [config, updateMetrics]);

  /**
   * Fetch deadline analytics data
   */
  const fetchData = useCallback(
    async (forceRefresh = false) => {
      // Cancel any existing request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setLoadingState("loading");
      config.onLoadingChange?.(true);

      const startTime = performance.now();

      try {
        const analytics = await fetchDeadlineAnalytics({
          useCache: config.enableCache && !forceRefresh,
          signal: abortControllerRef.current.signal,
        });

        const duration = performance.now() - startTime;
        updateMetrics("success", duration);

        setData(analytics);
        setError(null);
        setLoadingState("success");
        retryCountRef.current = 0;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was aborted, don't treat as error
          return;
        }
        handleError(err);
      } finally {
        config.onLoadingChange?.(false);
      }
    },
    [config, handleError, updateMetrics]
  );

  /**
   * Retry fetching data
   */
  const retry = useCallback(() => {
    retryCountRef.current = 0;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    fetchData(true);
  }, [fetchData]);

  /**
   * Refresh data (ignore cache)
   */
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  /**
   * Clear cache and refetch
   */
  const clearCache = useCallback(() => {
    clearDeadlineCache();
    fetchData(true);
  }, [fetchData]);

  /**
   * Toggle filter for specific entity and severity
   */
  const toggleFilter = useCallback((entityType: string, severity: "overdue" | "dueSoon") => {
    setActiveFilters(prev => {
      const entityFilters = prev[entityType] || { overdue: false, dueSoon: false };
      const newEntityFilters = {
        ...entityFilters,
        [severity]: !entityFilters[severity],
      };

      // Remove filter if both are false
      if (!newEntityFilters.overdue && !newEntityFilters.dueSoon) {
        const { [entityType]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [entityType]: newEntityFilters,
      };
    });
  }, []);

  /**
   * Clear all active filters
   */
  const clearFilters = useCallback(() => {
    setActiveFilters({});
  }, []);

  /**
   * Abort current request
   */
  const abortRequest = useCallback(() => {
    abortControllerRef.current?.abort();
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up auto-refresh interval
  useEffect(() => {
    if (config.refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchData(false);
      }, config.refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [config.refreshInterval, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRequest();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [abortRequest]);

  return {
    data,
    loadingState,
    error,
    totalOverdue,
    totalDueSoon,
    hasWarnings,
    metrics,
    activeFilters,
    retry,
    refresh,
    clearCache,
    setActiveFilters,
    toggleFilter,
    clearFilters,
    abortRequest,
  };
}

export default useDeadlineWarnings;