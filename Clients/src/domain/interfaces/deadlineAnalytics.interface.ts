/**
 * Deadline Analytics API Interface Definitions
 * Defines the structure for deadline warning system analytics data and responses
 */

export interface DeadlineSummary {
  tasks?: {
    overdue: number;
    dueSoon: number;
    threshold: number;
  };
  // Future: Add vendors, policies, risks
  // vendors?: { overdue: number; dueSoon: number; threshold: number };
  // policies?: { overdue: number; dueSoon: number; threshold: number };
  // risks?: { overdue: number; dueSoon: number; threshold: number };
}

export interface DeadlineDetail {
  id: number;
  title: string;
  description?: string;
  due_date: Date;
  priority: string;
  status: string;
  creator_id: number;
  organization_id: number;
  created_at: Date;
  updated_at: Date;
  categories?: string[];
  // Include related data for display
  creator?: {
    name: string;
    email: string;
  };
  assignees?: Array<{
    user_id: number;
    user?: {
      name: string;
      email: string;
    };
  }>;
}

export interface DeadlineConfig {
  dueSoonThresholdDays: number;
  completedStatuses: string[];
}

export interface DeadlineAnalyticsRequest {
  entityType?: 'tasks' | 'vendors' | 'policies' | 'risks';
  category?: 'overdue' | 'dueSoon';
  userId?: number;
  organizationId?: number;
}

export interface DeadlineAnalyticsResponse {
  success: boolean;
  data?: DeadlineSummary | DeadlineDetail[];
  message: string;
  timestamp: string;
  performance?: {
    queryTime: number;
    cached: boolean;
  };
}

export interface DeadlineSummaryResponse extends DeadlineAnalyticsResponse {
  data: DeadlineSummary;
}

export interface DeadlineDetailsResponse extends DeadlineAnalyticsResponse {
  data: DeadlineDetail[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface DeadlineConfigResponse {
  success: boolean;
  data: DeadlineConfig;
  message: string;
  timestamp: string;
}

/**
 * Extended interface for deadline analytics state with loading and error states
 */
export interface DeadlineAnalyticsState {
  summary: DeadlineSummary | null;
  details: DeadlineDetail[];
  config: DeadlineConfig | null;
  loading: {
    summary: boolean;
    details: boolean;
    config: boolean;
  };
  error: {
    summary: string | null;
    details: string | null;
    config: string | null;
  };
  lastUpdated: Date | null;
}

/**
 * Hook options for deadline analytics
 */
export interface UseDeadlineAnalyticsOptions {
  entityType?: 'tasks' | 'vendors' | 'policies' | 'risks';
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  enableCache?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}