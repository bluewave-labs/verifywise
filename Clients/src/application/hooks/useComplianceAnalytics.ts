import { useState, useCallback, useEffect } from "react";
import { getAllEntities } from "../repository/entity.repository";

export interface ComplianceProjectDetail {
  project_id: number;
  project_name: string;
  completion_rate: number;
  total_controls: number;
  completed_controls: number;
  trend: number;
}

export interface ComplianceFrameworkDetail {
  framework: string;
  framework_id: number;
  average_completion: number;
  total_projects: number;
  projects: ComplianceProjectDetail[];
  completion_distribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export interface ComplianceAnalyticsData {
  iso27001: ComplianceFrameworkDetail;
  iso42001: ComplianceFrameworkDetail;
  overall_compliance: {
    score: number;
    total_projects: number;
    chart_data: Array<{
      name: string;
      value: number;
      color: string;
    }>;
  };
  project_tracker: {
    projects: ComplianceProjectDetail[];
    completion_trends: Array<{
      date: string;
      iso27001: number;
      iso42001: number;
      overall: number;
    }>;
  };
}

export const useComplianceAnalytics = () => {
  const [data, setData] = useState<ComplianceAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchComplianceAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAllEntities({ 
        routeUrl: "/dashboard/compliance" 
      });

      if (response?.data) {
        setData(response.data);
        setLastUpdated(new Date());
      } else {
        setError("No compliance analytics data received from server");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch compliance analytics data';
      setError(errorMessage);
      console.error("Compliance analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplianceAnalytics();
  }, [fetchComplianceAnalytics]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh: fetchComplianceAnalytics
  };
};