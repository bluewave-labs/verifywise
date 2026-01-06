/**
 * @fileoverview AI Dependency Graph Styles
 *
 * Styles for the AI Dependency Graph visualization component.
 */

import type { CSSProperties } from "react";
import { SxProps, Theme } from "@mui/material";

// Design system colors
const COLORS = {
  primary: "#13715B",
  primaryLight: "#f0fdf4",
  border: "#d0d5dd",
  borderLight: "#e5e7eb",
  textPrimary: "#344054",
  textSecondary: "#667085",
  textTertiary: "#9ca3af",
  background: "#fafafa",
} as const;

// Container styles
export const graphContainerStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  backgroundColor: COLORS.background,
};

// Loading state styles
export const loadingContainerSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
  gap: 2,
};

export const loadingTextSx: SxProps<Theme> = {
  fontSize: 14,
  color: COLORS.textSecondary,
};

// Error state styles
export const errorContainerSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
  gap: 2,
  padding: 3,
};

export const errorTextSx: SxProps<Theme> = {
  fontSize: 14,
  color: "#ef4444",
  textAlign: "center",
};

// Empty state styles
export const emptyStateContainerSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
  gap: 2,
  backgroundColor: COLORS.background,
};

export const emptyStateTitleSx: SxProps<Theme> = {
  fontSize: 16,
  fontWeight: 600,
  color: COLORS.textPrimary,
};

export const emptyStateDescriptionSx: SxProps<Theme> = {
  fontSize: 13,
  color: COLORS.textSecondary,
  textAlign: "center",
  maxWidth: 300,
};

// Control panel styles
export const controlPanelSx: SxProps<Theme> = {
  gap: "8px",
  p: "12px",
  backgroundColor: "white",
  borderRadius: "4px",
  border: `1px solid ${COLORS.border}`,
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  minWidth: 240,
  maxWidth: 280,
};

export const legendLabelSx: SxProps<Theme> = {
  fontSize: 11,
  fontWeight: 600,
  color: COLORS.textSecondary,
  mb: 1,
};

export const legendItemSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  mb: 0.5,
};

export const colorDotSx = (color: string): SxProps<Theme> => ({
  width: 10,
  height: 10,
  borderRadius: "50%",
  backgroundColor: color,
  flexShrink: 0,
});

export const legendTextSx: SxProps<Theme> = {
  fontSize: 11,
  color: COLORS.textPrimary,
};

export const statsContainerSx: SxProps<Theme> = {
  pt: "8px",
  borderTop: `1px solid ${COLORS.borderLight}`,
};

export const statsTextSx: SxProps<Theme> = {
  fontSize: 11,
  color: COLORS.textSecondary,
};

// Sidebar styles
export const sidebarContainerSx: SxProps<Theme> = {
  position: "absolute",
  right: 0,
  top: 0,
  bottom: 0,
  width: 320,
  backgroundColor: "white",
  borderLeft: `1px solid ${COLORS.border}`,
  boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
  zIndex: 10,
};

export const sidebarHeaderSx: SxProps<Theme> = {
  p: 2,
  borderBottom: `1px solid ${COLORS.borderLight}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

export const sidebarTitleSx: SxProps<Theme> = {
  fontSize: 14,
  fontWeight: 600,
  color: COLORS.textPrimary,
};

export const sidebarContentSx: SxProps<Theme> = {
  flex: 1,
  overflow: "auto",
  p: "8px",
};

export const sidebarSectionSx: SxProps<Theme> = {
  mb: 2,
};

// Table styles for metadata display
export const sidebarTableSx: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "1px",
  backgroundColor: COLORS.borderLight,
  border: `1px solid ${COLORS.borderLight}`,
  borderRadius: "4px",
  overflow: "hidden",
  mb: 2,
};

export const sidebarTableCellSx: SxProps<Theme> = {
  backgroundColor: "white",
  p: "8px 12px",
};

export const sidebarTableLabelSx: SxProps<Theme> = {
  fontSize: 11,
  fontWeight: 600,
  color: COLORS.textSecondary,
  textTransform: "uppercase",
  mb: "4px",
};

export const sidebarTableValueSx: SxProps<Theme> = {
  fontSize: 13,
  color: COLORS.textPrimary,
};

export const sidebarLabelSx: SxProps<Theme> = {
  fontSize: 11,
  fontWeight: 600,
  color: COLORS.textSecondary,
  mb: 0.5,
  textTransform: "uppercase",
};

export const sidebarValueSx: SxProps<Theme> = {
  fontSize: 13,
  color: COLORS.textPrimary,
};

export const filePathSx: SxProps<Theme> = {
  fontSize: 12,
  color: COLORS.primary,
  cursor: "pointer",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "block",
  "&:hover": {
    textDecoration: "underline",
  },
};
