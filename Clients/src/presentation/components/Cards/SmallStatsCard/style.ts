import { Theme } from "@mui/material";

export const smallStatsCardStyle = (theme: Theme) => ({
  border: `1px solid ${theme.palette.border.light}`,
  borderRadius: "4px",
  padding: "10px",
  pt: "15px",
  minWidth: 300,
  width: "100%",
  gap: 5,
});

export const smallStatsCardHeader = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
};
