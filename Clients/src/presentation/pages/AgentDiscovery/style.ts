import { Theme } from "@mui/material/styles";

export const agentMainStack = {
  gap: "16px",
};

export const agentFilterRow = {
  gap: "16px",
};

export const agentToastContainer = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
};

export const addAgentButton = {
  backgroundColor: "#13715B",
  border: "1px solid #13715B",
  gap: "8px",
};

export const syncButton = {
  border: "1px solid #d0d5dd",
  gap: "8px",
};

export const statusCardsContainer = {
  minWidth: "fit-content",
  width: { xs: "100%", sm: "fit-content" },
  height: "100%",
  display: "flex",
  flexDirection: { xs: "column", sm: "row" },
  gap: "16px",
  overflow: "auto",
};

export const statusCardTile = {
  paddingY: { xs: "10px", sm: "15px" },
  paddingX: { xs: "15px", sm: "30px" },
  textAlign: "center",
  fontWeight: 600,
  position: "relative",
  cursor: "default",
  minWidth: { xs: "120px", sm: "140px" },
  width: { xs: "120px", sm: "140px" },
  backgroundColor: "#FFFFFF",
  border: "1px solid #d0d5dd",
  borderRadius: 2,
};

export const statusCardKey = {
  fontSize: 13,
};

export const statusCardValue = {
  fontSize: 28,
  fontWeight: 800,
};

// Table styles
export const agentRowHover = {
  "&:hover": { backgroundColor: "#FBFBFB", cursor: "pointer" },
};

export const agentEmptyContainer = () => ({
  border: "1px solid #EEEEEE",
  borderRadius: "4px",
  padding: "60px 20px 80px 20px",
  gap: "20px",
  minHeight: 200,
});

export const agentLoadingContainer = () => ({
  border: "1px solid #EEEEEE",
  borderRadius: "4px",
  padding: "60px 20px",
  minHeight: 200,
});

export const agentEmptyText = {
  fontSize: 13,
  color: "#475467",
  margin: 0,
  fontWeight: 400,
};

// Review status badge
export const reviewStatusBadge = (status: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    unreviewed: { bg: "#FFE5D0", color: "#E64A19" },
    confirmed: { bg: "#E6F4EA", color: "#138A5E" },
    rejected: { bg: "#FFD6D6", color: "#D32F2F" },
  };
  const style = styles[status] || { bg: "#E0E0E0", color: "#424242" };
  return {
    backgroundColor: style.bg,
    color: style.color,
    padding: "4px 8px",
    borderRadius: 4,
    fontWeight: 500,
    fontSize: 11,
    textTransform: "capitalize" as const,
    display: "inline-block" as const,
  };
};

// Permission category chip
export const permissionChip = {
  fontSize: 11,
  height: "20px",
  backgroundColor: "#f5f5f5",
  borderRadius: 4,
  color: "#666",
  margin: 0,
  fontWeight: 500,
};

// Pagination
export const agentPagination = (theme: Theme) => ({
  mt: theme.spacing(6),
  color: theme.palette.text.secondary,
  "& .MuiSelect-icon": {
    width: "24px",
    height: "fit-content",
  },
  "& .MuiSelect-select": {
    width: theme.spacing(10),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.border.light}`,
    padding: theme.spacing(4),
  },
});

export const agentShowingText = (theme: Theme) => ({
  paddingX: theme.spacing(2),
  fontSize: 11,
  opacity: 0.7,
  fontWeight: 400,
  whiteSpace: "nowrap" as const,
});
