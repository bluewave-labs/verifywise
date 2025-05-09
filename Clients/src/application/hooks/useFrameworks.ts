import { useState, useEffect, useCallback } from "react";
import { Framework } from "../../domain/types/Framework";
import { getAllFrameworks } from "../repository/entity.repository";

interface UseFrameworksResult {
  frameworks: Framework[];
  loading: boolean;
  error: string | null;
  refreshFrameworks: () => Promise<void>;
}

const useFrameworks = (): UseFrameworksResult => {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFrameworks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllFrameworks({ routeUrl: "/frameworks" });
      if (response?.data) {
        setFrameworks(response.data);
        setError(null);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch frameworks";
      setError(errorMessage);
      console.error("Error fetching frameworks:", errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFrameworks();
  }, [fetchFrameworks]);

  return { 
    frameworks, 
    loading, 
    error,
    refreshFrameworks: fetchFrameworks 
  };
};

export default useFrameworks;