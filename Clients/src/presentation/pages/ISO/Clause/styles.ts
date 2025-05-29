import { SxProps, Theme } from "@mui/material";
import { commonStyles, flashAnimation, getStatusColor } from "../style";

// Component styles
export const styles = {
  container: commonStyles.container,
  title: commonStyles.title,
  accordion: commonStyles.accordion,
  accordionSummary: commonStyles.accordionSummary,
  expandIcon: commonStyles.expandIcon,

  subClauseRow: (isLast: boolean, isFlashing: boolean) => ({
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "16px",
    borderBottom: isLast ? "none" : "1px solid #eaecf0",
    cursor: "pointer",
    fontSize: 13,
    animation: isFlashing ? `${flashAnimation} 2s ease-in-out` : 'none',
    '&:hover': {
      backgroundColor: isFlashing ? 'transparent' : '#f5f5f5',
    },
    alignItems: "center",
  }) as SxProps<Theme>,

  statusBadge: (status: string) => ({
    borderRadius: "4px",
    padding: "5px",
    backgroundColor: getStatusColor(status),
    color: "#fff",
  }) as SxProps<Theme>,

  loadingContainer: {
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as SxProps<Theme>,

  noSubClausesContainer: {
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#666",
  } as SxProps<Theme>,
}; 