import { IStatusData } from "../../domain/interfaces/i.chart";

// Color schemes for different entity statuses
export const statusColorSchemes = {
  // Model statuses (4 different states)
  models: {
    development: "#3B82F6", // Blue
    training: "#F59E0B", // Amber
    validation: "#8B5CF6", // Purple
    production: "#10B981", // Emerald
  },

  // Vendor statuses
  vendors: {
    "in review": "#F59E0B", // Amber
    reviewed: "#10B981", // Emerald
    "requires follow up": "#EF4444", // Red
    active: "#10B981", // Emerald
    inactive: "#6B7280", // Gray
  },

  // Policy statuses
  policies: {
    draft: "#6B7280", // Gray
    "in review": "#F59E0B", // Amber
    approved: "#10B981", // Emerald
    published: "#3B82F6", // Blue
    archived: "#9CA3AF", // Light Gray
  },

  // Training statuses
  trainings: {
    planned: "#6B7280", // Gray
    "in progress": "#F59E0B", // Amber
    completed: "#10B981", // Emerald
  },

  // Vendor risk levels
  vendorRisks: {
    "very high": "#DC2626", // Dark Red
    high: "#EF4444", // Red
    medium: "#F59E0B", // Amber
    low: "#10B981", // Emerald
    "very low": "#059669", // Dark Emerald
  },
};

// Helper function to get color for a status
export const getStatusColor = (
  entityType: keyof typeof statusColorSchemes,
  status: string
): string => {
  const scheme = statusColorSchemes[entityType];
  const normalizedStatus = status.toLowerCase().trim();
  return scheme[normalizedStatus as keyof typeof scheme] || "#6B7280"; // Default gray
};

// Helper function to create StatusData array from status counts
export const createStatusData = (
  entityType: keyof typeof statusColorSchemes,
  statusCounts: Record<string, number>
): IStatusData[] => {
  return Object.entries(statusCounts).map(([status, count]) => ({
    label: status,
    value: count,
    color: getStatusColor(entityType, status),
  }));
};

// Default status distributions (when API doesn't provide breakdown)
export const getDefaultStatusDistribution = (
  entityType: keyof typeof statusColorSchemes,
  total: number
): IStatusData[] => {
  if (total === 0) return [];

  switch (entityType) {
    case "models":
      return [
        {
          label: "Production",
          value: Math.floor(total * 0.4),
          color: statusColorSchemes.models.production,
        },
        {
          label: "Development",
          value: Math.floor(total * 0.3),
          color: statusColorSchemes.models.development,
        },
        {
          label: "Training",
          value: Math.floor(total * 0.2),
          color: statusColorSchemes.models.training,
        },
        {
          label: "Validation",
          value: total - Math.floor(total * 0.9),
          color: statusColorSchemes.models.validation,
        },
      ];

    case "trainings":
      return [
        {
          label: "Completed",
          value: Math.floor(total * 0.6),
          color: statusColorSchemes.trainings.completed,
        },
        {
          label: "In Progress",
          value: Math.floor(total * 0.25),
          color: statusColorSchemes.trainings["in progress"],
        },
        {
          label: "Planned",
          value: total - Math.floor(total * 0.85),
          color: statusColorSchemes.trainings.planned,
        },
      ];

    case "policies":
      return [
        {
          label: "Published",
          value: Math.floor(total * 0.5),
          color: statusColorSchemes.policies.published,
        },
        {
          label: "Approved",
          value: Math.floor(total * 0.25),
          color: statusColorSchemes.policies.approved,
        },
        {
          label: "In Review",
          value: Math.floor(total * 0.15),
          color: statusColorSchemes.policies["in review"],
        },
        {
          label: "Draft",
          value: total - Math.floor(total * 0.9),
          color: statusColorSchemes.policies.draft,
        },
      ];

    case "vendors":
      return [
        {
          label: "Active",
          value: Math.floor(total * 0.7),
          color: statusColorSchemes.vendors.active,
        },
        {
          label: "In Review",
          value: Math.floor(total * 0.2),
          color: statusColorSchemes.vendors["in review"],
        },
        {
          label: "Requires Follow Up",
          value: total - Math.floor(total * 0.9),
          color: statusColorSchemes.vendors["requires follow up"],
        },
      ];

    case "vendorRisks":
      return [
        {
          label: "Low",
          value: Math.floor(total * 0.4),
          color: statusColorSchemes.vendorRisks.low,
        },
        {
          label: "Medium",
          value: Math.floor(total * 0.35),
          color: statusColorSchemes.vendorRisks.medium,
        },
        {
          label: "High",
          value: Math.floor(total * 0.2),
          color: statusColorSchemes.vendorRisks.high,
        },
        {
          label: "Very High",
          value: total - Math.floor(total * 0.95),
          color: statusColorSchemes.vendorRisks["very high"],
        },
      ];

    default:
      return [];
  }
};
