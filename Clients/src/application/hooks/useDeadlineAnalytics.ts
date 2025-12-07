import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import {
  getDeadlineSummary,
  getDeadlineDetails,
  getDeadlineConfig,
} from '../repository/deadlineAnalytics.repository';
import {
  DeadlineSummary,
  DeadlineDetail,
  DeadlineConfig,
  DeadlineAnalyticsState,
  UseDeadlineAnalyticsOptions,
} from '../../domain/interfaces/deadlineAnalytics.interface';

// Query keys for React Query
export const deadlineAnalyticsQueryKeys = {
  all: ['deadlineAnalytics'] as const,
  summary: (entityType?: string) => [...deadlineAnalyticsQueryKeys.all, 'summary', entityType] as const,
  details: (params?: { entityType?: string; category?: string; page?: number; limit?: number }) =>
    [...deadlineAnalyticsQueryKeys.all, 'details', params] as const,
  config: () => [...deadlineAnalyticsQueryKeys.all, 'config'] as const,
};

/**
 * Main hook for deadline analytics functionality
 * Provides comprehensive deadline tracking with overdue and due-soon detection
 *
 * @param options - Configuration options for the hook
 * @returns Object with deadline data, loading states, and utility functions
 */
export const useDeadlineAnalytics = (options: UseDeadlineAnalyticsOptions = {}) => {
  const {
    entityType = 'tasks',
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute default
    enableCache = true,
    onError,
    onSuccess,
  } = options;

  const queryClient = useQueryClient();

  // Query for deadline summary
  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: deadlineAnalyticsQueryKeys.summary(entityType),
    queryFn: () => getDeadlineSummary({ entityType }),
    select: (response) => response?.data as DeadlineSummary,
    enabled: true,
    staleTime: enableCache ? 30000 : 0, // 30 seconds if cached, 0 if not
    refetchInterval: autoRefresh ? refreshInterval : false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Query for deadline configuration
  const {
    data: configData,
    isLoading: configLoading,
    error: configError,
    refetch: refetchConfig,
  } = useQuery({
    queryKey: deadlineAnalyticsQueryKeys.config(),
    queryFn: getDeadlineConfig,
    select: (response) => response?.data as DeadlineConfig,
    enabled: true,
    staleTime: enableCache ? 300000 : 0, // 5 minutes for config (changes rarely)
    retry: 3,
  });

  // Utility function to get details with parameters
  const getDetails = useCallback(
    (params?: { category?: 'overdue' | 'dueSoon'; page?: number; limit?: number }) => {
      const queryParams = {
        entityType,
        ...params,
      };
      return queryClient.fetchQuery({
        queryKey: deadlineAnalyticsQueryKeys.details(queryParams),
        queryFn: () => getDeadlineDetails(queryParams),
        staleTime: enableCache ? 15000 : 0, // 15 seconds for details
      });
    },
    [entityType, queryClient, enableCache]
  );

  // Query for detailed items (hook version)
  const useDeadlineDetails = (params?: { category?: 'overdue' | 'dueSoon'; page?: number; limit?: number }) => {
    const queryParams = {
      entityType,
      ...params,
    };

    return useQuery({
      queryKey: deadlineAnalyticsQueryKeys.details(queryParams),
      queryFn: () => getDeadlineDetails(queryParams),
      select: (response) => response?.data as DeadlineDetail[],
      enabled: true,
      staleTime: enableCache ? 15000 : 0,
      retry: 2,
    });
  };

  // Computed state values
  const state: DeadlineAnalyticsState = useMemo(
    () => ({
      summary: summaryData || null,
      details: [], // Details are loaded on-demand via useDeadlineDetails
      config: configData || null,
      loading: {
        summary: summaryLoading,
        details: false, // Separate loading handled by useDeadlineDetails
        config: configLoading,
      },
      error: {
        summary: summaryError ? (summaryError as Error).message : null,
        details: null,
        config: configError ? (configError as Error).message : null,
      },
      lastUpdated: new Date(),
    }),
    [summaryData, configData, summaryLoading, configLoading, summaryError, configError]
  );

  // Computed values for convenience
  const totalOverdue = useMemo(() => {
    return summaryData?.tasks?.overdue || 0;
  }, [summaryData]);

  const totalDueSoon = useMemo(() => {
    return summaryData?.tasks?.dueSoon || 0;
  }, [summaryData]);

  const totalDeadlineIssues = useMemo(() => {
    return totalOverdue + totalDueSoon;
  }, [totalOverdue, totalDueSoon]);

  const hasDeadlines = useMemo(() => {
    return totalDeadlineIssues > 0;
  }, [totalDeadlineIssues]);

  // Utility functions
  const refetchAll = useCallback(() => {
    refetchSummary();
    refetchConfig();
    // Invalidate all detail queries
    queryClient.invalidateQueries({ queryKey: deadlineAnalyticsQueryKeys.details() });
  }, [refetchSummary, refetchConfig, queryClient]);

  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: deadlineAnalyticsQueryKeys.all });
  }, [queryClient]);

  // Error handling
  if (summaryError && onError) {
    onError(summaryError as Error);
  }

  // Success handling
  if (summaryData && onSuccess) {
    onSuccess(summaryData);
  }

  return {
    // State
    state,

    // Direct data access
    summary: summaryData,
    config: configData,

    // Computed values
    totalOverdue,
    totalDueSoon,
    totalDeadlineIssues,
    hasDeadlines,

    // Loading states
    loading: {
      summary: summaryLoading,
      config: configLoading,
    },

    // Error states
    error: {
      summary: summaryError,
      config: configError,
    },

    // Utility functions
    refetchSummary,
    refetchConfig,
    refetchAll,
    invalidateCache,
    getDetails,
    useDeadlineDetails,
  };
};

/**
 * Simplified hook for just deadline summary data
 * Useful for badges and quick indicators
 */
export const useDeadlineSummary = (entityType: 'tasks' | 'vendors' | 'policies' | 'risks' = 'tasks') => {
  const { summary, loading, error, refetchSummary } = useDeadlineAnalytics({ entityType });

  return {
    summary,
    loading: loading.summary,
    error: error.summary,
    refetch: refetchSummary,
    totalOverdue: summary?.tasks?.overdue || 0,
    totalDueSoon: summary?.tasks?.dueSoon || 0,
    totalDeadlineIssues: (summary?.tasks?.overdue || 0) + (summary?.tasks?.dueSoon || 0),
    hasDeadlines: ((summary?.tasks?.overdue || 0) + (summary?.tasks?.dueSoon || 0)) > 0,
  };
};

/**
 * Hook for deadline details with category filtering
 * Ideal for detailed deadline views and tables
 */
export const useDeadlineDetails = (
  entityType: 'tasks' | 'vendors' | 'policies' | 'risks' = 'tasks',
  category?: 'overdue' | 'dueSoon',
  page = 1,
  limit = 20
) => {
  const { useDeadlineDetails: useDetails } = useDeadlineAnalytics({ entityType });

  return useDetails({ category, page, limit });
};