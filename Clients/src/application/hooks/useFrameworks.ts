import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from "react";
import { Framework } from "../../domain/types/Framework";
import { ProjectFramework } from "../../domain/types/Project";
import { getAllFrameworks } from "../repository/entity.repository";

/**
 * Result object returned by the useFrameworks hook.
 */
interface UseFrameworksResult {
  /** All available frameworks in the system */
  allFrameworks: Framework[];
  /** Frameworks filtered to those assigned to the current project */
  filteredFrameworks: Framework[];
  /** Map of framework_id to project_framework_id for quick lookup */
  projectFrameworksMap: Map<number, number>;
  /** Loading state for the frameworks query */
  loading: boolean;
  /** Error message if fetch failed, null otherwise */
  error: string | null;
  /** Function to refetch all frameworks */
  refreshAllFrameworks: () => Promise<void>;
  /** Function to invalidate and refetch filtered frameworks */
  refreshFilteredFrameworks: () => Promise<void>;
}

/**
 * Parameters for the useFrameworks hook.
 */
interface UseFrameworksParams {
  /** List of project-framework relationships to filter by */
  listOfFrameworks: ProjectFramework[];
}

/**
 * Custom hook to fetch and manage frameworks with project-specific filtering.
 *
 * @param {UseFrameworksParams} params - The parameters object
 * @returns {UseFrameworksResult} Object containing frameworks data and utilities
 *
 * @example
 * const { allFrameworks, filteredFrameworks, loading } = useFrameworks({
 *   listOfFrameworks: project.framework
 * });
 */
const useFrameworks = ({
  listOfFrameworks,
}: UseFrameworksParams): UseFrameworksResult => {
  const queryClient = useQueryClient();

  // Fetch all frameworks using TanStack Query
  const {
    data: allFrameworks = [],
    isLoading: loading,
    error: queryError,
    refetch: refetchAllFrameworks
  } = useQuery({
    queryKey: ['frameworks', 'all'],
    queryFn: async () => {
      const response = await getAllFrameworks();
      if (response?.data) {
        return response.data;
      } else {
        throw new Error("Invalid response format");
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });

  // Memoized computation of filtered frameworks and project frameworks map
  const { filteredFrameworks, projectFrameworksMap } = useMemo(() => {
    const _projectFrameworksMap = new Map<number, number>();
    let _filteredFrameworks: Framework[] = [];

    if (allFrameworks.length > 0 && listOfFrameworks.length > 0) {
      const frameworkIds = listOfFrameworks.map((f: ProjectFramework) => {
        _projectFrameworksMap.set(Number(f.framework_id), Number(f.project_framework_id));
        return Number(f.framework_id);
      });

      _filteredFrameworks = allFrameworks.filter((fw: Framework) =>
        frameworkIds.includes(Number(fw.id))
      );
    }

    return {
      filteredFrameworks: _filteredFrameworks,
      projectFrameworksMap: _projectFrameworksMap
    };
  }, [allFrameworks, listOfFrameworks]);

  // Refresh all frameworks
  const refreshAllFrameworks = useCallback(async () => {
    await refetchAllFrameworks();
  }, [refetchAllFrameworks]);

  // Refresh filtered frameworks (invalidate and refetch)
  const refreshFilteredFrameworks = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ['frameworks', 'all'] });
  }, [queryClient]);

  // Convert error to string
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch frameworks') : null;

  return {
    allFrameworks,
    filteredFrameworks,
    projectFrameworksMap,
    loading,
    error,
    refreshAllFrameworks,
    refreshFilteredFrameworks,
  };
};

export default useFrameworks;
