// VerifyWise Demo Video Styles - Matching actual app UI

// Brand Colors - from actual app
export const colors = {
  // Primary
  primary: "#13715B",
  primaryLight: "#1a9e7a",
  primaryDark: "#0d5243",

  // Status colors
  critical: "#DC2626",
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#10B981",

  // State colors
  completed: "#10B981",
  approved: "#22C55E",
  inProgress: "#F59E0B",
  pending: "#9CA3AF",

  // UI colors
  white: "#ffffff",
  background: "#f8fafc",
  backgroundAlt: "#f1f5f9",
  backgroundLight: "#F3F4F6",

  textPrimary: "#1F2937",
  textSecondary: "#667085",

  border: "#d0d5dd",
  borderLight: "#e2e8f0",

  // Sidebar
  sidebarBg: "#ffffff",
  sidebarText: "#344054",
  sidebarTextMuted: "#667085",
  sidebarActive: "#13715B",
  sidebarActiveBg: "rgba(19, 113, 91, 0.08)",
};

// Typography
export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

  // Video text (larger for video)
  heroTitle: {
    fontSize: 64,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
  },
  heroSubtitle: {
    fontSize: 32,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    lineHeight: 1.4,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },

  // App UI text (matching actual app)
  appTitle: {
    fontSize: 18,
    fontWeight: 600,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: 500,
  },
  appBody: {
    fontSize: 13,
    fontWeight: 400,
  },
  appSmall: {
    fontSize: 11,
    fontWeight: 400,
  },
  appLabel: {
    fontSize: 11,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
};

// App Shell Styles
export const appShell = {
  container: {
    display: "flex",
    width: "100%",
    height: "100%",
    backgroundColor: colors.background,
  },
  sidebar: {
    width: 240,
    backgroundColor: colors.sidebarBg,
    borderRight: `1px solid ${colors.border}`,
    display: "flex",
    flexDirection: "column",
    padding: "16px 0",
  },
  sidebarLogo: {
    padding: "0 16px 16px 16px",
    borderBottom: `1px solid ${colors.borderLight}`,
    marginBottom: 16,
  },
  sidebarGroup: {
    marginBottom: 8,
  },
  sidebarGroupLabel: {
    ...typography.appLabel,
    color: colors.sidebarTextMuted,
    padding: "8px 16px",
  },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 16px",
    margin: "2px 8px",
    borderRadius: 6,
    cursor: "pointer",
    ...typography.appBody,
    color: colors.sidebarText,
  },
  sidebarItemActive: {
    backgroundColor: colors.sidebarActiveBg,
    color: colors.sidebarActive,
    fontWeight: 500,
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    height: 56,
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
  },
  pageContent: {
    flex: 1,
    padding: 24,
    overflow: "auto",
  },
};

// Card Styles
export const card = {
  base: {
    backgroundColor: colors.white,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    overflow: "hidden",
  },
  header: {
    padding: "16px 20px",
    borderBottom: `1px solid ${colors.borderLight}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  body: {
    padding: "16px 20px",
  },
};

// Table Styles
export const table = {
  container: {
    width: "100%",
    borderCollapse: "collapse",
  },
  header: {
    backgroundColor: colors.backgroundLight,
    ...typography.appLabel,
    color: colors.textSecondary,
    padding: "12px 16px",
    textAlign: "left",
    borderBottom: `1px solid ${colors.border}`,
  },
  row: {
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  cell: {
    padding: "12px 16px",
    ...typography.appBody,
    color: colors.textPrimary,
  },
};

// Badge/Chip Styles
export const badge = {
  base: {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500,
  },
  success: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    color: "#059669",
  },
  warning: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    color: "#D97706",
  },
  danger: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#DC2626",
  },
  info: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    color: "#2563EB",
  },
  neutral: {
    backgroundColor: colors.backgroundLight,
    color: colors.textSecondary,
  },
};

// Button Styles
export const button = {
  primary: {
    backgroundColor: colors.primary,
    color: colors.white,
    padding: "8px 16px",
    borderRadius: 6,
    border: "none",
    ...typography.appBody,
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  secondary: {
    backgroundColor: colors.white,
    color: colors.textPrimary,
    padding: "8px 16px",
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
    ...typography.appBody,
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
};

// Stat Card Styles
export const statCard = {
  container: {
    ...card.base,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    ...typography.appSmall,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 28,
    fontWeight: 700,
    color: colors.textPrimary,
  },
  change: {
    ...typography.appSmall,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
};

// Progress Bar Styles
export const progressBar = {
  container: {
    width: "100%",
    height: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.3s ease",
  },
};

// Inter font import
export const interFontFace = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
`;
