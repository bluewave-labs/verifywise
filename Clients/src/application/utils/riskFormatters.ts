// Formatting functions for risk data display
export const formatRiskCount = (count: number): string => {
  return count.toString();
};

export const formatRiskPercentage = (count: number, total: number): string => {
  if (total === 0) return "0%";
  return `${Math.round((count / total) * 100)}%`;
};

export const formatRiskLevel = (level: string): string => {
  return level.replace(/risk$/i, "").trim();
};

export const getRiskLevelColor = (level: string): string => {
  switch (level.toLowerCase()) {
    case "very high risk":
    case "very high":
      return "#DC2626"; // Red
    case "high risk":
    case "high":
      return "#EA580C"; // Orange
    case "medium risk":
    case "medium":
      return "#D97706"; // Amber
    case "low risk":
    case "low":
      return "#16A34A"; // Green
    case "very low risk":
    case "very low":
      return "#059669"; // Emerald
    default:
      return "#6B7280"; // Gray
  }
};