import { useTheme } from "@mui/material";

export const sectionTitleSx = { fontWeight: 600, fontSize: 16 };

export function useCardSx() {
  const theme = useTheme();
  return {
    background: theme.palette.background.paper,
    border: `1.5px solid ${theme.palette.border.light}`,
    borderRadius: theme.shape.borderRadius,
    p: theme.spacing(5, 6),
    boxShadow: "none",
  };
}
