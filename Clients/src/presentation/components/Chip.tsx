import React from "react";
import { Box } from "@mui/material";
import {
  IChipProps,
  ChipVariant,
  ChipColorConfig,
} from "../types/interfaces/i.chip";

/**
 * Color mappings for all chip variants
 * Light pastel backgrounds with dark matching text
 */
const VARIANT_COLORS: Record<ChipVariant, ChipColorConfig> = {
  // Risk levels
  critical: { backgroundColor: "#FFD6D6", textColor: "#D32F2F" },
  high: { backgroundColor: "#FFE5D0", textColor: "#E64A19" },
  medium: { backgroundColor: "#FFF8E1", textColor: "#795548" },
  low: { backgroundColor: "#E6F4EA", textColor: "#138A5E" },
  "very-low": { backgroundColor: "#E0F7FA", textColor: "#00695C" },

  // Status
  success: { backgroundColor: "#E6F4EA", textColor: "#138A5E" },
  warning: { backgroundColor: "#FFF8E1", textColor: "#795548" },
  error: { backgroundColor: "#FFD6D6", textColor: "#D32F2F" },
  info: { backgroundColor: "#E3F2FD", textColor: "#1565C0" },
  default: { backgroundColor: "#F3F4F6", textColor: "#6B7280" },

  // Severity (maps to same colors as risk levels)
  catastrophic: { backgroundColor: "#FFD6D6", textColor: "#D32F2F" },
  major: { backgroundColor: "#FFE5D0", textColor: "#E64A19" },
  moderate: { backgroundColor: "#FFF8E1", textColor: "#795548" },
  minor: { backgroundColor: "#E6F4EA", textColor: "#138A5E" },
  negligible: { backgroundColor: "#E0F7FA", textColor: "#00695C" },

  // Boolean
  yes: { backgroundColor: "#E6F4EA", textColor: "#138A5E" },
  no: { backgroundColor: "#FFD6D6", textColor: "#D32F2F" },
};

/**
 * Height values for chip sizes
 */
const SIZE_HEIGHT: Record<"small" | "medium", number> = {
  small: 24,
  medium: 34,
};

/**
 * Map common label strings to variants (case-insensitive)
 */
const LABEL_TO_VARIANT: Record<string, ChipVariant> = {
  // Risk levels
  critical: "critical",
  "very high": "critical",
  "very high risk": "critical",
  high: "high",
  "high risk": "high",
  medium: "medium",
  "medium risk": "medium",
  low: "low",
  "low risk": "low",
  "very low": "very-low",
  "very low risk": "very-low",

  // Severity
  catastrophic: "catastrophic",
  major: "major",
  moderate: "moderate",
  minor: "minor",
  negligible: "negligible",

  // Status
  approved: "success",
  completed: "success",
  resolved: "success",
  active: "success",
  yes: "yes",
  pending: "warning",
  "in progress": "warning",
  "under review": "warning",
  draft: "default",
  blocked: "error",
  rejected: "error",
  restricted: "error",
  no: "no",
  open: "error",
  closed: "info",

  // Lifecycle stages (MLFlow)
  production: "success",
  staging: "warning",
  archived: "default",
  none: "default",

  // Incident severity
  serious: "high",
  "very serious": "critical",

  // Incident status
  investigated: "warning",
  mitigated: "success",

  // Incident approval
  "not required": "default",

  // Mitigation status
  "not started": "default",
  "on hold": "warning",
  deferred: "warning",
  canceled: "error",
  "requires review": "info",

  // Likelihood
  "almost certain": "critical",
  likely: "high",
  possible: "warning",
  unlikely: "low",
  rare: "very-low",

  // Policy status
  published: "info",
  deprecated: "error",

  // Training status
  planned: "info",

  // AI risk classification (EU AI Act)
  prohibited: "critical",
  "limited risk": "warning",
  "minimal risk": "success",

  // Automation execution status
  "partial success": "warning",
  failure: "error",
};

/**
 * Get variant from label if no explicit variant provided
 */
const getVariantFromLabel = (label: string): ChipVariant | undefined => {
  const normalizedLabel = label.toLowerCase().trim();
  return LABEL_TO_VARIANT[normalizedLabel];
};

/**
 * Darken a hex color by a percentage
 */
const darkenColor = (hex: string, percent: number): string => {
  // Remove # if present
  const color = hex.replace("#", "");

  // Parse RGB values
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Darken each channel
  const darkenChannel = (channel: number) =>
    Math.max(0, Math.floor(channel * (1 - percent / 100)));

  const newR = darkenChannel(r);
  const newG = darkenChannel(g);
  const newB = darkenChannel(b);

  // Convert back to hex
  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
};

/**
 * Get colors for a chip based on variant or custom colors
 */
const getChipColors = (
  label: string,
  variant?: ChipVariant,
  backgroundColor?: string,
  textColor?: string
): ChipColorConfig => {
  // Custom colors take priority
  if (backgroundColor && textColor) {
    return { backgroundColor, textColor };
  }

  // Use explicit variant if provided
  if (variant && VARIANT_COLORS[variant]) {
    return {
      backgroundColor: backgroundColor || VARIANT_COLORS[variant].backgroundColor,
      textColor: textColor || VARIANT_COLORS[variant].textColor,
    };
  }

  // Try to derive variant from label
  const derivedVariant = getVariantFromLabel(label);
  if (derivedVariant && VARIANT_COLORS[derivedVariant]) {
    return {
      backgroundColor: backgroundColor || VARIANT_COLORS[derivedVariant].backgroundColor,
      textColor: textColor || VARIANT_COLORS[derivedVariant].textColor,
    };
  }

  // Fallback to default
  return VARIANT_COLORS.default;
};

/**
 * Unified Chip component with consistent light pastel styling
 *
 * @example
 * // Risk level
 * <Chip label="High" variant="high" />
 *
 * @example
 * // Status
 * <Chip label="Approved" variant="success" />
 *
 * @example
 * // Boolean
 * <Chip label="Yes" variant="yes" />
 *
 * @example
 * // Custom colors
 * <Chip label="Custom" backgroundColor="#E8F5E9" textColor="#2E7D32" />
 *
 * @example
 * // Lowercase, medium size
 * <Chip label="In Progress" variant="warning" uppercase={false} size="medium" />
 */
const Chip: React.FC<IChipProps> = ({
  label,
  variant,
  size = "small",
  uppercase = true,
  backgroundColor,
  textColor,
}) => {
  const colors = getChipColors(label, variant, backgroundColor, textColor);
  const height = SIZE_HEIGHT[size];

  // Create gradient colors (very slightly darker at bottom)
  const gradientTop = colors.backgroundColor;
  const gradientBottom = darkenColor(colors.backgroundColor, 3);

  // Create border color (very slightly darker than background)
  const borderColor = darkenColor(colors.backgroundColor, 6);

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height,
        padding: "4px 8px",
        borderRadius: "4px",
        background: `linear-gradient(180deg, ${gradientTop} 0%, ${gradientBottom} 100%)`,
        border: `1px solid ${borderColor}`,
        color: colors.textColor,
        fontSize: 11,
        fontWeight: 500,
        textTransform: uppercase ? "uppercase" : "none",
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      {label}
    </Box>
  );
};

export default Chip;

/**
 * Export variant colors for external use if needed
 */
export { VARIANT_COLORS, getChipColors };
