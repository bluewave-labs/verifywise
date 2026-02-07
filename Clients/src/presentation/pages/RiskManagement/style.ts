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
