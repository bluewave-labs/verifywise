import { Theme } from "@mui/material";

export const projectRisksCard = {
  minWidth: "fit-content",
  width: { xs: "100%", sm: "fit-content" },
  height: "100%",
  display: "flex",
  flexDirection: { xs: "column", sm: "row" },
  gap: "16px",
  overflow: "auto",
};

export const projectRisksTileCard = (theme: Theme) => ({
  paddingY: { xs: "10px", sm: "15px" },
  paddingX: { xs: "15px", sm: "30px" },
  textAlign: "center" as const,
  fontWeight: 600,
  gap: 5,
  position: "relative" as const,
  minWidth: { xs: "120px", sm: "140px" },
  width: { xs: "120px", sm: "140px" },
  background: `linear-gradient(135deg, ${theme.palette.background.main} 0%, ${theme.palette.background.subtle} 100%)`,
  border: `1px solid ${theme.palette.border.input}`,
  borderRadius: 2,
  transition: "all 0.2s ease",
});

export const projectRisksTileCardKey = {
  fontSize: 13,
};

export const projectRisksTileCardvalue = {
  fontSize: 28,
  fontWeight: 800,
};

// Enhanced styles for trends and metrics
export const trendIndicator = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 600,
  gap: 0.5,
  marginTop: 1,
};

export const trendIconUp = (theme: Theme) => ({
  color: theme.palette.status?.error?.text || theme.palette.error.main,
  fontSize: 14,
});

export const trendIconDown = (theme: Theme) => ({
  color: theme.palette.status?.success?.main || theme.palette.success.main,
  fontSize: 14,
});

export const trendIconStable = (theme: Theme) => ({
  color: theme.palette.text.muted,
  fontSize: 14,
});

export const riskMetricsContainer = (theme: Theme) => ({
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: "16px 24px",
  backgroundColor: theme.palette.background.accent,
  border: `1px solid ${theme.palette.border.input}`,
  borderRadius: 2,
  minWidth: "200px",
});

export const riskMetricItem = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 14,
};

export const riskMetricLabel = (theme: Theme) => ({
  color: theme.palette.text.muted,
  fontWeight: 500,
});

export const riskMetricValue = (theme: Theme) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
});
