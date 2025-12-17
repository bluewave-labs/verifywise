/**
 * Deadline Analytics API Interface Definitions
 * Defines the structure for deadline warning system analytics data and responses
 */

import { DeadlineSummary, DeadlineDetail } from '../../services/deadline.service';

export interface IDeadlineAnalyticsRequest {
  entityType?: 'tasks' | 'vendors' | 'policies' | 'risks';
  category?: 'overdue' | 'dueSoon';
  userId?: number;
  organizationId?: number;
}

export interface IDeadlineAnalyticsResponse {
  success: boolean;
  data?: DeadlineSummary | DeadlineDetail[];
  message: string;
  timestamp: string;
  performance?: {
    queryTime: number;
    cached: boolean;
  };
}

export interface IDeadlineSummaryResponse extends IDeadlineAnalyticsResponse {
  data: DeadlineSummary;
}

export interface IDeadlineDetailsResponse extends IDeadlineAnalyticsResponse {
  data: DeadlineDetail[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface IDeadlineConfigResponse {
  success: boolean;
  data: {
    dueSoonThresholdDays: number;
    completedStatuses: string[];
  };
  message: string;
  timestamp: string;
}