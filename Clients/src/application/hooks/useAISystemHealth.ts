import { useState, useEffect, useContext } from 'react';
import {
  getHealthOverview,
  getActiveAlerts,
  getRiskPredictions,
  getAISystemsHealth,
  SystemHealthData,
  AlertData,
  RiskPrediction,
  SystemDetail
} from '../repository/aiSystemHealth.repository';
import { VerifyWiseContext } from '../contexts/VerifyWise.context';
import { logEngine } from '../tools/log.engine';

export const useAISystemHealthOverview = () => {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [predictions, setPredictions] = useState<RiskPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { organizationId } = useContext(VerifyWiseContext);

  const fetchHealthOverview = async () => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [overviewData, alertsData, predictionsData] = await Promise.all([
        getHealthOverview(organizationId),
        getActiveAlerts(organizationId, 5),
        getRiskPredictions(organizationId)
      ]);

      setHealthData(overviewData);
      setAlerts(alertsData);
      setPredictions(predictionsData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch health overview';
      setError(errorMessage);
      logEngine({
        type: 'error',
        message: `Error fetching AI system health overview: ${errorMessage}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthOverview();
  }, [organizationId]);

  return {
    healthData,
    alerts,
    predictions,
    isLoading,
    error,
    refetch: fetchHealthOverview
  };
};

export const useAISystemsList = (params?: {
  page?: number;
  limit?: number;
  systemType?: string;
  status?: string;
}) => {
  const [systems, setSystems] = useState<SystemDetail[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { organizationId } = useContext(VerifyWiseContext);

  const fetchSystems = async () => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await getAISystemsHealth(organizationId, params);
      setSystems(response.systems);
      setPagination(response.pagination);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch AI systems';
      setError(errorMessage);
      logEngine({
        type: 'error',
        message: `Error fetching AI systems list: ${errorMessage}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystems();
  }, [organizationId, params?.page, params?.limit, params?.systemType, params?.status]);

  return {
    systems,
    pagination,
    isLoading,
    error,
    refetch: fetchSystems
  };
};

export const useAISystemHealthActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { organizationId } = useContext(VerifyWiseContext);

  const createSystemHealth = async (data: {
    systemName: string;
    systemType: string;
    overallScore: number;
    performanceScore: number;
    securityScore: number;
    complianceScore: number;
    reliabilityScore: number;
    uptime?: number;
    projectId?: number;
    metadata?: Record<string, any>;
  }) => {
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai-system-health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          organizationId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create system health record');
      }

      return await response.json();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create system health record';
      setError(errorMessage);
      logEngine({
        type: 'error',
        message: `Error creating system health record: ${errorMessage}`
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createAlert = async (data: {
    systemHealthId: number;
    alertType: 'error' | 'warning' | 'info';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    projectId?: number;
    metadata?: Record<string, any>;
  }) => {
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai-system-health/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          organizationId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create alert');
      }

      return await response.json();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create alert';
      setError(errorMessage);
      logEngine({
        type: 'error',
        message: `Error creating alert: ${errorMessage}`
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const recordMetrics = async (data: {
    systemHealthId: number;
    metricType: string;
    metricValue: number;
    metricUnit?: string;
    threshold?: number;
    metadata?: Record<string, any>;
  }) => {
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai-system-health/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          organizationId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record metrics');
      }

      return await response.json();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record metrics';
      setError(errorMessage);
      logEngine({
        type: 'error',
        message: `Error recording metrics: ${errorMessage}`
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createSystemHealth,
    createAlert,
    recordMetrics,
    isLoading,
    error
  };
};