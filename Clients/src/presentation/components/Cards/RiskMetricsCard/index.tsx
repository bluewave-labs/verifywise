import React from "react";
import { Stack, Typography, Box, Grid, Card, CardContent } from "@mui/material";
import { TrendingUp, Assessment, Speed, Timeline } from "@mui/icons-material";
import { ProjectRisk } from "../../../../domain/types/ProjectRisk";

interface RiskMetricsCardProps {
  risks: ProjectRisk[];
}

const RiskMetricsCard: React.FC<RiskMetricsCardProps> = ({ risks }) => {
  const getRiskLevelFromString = (level: string): number => {
    if (typeof level === "number") return level;
    const levelStr = level.toLowerCase();
    if (levelStr.includes("very high") || levelStr === "5") return 5;
    if (levelStr.includes("high") || levelStr === "4") return 4;
    if (levelStr.includes("medium") || levelStr === "3") return 3;
    if (levelStr.includes("low") || levelStr === "2") return 2;
    if (levelStr.includes("very low") || levelStr === "1") return 1;
    return parseInt(level) || 0;
  };

  const calculateMetrics = () => {
    const totalRisks = risks.length;
    const riskLevels = risks.map(r => getRiskLevelFromString(r.current_risk_level?.toString() || "0"));
    const avgRiskLevel = riskLevels.length > 0 ? riskLevels.reduce((a, b) => a + b, 0) / riskLevels.length : 0;
    
    const highRisks = riskLevels.filter(level => level >= 4).length;
    const mitigatedRisks = risks.filter(r => 
      r.mitigation_status?.toLowerCase().includes("completed") || 
      r.mitigation_status?.toLowerCase().includes("resolved")
    ).length;
    
    const recentRisks = risks.filter(r => {
      if (!r.date_of_assessment) return false;
      const riskDate = new Date(r.date_of_assessment);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return riskDate >= thirtyDaysAgo;
    }).length;

    return {
      totalRisks,
      avgRiskLevel: avgRiskLevel.toFixed(1),
      highRiskCount: highRisks,
      mitigationRate: totalRisks > 0 ? ((mitigatedRisks / totalRisks) * 100).toFixed(1) : "0",
      riskVelocity: recentRisks
    };
  };

  const metrics = calculateMetrics();

  const metricCards = [
    {
      title: "Risk Velocity",
      value: metrics.riskVelocity,
      subtitle: "New risks (30 days)",
      icon: <Speed sx={{ color: "#13715B" }} />,
      color: "#13715B"
    },
    {
      title: "Average Risk Level",
      value: metrics.avgRiskLevel,
      subtitle: "Across all risks",
      icon: <Assessment sx={{ color: "#D68B61" }} />,
      color: "#D68B61"
    },
    {
      title: "High Priority Risks",
      value: metrics.highRiskCount,
      subtitle: "High & Very High",
      icon: <TrendingUp sx={{ color: "#C63622" }} />,
      color: "#C63622"
    },
    {
      title: "Mitigation Progress",
      value: `${metrics.mitigationRate}%`,
      subtitle: "Completed/Resolved",
      icon: <Timeline sx={{ color: "#52AB43" }} />,
      color: "#52AB43"
    }
  ];

  return (
    <Box sx={{ 
      backgroundColor: "#FCFCFD", 
      borderRadius: 2, 
      border: "1px solid #E5E7EB",
      p: 3
    }}>
      <Stack spacing={3}>
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#1A1919" }}>
            Risk Intelligence Metrics
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#6B7280", mt: 0.5 }}>
            Key performance indicators for risk management effectiveness
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {metricCards.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ 
                height: "100%",
                border: "1px solid #E5E7EB",
                borderRadius: 2,
                "&:hover": { 
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)" 
                }
              }}>
                <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    {metric.icon}
                    <Typography sx={{ 
                      fontSize: 12, 
                      fontWeight: 600, 
                      color: "#6B7280",
                      ml: 1,
                      textTransform: "uppercase",
                      letterSpacing: 0.5
                    }}>
                      {metric.title}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <Typography sx={{ 
                      fontSize: 28, 
                      fontWeight: 800, 
                      color: metric.color,
                      lineHeight: 1
                    }}>
                      {metric.value}
                    </Typography>
                    <Typography sx={{ 
                      fontSize: 12, 
                      color: "#6B7280", 
                      mt: 1,
                      fontWeight: 500
                    }}>
                      {metric.subtitle}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ 
          p: 2, 
          backgroundColor: "#F9FAFB", 
          borderRadius: 1,
          border: "1px solid #E5E7EB"
        }}>
          <Typography sx={{ fontSize: 12, color: "#6B7280", textAlign: "center" }}>
            Risk intelligence powered by AI-driven analysis and predictive modeling
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

export default RiskMetricsCard;