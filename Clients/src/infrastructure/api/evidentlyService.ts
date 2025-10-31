import { CustomAxios } from "./customAxios";

/**
 * Evidently AI Integration Service
 * Handles all API calls to the Evidently backend endpoints
 */

// ============================================================================
// Configuration Endpoints
// ============================================================================

export interface EvidentlyConfigRequest {
  evidently_url?: string;
  api_token: string;
}

export interface EvidentlyConfigResponse {
  id: number;
  evidently_url: string;
  is_configured: boolean;
  last_test_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  workspace_id?: string;
}

/**
 * Test connection to Evidently Cloud
 */
export const testEvidentlyConnection = async (
  url: string,
  apiToken: string
): Promise<TestConnectionResponse> => {
  const response = await CustomAxios.post("/evidently/config/test", {
    evidently_url: url,
    api_token: apiToken,
  });
  return response.data.data;
};

/**
 * Get current Evidently configuration
 */
export const getEvidentlyConfig = async (): Promise<EvidentlyConfigResponse | null> => {
  try {
    const response = await CustomAxios.get("/evidently/config");
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // Not configured yet
    }
    throw error;
  }
};

/**
 * Save Evidently configuration
 */
export const saveEvidentlyConfig = async (
  url: string,
  apiToken: string
): Promise<EvidentlyConfigResponse> => {
  const response = await CustomAxios.post("/evidently/config", {
    evidently_url: url,
    api_token: apiToken,
  });
  return response.data.data;
};

/**
 * Delete Evidently configuration
 */
export const deleteEvidentlyConfig = async (): Promise<void> => {
  await CustomAxios.delete("/evidently/config");
};

// ============================================================================
// Models/Projects Endpoints
// ============================================================================

// Backend API response type (snake_case)
interface EvidentlyModelAPI {
  id: number;
  project_id: string;
  project_name: string;
  model_name: string;
  last_sync_at: string | null;
  drift_status: "healthy" | "warning" | "critical" | "unknown";
  performance_status: "healthy" | "warning" | "critical" | "unknown";
  fairness_status: "healthy" | "warning" | "critical" | "unknown";
  metrics_count: number;
  created_at: string;
  updated_at: string;
}

// Frontend type (camelCase) - matches mockEvidentlyData.ts
export interface EvidentlyModel {
  id: string;
  projectId: string;
  projectName: string;
  modelName: string;
  lastSync: string;
  driftStatus: "healthy" | "warning" | "critical" | "unknown";
  performanceStatus: "healthy" | "warning" | "critical" | "unknown";
  fairnessStatus: "healthy" | "warning" | "critical" | "unknown";
  metricsCount: number;
}

/**
 * Transform backend API model to frontend format
 */
const transformModel = (apiModel: EvidentlyModelAPI): EvidentlyModel => ({
  id: String(apiModel.id),
  projectId: apiModel.project_id,
  projectName: apiModel.project_name,
  modelName: apiModel.model_name,
  lastSync: apiModel.last_sync_at || new Date().toISOString(),
  driftStatus: apiModel.drift_status,
  performanceStatus: apiModel.performance_status,
  fairnessStatus: apiModel.fairness_status,
  metricsCount: apiModel.metrics_count,
});

/**
 * Get all monitored models
 */
export const getMonitoredModels = async (): Promise<EvidentlyModel[]> => {
  const response = await CustomAxios.get("/evidently/models");
  const apiModels: EvidentlyModelAPI[] = response.data.data;
  return apiModels.map(transformModel);
};

/**
 * Get Evidently projects list
 */
export const getEvidentlyProjects = async (): Promise<any[]> => {
  const response = await CustomAxios.get("/evidently/projects");
  return response.data.data.projects;
};

/**
 * Bulk sync all metrics for a project
 */
export const bulkSyncMetrics = async (projectId: string): Promise<any> => {
  const response = await CustomAxios.post(`/evidently/sync/${projectId}`);
  return response.data.data;
};

// ============================================================================
// Metrics Endpoints
// ============================================================================

// Backend API response types (snake_case)
interface DriftMetricsAPI {
  project_id: string;
  model_name?: string;
  metric_type: "drift";
  data: {
    dataset_drift?: boolean;
    drift_score?: number;
    number_of_drifted_features?: number;
    share_of_drifted_features?: number;
    drift_by_features?: Record<string, {
      drift_detected: boolean;
      drift_score: number;
      current_distribution?: any;
      reference_distribution?: any;
    }>;
  };
  captured_at: string;
  status: "healthy" | "warning" | "critical" | "unknown";
}

