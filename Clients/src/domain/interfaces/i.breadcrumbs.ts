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
