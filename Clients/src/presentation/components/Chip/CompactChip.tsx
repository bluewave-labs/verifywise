import React from "react";
import { Box } from "@mui/material";
import { ChipVariant, ChipColorConfig } from "../../../domain/interfaces/i.chip";

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

  // Severity
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
 * Height values for compact chip sizes (2/3 of normal chip)
 */
const SIZE_HEIGHT: Record<"small" | "medium", number> = {
  small: 16,
  medium: 22,
};

/**
 * Darken a hex color by a percentage
 */
const darkenColor = (hex: string, percent: number): string => {
  const color = hex.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  const darkenChannel = (channel: number) =>
    Math.max(0, Math.floor(channel * (1 - percent / 100)));

  const newR = darkenChannel(r);
  const newG = darkenChannel(g);
  const newB = darkenChannel(b);

  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
};

/**
 * Get colors for a chip based on variant or custom colors
 */
const getChipColors = (
  variant?: ChipVariant,
  backgroundColor?: string,
  textColor?: string
): ChipColorConfig => {
  if (backgroundColor && textColor) {
    return { backgroundColor, textColor };
  }

  if (variant && VARIANT_COLORS[variant]) {
    return {
      backgroundColor: backgroundColor || VARIANT_COLORS[variant].backgroundColor,
      textColor: textColor || VARIANT_COLORS[variant].textColor,
    };
  }

  return VARIANT_COLORS.default;
};

export interface CompactChipProps {
  label: string;
  variant?: ChipVariant;
  size?: "small" | "medium";
  uppercase?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

/**
 * CompactChip - A smaller variant of the Chip component
 *
 * Dimensions are 2/3 of the standard Chip:
 * - Height: 16px (small) / 22px (medium) vs 24px / 34px
 * - Padding: 3px 5px vs 4px 8px
 * - Font size: 9px vs 11px
 *
 * @example
 * <CompactChip label="integration" backgroundColor="#F3E8FF" textColor="#7C3AED" />
 */
const CompactChip: React.FC<CompactChipProps> = ({
  label,
  variant,
  size = "small",
  uppercase = true,
  backgroundColor,
  textColor,
}) => {
  const colors = getChipColors(variant, backgroundColor, textColor);
  const height = SIZE_HEIGHT[size];

  const gradientTop = colors.backgroundColor;
  const gradientBottom = darkenColor(colors.backgroundColor, 3);
  const borderColor = darkenColor(colors.backgroundColor, 6);

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height,
        padding: "3px 5px",
        borderRadius: "3px",
        background: `linear-gradient(180deg, ${gradientTop} 0%, ${gradientBottom} 100%)`,
        border: `1px solid ${borderColor}`,
        color: colors.textColor,
        fontSize: 9,
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

export default CompactChip;
