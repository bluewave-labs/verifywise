import { useState, useCallback, useEffect } from "react";
import { getAllEntities } from "../repository/entity.repository";

export interface ChartData {
  name: string;
  value: number;
  color: string;
}

export interface ComplianceTrendData {
  month: string;
  iso27001: number;
  iso42001: number;
}

export interface ExecutiveOverviewData {
  total_projects: {
    count: number;
    active_count: number;
    chart_data: ChartData[];
  };
  compliance_score: {
    score: number;
    iso27001_score: number;
    iso42001_score: number;
    chart_data: ComplianceTrendData[];
  };
  critical_risks: {
    count: number;
    chart_data: ChartData[];
  };
}

export const useExecutiveOverview = () => {
  const [data, setData] = useState<ExecutiveOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchExecutiveOverview = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAllEntities({ 
        routeUrl: "/dashboard/executive" 
      });

      if (response?.data) {
        setData(response.data);
        setLastUpdated(new Date());
      } else {
        setError("No data received from server");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch executive overview data';
      setError(errorMessage);
      console.error("Executive overview fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExecutiveOverview();
  }, [fetchExecutiveOverview]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh: fetchExecutiveOverview
  };
};