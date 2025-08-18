import React from "react";
import { Stack, useTheme } from "@mui/material";
import Breadcrumbs, { BreadcrumbItem } from "./index";
import { routeMapping } from "./routeMapping";

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
  /** Additional styling */
  sx?: any;
}

/**
 * A standardized PageBreadcrumbs component that follows the application's design patterns.
 * This component provides consistent breadcrumb styling and behavior across all pages.
 *
 * @component
 * @param {PageBreadcrumbsProps} props - The props for the PageBreadcrumbs component
 * @returns {JSX.Element} A styled breadcrumbs component
 */
const PageBreadcrumbs: React.FC<PageBreadcrumbsProps> = ({
  items,
  autoGenerate = true,
  customRouteMapping = {},
  showCurrentPage = true,
  homeLabel = "Dashboard",
  homePath = "/",
  truncateLabels = true,
  maxLabelLength = 25,
  onItemClick,
  sx,
}) => {
  const theme = useTheme();

  // Merge custom route mapping with default mapping
  const mergedRouteMapping = {
    ...routeMapping,
    ...customRouteMapping,
  };

  return (
    <Stack
      sx={{
        mb: 3, // Increased bottom spacing
        mt: 1,
        ...sx,
      }}
    >
      <Breadcrumbs
        items={items}
        autoGenerate={autoGenerate}
        routeMapping={mergedRouteMapping}
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
            color: theme.palette.text.tertiary,
            mx: 0.5,
          },
        }}
      />
    </Stack>
  );
};

export default PageBreadcrumbs;
