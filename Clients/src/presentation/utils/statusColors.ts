import { IStatusData } from "../types/interfaces/i.chart";

// Chart/data category colors — same in light and dark themes.
// These are intentionally NOT theme-switched since they encode data categories.
const CHART_BLUE = "#3B82F6";
const CHART_AMBER = "#F59E0B";
const CHART_PURPLE = "#8B5CF6";
const CHART_EMERALD = "#10B981";
const CHART_RED = "#EF4444";
const CHART_DARK_RED = "#DC2626";
const CHART_DARK_EMERALD = "#059669";
const CHART_SLATE = "#6B7280";
const CHART_MUTED = "#9CA3AF";

// Color schemes for different entity statuses
export const statusColorSchemes = {
  // Model statuses (4 different states)
  models: {
    development: CHART_BLUE,
    training: CHART_AMBER,
    validation: CHART_PURPLE,
    production: CHART_EMERALD,
  },

  // Vendor statuses
  vendors: {
    "in review": CHART_AMBER,
    reviewed: CHART_EMERALD,
    "requires follow up": CHART_RED,
    active: CHART_EMERALD,
    inactive: CHART_SLATE,
  },

  // Policy statuses
  policies: {
    draft: CHART_SLATE,
    "in review": CHART_AMBER,
    approved: CHART_EMERALD,
    published: CHART_BLUE,
    archived: CHART_MUTED,
  },

  // Training statuses
  trainings: {
    planned: CHART_SLATE,
    "in progress": CHART_AMBER,
    completed: CHART_EMERALD,
  },

  // Vendor risk levels
  vendorRisks: {
    "very high": CHART_DARK_RED,
    high: CHART_RED,
    medium: CHART_AMBER,
    low: CHART_EMERALD,
    "very low": CHART_DARK_EMERALD,
  },

  // Incident statuses
  incidents: {
    open: CHART_RED,
    "in progress": CHART_AMBER,
    resolved: CHART_EMERALD,
    closed: CHART_SLATE,
  },
};

// Helper function to get color for a status
export const getStatusColor = (
  entityType: keyof typeof statusColorSchemes,
  status: string
): string => {
  const scheme = statusColorSchemes[entityType];
  const normalizedStatus = status.toLowerCase().trim();
  return scheme[normalizedStatus as keyof typeof scheme] || CHART_SLATE; // Default gray
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

    case "incidents":
      return [
        {
          label: "Open",
          value: Math.floor(total * 0.3),
          color: statusColorSchemes.incidents.open,
        },
        {
          label: "In Progress",
          value: Math.floor(total * 0.4),
          color: statusColorSchemes.incidents["in progress"],
        },
        {
          label: "Resolved",
          value: Math.floor(total * 0.2),
          color: statusColorSchemes.incidents.resolved,
        },
        {
          label: "Closed",
          value: total - Math.floor(total * 0.9),
          color: statusColorSchemes.incidents.closed,
        },
      ];

    default:
      return [];
  }
};
