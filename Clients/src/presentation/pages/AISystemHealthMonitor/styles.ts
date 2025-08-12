export const systemHealthStyles = {
  padding: "24px",
  gap: "24px",
  backgroundColor: "#FAFAFA",
  minHeight: "100vh"
};

export const healthScoreCardStyle = {
  borderRadius: "12px",
  boxShadow: "0px 4px 24px -4px rgba(16, 24, 40, 0.08), 0px 3px 3px -3px rgba(16, 24, 40, 0.03)",
  border: "1px solid #E5E7EB",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    boxShadow: "0px 6px 32px -4px rgba(16, 24, 40, 0.12), 0px 4px 6px -3px rgba(16, 24, 40, 0.05)",
    transform: "translateY(-2px)"
  }
};

export const healthIndicatorStyle = {
  borderRadius: "8px",
  boxShadow: "0px 2px 8px rgba(16, 24, 40, 0.04)",
  border: "1px solid #E5E7EB",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    boxShadow: "0px 4px 16px rgba(16, 24, 40, 0.08)",
    borderColor: "#13715B"
  }
};

export const alertCardStyle = {
  borderRadius: "12px",
  boxShadow: "0px 4px 24px -4px rgba(16, 24, 40, 0.08)",
  border: "1px solid #E5E7EB"
};

export const chartContainerStyle = {
  borderRadius: "12px",
  boxShadow: "0px 4px 24px -4px rgba(16, 24, 40, 0.08)",
  border: "1px solid #E5E7EB",
  minHeight: "280px"
};

export const tabStyle = {
  textTransform: "none",
  fontWeight: 600,
  fontSize: "14px",
  color: "#667085",
  minHeight: "48px",
  "&.Mui-selected": {
    color: "#13715B"
  },
  "&:hover": {
    color: "#13715B",
    backgroundColor: "transparent"
  }
};

export const tabListStyle = {
  "& .MuiTabs-flexContainer": {
    gap: "8px"
  }
};

export const tabPanelStyle = {
  padding: "24px 0"
};