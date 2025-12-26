/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Dashboard Presentation Types
 * Contains UI-specific dashboard interfaces with React dependencies
 */
import React from 'react';
import { Layouts } from 'react-grid-layout';
import { WidgetType } from '../../../domain/enums/dashboard.enum';
import type { IStatusData } from '../../../domain/interfaces/i.statusData';

// Re-export domain types for convenience
export type {
  DashboardPermissions,
  DashboardPreferences,
  WidgetData,
  DashboardProject,
  MetricData
} from '../../../domain/interfaces/i.dashboard';

export { WidgetType } from '../../../domain/enums/dashboard.enum';

/**
 * Widget configuration - presentation type with React.ReactNode
 */
export interface WidgetConfig {
  id: string;
  title: string;
  type: WidgetType | string;
  description?: string;
  icon?: React.ReactNode;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  defaultW?: number;
  defaultH?: number;
  defaultX?: number;
  defaultY?: number;
  dataSource?: string;
  refreshInterval?: number;
  customProps?: Record<string, any>;
}

/**
 * Dashboard configuration - presentation type with Layouts from react-grid-layout
 */
export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  organizationId: string;
  widgets: WidgetConfig[];
  layouts: Layouts;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isDefault?: boolean;
  isShared?: boolean;
  permissions?: import('../../../domain/interfaces/i.dashboard').DashboardPermissions;
}

/**
 * Layout persistence schema - presentation type with Layouts from react-grid-layout
 */
export interface LayoutPersistence {
  version: string;
  projectId: string;
  dashboardId: string;
  userId: string;
  layouts: Layouts;
  widgets: string[]; // Widget IDs
  lastModified: string;
  preferences?: import('../../../domain/interfaces/i.dashboard').DashboardPreferences;
}

/**
 * Dashboard state - presentation type
 */
export interface DashboardState {
  config: DashboardConfig | null;
  widgets: Map<string, import('../../../domain/interfaces/i.dashboard').WidgetData>;
  editMode: boolean;
  loading: boolean;
  error: Error | null;
  isDirty: boolean;
}

/**
 * Dashboard context value - used for React Context
 * Contains state and action handlers for dashboard management
 */
export interface DashboardContextValue {
  state: DashboardState;
  actions: {
    setEditMode: (editMode: boolean) => void;
    saveLayout: (layouts: Layouts) => Promise<void>;
    addWidget: (widget: WidgetConfig) => void;
    removeWidget: (widgetId: string) => void;
    updateWidget: (widgetId: string, updates: Partial<WidgetConfig>) => void;
    refreshWidget: (widgetId: string) => Promise<void>;
    refreshAllWidgets: () => Promise<void>;
    resetLayout: () => void;
    exportDashboard: () => void;
    importDashboard: (config: DashboardConfig) => void;
  };
}

/**
 * Dashboard projects widget props
 */
export interface DashboardProjectsWidgetProps {
  loading?: boolean;
  projects?: import('../../../domain/interfaces/i.dashboard').DashboardProject[];
}

/**
 * Metrics widget props
 */
export interface MetricsWidgetProps {
  loading?: boolean;
  data?: import('../../../domain/interfaces/i.dashboard').MetricData[];
}

/**
 * Metric card component props
 * Has React.ComponentType for background icon
 */
export interface MetricCardProps {
  title: string;
  value: number | string;
  onClick?: () => void;
  navigable?: boolean;
  statusData?: IStatusData[];
  entityType?: "models" | "vendors" | "policies" | "trainings" | "vendorRisks" | "incidents";
  compact?: boolean;
  backgroundIcon?: React.ComponentType<any>;
}
