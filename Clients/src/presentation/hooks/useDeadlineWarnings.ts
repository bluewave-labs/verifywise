/**
 * @fileoverview useDeadlineWarningsQuery Hook
 *
 * React Query-based hook for managing deadline warning state and data fetching.
 * Replaces manual state management with React Query for better caching,
 * deduplication, and performance.
 *
 * @package hooks
 */

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useMemo, useCallback, useState } from 'react';
import { useAuth } from '../../application/hooks/useAuth';
import { getDeadlineAnalytics } from '../../application/repository/deadlineAnalytics.repository';
import {
  DeadlineAnalytics,
  LoadingState,
  DeadlineError,
  DeadlineFilterState,
} from '../components/DeadlineWarningBox/types';

/**
 * Query keys for deadline warnings
 */
export const deadlineWarningQueryKeys = {
  all: ['deadlines'] as const,
  lists: () => [...deadlineWarningQueryKeys.all, 'list'] as const,
  list: (userId: number | null) => [...deadlineWarningQueryKeys.lists(), userId] as const,
  details: () => [...deadlineWarningQueryKeys.all, 'detail'] as const,
};

/**
 * Hook configuration options
 */
interface UseDeadlineWarningsQueryOptions {
  /**
   * Auto-refresh interval in milliseconds (0 = disabled)
   * @default 60000 (1 minute)
   */
  refreshInterval?: number;

  /**
   * Enable/disable query
   * @default true
   */
  enabled?: boolean;

  /**
   * Custom stale time in milliseconds
   * @default 30000 (30 seconds)
   */
  staleTime?: number;

  /**
   * Custom query options
   */
  queryOptions?: Omit<UseQueryOptions<DeadlineAnalytics, unknown>, 'queryKey' | 'queryFn'>;
}

/**
 * Hook return value
 */
interface UseDeadlineWarningsQueryReturn {
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
   * Whether the query is fetching
   */
  isFetching: boolean;

  /**
   * Last updated timestamp
   */
  lastUpdated: number | null;
}

/**
 * Default hook configuration
 */
const DEFAULT_CONFIG: Required<Omit<UseDeadlineWarningsQueryOptions, 'queryOptions'>> = {
  refreshInterval: 60000,
  enabled: true,
  staleTime: 30000,
};

/**
 * React Query-based hook for managing deadline warnings
 *
 * @param options - Hook configuration options
 * @returns Hook return value with state and actions
 */
export function useDeadlineWarnings(
  options: UseDeadlineWarningsQueryOptions = {}
): UseDeadlineWarningsQueryReturn {
  const config = { ...DEFAULT_CONFIG, ...options };
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  // Check if snoozed
  const isSnoozed = useMemo(() => {
    const snoozeData = localStorage.getItem('deadline-warnings-snoozed');
    if (!snoozeData) return false;

    const { snoozedAt, duration } = JSON.parse(snoozeData);
    const now = Date.now();
    const snoozeEndTime = snoozedAt + duration;

    // Clear expired snooze
    if (now > snoozeEndTime) {
      localStorage.removeItem('deadline-warnings-snoozed');
      return false;
    }

    return true;
  }, []);

  // Active filters state
  const [activeFilters, setActiveFiltersState] = useState<DeadlineFilterState>(() => {
    // Try to restore filters from localStorage
    try {
      const savedFilters = localStorage.getItem('deadline-warnings-filters');
      return savedFilters ? JSON.parse(savedFilters) : {};
    } catch {
      return {};
    }
  });

  // Main React Query for deadline analytics
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: deadlineWarningQueryKeys.list(userId),
    queryFn: async () => {
      const response = await getDeadlineAnalytics();
      return response.data;
    },
    enabled: config.enabled && !!userId && !isSnoozed,
    refetchInterval: config.refreshInterval,
    staleTime: config.staleTime,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...config.queryOptions,
  });

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

  // Convert unknown error to DeadlineError
  const formattedError: DeadlineError | null = useMemo(() => {
    if (!error) return null;

    if (error instanceof Error) {
      return {
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    // Handle Axios error or other error types
    if (typeof error === 'object' && error !== null) {
      const err = error as any;
      return {
        message: err.message || 'An unknown error occurred',
        code: err.code,
        statusCode: err.status || err.statusCode,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      message: 'An unknown error occurred',
      timestamp: new Date().toISOString(),
    };
  }, [error]);

  // Determine loading state
  const loadingState: LoadingState = useMemo(() => {
    if (isLoading) return 'loading';
    if (error) return 'error';
    if (data) return 'success';
    return 'idle';
  }, [isLoading, error, data]);

  // Retry function
  const retry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Refresh function (ignoring cache)
  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Clear cache function
  const clearCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: deadlineWarningQueryKeys.lists() });
    refetch();
  }, [queryClient, refetch]);

  // Set active filters
  const setActiveFilters = useCallback((filters: DeadlineFilterState) => {
    setActiveFiltersState(filters);
    try {
      localStorage.setItem('deadline-warnings-filters', JSON.stringify(filters));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Toggle filter for specific entity and severity
  const toggleFilter = useCallback((entityType: string, severity: "overdue" | "dueSoon") => {
    setActiveFiltersState((prev: DeadlineFilterState) => {
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

  // Clear all filters
  const clearFilters = useCallback(() => {
    setActiveFilters({});
  }, [setActiveFilters]);

  // Last updated timestamp
  const lastUpdated = useMemo(() => {
    if (!data) return null;
    // Extract lastUpdated from data if available, or use current time
    return (data as any).lastUpdated ? new Date((data as any).lastUpdated).getTime() : Date.now();
  }, [data]);

  return {
    data: data || null,
    loadingState,
    error: formattedError,
    totalOverdue,
    totalDueSoon,
    hasWarnings,
    activeFilters,
    retry,
    refresh,
    clearCache,
    setActiveFilters,
    toggleFilter,
    clearFilters,
    isFetching,
    lastUpdated,
  };
}

export default useDeadlineWarnings;