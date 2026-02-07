import singleTheme from "../../themes/v1SingleTheme";

// A. Main Layout
export const riskMainStackStyle = {
  gap: 10,
};

export const riskFilterRowStyle = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
};

// B. Toolbar Buttons
export const analyticsIconButtonStyle = {
  ...singleTheme.iconButtonsRectangle,
  "&:hover": {
    backgroundColor: "#f9fafb",
  },
};

export const addNewRiskButtonStyle = {
  backgroundColor: singleTheme.buttons.primary.contained.backgroundColor,
  border: `1px solid ${singleTheme.buttons.primary.contained.backgroundColor}`,
  gap: 2,
};

// C. Popover (Insert Risk Mega Dropdown)
export const riskPopoverStyle = {
  mt: 1,
  "& .MuiPopover-paper": {
    borderRadius: singleTheme.borderRadius,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
    overflow: "visible",
    backgroundColor: "#fff",
  },
};

export const riskPopoverContentStyle = {
  p: 2,
  width: "420px",
};

// D. Menu Item (Add New Risk Manually)
export const riskMenuItemStyle = {
  display: "flex",
  alignItems: "center",
  padding: "12px 16px",
  borderRadius: singleTheme.borderRadius,
  cursor: "pointer",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  backgroundColor: "#fff",
  transition: "all 0.2s ease",
  mb: 2,
  "&:hover": {
    backgroundColor: "#f9fafb",
    border: "1px solid rgba(0, 0, 0, 0.12)",
  },
};

export const riskMenuItemTitleStyle = {
  fontWeight: 600,
  fontSize: singleTheme.fontSizes.medium,
  color: "rgba(0, 0, 0, 0.85)",
};

export const riskMenuItemSubtitleStyle = {
  fontSize: singleTheme.fontSizes.small,
  color: "rgba(0, 0, 0, 0.6)",
};

// E. Divider ("Or Import From")
export const riskDividerContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  mb: 2,
};

export const riskDividerLineStyle = {
  flex: 1,
  height: "1px",
  backgroundColor: "rgba(0, 0, 0, 0.08)",
};

export const riskDividerTextStyle = {
  fontSize: singleTheme.fontSizes.small,
  color: "rgba(0, 0, 0, 0.45)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

// F. AI Risk Cards Grid
export const riskCardsGridStyle = (hasPlugin: boolean) => ({
  display: "grid",
  gridTemplateColumns: hasPlugin ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
  gap: 2,
});
