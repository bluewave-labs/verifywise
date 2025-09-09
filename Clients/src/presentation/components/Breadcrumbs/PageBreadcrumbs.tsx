import React, { memo } from "react";
import { Stack, useTheme, SxProps, Theme } from "@mui/material";
import Breadcrumbs, { BreadcrumbItem } from "./index";

/**
 * Props for the PageBreadcrumbs component
 */
export interface PageBreadcrumbsProps {
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
}

/**
 * A standardized PageBreadcrumbs component that follows the application's design patterns.
 * This component provides consistent breadcrumb styling and behavior across all pages.
 *
 * Features:
 * - Auto-generation from current route
 * - Customizable route mappings
 * - Accessible navigation with proper ARIA labels
 * - Performance optimized with memoization
 * - Consistent theme integration
 *
 * @component
 * @param {PageBreadcrumbsProps} props - The props for the PageBreadcrumbs component
 * @returns {JSX.Element} A styled breadcrumbs component
 */
const PageBreadcrumbs: React.FC<PageBreadcrumbsProps> = memo(
  ({
    items,
    autoGenerate = true,
    showCurrentPage = true,
    homeLabel = "Dashboard",
    homePath = "/",
    truncateLabels = true,
    maxLabelLength = 25,
    onItemClick,
    sx,
    className,
    testId,
  }) => {
    const theme = useTheme();

    // Note: Custom route mapping is now handled centrally in the main Breadcrumbs component
    // through the getRouteMapping utility function

    return (
      <Stack
        className={className}
        data-testid={testId}
        component="nav"
        role="navigation"
        aria-label="Page breadcrumb navigation"
        sx={{
          mt: 1,
          width: "100%",
          ...sx,
        }}
      >
        <Breadcrumbs
          items={items}
          autoGenerate={autoGenerate}
          showCurrentPage={showCurrentPage}
          homeLabel={homeLabel}
          homePath={homePath}
          truncateLabels={truncateLabels}
          maxLabelLength={maxLabelLength}
          onItemClick={onItemClick}
          sx={{
            py: 0.5,
            px: 0,
            "& .MuiBreadcrumbs-separator": {
              color: theme.palette.text.disabled,
              mx: 0.5,
              fontSize: "14px",
            },
            "& .MuiBreadcrumbs-ol": {
              flexWrap: "wrap",
            },
          }}
        />
      </Stack>
    );
  }
);

// Set display name for better debugging
PageBreadcrumbs.displayName = "PageBreadcrumbs";

export default PageBreadcrumbs;