interface PerformanceMetricsAPI {
  project_id: string;
  model_name?: string;
  metric_type: "performance";
  data: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    roc_auc?: number;
    log_loss?: number;
    mae?: number;
    mse?: number;
    rmse?: number;
    r2_score?: number;
    current_performance?: Record<string, number>;
    reference_performance?: Record<string, number>;
  };
  captured_at: string;
  status: "healthy" | "warning" | "critical" | "unknown";
}

interface FairnessMetricsAPI {
  project_id: string;
  model_name?: string;
  metric_type: "fairness";
  data: {
    group_metrics?: Record<string, {
      accuracy?: number;
      precision?: number;
      recall?: number;
      fpr?: number;
      fnr?: number;
      selection_rate?: number;
      count?: number;
    }>;
    bias_metrics?: {
      demographic_parity_difference?: number;
      demographic_parity_ratio?: number;
      equalized_odds_difference?: number;
      equalized_odds_ratio?: number;
      disparate_impact?: number;
    };
    protected_features?: string[];
  };
  captured_at: string;
  status: "healthy" | "warning" | "critical" | "unknown";
}

// Frontend types (camelCase) - matches mockMetricsData.ts
export interface DriftFeature {
  name: string;
  driftScore: number;
  status: 'healthy' | 'warning' | 'critical';
  pValue?: number;
  statTestName?: string;
}

export interface DriftTimelinePoint {
  timestamp: string;
  score: number;
  driftedFeaturesCount: number;
}

export interface DriftMetrics {
  datasetDriftScore: number;
  totalFeatures: number;
  driftedFeatures: number;
  lastUpdated: string;
  timeline: DriftTimelinePoint[];
  features: DriftFeature[];
}

export interface PerformanceTimelinePoint {
  timestamp: string;
  accuracy?: number;
  precision?: number;
  recall?: number;
}

export interface PerformanceMetrics {
  currentMetrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    rocAuc?: number;
    mae?: number;
    mse?: number;
    rmse?: number;
    r2Score?: number;
  };
  timeline: PerformanceTimelinePoint[];
  lastUpdated: string;
}

