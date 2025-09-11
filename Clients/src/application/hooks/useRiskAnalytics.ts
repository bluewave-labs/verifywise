import { useState, useCallback, useEffect } from "react";
import { getAllEntities } from "../repository/entity.repository";
import { IRiskAnalytics } from "../../domain/interfaces/i.Dashboard";

interface UseRiskAnalyticsResponse {
  data: IRiskAnalytics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useRiskAnalytics = (): UseRiskAnalyticsResponse => {
  const [data, setData] = useState<IRiskAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRiskAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAllEntities({ 
        routeUrl: "/dashboard/risks" 
      });

      if (response?.data) {
        setData(response.data);
      } else {
        setError("No data received from server");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch risk analytics data';
      setError(errorMessage);
      console.error("Risk analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRiskAnalytics();
  }, [fetchRiskAnalytics]);

  return {
    data,
    loading,
    error,
    refetch: fetchRiskAnalytics,
  };
};