import React, { useMemo } from "react";
import {
  Breadcrumbs as MUIBreadcrumbs,
  Link,
  Typography,
  Stack,
  useTheme,
  SxProps,
  Theme,
} from "@mui/material";
import { NavigateNext } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Interface for individual breadcrumb item
 */
export interface BreadcrumbItem {
  label: string;
  path?: string;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * Props for the Breadcrumbs component
 */
export interface BreadcrumbsProps {
  /** Array of breadcrumb items */
  items?: BreadcrumbItem[];
  /** Custom separator icon */
  separator?: React.ReactNode;
  /** Maximum number of items to show (collapses middle items) */
  maxItems?: number;
  /** Custom styles */
  sx?: SxProps<Theme>;
  /** Whether to auto-generate breadcrumbs from current route */
  autoGenerate?: boolean;
  /** Custom route mapping for auto-generation */
  routeMapping?: Record<string, string>;
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
}

/**
 * A customizable Breadcrumbs component that wraps Material-UI Breadcrumbs.
 * Supports both manual and auto-generated breadcrumbs from routing.
 *
 * @component
 * @param {BreadcrumbsProps} props - The props for the Breadcrumbs component
 * @returns {JSX.Element} A styled Material-UI Breadcrumbs component
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  separator = <NavigateNext fontSize="small" />,
  maxItems = 8,
  sx,
  autoGenerate = false,
  routeMapping = {},
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
   */
  const truncateText = (text: string): string => {
    if (!truncateLabels || text.length <= maxLabelLength) {
      return text;
    }
    return `${text.substring(0, maxLabelLength)}...`;
  };

  /**
   * Convert route path to readable label
   */
  const pathToLabel = (path: string): string => {
    // Check custom mapping first
    if (routeMapping[path]) {
      return routeMapping[path];
    }

    // Convert path to readable format
    return path
      .split("/")
      .filter(Boolean)
      .map((segment) => {
        // Convert kebab-case or snake_case to Title Case
        return segment
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());
      })
      .join(" / ");
  };

  /**
   * Auto-generate breadcrumbs from current route
   */
  const generateBreadcrumbs = useMemo((): BreadcrumbItem[] => {
    if (!autoGenerate) return [];

    const pathSegments = location.pathname.split("/").filter(Boolean);

    const breadcrumbs: BreadcrumbItem[] = [];

    // Add home item
    breadcrumbs.push({
      label: homeLabel,
      path: homePath,
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
      });
    });

    return breadcrumbs;
  }, [
    location.pathname,
    autoGenerate,
    homeLabel,
    homePath,
    showCurrentPage,
    routeMapping,
  ]);

  /**
   * Handle breadcrumb item click
   */
  const handleItemClick = (item: BreadcrumbItem, index: number) => {
    if (item.disabled) return;

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
  };

  /**
   * Render breadcrumb item
   */
  const renderBreadcrumbItem = (item: BreadcrumbItem, index: number) => {
    const isLast = index === (items || generateBreadcrumbs).length - 1;
    const isDisabled = item.disabled || isLast;

    const itemContent = (
      <Typography
        variant="body2"
        sx={{
          fontSize: "13px",
          fontWeight: isLast ? 500 : 400,
          color: isDisabled
            ? theme.palette.text.tertiary
            : theme.palette.text.secondary,
          cursor: isDisabled ? "default" : "pointer",
          "&:hover": {
            color: isDisabled ? theme.palette.text.tertiary : "#13715B", // Use the green color from the theme
          },
          transition: "color 0.2s ease",
        }}
      >
        {truncateText(item.label)}
      </Typography>
    );

    if (isDisabled) {
      return itemContent;
    }

    return (
      <Link
        component="button"
        variant="body2"
        onClick={() => handleItemClick(item, index)}
        sx={{
          textDecoration: "none",
          color: "inherit",
          "&:hover": {
            textDecoration: "none",
          },
        }}
      >
        {itemContent}
      </Link>
    );
  };

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
        mb: 1, // Add bottom spacing
        ...sx,
      }}
    >
      <MUIBreadcrumbs
        separator={separator}
        maxItems={maxItems}
        aria-label="breadcrumb"
        sx={{
          "& .MuiBreadcrumbs-separator": {
            color: theme.palette.text.tertiary,
            mx: 1,
          },
          "& .MuiBreadcrumbs-ol": {
            alignItems: "center",
          },
        }}
      >
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={`${item.label}-${index}`}>
            {renderBreadcrumbItem(item, index)}
          </React.Fragment>
        ))}
      </MUIBreadcrumbs>
    </Stack>
  );
};

export default Breadcrumbs;
