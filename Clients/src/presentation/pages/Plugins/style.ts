import { SxProps, Theme } from "@mui/material";

// Category sidebar styles - matching main app sidebar design
export const categorySidebar: SxProps<Theme> = {
  width: 200,
  minWidth: 200,
  flexShrink: 0,
};

export const categoryMenuItem = (isSelected: boolean): SxProps<Theme> => ({
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  height: "32px",
  padding: "0 12px",
  borderRadius: "4px",
  cursor: "pointer",
  background: isSelected
    ? "linear-gradient(135deg, #F7F7F7 0%, #F2F2F2 100%)"
    : "transparent",
  border: isSelected ? "1px solid #E8E8E8" : "1px solid transparent",
  "&:hover": {
    background: isSelected
      ? "linear-gradient(135deg, #F7F7F7 0%, #F2F2F2 100%)"
      : "#FAFAFA",
    border: isSelected ? "1px solid #E8E8E8" : "1px solid transparent",
    "& svg": {
      color: "#13715B !important",
      stroke: "#13715B !important",
    },
    "& svg path": {
      stroke: "#13715B !important",
    },
  },
  transition: "all 0.2s ease",
});

export const categoryMenuText = (isSelected: boolean): SxProps<Theme> => ({
  fontSize: "13px",
  fontWeight: isSelected ? 600 : 400,
  color: isSelected ? "#101828" : "#667085",
});

export const categoryHeader: SxProps<Theme> = {
  padding: "16px 20px",
  backgroundColor: "#f9fafb",
  border: "1px solid #d0d5dd",
  borderRadius: "4px",
};

export const categoryHeaderTitle: SxProps<Theme> = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#101828",
};

export const categoryHeaderDescription: SxProps<Theme> = {
  fontSize: "13px",
  color: "#667085",
  lineHeight: 1.5,
};

export const pluginCardsGrid: SxProps<Theme> = {
  display: "flex",
  flexWrap: "wrap",
  gap: "16px",
};

export const pluginCardWrapper: SxProps<Theme> = {
  width: {
    xs: "100%",
    md: "calc(50% - 8px)",
  },
};

export const pluginCardWrapperThreeColumn: SxProps<Theme> = {
  width: {
    xs: "100%",
    md: "calc(50% - 8px)",
    lg: "calc(33.333% - 11px)",
  },
};

export const emptyStateContainer: SxProps<Theme> = {
  textAlign: "center",
  py: 4,
};

export const emptyStateText: SxProps<Theme> = {
  color: "#667085",
  fontSize: "14px",
};

export const tabPanelStyle: SxProps<Theme> = {
  p: 0,
  pt: 2,
};
