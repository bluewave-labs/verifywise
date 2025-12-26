/* eslint-disable @typescript-eslint/no-explicit-any */

import { WidgetType } from '../enums/dashboard.enum';

/**
 * Dashboard Domain Types
 * Contains pure domain types without React dependencies
 */

// Dashboard permissions - pure domain type
export interface DashboardPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  sharedWith?: string[];
}

// User dashboard preferences - pure domain type
export interface DashboardPreferences {
  autoRefresh?: boolean;
  refreshInterval?: number;
  theme?: 'light' | 'dark' | 'auto';
  compactMode?: boolean;
  showGridLines?: boolean;
  animationsEnabled?: boolean;
}

// Widget data structure - pure domain type
export interface WidgetData<T = any> {
  widgetId: string;
  data: T;
  loading: boolean;
  error?: Error | null;
  lastUpdated?: Date;
}

// Dashboard project data - pure domain type
export interface DashboardProject {
  id: string;
  name: string;
  progress: number;
  status: 'active' | 'pending' | 'completed' | 'on-hold';
  dueDate?: string;
}

// Metric data structure - pure domain type
export interface MetricData {
  label: string;
  value: number | string;
  change?: number;
  unit?: string;
  color?: string;
}

// Widget type enum re-export for convenience
export { WidgetType };

// Note: React-dependent interfaces (WidgetConfig, DashboardConfig, LayoutPersistence,
// DashboardState, DashboardContextValue, MetricCardProps, DashboardProjectsWidgetProps,
// MetricsWidgetProps) have been moved to: presentation/types/interfaces/i.dashboard.ts