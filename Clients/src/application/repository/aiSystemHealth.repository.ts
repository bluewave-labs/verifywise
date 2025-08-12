import { customAxios } from "../../infrastructure/api/customAxios";

export interface SystemHealthData {
  systemHealth: {
    overall: number;
    performance: number;
    security: number;
    compliance: number;
    reliability: number;
  };
  metrics: {
    totalSystems: number;
    activeAlerts: number;
    riskScore: string;
    uptime: string;
  };
  healthTrends: Array<{
    month: string;
    score: number;
  }>;
}

export interface AlertData {
  id: number;
  type: string;
  title: string;
  description: string;
  severity: string;
  timestamp: string;
  project: string;
}

export interface RiskPrediction {
  category: string;
  risk: string;
  trend: string;
  prediction: string;
  confidence: number;
}

export interface SystemDetail {
  id: number;
  name: string;
  health: number;
  status: string;
  lastCheck: string;
  systemType: string;
  uptime: number;
}

export interface CreateSystemHealthRequest {
  systemName: string;
  systemType: string;
  overallScore: number;
  performanceScore: number;
  securityScore: number;
  complianceScore: number;
  reliabilityScore: number;
  uptime?: number;
  organizationId: number;
  projectId?: number;
  metadata?: Record<string, any>;
}

export interface CreateAlertRequest {
  systemHealthId: number;
  alertType: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  organizationId?: number;
  projectId?: number;
  metadata?: Record<string, any>;
}

export interface RecordMetricsRequest {
  systemHealthId: number;
  metricType: string;
  metricValue: number;
  metricUnit?: string;
  threshold?: number;
  organizationId?: number;
  metadata?: Record<string, any>;
}

/**
 * Get health overview and metrics for dashboard
 */
export const getHealthOverview = async (organizationId: number): Promise<SystemHealthData> => {
  const response = await customAxios.get(`/ai-system-health/${organizationId}/overview`);
  return response.data.data;
};

/**
 * Get active alerts for the organization
 */
export const getActiveAlerts = async (organizationId: number, limit: number = 5): Promise<AlertData[]> => {
  const response = await customAxios.get(`/ai-system-health/${organizationId}/alerts`, {
    params: { limit }
  });
  return response.data.data;
};

/**
 * Get risk predictions
 */
export const getRiskPredictions = async (organizationId: number): Promise<RiskPrediction[]> => {
  const response = await customAxios.get(`/ai-system-health/${organizationId}/predictions`);
  return response.data.data;
};

/**
 * Get all AI systems health data
 */
export const getAISystemsHealth = async (
  organizationId: number,
  params?: {
    page?: number;
    limit?: number;
    systemType?: string;
    status?: string;
  }
): Promise<{
  systems: SystemDetail[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}> => {
  const response = await customAxios.get(`/ai-system-health/${organizationId}`, {
    params
  });
  
  // Transform the response to match frontend expectations
  const transformedSystems = response.data.data.systems.map((system: any) => ({
    id: system.id,
    name: system.systemName,
    health: system.overallScore,
    status: system.status,
    lastCheck: getTimeAgo(new Date(system.lastChecked)),
    systemType: system.systemType,
    uptime: system.uptime
  }));

  return {
    systems: transformedSystems,
    pagination: response.data.data.pagination
  };
};

/**
 * Create or update system health record
 */
export const createOrUpdateSystemHealth = async (data: CreateSystemHealthRequest) => {
  const response = await customAxios.post('/ai-system-health', data);
  return response.data;
};

/**
 * Create health alert
 */
export const createHealthAlert = async (data: CreateAlertRequest) => {
  const response = await customAxios.post('/ai-system-health/alerts', data);
  return response.data;
};

/**
 * Resolve health alert
 */
export const resolveHealthAlert = async (alertId: number, resolvedBy: number) => {
  const response = await customAxios.patch(`/ai-system-health/alerts/${alertId}/resolve`, {
    resolvedBy
  });
  return response.data;
};

/**
 * Record health metrics
 */
export const recordHealthMetrics = async (data: RecordMetricsRequest) => {
  const response = await customAxios.post('/ai-system-health/metrics', data);
  return response.data;
};

// Helper function to format timestamps
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}