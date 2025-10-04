import { Layouts } from 'react-grid-layout';

// Widget types enum
export enum WidgetType {
  METRICS = 'metrics',
  PROJECTS = 'projects',
  RISKS = 'risks',
  COMPLIANCE = 'compliance',
  ACTIVITIES = 'activities',
  TASKS = 'tasks',
  CHART = 'chart',
  TABLE = 'table',
  CUSTOM = 'custom'
}

// Widget configuration
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

// Dashboard configuration
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
  permissions?: DashboardPermissions;
}

// Dashboard permissions
export interface DashboardPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  sharedWith?: string[];
}

// Layout persistence schema
export interface LayoutPersistence {
  version: string;
  projectId: string;
  dashboardId: string;
  userId: string;
  layouts: Layouts;
  widgets: string[]; // Widget IDs
  lastModified: string;
  preferences?: DashboardPreferences;
}

// User dashboard preferences
export interface DashboardPreferences {
  autoRefresh?: boolean;
  refreshInterval?: number;
  theme?: 'light' | 'dark' | 'auto';
  compactMode?: boolean;
  showGridLines?: boolean;
  animationsEnabled?: boolean;
}

// Widget data structure
export interface WidgetData<T = any> {
  widgetId: string;
  data: T;
  loading: boolean;
  error?: Error | null;
  lastUpdated?: Date;
}

// Dashboard state
export interface DashboardState {
  config: DashboardConfig | null;
  widgets: Map<string, WidgetData>;
  editMode: boolean;
  loading: boolean;
  error: Error | null;
  isDirty: boolean;
}

// Dashboard context
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