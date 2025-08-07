import { useEffect, useState } from "react";
import { useCallback } from "react";
import { getAllEntities } from "../repository/entity.repository";
import { Dashboard } from "../../domain/types/Dashboard";

export const useDashboard = () => {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await getAllEntities({ routeUrl: "/dashboard" });
      setDashboard(response.data);
    } catch (error) {
      // Handle error
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch dashboard data when the component mounts
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { dashboard, loading, fetchDashboard };
};
