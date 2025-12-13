/**
 * @fileoverview Deadline Warning Box Types
 *
 * Defines TypeScript interfaces and types for the deadline warning system.
 * These types ensure type safety across the component hierarchy and API layer.
 *
 * @package components/DeadlineWarningBox
 */

/**
 * Deadline severity levels for categorizing warnings
 */
export type DeadlineSeverity = 'overdue' | 'dueSoon';

/**
 * Individual deadline item with metadata
 */
export interface DeadlineItem {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  severity: DeadlineSeverity;
  projectId?: number;
  projectName?: string;
  entityType: 'task';
}

/**
 * Deadline summary counts by severity
 */
export interface DeadlineSummary {
  overdue: number;
  dueSoon: number;
  threshold: number;
}

/**
 * Complete deadline analytics response
 */
export interface DeadlineAnalytics {
  tasks?: DeadlineSummary;
  vendors?: DeadlineSummary;
  policies?: DeadlineSummary;
  risks?: DeadlineSummary;
  totalOverdue: number;
  totalDueSoon: number;
  lastUpdated: string;
}

/**
 * API response wrapper for deadline analytics
 */
export interface DeadlineAnalyticsResponse {
  data: DeadlineAnalytics;
  success: boolean;
  message?: string;
}

/**
 * Loading states for the deadline warning component
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Error information for failed API calls
 */
export interface DeadlineError {
  message: string;
  code?: string;
  statusCode?: number;
  timestamp: string;
}

/**
 * Configuration options for the deadline warning box
 */
export interface DeadlineWarningBoxConfig {
  /**
   * Auto-refresh interval in milliseconds (0 = disabled)
   * @default 60000 (1 minute)
   */
  refreshInterval?: number;

  /**
   * Enable/disable animations
   * @default true
   */
  animations?: boolean;

  /**
   * Maximum number of chips to display before showing "more" chip
   * @default 3
   */
  maxVisibleChips?: number;

  /**
   * Enable dark mode support
   * @default true
   */
  darkMode?: boolean;

  /**
   * Callback function when a deadline chip is clicked
   */
  onFilterClick?: (severity: DeadlineSeverity, entityType: string) => void;

  /**
   * Callback function when retry is clicked in error state
   */
  onRetry?: () => void;

  /**
   * Custom CSS class name
   */
  className?: string;

  /**
   * Additional inline styles
   */
  style?: React.CSSProperties;
}

/**
 * Props for the main DeadlineWarningBox component
 */
export interface DeadlineWarningBoxProps extends DeadlineWarningBoxConfig {
  /**
   * Hide the component when there are no warnings
   * @default true
   */
  hideWhenEmpty?: boolean;

  /**
   * Show loading skeleton during data fetch
   * @default true
   */
  showLoadingSkeleton?: boolean;
}

/**
 * Props for individual deadline chips
 */
export interface DeadlineChipProps {
  count: number;
  severity: DeadlineSeverity;
  entityType: string;
  onClick?: () => void;
  isSelected?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'outlined' | 'filled';
}

/**
 * Props for loading state component
 */
export interface LoadingStateProps {
  message?: string;
  showSkeleton?: boolean;
  skeletonCount?: number;
}

/**
 * Props for error state component
 */
export interface ErrorStateProps {
  error: DeadlineError;
  onRetry?: () => void;
  retryText?: string;
  showDetails?: boolean;
}

/**
 * Styles configuration for deadline warning components
 */
export interface DeadlineWarningStyles {
  container: React.CSSProperties;
  header: React.CSSProperties;
  chipContainer: React.CSSProperties;
  chip: {
    [severity in DeadlineSeverity]: React.CSSProperties;
  };
  loading: React.CSSProperties;
  error: React.CSSProperties;
  skeleton: React.CSSProperties;
}

/**
 * Theme configuration for dark/light modes
 */
export interface DeadlineWarningTheme {
  colors: {
    primary: {
      main: string;
      light: string;
      dark: string;
      contrast: string;
    };
    overdue: {
      main: string;
      light: string;
      dark: string;
      contrast: string;
    };
    dueSoon: {
      main: string;
      light: string;
      dark: string;
      contrast: string;
    };
    background: {
      default: string;
      paper: string;
      error: string;
    };
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    border: {
      default: string;
      focus: string;
      error: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

/**
 * Animation states for component transitions
 */
export interface AnimationState {
  isEntering: boolean;
  isExiting: boolean;
  shouldRender: boolean;
}

/**
 * Filter state for selected deadline categories
 */
export interface DeadlineFilterState {
  [entityType: string]: {
    [severity in DeadlineSeverity]: boolean;
  };
}

/**
 * Metrics for performance monitoring
 */
export interface DeadlineWarningMetrics {
  renderTime: number;
  apiResponseTime: number;
  lastRefreshTime: number;
  refreshCount: number;
  errorCount: number;
}