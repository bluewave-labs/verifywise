import { SxProps, Theme } from "@mui/material";

// Category sidebar styles
export const categorySidebar: SxProps<Theme> = {
  width: 220,
  minWidth: 220,
  flexShrink: 0,
};

export const categoryMenuItem = (isSelected: boolean): SxProps<Theme> => ({
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  padding: "10px 12px",
  borderRadius: "4px",
  cursor: "pointer",
  backgroundColor: isSelected ? "rgba(19, 113, 91, 0.08)" : "transparent",
  border: isSelected ? "1px solid #13715B" : "1px solid transparent",
  "&:hover": {
    backgroundColor: isSelected ? "rgba(19, 113, 91, 0.12)" : "rgba(0, 0, 0, 0.04)",
  },
  transition: "all 0.15s ease",
});

export const categoryMenuText = (isSelected: boolean): SxProps<Theme> => ({
  fontSize: "13px",
  fontWeight: isSelected ? 500 : 400,
  color: isSelected ? "#13715B" : "#344054",
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

// Region collapsible section styles
export const regionHeader = (theme: Theme): SxProps<Theme> => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
  py: theme.spacing(3),
  px: theme.spacing(2),
  mx: theme.spacing(-2),
  borderBottom: `1px solid ${theme.palette.border?.light || "#eaecf0"}`,
  cursor: "pointer",
  borderRadius: theme.shape.borderRadius,
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: theme.palette.action?.hover || "rgba(19, 113, 91, 0.04)",
  },
  "&:hover svg": {
    color: theme.palette.primary.main,
  },
});

export const regionChevron = (theme: Theme, isExpanded: boolean): SxProps<Theme> => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "transform 0.2s ease",
  transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
  color: theme.palette.text.secondary,
});

export const regionFlagStyle: SxProps<Theme> = {
  fontSize: "22px",
  lineHeight: 1,
};

export const regionNameStyle = (theme: Theme): SxProps<Theme> => ({
  fontSize: "15px",
  fontWeight: 600,
  color: theme.palette.text.primary,
});

export const regionCountStyle = (theme: Theme): SxProps<Theme> => ({
  fontSize: "13px",
  color: theme.palette.text.tertiary || "#98A2B3",
  fontWeight: 500,
});

export const regionContent = (theme: Theme): SxProps<Theme> => ({
  ...pluginCardsGrid,
  mt: theme.spacing(4),
  mb: theme.spacing(2),
});
