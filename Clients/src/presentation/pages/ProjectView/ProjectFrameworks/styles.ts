import { SxProps, Theme } from "@mui/material";

export const containerStyle: SxProps<Theme> = {
  width: "100%",
  mt: 2,
};

export const headerContainerStyle: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  mb: 2,
};

export const frameworkTabsContainerStyle: SxProps<Theme> = {
  display: "flex",
  border: (theme) => `1px solid ${theme.palette.divider}`,
  borderRadius: "4px",
  overflow: "hidden",
  height: 43,
  bgcolor: "background.paper",
};

export const getFrameworkTabStyle = (
  isActive: boolean,
  isLast: boolean
): SxProps<Theme> => ({
  cursor: "pointer",
  px: 5,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  bgcolor: isActive ? "background.paper" : "action.hover",
  color: "text.primary",
  fontFamily: (theme) => theme.typography.fontFamily,
  fontSize: "13px",
  borderRight: (theme) =>
    isLast ? "none" : `1px solid ${theme.palette.divider}`,
  fontWeight: (theme) => theme.typography.body2.fontWeight,
  transition: "background 0.2s",
  userSelect: "none",
  width: "142px",
});

export const addButtonStyle: SxProps<Theme> = {
  borderRadius: 2,
  textTransform: "none",
  fontWeight: 400,
  backgroundColor: "#13715B",
  border: "1px solid #13715B",
  color: "#fff",
  fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
  fontSize: 13,
  "&:hover": {
    backgroundColor: "#10614d",
  },
};

export const tabListStyle: SxProps<Theme> = {
  minHeight: "20px",
  "& .MuiTabs-flexContainer": {
    columnGap: "34px",
  },
};

export const modalContainerStyle: SxProps<Theme> = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "#fff",
  borderRadius: 3,
  boxShadow: 6,
  maxWidth: 480,
  width: "100%",
  mx: 2,
  maxHeight: "90vh",
  overflow: "auto",
  animation: "scaleIn 0.2s",
  padding: "20px",
};

export const modalHeaderStyle: SxProps<Theme> = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #E5E7EB",
  p: 2,
};

export const modalCloseButtonStyle: SxProps<Theme> = {
  color: "#6B7280",
  "&:hover": { color: "#232B3A", background: "#e3f5e6" },
  p: 1,
};

export const modalDescriptionStyle: SxProps<Theme> = {
  color: "#6B7280",
  mb: 3,
  fontSize: 14,
  textAlign: "left",
};

export const frameworkCardStyle: SxProps<Theme> = {
  border: "1.5px solid #13715B",
  borderRadius: 2,
  background: "#e3f5e6",
  p: 2.5,
  transition: "background 0.2s",
};

export const frameworkCardTitleStyle: SxProps<Theme> = {
  fontWeight: 500,
  color: "#232B3A",
  fontSize: 16,
};

export const frameworkCardAddedStyle: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  color: "#13715B",
  gap: 1,
  fontSize: 14,
};

export const frameworkCardDescriptionStyle: SxProps<Theme> = {
  color: "#6B7280",
  fontSize: 14,
  textAlign: "left",
};

export const modalDoneButtonStyle: SxProps<Theme> = {
  px: 4,
  py: 1,
  fontWeight: 500,
  borderRadius: 2,
  boxShadow: "none",
  fontSize: 15,
  backgroundColor: "#13715B",
  color: "#fff",
  border: "1px solid #13715B",
  fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
  "&:hover": {
    backgroundColor: "#10614d",
  },
};
