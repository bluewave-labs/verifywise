import { SxProps, Theme } from "@mui/material";
import { keyframes } from "@mui/system";

// Animation
export const flashAnimation = keyframes`
  0% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(82, 171, 67, 0.2); // Light green color
  }
  100% {
    background-color: transparent;
  }
`;

// Common styles
export const commonStyles = {
  container: {
    maxWidth: "1400px",
    marginTop: "14px",
    gap: "20px",
  } as SxProps<Theme>,

  title: {
    color: "#1A1919",
    fontWeight: 600,
    mb: "6px",
    fontSize: 16,
  } as SxProps<Theme>,

  accordion: {
    marginTop: "9px",
    border: "1px solid #eaecf0",
    width: "100%",
    marginLeft: "1.5px",
    borderRadius: "4px",
    overflow: "hidden",
    position: "relative",
    margin: 0,
    padding: 0,
    boxShadow: "none",
    ".MuiAccordionDetails-root": {
      padding: 0,
      margin: 0,
    },
  } as SxProps<Theme>,

  accordionSummary: {
    backgroundColor: "#fafafa",
    flexDirection: "row-reverse",
  } as SxProps<Theme>,

  expandIcon: (expanded: boolean) => ({
    transform: expanded ? "rotate(180deg)" : "rotate(270deg)",
    transition: "transform 0.5s ease-in",
  }) as SxProps<Theme>,
};

/**
 * Get the color associated with a status
 * @param status The status string to get the color for
 * @returns The hex color code for the status
 */
export function getStatusColor(status: string): string {
  const normalizedStatus = status?.trim() || "Not Started";
  switch (
    normalizedStatus.charAt(0).toUpperCase() +
    normalizedStatus.slice(1).toLowerCase()
  ) {
    case "Not Started":
      return "#C63622";
    case "Draft":
      return "#D68B61";
    case "In Progress":
      return "#D6B971";
    case "Awaiting Review":
      return "#D6B971";
    case "Awaiting Approval":
      return "#D6B971";
    case "Implemented":
      return "#52AB43";
    case "Audited":
      return "#B8D39C";
    case "Needs Rework":
      return "#800080";
    default:
      return "#C63622"; // Default to "Not Started" color
  }
}
