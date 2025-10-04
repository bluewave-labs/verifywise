/**
 * Interface for individual breadcrumb item
 */
export interface IBreadcrumbItem {
  /** Display label for the breadcrumb */
  label: string;
  /** Navigation path for the breadcrumb */
  path?: string;
  /** Custom click handler */
  onClick?: () => void;
  /** Whether the breadcrumb is disabled */
  disabled?: boolean;
  /** Unique identifier for the breadcrumb */
  id?: string;
  /** Tooltip text for additional context */
  tooltip?: string;
}

/**
 * Props for the PageBreadcrumbs component
 */
export interface IPageBreadcrumbsProps {
  /** Custom breadcrumb items (overrides auto-generation) */
  items?: BreadcrumbItem[];
  /** Whether to auto-generate breadcrumbs from current route */
  autoGenerate?: boolean;
  /** Custom route mapping (extends the default mapping) */
  customRouteMapping?: Record<string, string>;
  /** Whether to show the current page as the last item */
  showCurrentPage?: boolean;
  /** Custom home label */
  homeLabel?: string;
  /** Custom home path */
  homePath?: string;
  /** Whether to truncate long labels */
  truncateLabels?: boolean;
  /** Maximum length for truncated labels */
  maxLabelLength?: number;
  /** Custom click handler for breadcrumb items */
  onItemClick?: (item: BreadcrumbItem, index: number) => void;
  /** Additional styling with proper MUI typing */
  sx?: SxProps<Theme>;
  /** Additional className for custom styling */
  className?: string;
  /** Test identifier for automated testing */
  testId?: string;
  /** Whether to show the divider below breadcrumbs */
  showDivider?: boolean;
}
