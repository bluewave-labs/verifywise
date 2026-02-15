import { Theme } from "@mui/material";

export const GroupStatsCardFrame = (theme: Theme) => ({
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    minWidth: "300px",
    maxWidth: "100%",
    gap: "40px",
    backgroundColor: theme.palette.background.main,
    padding: "10px 25px",
    border: `1px solid ${theme.palette.border.dark}`,
    borderRadius: "4px",
    boxShadow: "none",
  });

  export const GroupStatsCardRate = (theme: Theme) => ({
    color: theme.palette.text.primary,
    fontSize: 26,
  });
  