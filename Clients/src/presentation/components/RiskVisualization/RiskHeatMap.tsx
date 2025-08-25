import React from "react";
import { Stack, Typography, Box, Chip } from "@mui/material";
import { ProjectRisk } from "../../../domain/types/ProjectRisk";

interface RiskHeatMapProps {
  risks: ProjectRisk[];
}

const RiskHeatMap: React.FC<RiskHeatMapProps> = ({ risks }) => {
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

  const getRiskLevelColor = (level: number): string => {
    switch (level) {
      case 5: return "#C63622";
      case 4: return "#D68B61";
      case 3: return "#D6B971";
      case 2: return "#52AB43";
      case 1: return "#B8D39C";
      default: return "#E5E7EB";
    }
  };

  const getRiskLevelLabel = (level: number): string => {
    switch (level) {
      case 5: return "Very High";
      case 4: return "High";
      case 3: return "Medium";
      case 2: return "Low";
      case 1: return "Very Low";
      default: return "Unknown";
    }
  };

  const riskLevelCounts = risks.reduce((acc, risk) => {
    const level = getRiskLevelFromString(risk.current_risk_level?.toString() || "0");
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const maxCount = Math.max(...Object.values(riskLevelCounts), 1);

  return (
    <Stack spacing={3}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: "#1A1919" }}>
        Risk Distribution Heat Map
      </Typography>
      
      <Stack spacing={2}>
        {[5, 4, 3, 2, 1].map((level) => {
          const count = riskLevelCounts[level] || 0;
          const intensity = count / maxCount;
          const backgroundColor = getRiskLevelColor(level);
          
          return (
            <Stack key={level} direction="row" alignItems="center" spacing={2}>
              <Box sx={{ minWidth: 80 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                  {getRiskLevelLabel(level)}
                </Typography>
              </Box>
              
              <Box
                sx={{
                  flex: 1,
                  height: 32,
                  borderRadius: 1,
                  backgroundColor: "#F9FAFB",
                  position: "relative",
                  border: "1px solid #E5E7EB",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    width: `${intensity * 100}%`,
                    backgroundColor,
                    borderRadius: 1,
                    opacity: 0.8,
                    transition: "width 0.3s ease",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    right: 8,
                    transform: "translateY(-50%)",
                  }}
                >
                  <Chip
                    label={count}
                    size="small"
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      color: "#374151",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>
            </Stack>
          );
        })}
      </Stack>
      
      <Box sx={{ mt: 2, p: 2, backgroundColor: "#F9FAFB", borderRadius: 1 }}>
        <Typography sx={{ fontSize: 12, color: "#6B7280", textAlign: "center" }}>
          Total Risks: {risks.length} | Highest Risk Level: {getRiskLevelLabel(Math.max(...Object.keys(riskLevelCounts).map(Number), 0))}
        </Typography>
      </Box>
    </Stack>
  );
};

export default RiskHeatMap;