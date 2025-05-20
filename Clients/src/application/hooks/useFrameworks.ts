import { useState, useEffect, useCallback } from "react";
import { Framework } from "../../domain/types/Framework";
import { getAllFrameworks } from "../repository/entity.repository";

interface UseFrameworksResult {
  frameworks: Framework[];
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

  const fetchFrameworks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllFrameworks({ routeUrl: "/frameworks" });
      if (response?.data) {
        const frameworkIds = listOfFrameworks.map((f: any) =>
          Number(f.framework_id)
        );
        const filteredFrameworks = response.data.filter((fw: Framework) =>
          frameworkIds.includes(Number(fw.id))
        );
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
    loading,
    error,
    refreshFrameworks: fetchFrameworks,
  };
};

export default useFrameworks;
