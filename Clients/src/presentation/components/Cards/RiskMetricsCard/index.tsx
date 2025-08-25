import { Typography, Box, Grid } from "@mui/material";
import SpeedIcon from "@mui/icons-material/Speed";
import { RiskMetrics } from "../../../../domain/interfaces/iRiskSummary";

interface RiskMetricsCardProps {
  metrics: RiskMetrics;
  velocity?: {
    newRisksThisWeek: number;
    resolvedRisksThisWeek: number;
    overdueRisks: number;
  };
}

const RiskMetricsCard = ({ metrics, velocity }: RiskMetricsCardProps) => {
  const getVelocityColor = (velocity: number): string => {
    if (velocity > 0) return "#EF4444"; // Red - increasing risks
    if (velocity < 0) return "#10B981"; // Green - decreasing risks
    return "#6B7280"; // Gray - stable
  };

  const getVelocityDirection = (velocity: number): string => {
    if (velocity > 0) return "↗";
    if (velocity < 0) return "↘";
    return "→";
  };

  const metricBoxStyle = {
    p: 2,
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 2,
    textAlign: "center",
    height: "100%",
    minHeight: "140px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  };

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography 
        variant="h6" 
        sx={{ 
          fontSize: 16, 
          fontWeight: 600, 
          marginBottom: 2,
          color: "#111827",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <SpeedIcon sx={{ fontSize: 18, color: "#13715B" }} />
        Risk Intelligence
      </Typography>

      <Grid container spacing={2} sx={{ flex: 1, width: "100%", height: "100%" }}>
        {/* Risk Velocity */}
        <Grid item xs={3} sm={3} sx={{ height: "100%" }}>
          <Box sx={metricBoxStyle}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: "#6B7280", 
                fontWeight: 500,
                mb: 1,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Risk Velocity
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700, 
                color: getVelocityColor(metrics.riskVelocity),
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5
              }}
            >
              {getVelocityDirection(metrics.riskVelocity)} {Math.abs(metrics.riskVelocity)}/week
            </Typography>
          </Box>
        </Grid>

        {/* Mitigation Progress */}
        <Grid item xs={3} sm={3} sx={{ height: "100%" }}>
          <Box sx={metricBoxStyle}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: "#6B7280", 
                fontWeight: 500,
                mb: 1,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Mitigation Progress
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700, 
                color: "#111827",
                fontSize: 18 
              }}
            >
              {metrics.mitigationProgress}%
            </Typography>
          </Box>
        </Grid>

        {/* New This Week */}
        {velocity && (
          <Grid item xs={3} sm={3} sx={{ height: "100%" }}>
            <Box sx={metricBoxStyle}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: "#6B7280", 
                  fontWeight: 500,
                  mb: 1,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                New This Week
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  color: "#111827",
                  fontSize: 18 
                }}
              >
                {velocity.newRisksThisWeek}
              </Typography>
            </Box>
          </Grid>
        )}

        {/* Resolved This Week */}
        {velocity && (
          <Grid item xs={3} sm={3} sx={{ height: "100%" }}>
            <Box sx={metricBoxStyle}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: "#6B7280", 
                  fontWeight: 500,
                  mb: 1,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                Resolved This Week
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  color: "#111827",
                  fontSize: 18 
                }}
              >
                {velocity.resolvedRisksThisWeek}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default RiskMetricsCard;