import { Theme } from "@mui/material";

export const infoCardStyle = (theme: Theme) => ({
  border: `1px solid ${theme.palette.border.dark}`,
  borderRadius: 2,
  background: `linear-gradient(135deg, ${theme.palette.background.main} 0%, ${theme.palette.background.subtle} 100%)`,
  minWidth: 228,
  width: "100%",
  padding: "8px 36px 14px 14px",
  position: "relative",
});

export const infoCardTitleStyle = (theme: Theme) => ({
  fontSize: 13,
  color: theme.palette.text.accent,
  pb: "2px",
  textWrap: "wrap",
});

export const descCardbodyStyle = (theme: Theme) => ({
  fontSize: 13,
  color: theme.palette.text.primary,
  textAlign: "justify",
});
