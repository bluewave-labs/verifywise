// Shared color palette for dashboard components
export const DASHBOARD_COLORS = {
  // Status/severity colors
  critical: "#DC2626",
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#10B981",
  veryLow: "#22C55E",

  // State colors
  completed: "#10B981",
  approved: "#22C55E",
  inProgress: "#F59E0B",
  pending: "#9CA3AF",
  draft: "#6B7280",
  archived: "#9CA3AF",

  // Framework status colors
  implemented: "#13715B",
  awaitingReview: "#3B82F6",
  awaitingApproval: "#8B5CF6",
  needsRework: "#EA580C",
  notStarted: "#9CA3AF",

  // Incident colors
  open: "#EF4444",
  investigating: "#F59E0B",
  mitigated: "#3B82F6",
  closed: "#10B981",

  // Model lifecycle colors
  restricted: "#F97316",
  blocked: "#EF4444",

  // UI colors
  primary: "#13715B",
  textPrimary: "#1F2937",
  textSecondary: "#667085",
  border: "#d0d5dd",
  backgroundHover: "#E5E7EB",
  backgroundLight: "#F3F4F6",
  progressBackground: "#E5E7EB",
} as const;

// Common text styles
export const TEXT_STYLES = {
  label: { fontSize: 11, color: DASHBOARD_COLORS.textSecondary },
  value: { fontSize: 13, fontWeight: 600, color: DASHBOARD_COLORS.textPrimary },
  valueSmall: { fontSize: 14, fontWeight: 600, color: DASHBOARD_COLORS.textPrimary },
  legendItem: { fontSize: 13, color: DASHBOARD_COLORS.textSecondary },
  percentage: { fontSize: 24, fontWeight: 700, color: DASHBOARD_COLORS.textSecondary },
} as const;
