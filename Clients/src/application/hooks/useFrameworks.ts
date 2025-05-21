import { useState, useEffect, useCallback } from "react";
import { Framework } from "../../domain/types/Framework";
import { getAllFrameworks } from "../repository/entity.repository";

interface UseFrameworksResult {
  frameworks: Framework[];
  projectFrameworksMap: Map<number, number>;
  loading: boolean;
  error: string | null;
  refreshFrameworks: () => Promise<void>;
}

const useFrameworks = ({
  listOfFrameworks,
}: {
  listOfFrameworks: any[];
}): UseFrameworksResult => {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectFrameworksMap, setProjectFrameworksMap] = useState<Map<number, number>>(new Map());

  const fetchFrameworks = useCallback(async () => {
    try {
      setLoading(true);
      const _projectFrameworksMap = new Map<number, number>();
      const response = await getAllFrameworks({ routeUrl: "/frameworks" });
      if (response?.data) {
        const frameworkIds = listOfFrameworks.map((f: any) =>
        {
          _projectFrameworksMap.set(Number(f.framework_id), Number(f.project_framework_id));
          return Number(f.framework_id)
        }
        );
        const filteredFrameworks = response.data.filter((fw: Framework) =>
          frameworkIds.includes(Number(fw.id))
        );
        setProjectFrameworksMap(_projectFrameworksMap);
        setFrameworks(filteredFrameworks);
        setError(null);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch frameworks";
      setError(errorMessage);
      console.error("Error fetching frameworks:", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [listOfFrameworks]);

  useEffect(() => {
    fetchFrameworks();
  }, [fetchFrameworks]);

  return {
    frameworks,
    projectFrameworksMap,
    loading,
    error,
    refreshFrameworks: fetchFrameworks,
  };
};

export default useFrameworks;
