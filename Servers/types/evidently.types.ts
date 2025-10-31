/**
 * Type definitions for Evidently API requests and responses
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface EvidentlyConfigRequest {
  evidently_url?: string;
  api_token: string;
}

export interface EvidentlyConfigResponse {
  id: number;
  evidently_url: string;
  is_configured: boolean;
  last_test_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface TestConnectionRequest {
  evidently_url?: string;
  api_token: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  workspace_id?: string;
}

// ============================================================================
// Project Types
// ============================================================================

export interface EvidentlyProject {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ListProjectsResponse {
  projects: EvidentlyProject[];
  count: number;
}

export interface ProjectDetailsResponse extends EvidentlyProject {
  team_id?: string;
  org_id?: string;
}

// ============================================================================
// Metrics Types
// ============================================================================

export enum MetricType {
  DRIFT = "drift",
  PERFORMANCE = "performance",
  FAIRNESS = "fairness",
}

export enum HealthStatus {
  HEALTHY = "healthy",
  WARNING = "warning",
  CRITICAL = "critical",
  UNKNOWN = "unknown",
}

// Drift Metrics
export interface DriftMetricData {
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
}

export interface DriftMetricsResponse {
  project_id: string;
  model_name?: string;
  metric_type: MetricType.DRIFT;
  data: DriftMetricData;
  captured_at: string;
  status: HealthStatus;
}

// Performance Metrics
export interface PerformanceMetricData {
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
}

export interface PerformanceMetricsResponse {
  project_id: string;
  model_name?: string;
  metric_type: MetricType.PERFORMANCE;
  data: PerformanceMetricData;
  captured_at: string;
  status: HealthStatus;
}

// Fairness Metrics
export interface FairnessMetricData {
  group_metrics?: Record<string, {
    accuracy?: number;
    precision?: number;
    recall?: number;
    fpr?: number; // False Positive Rate
    fnr?: number; // False Negative Rate
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
}

export interface FairnessMetricsResponse {
  project_id: string;
  model_name?: string;
  metric_type: MetricType.FAIRNESS;
  data: FairnessMetricData;
  captured_at: string;
  status: HealthStatus;
}

// Union type for all metrics
export type MetricsResponse =
  | DriftMetricsResponse
  | PerformanceMetricsResponse
  | FairnessMetricsResponse;

// ============================================================================
// Bulk Sync Types
// ============================================================================

export interface BulkSyncRequest {
  project_id: string;
}

export interface BulkSyncResponse {
  project_id: string;
  synced_metrics: {
    drift: boolean;
    performance: boolean;
    fairness: boolean;
  };
  total_synced: number;
  errors?: string[];
  message: string;
}

// ============================================================================
// Model Types (Database)
// ============================================================================

export interface MonitoredModel {
  id: number;
  organization_id: number;
  project_id: string;
  project_name: string;
  model_name: string;
  last_sync_at: Date | null;
  drift_status: HealthStatus;
  performance_status: HealthStatus;
  fairness_status: HealthStatus;
  metrics_count: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Error Response Types
// ============================================================================

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  details?: any;
}

// ============================================================================
// Request Extensions (for Express middleware)
// ============================================================================

export interface EvidentlyAuthData {
  url: string;
  apiToken: string;
  configId: number;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      evidentlyConfig?: EvidentlyAuthData;
    }
  }
}
