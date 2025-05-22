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

  // Fetch all frameworks only once on mount
  useEffect(() => {
    const fetchAllFrameworks = async () => {
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
    };

    fetchAllFrameworks();
  }, []); // Empty dependency array means this runs once on mount

  // Update filtered frameworks whenever listOfFrameworks or allFrameworks changes
  useEffect(() => {
    if (allFrameworks.length > 0) {
      const frameworkIds = listOfFrameworks.map((f: any) => Number(f.framework_id));
      const filtered = allFrameworks.filter((fw: Framework) =>
        frameworkIds.includes(Number(fw.id))
      );
      setFilteredFrameworks(filtered);
    }
  }, [listOfFrameworks, allFrameworks]);

  const refreshAllFrameworks = useCallback(async () => {
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

  const refreshFilteredFrameworks = useCallback(async () => {
    if (allFrameworks.length > 0) {
      const frameworkIds = listOfFrameworks.map((f: any) => Number(f.framework_id));
      const filtered = allFrameworks.filter((fw: Framework) =>
        frameworkIds.includes(Number(fw.id))
      );
      setFilteredFrameworks(filtered);
    }
  }, [listOfFrameworks, allFrameworks]);

  return {
    allFrameworks,
    filteredFrameworks,
    loading,
    error,
    refreshAllFrameworks,
    refreshFilteredFrameworks,
  };
};

export default useFrameworks;
