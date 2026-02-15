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

  // Deadline/urgency colors
  overdue: "#dc2626",
  overdueBackground: "#fef2f2",
  dueToday: "#ea580c",
  dueTodayBackground: "#fff7ed",
  dueThisWeek: "#ca8a04",
  dueThisWeekBackground: "#fefce8",
  dueNextWeek: "#2563eb",
  dueNextWeekBackground: "#eff6ff",
  dueThisMonth: "#7c3aed",
  dueThisMonthBackground: "#f5f3ff",
  dueLater: "#6b7280",
  dueLaterBackground: "#f9fafb",
  noDueDate: "#9ca3af",
  noDueDateBackground: "#f3f4f6",

  // UI colors
  primary: "#13715B",
  white: "#ffffff",
  textPrimary: "#1F2937",
  textSecondary: "#667085",
  textMuted: "#374151",
  border: "#d0d5dd",
  borderLight: "#f3f4f6",
  backgroundWhite: "#ffffff",
  backgroundHover: "#E5E7EB",
  backgroundLight: "#F3F4F6",
  backgroundSubtle: "#f9fafb",
  progressBackground: "#E5E7EB",
} as const;

const DARK_DASHBOARD_COLORS = {
  ...DASHBOARD_COLORS,

  // Adjusted deadline backgrounds for dark mode
  overdueBackground: "#450a0a",
  dueTodayBackground: "#451a03",
  dueThisWeekBackground: "#422006",
  dueNextWeekBackground: "#1e1b4b",
  dueThisMonthBackground: "#2e1065",
  dueLaterBackground: "#1a1d23",
  noDueDateBackground: "#21242b",

  // UI colors adjusted for dark mode
  implemented: "#1a9e7e",
  primary: "#1a9e7e",
  white: "#0f1117",
  textPrimary: "#e6e8eb",
  textSecondary: "#8b909a",
  textMuted: "#b0b4bb",
  border: "#3a3d45",
  borderLight: "#2a2d35",
  backgroundWhite: "#0f1117",
  backgroundHover: "#21242b",
  backgroundLight: "#181b22",
  backgroundSubtle: "#141720",
  progressBackground: "#2a2d35",
} as const;

export const getDashboardColors = (mode: "light" | "dark" = "light") =>
  mode === "dark" ? DARK_DASHBOARD_COLORS : DASHBOARD_COLORS;

// Deadline group color configurations for DeadlineView component
export const DEADLINE_COLORS = {
  overdue: { color: DASHBOARD_COLORS.overdue, bgColor: DASHBOARD_COLORS.overdueBackground },
  today: { color: DASHBOARD_COLORS.dueToday, bgColor: DASHBOARD_COLORS.dueTodayBackground },
  thisWeek: { color: DASHBOARD_COLORS.dueThisWeek, bgColor: DASHBOARD_COLORS.dueThisWeekBackground },
  nextWeek: { color: DASHBOARD_COLORS.dueNextWeek, bgColor: DASHBOARD_COLORS.dueNextWeekBackground },
  thisMonth: { color: DASHBOARD_COLORS.dueThisMonth, bgColor: DASHBOARD_COLORS.dueThisMonthBackground },
  later: { color: DASHBOARD_COLORS.dueLater, bgColor: DASHBOARD_COLORS.dueLaterBackground },
  noDueDate: { color: DASHBOARD_COLORS.noDueDate, bgColor: DASHBOARD_COLORS.noDueDateBackground },
} as const;

export const getDeadlineColors = (mode: "light" | "dark" = "light") => {
  const colors = getDashboardColors(mode);
  return {
    overdue: { color: colors.overdue, bgColor: colors.overdueBackground },
    today: { color: colors.dueToday, bgColor: colors.dueTodayBackground },
    thisWeek: { color: colors.dueThisWeek, bgColor: colors.dueThisWeekBackground },
    nextWeek: { color: colors.dueNextWeek, bgColor: colors.dueNextWeekBackground },
    thisMonth: { color: colors.dueThisMonth, bgColor: colors.dueThisMonthBackground },
    later: { color: colors.dueLater, bgColor: colors.dueLaterBackground },
    noDueDate: { color: colors.noDueDate, bgColor: colors.noDueDateBackground },
  } as const;
};

// Common text styles
export const TEXT_STYLES = {
  label: { fontSize: 11, color: DASHBOARD_COLORS.textSecondary },
  value: { fontSize: 13, fontWeight: 600, color: DASHBOARD_COLORS.textPrimary },
  valueSmall: { fontSize: 14, fontWeight: 600, color: DASHBOARD_COLORS.textPrimary },
  legendItem: { fontSize: 13, color: DASHBOARD_COLORS.textSecondary },
  percentage: { fontSize: 24, fontWeight: 700, color: DASHBOARD_COLORS.textSecondary },
} as const;

export const getTextStyles = (mode: "light" | "dark" = "light") => {
  const colors = getDashboardColors(mode);
  return {
    label: { fontSize: 11, color: colors.textSecondary },
    value: { fontSize: 13, fontWeight: 600, color: colors.textPrimary },
    valueSmall: { fontSize: 14, fontWeight: 600, color: colors.textPrimary },
    legendItem: { fontSize: 13, color: colors.textSecondary },
    percentage: { fontSize: 24, fontWeight: 700, color: colors.textSecondary },
  } as const;
};
