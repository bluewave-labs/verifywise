/**
 * @fileoverview DeadlineChip Component
 *
 * Individual deadline chip component for displaying deadline counts.
 * Supports different severity levels, sizes, and interactive states.
 *
 * @package components/DeadlineWarningBox
 */

import React from "react";
import { Chip, Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AlertCircle,
  Clock,
  TrendingUp,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { DeadlineChipProps } from "./types";

/**
 * Deadline chip component with severity styling
 *
 * @param props - Component props
 * @returns JSX element
 */
export const DeadlineChip: React.FC<DeadlineChipProps> = ({
  count,
  severity,
  entityType,
  onClick,
  isSelected = false,
  disabled = false,
  size = "medium",
  variant = "default",
}) => {
  const theme = useTheme();

  // Get icon based on severity
  const getSeverityIcon = () => {
    const iconSize = size === "small" ? 14 : size === "large" ? 20 : 16;
    const iconColor = getSeverityColors().icon;

    switch (severity) {
      case "overdue":
        return <AlertTriangle size={iconSize} color={iconColor} />;
      case "dueSoon":
        return <Clock size={iconSize} color={iconColor} />;
      default:
        return <AlertCircle size={iconSize} color={iconColor} />;
    }
  };

  // Get color scheme based on severity
  const getSeverityColors = () => {
    switch (severity) {
      case "overdue":
        return {
          main: theme.palette.error.main,
          light: theme.palette.error.light,
          dark: theme.palette.error.dark,
          contrast: theme.palette.error.contrastText,
          icon: theme.palette.error.main,
          bg: isSelected ? theme.palette.error.dark : theme.palette.error.light,
          border: isSelected ? theme.palette.error.dark : theme.palette.error.main,
        };
      case "dueSoon":
        return {
          main: theme.palette.warning.main,
          light: theme.palette.warning.light,
          dark: theme.palette.warning.dark,
          contrast: theme.palette.warning.contrastText,
          icon: theme.palette.warning.main,
          bg: isSelected ? theme.palette.warning.dark : theme.palette.warning.light,
          border: isSelected ? theme.palette.warning.dark : theme.palette.warning.main,
        };
      default:
        return {
          main: theme.palette.info.main,
          light: theme.palette.info.light,
          dark: theme.palette.info.dark,
          contrast: theme.palette.info.contrastText,
          icon: theme.palette.info.main,
          bg: isSelected ? theme.palette.info.dark : theme.palette.info.light,
          border: isSelected ? theme.palette.info.dark : theme.palette.info.main,
        };
    }
  };

  // Get entity type display name
  const getEntityDisplayName = () => {
    const nameMap: Record<string, string> = {
      tasks: "Tasks",
      vendors: "Vendors",
      policies: "Policies",
      risks: "Risks",
    };
    return nameMap[entityType] || entityType.charAt(0).toUpperCase() + entityType.slice(1);
  };

  // Get severity display text
  const getSeverityText = () => {
    const textMap: Record<string, string> = {
      overdue: "Overdue",
      dueSoon: "Due Soon",
    };
    return textMap[severity] || severity;
  };

  // Get size-specific styling
  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          height: 24,
          fontSize: "0.7rem",
          padding: "2px 6px",
        };
      case "large":
        return {
          height: 40,
          fontSize: "0.9rem",
          padding: "8px 16px",
        };
      default:
        return {
          height: 32,
          fontSize: "0.8rem",
          padding: "4px 12px",
        };
    }
  };

  const colors = getSeverityColors();
  const sizeStyles = getSizeStyles();

  // Custom chip implementation for better control
  if (variant === "outlined" || variant === "filled") {
    return (
      <Chip
        icon={getSeverityIcon()}
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography
              variant="inherit"
              sx={{
                fontWeight: 600,
                color: variant === "filled" ? colors.contrast : colors.main,
              }}
            >
              {count}
            </Typography>
            <Typography
              variant="inherit"
              sx={{
                color: variant === "filled" ? colors.contrast : colors.main,
                opacity: 0.9,
              }}
            >
              {getSeverityText()} {getEntityDisplayName()}
            </Typography>
          </Box>
        }
        onClick={onClick}
        disabled={disabled}
        sx={{
          ...sizeStyles,
          backgroundColor: variant === "filled" ? colors.main : "transparent",
          color: variant === "filled" ? colors.contrast : colors.main,
          border: `1.5px solid ${colors.border}`,
          borderRadius: theme.shape.borderRadius * 3,
          cursor: onClick && !disabled ? "pointer" : "default",
          transition: theme.transitions.create(["background-color", "transform"], {
            duration: theme.transitions.duration.shorter,
          }),
          "&:hover": onClick && !disabled ? {
            backgroundColor: variant === "filled" ? colors.dark : colors.light,
            transform: "translateY(-1px)",
            boxShadow: theme.shadows[2],
          } : {},
          "&:active": onClick && !disabled ? {
            transform: "translateY(0)",
          } : {},
          "& .MuiChip-icon": {
            color: variant === "filled" ? colors.contrast : colors.icon,
          },
          "&.Mui-disabled": {
            opacity: 0.5,
            cursor: "not-allowed",
          },
        }}
      />
    );
  }

  // Default variant with custom styling
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: theme.spacing(1),
        padding: sizeStyles.padding,
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: theme.shape.borderRadius * 3,
        cursor: onClick && !disabled ? "pointer" : "default",
        transition: theme.transitions.create(["background-color", "transform"], {
          duration: theme.transitions.duration.shorter,
        }),
        "&:hover": onClick && !disabled ? {
          backgroundColor: colors.dark + "20",
          transform: "translateY(-1px)",
          boxShadow: theme.shadows[2],
        } : {},
        "&:active": onClick && !disabled ? {
          transform: "translateY(0)",
        } : {},
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {/* Icon */}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {getSeverityIcon()}
      </Box>

      {/* Count */}
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: sizeStyles.fontSize,
          color: colors.main,
          lineHeight: 1,
        }}
      >
        {count}
      </Typography>

      {/* Entity and severity text */}
      <Typography
        sx={{
          fontSize: sizeStyles.fontSize,
          color: colors.main,
          opacity: 0.85,
          lineHeight: 1,
        }}
      >
        {getSeverityText()} {getEntityDisplayName()}
      </Typography>
    </Box>
  );
};

export default DeadlineChip;