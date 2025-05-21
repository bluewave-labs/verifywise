import { useState, useEffect, useCallback } from "react";
import { Framework } from "../../domain/types/Framework";
import { getAllFrameworks } from "../repository/entity.repository";

interface UseFrameworksResult {
  allFrameworks: Framework[];
  filteredFrameworks: Framework[];
  loading: boolean;
  error: string | null;
  refreshAllFrameworks: () => Promise<void>;
  refreshFilteredFrameworks: () => Promise<void>;
}

const useFrameworks = ({
  listOfFrameworks,
}: {
  listOfFrameworks: any[];
}): UseFrameworksResult => {
  const [allFrameworks, setAllFrameworks] = useState<Framework[]>([]);
  const [filteredFrameworks, setFilteredFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllFrameworks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllFrameworks({ routeUrl: "/frameworks" });
      if (response?.data) {
        setAllFrameworks(response.data);
        setError(null);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch frameworks";
      setError(errorMessage);
      console.error("Error fetching all frameworks:", errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFilteredFrameworks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllFrameworks({ routeUrl: "/frameworks" });
      if (response?.data) {
        const frameworkIds = listOfFrameworks.map((f: any) =>
          Number(f.framework_id)
        );
        const filtered = response.data.filter((fw: Framework) =>
          frameworkIds.includes(Number(fw.id))
        );
        setFilteredFrameworks(filtered);
        setError(null);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch filtered frameworks";
      setError(errorMessage);
      console.error("Error fetching filtered frameworks:", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [listOfFrameworks]);

  useEffect(() => {
    fetchAllFrameworks();
    fetchFilteredFrameworks();
  }, [fetchAllFrameworks, fetchFilteredFrameworks]);

  return {
    allFrameworks,
    filteredFrameworks,
    loading,
    error,
    refreshAllFrameworks: fetchAllFrameworks,
    refreshFilteredFrameworks: fetchFilteredFrameworks,
  };
};

export default useFrameworks;
