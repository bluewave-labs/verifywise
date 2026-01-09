// Dashboard color palette
export const COLORS = {
  // Status colors
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
} as const;

// Common icon button styles for navigation arrows
export const navIconButtonSx = {
  padding: "4px",
  color: COLORS.textSecondary,
  "&:hover": {
    backgroundColor: COLORS.backgroundHover,
    color: COLORS.textPrimary
  },
} as const;

// Risk level data generators
export const getRiskLevelData = (distribution: { high: number; medium: number; low: number }) => [
  { label: "High", value: distribution.high || 0, color: COLORS.high },
  { label: "Medium", value: distribution.medium || 0, color: COLORS.medium },
  { label: "Low", value: distribution.low || 0, color: COLORS.low },
];

export const getVendorRiskData = (distribution: { veryHigh: number; high: number; medium: number; low: number; veryLow: number }) => [
  { label: "Very High", value: distribution.veryHigh || 0, color: COLORS.critical },
  { label: "High", value: distribution.high || 0, color: COLORS.high },
  { label: "Medium", value: distribution.medium || 0, color: COLORS.medium },
  { label: "Low", value: distribution.low || 0, color: COLORS.veryLow },
  { label: "Very Low", value: distribution.veryLow || 0, color: COLORS.low },
];

export const getModelRiskData = (distribution: { critical: number; high: number; medium: number; low: number }) => [
  { label: "Critical", value: distribution.critical || 0, color: COLORS.critical },
  { label: "High", value: distribution.high || 0, color: COLORS.high },
  { label: "Medium", value: distribution.medium || 0, color: COLORS.medium },
  { label: "Low", value: distribution.low || 0, color: COLORS.low },
];

export const getNistStatusData = (breakdown: {
  implemented?: number;
  inProgress?: number;
  awaitingReview?: number;
  awaitingApproval?: number;
  draft?: number;
  needsRework?: number;
  notStarted?: number;
}) => [
  { label: "Implemented", value: breakdown.implemented || 0, color: COLORS.implemented },
  { label: "In Progress", value: breakdown.inProgress || 0, color: COLORS.inProgress },
  { label: "Awaiting Review", value: breakdown.awaitingReview || 0, color: COLORS.awaitingReview },
  { label: "Awaiting Approval", value: breakdown.awaitingApproval || 0, color: COLORS.awaitingApproval },
  { label: "Draft", value: breakdown.draft || 0, color: COLORS.pending },
  { label: "Needs Rework", value: breakdown.needsRework || 0, color: COLORS.needsRework },
  { label: "Not Started", value: breakdown.notStarted || 0, color: COLORS.notStarted },
];

export const getCompletionData = (done: number, pending: number) => [
  { label: "Completed", value: done, color: COLORS.implemented },
  { label: "Pending", value: pending, color: COLORS.pending },
];

// Training status data
export const getTrainingStatusData = (distribution: { planned: number; inProgress: number; completed: number }) => [
  { label: "Planned", value: distribution.planned, color: COLORS.draft },
  { label: "In progress", value: distribution.inProgress, color: COLORS.inProgress },
  { label: "Completed", value: distribution.completed, color: COLORS.completed },
];

// Policy status data
export const getPolicyStatusData = (distribution: {
  published: number;
  approved: number;
  underReview: number;
  draft: number;
  archived: number;
}) => [
  { label: "Published", value: distribution.published, color: COLORS.completed },
  { label: "Approved", value: distribution.approved, color: COLORS.approved },
  { label: "Under review", value: distribution.underReview, color: COLORS.inProgress },
  { label: "Draft", value: distribution.draft, color: COLORS.draft },
  { label: "Archived", value: distribution.archived, color: COLORS.archived },
].filter((item) => item.value > 0);

// Incident status data
export const getIncidentStatusData = (distribution: {
  open: number;
  investigating: number;
  mitigated: number;
  closed: number;
}) => [
  { label: "Open", value: distribution.open, color: COLORS.open },
  { label: "Investigating", value: distribution.investigating, color: COLORS.investigating },
  { label: "Mitigated", value: distribution.mitigated, color: COLORS.mitigated },
  { label: "Closed", value: distribution.closed, color: COLORS.closed },
];

// Model lifecycle data
export const getModelLifecycleData = (distribution: {
  approved: number;
  pending: number;
  restricted: number;
  blocked: number;
}) => [
  { label: "Approved", value: distribution.approved, color: COLORS.completed },
  { label: "Pending", value: distribution.pending, color: COLORS.inProgress },
  { label: "Restricted", value: distribution.restricted, color: COLORS.restricted },
  { label: "Blocked", value: distribution.blocked, color: COLORS.blocked },
].filter((item) => item.value > 0);
