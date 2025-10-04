import React, { memo } from "react";
import { Stack, useTheme, Divider } from "@mui/material";
import Breadcrumbs from "./index";
import { IPageBreadcrumbsProps } from "../../../domain/interfaces/i.breadcrumbs";

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
const PageBreadcrumbs: React.FC<IPageBreadcrumbsProps> = memo(
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
    showDivider = true,
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
          mt: 2,
          mb: 3,
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
            mb: 2,
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
        {showDivider && <Divider sx={{ mb: 2 }} />}
      </Stack>
    );
  }
);

// Set display name for better debugging
PageBreadcrumbs.displayName = "PageBreadcrumbs";

export default PageBreadcrumbs;
