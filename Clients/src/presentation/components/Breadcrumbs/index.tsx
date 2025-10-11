import React, { useMemo, useCallback } from "react";
import {
  Breadcrumbs as MUIBreadcrumbs,
  Link,
  Typography,
  Stack,
  useTheme,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { getRouteMapping, getRouteIcon } from "./routeMapping";

import { ChevronRight as ChevronRightGreyIcon } from "lucide-react";
import {
  IBreadcrumbItem,
  IBreadcrumbsProps,
} from "../../../domain/interfaces/i.breadcrumbs";

/**
 * A customizable Breadcrumbs component that wraps Material-UI Breadcrumbs.
 * Supports both manual and auto-generated breadcrumbs from routing.
 *
 * @component
 * @param {IBreadcrumbsProps} props - The props for the Breadcrumbs component
 * @returns {JSX.Element} A styled Material-UI Breadcrumbs component
 */
const Breadcrumbs: React.FC<IBreadcrumbsProps> = ({
  items,
  separator = <ChevronRightGreyIcon size={16} style={{ width: "80%", height: "auto" }} />,
  maxItems = 8,
  sx,
  autoGenerate = false,
  showCurrentPage = true,
  homeLabel = "Home",
  homePath = "/",
  truncateLabels = true,
  maxLabelLength = 20,
  onItemClick,
}) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Truncate text if it exceeds the maximum length
   * Memoized for performance optimization
   */
  const truncateText = useCallback(
    (text: string): string => {
      if (!truncateLabels || text.length <= maxLabelLength) {
        return text;
      }
      return `${text.substring(0, maxLabelLength)}...`;
    },
    [truncateLabels, maxLabelLength]
  );

  /**
   * Convert route path to readable label
   * Uses centralized route mapping utilities for consistency
   */
  const pathToLabel = useCallback((path: string): string => {
    // Use centralized route mapping logic which handles custom mappings
    return getRouteMapping(path);
  }, []);

  /**
   * Auto-generate breadcrumbs from current route
   */
  const generateBreadcrumbs = useMemo((): IBreadcrumbItem[] => {
    if (!autoGenerate) return [];

    const pathSegments = location.pathname.split("/").filter(Boolean);

    const breadcrumbs: IBreadcrumbItem[] = [];

    // Add home item
    breadcrumbs.push({
      label: homeLabel,
      path: homePath,
      icon: getRouteIcon(homePath),
    });

    // Build path progressively
    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip adding current page if showCurrentPage is false and this is the last segment
      if (!showCurrentPage && index === pathSegments.length - 1) {
        return;
      }

      breadcrumbs.push({
        label: pathToLabel(currentPath),
        path: currentPath,
        icon: getRouteIcon(currentPath),
      });
    });

    return breadcrumbs;
  }, [
    location.pathname,
    autoGenerate,
    homeLabel,
    homePath,
    showCurrentPage,
    pathToLabel,
  ]);

  /**
   * Handle breadcrumb item click
   * Enhanced with error handling
   */
  const handleItemClick = useCallback(
    (item: IBreadcrumbItem, index: number) => {
      if (item.disabled) return;

      try {
        // Call custom click handler if provided
        if (onItemClick) {
          onItemClick(item, index);
          return;
        }

        // Default navigation behavior
        if (item.onClick) {
          item.onClick();
        } else if (item.path) {
          navigate(item.path);
        }
      } catch (error) {
        console.error("Navigation error:", error);
      }
    },
    [navigate, onItemClick]
  );

  /**
   * Render breadcrumb item
   * Memoized for better performance
   */
  const renderBreadcrumbItem = useCallback(
    (item: IBreadcrumbItem, index: number, totalItems: number) => {
      const isLast = index === totalItems - 1;
      const isDisabled = item.disabled || isLast;
      const truncatedLabel = truncateText(item.label);
      const isLabelTruncated = truncatedLabel !== item.label;

      const itemContent = (
        <Typography
          variant="body2"
          component="span"
          title={
            isLabelTruncated || item.tooltip
              ? item.tooltip || item.label
              : undefined
          }
          sx={{
            fontSize: "13px",
            fontWeight: isLast ? 500 : 400,
            color: theme.palette.text.secondary,
            cursor: isDisabled ? "default" : "pointer",
            "&:hover": {
              color: isDisabled
                ? theme.palette.text.secondary
                : theme.palette.primary.main,
              backgroundColor: isDisabled
                ? (theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.06)"
                  : "rgba(0, 0, 0, 0.04)")
                : (theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.12)"
                  : "rgba(0, 0, 0, 0.08)"),
            },
            transition: "color 0.2s ease, background-color 0.2s ease",
            textDecoration: "none",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            backgroundColor: theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(0, 0, 0, 0.04)",
            padding: "2px 10px",
            borderRadius: "4px",
            gap: "6px",
          }}
        >
          {item.icon && (
            <span style={{ display: "flex", alignItems: "center" }}>
              {item.icon}
            </span>
          )}
          {truncatedLabel}
        </Typography>
      );

      if (isDisabled) {
        return (
          <span
            key={item.id || `${item.label}-${index}`}
            role="text"
            aria-current={isLast ? "page" : undefined}
          >
            {itemContent}
          </span>
        );
      }

      return (
        <Link
          key={item.id || `${item.label}-${index}`}
          component="button"
          variant="body2"
          onClick={() => handleItemClick(item, index)}
          role="button"
          tabIndex={0}
          aria-label={`Navigate to ${item.label}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleItemClick(item, index);
            }
          }}
          sx={{
            textDecoration: "none",
            color: "inherit",
            backgroundColor: "transparent",
            border: "none",
            padding: 0,
            "&:hover": {
              textDecoration: "none",
            },
            "&:focus": {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: "2px",
              borderRadius: "2px",
            },
          }}
        >
          {itemContent}
        </Link>
      );
    },
    [truncateText, handleItemClick, theme]
  );

  const breadcrumbItems = items || generateBreadcrumbs;

  // Don't render if no items
  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <Stack
      sx={{
        py: 1,
        px: 0,
        ...sx,
      }}
    >
      <MUIBreadcrumbs
        separator={separator}
        maxItems={maxItems}
        aria-label="Page navigation breadcrumbs"
        sx={{
          "& .MuiBreadcrumbs-separator": {
            color: theme.palette.text.disabled,
            ml: 2.25,
            mr: 2.25,
            fontSize: "14px",
          },
          "& .MuiBreadcrumbs-ol": {
            alignItems: "center",
            flexWrap: "wrap",
            gap: 0,
          },
          "& .MuiBreadcrumbs-li": {
            display: "flex",
            alignItems: "center",
          },
        }}
      >
        {breadcrumbItems.map((item, index) =>
          renderBreadcrumbItem(item, index, breadcrumbItems.length)
        )}
      </MUIBreadcrumbs>
    </Stack>
  );
};

// Set display name for better debugging
Breadcrumbs.displayName = "Breadcrumbs";

export default Breadcrumbs;