export interface BiasMetric {
  name: string;
  value: number;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface GroupMetric {
  group: string;
  accuracy?: number;
  precision?: number;
  recall?: number;
  fpr?: number;
  fnr?: number;
  selectionRate?: number;
  count?: number;
}

export interface FairnessMetrics {
  biasMetrics: BiasMetric[];
  groupMetrics: GroupMetric[];
  protectedFeatures: string[];
  lastUpdated: string;
}

/**
 * Helper to determine metric status based on drift score
 */
const getDriftStatus = (score: number): 'healthy' | 'warning' | 'critical' => {
  if (score >= 0.7) return 'critical';
  if (score >= 0.5) return 'warning';
  return 'healthy';
};

/**
 * Helper to determine bias metric status
 */
const getBiasStatus = (value: number, threshold: number): 'healthy' | 'warning' | 'critical' => {
  const absValue = Math.abs(value);
  if (absValue >= threshold * 1.5) return 'critical';
  if (absValue >= threshold) return 'warning';
  return 'healthy';
};

/**
 * Transform drift metrics from API to frontend format
 */
const transformDriftMetrics = (apiMetrics: DriftMetricsAPI): DriftMetrics => {
  const { data, captured_at } = apiMetrics;

  // Transform features
  const features: DriftFeature[] = [];
  if (data.drift_by_features) {
    Object.entries(data.drift_by_features).forEach(([name, featureData]) => {
      features.push({
        name,
        driftScore: featureData.drift_score,
        status: getDriftStatus(featureData.drift_score),
      });
    });
  }

  return {
    datasetDriftScore: data.drift_score || 0,
    totalFeatures: Object.keys(data.drift_by_features || {}).length,
    driftedFeatures: data.number_of_drifted_features || 0,
    lastUpdated: captured_at,
    timeline: [], // Timeline data would need to be fetched separately or built from historical data
    features: features.sort((a, b) => b.driftScore - a.driftScore),
  };
};

/**
 * Transform performance metrics from API to frontend format
 */
const transformPerformanceMetrics = (apiMetrics: PerformanceMetricsAPI): PerformanceMetrics => {
  const { data, captured_at } = apiMetrics;

  return {
    currentMetrics: {
      accuracy: data.accuracy,
      precision: data.precision,
      recall: data.recall,
      f1Score: data.f1_score,
      rocAuc: data.roc_auc,
      mae: data.mae,
      mse: data.mse,
      rmse: data.rmse,
      r2Score: data.r2_score,
    },
    timeline: [], // Timeline data would need to be fetched separately
    lastUpdated: captured_at,
  };
};

/**
 * Transform fairness metrics from API to frontend format
 */
const transformFairnessMetrics = (apiMetrics: FairnessMetricsAPI): FairnessMetrics => {
  const { data, captured_at } = apiMetrics;

  // Transform bias metrics
  const biasMetrics: BiasMetric[] = [];
  if (data.bias_metrics) {
    const { bias_metrics } = data;
    const threshold = 0.1; // Standard fairness threshold

    if (bias_metrics.demographic_parity_difference !== undefined) {
      biasMetrics.push({
        name: 'Demographic Parity Difference',
        value: bias_metrics.demographic_parity_difference,
        threshold,
        status: getBiasStatus(bias_metrics.demographic_parity_difference, threshold),
      });
    }
    if (bias_metrics.equalized_odds_difference !== undefined) {
      biasMetrics.push({
        name: 'Equalized Odds Difference',
        value: bias_metrics.equalized_odds_difference,
        threshold,
        status: getBiasStatus(bias_metrics.equalized_odds_difference, threshold),
      });
    }
    if (bias_metrics.disparate_impact !== undefined) {
      biasMetrics.push({
        name: 'Disparate Impact',
        value: bias_metrics.disparate_impact,
        threshold: 0.8, // Disparate impact uses different threshold
        status: bias_metrics.disparate_impact < 0.8 || bias_metrics.disparate_impact > 1.25 ? 'critical' : 'healthy',
      });
    }
  }

  // Transform group metrics
  const groupMetrics: GroupMetric[] = [];
  if (data.group_metrics) {
    Object.entries(data.group_metrics).forEach(([group, metrics]) => {
      groupMetrics.push({
        group,
        accuracy: metrics.accuracy,
        precision: metrics.precision,
        recall: metrics.recall,
        fpr: metrics.fpr,
        fnr: metrics.fnr,
        selectionRate: metrics.selection_rate,
        count: metrics.count,
      });
    });
  }

  return {
    biasMetrics,
    groupMetrics,
    protectedFeatures: data.protected_features || [],
    lastUpdated: captured_at,
  };
};

/**
 * Get drift metrics for a project
 */
export const getDriftMetrics = async (projectId: string): Promise<DriftMetrics> => {
  const response = await CustomAxios.get(`/evidently/metrics/drift/${projectId}`);
  const apiMetrics: DriftMetricsAPI = response.data.data;
  return transformDriftMetrics(apiMetrics);
};

/**
 * Get performance metrics for a project
 */
export const getPerformanceMetrics = async (projectId: string): Promise<PerformanceMetrics> => {
  const response = await CustomAxios.get(`/evidently/metrics/performance/${projectId}`);
  const apiMetrics: PerformanceMetricsAPI = response.data.data;
  return transformPerformanceMetrics(apiMetrics);
};

/**
 * Get fairness metrics for a project
 */
export const getFairnessMetrics = async (projectId: string): Promise<FairnessMetrics> => {
  const response = await CustomAxios.get(`/evidently/metrics/fairness/${projectId}`);
  const apiMetrics: FairnessMetricsAPI = response.data.data;
  return transformFairnessMetrics(apiMetrics);
};

// ============================================================================
// Cache Management Endpoints
// ============================================================================

export interface CacheStats {
  totalModels: number;
  totalCachedMetrics: number;
  metricsByType: {
    drift: number;
    performance: number;
    fairness: number;
  };
  oldestCache: string | null;
  newestCache: string | null;
}

/**
 * Get cache statistics
 */
export const getCacheStats = async (): Promise<CacheStats> => {
  const response = await CustomAxios.get("/evidently/cache/stats");
  return response.data.data;
};

/**
 * Invalidate cache for a specific project
 */
export const invalidateCache = async (projectId: string): Promise<void> => {
  await CustomAxios.delete(`/evidently/cache/${projectId}`);
};

/**
 * Clean up old cached metrics (>7 days)
 */
export const cleanupOldCache = async (): Promise<{ deleted: number; message: string }> => {
  const response = await CustomAxios.post("/evidently/cache/cleanup");
  return response.data.data;
};

// ============================================================================
// Export all as a single service object (alternative pattern)
// ============================================================================

export const evidentlyService = {
  // Configuration
  testConnection: testEvidentlyConnection,
  getConfig: getEvidentlyConfig,
  saveConfig: saveEvidentlyConfig,
  deleteConfig: deleteEvidentlyConfig,

  // Models
  getModels: getMonitoredModels,
  getProjects: getEvidentlyProjects,
  bulkSync: bulkSyncMetrics,

  // Metrics
  getDrift: getDriftMetrics,
  getPerformance: getPerformanceMetrics,
  getFairness: getFairnessMetrics,

  // Cache
  getCacheStats,
  invalidateCache,
  cleanupCache: cleanupOldCache,
};

export default evidentlyService;
