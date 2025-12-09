/**
 * Utility functions for PluginDetailsModal components
 */

/**
 * Get chip colors based on plugin type
 */
export const getTypeChipConfig = (
  type: string
): { backgroundColor: string; textColor: string } => {
  switch (type) {
    case "framework":
      return { backgroundColor: "#E3F2FD", textColor: "#1565C0" };
    case "integration":
      return { backgroundColor: "#F3E8FF", textColor: "#7C3AED" };
    case "feature":
      return { backgroundColor: "#E6F4EA", textColor: "#138A5E" };
    case "reporting":
      return { backgroundColor: "#FFF8E1", textColor: "#795548" };
    default:
      return { backgroundColor: "#F3F4F6", textColor: "#6B7280" };
  }
};
