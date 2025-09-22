export const projectRisksCard = {
  minWidth: "fit-content",
  width: { xs: "100%", sm: "fit-content" },
  height: "100%",
  display: "flex",
  flexDirection: { xs: "column", sm: "row" },
  gap: "24px",
  overflow: "auto",
};

export const projectRisksTileCard = {
  paddingY: { xs: "10px", sm: "15px" },
  paddingX: { xs: "15px", sm: "30px" },
  textAlign: "center",
  fontWeight: 600,
  gap: 5,
  position: "relative",
  cursor: "default",
  minWidth: { xs: "120px", sm: "140px" },
  width: { xs: "120px", sm: "140px" },
  backgroundColor: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 2,
};

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

export const trendIconUp = {
  color: "#EF4444", // Red for increasing risks
  fontSize: 14,
};

export const trendIconDown = {
  color: "#10B981", // Green for decreasing risks
  fontSize: 14,
};

export const trendIconStable = {
  color: "#6B7280", // Gray for stable risks
  fontSize: 14,
};

export const riskMetricsContainer = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: "16px 24px",
  backgroundColor: "#F9FAFB",
  border: `1px solid #E5E7EB`,
  borderRadius: 2,
  minWidth: "200px",
};

export const riskMetricItem = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 14,
};

export const riskMetricLabel = {
  color: "#6B7280",
  fontWeight: 500,
};

export const riskMetricValue = {
  fontWeight: 600,
  color: "#111827",
};
