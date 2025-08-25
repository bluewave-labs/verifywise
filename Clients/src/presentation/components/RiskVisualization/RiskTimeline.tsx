import React from "react";
import { Stack, Typography, Box, Chip } from "@mui/material";
import { ProjectRisk } from "../../../domain/types/ProjectRisk";

interface RiskTimelineProps {
  risks: ProjectRisk[];
}

const RiskTimeline: React.FC<RiskTimelineProps> = ({ risks }) => {
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

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return "Unknown";
    }
  };

  const sortedRisks = [...risks].sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return dateB.getTime() - dateA.getTime();
  });

  const groupedByMonth = sortedRisks.reduce((acc, risk) => {
    const date = new Date(risk.created_at || 0);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        label: monthLabel,
        risks: []
      };
    }
    
    acc[monthKey].risks.push(risk);
    return acc;
  }, {} as Record<string, { label: string; risks: ProjectRisk[] }>);

  if (risks.length === 0) {
    return (
      <Stack spacing={3}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#1A1919" }}>
          Risk Timeline Analysis
        </Typography>
        <Box sx={{ textAlign: "center", py: 4, color: "#6B7280" }}>
          <Typography>No risks available for timeline analysis</Typography>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: "#1A1919" }}>
        Risk Timeline Analysis
      </Typography>
      
      <Stack spacing={3}>
        {Object.entries(groupedByMonth)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([monthKey, { label, risks: monthRisks }]) => (
          <Box key={monthKey}>
            <Typography 
              sx={{ 
                fontSize: 16, 
                fontWeight: 600, 
                color: "#374151",
                mb: 2,
                borderBottom: "2px solid #E5E7EB",
                pb: 1
              }}
            >
              {label} ({monthRisks.length} risk{monthRisks.length !== 1 ? 's' : ''})
            </Typography>
            
            <Stack spacing={2} sx={{ pl: 2 }}>
              {monthRisks.map((risk, index) => {
                const riskLevel = getRiskLevelFromString(risk.current_risk_level?.toString() || "0");
                const riskColor = getRiskLevelColor(riskLevel);
                
                return (
                  <Box
                    key={`${risk.id}-${index}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2,
                      backgroundColor: "#FCFCFD",
                      borderRadius: 1,
                      borderLeft: `4px solid ${riskColor}`,
                      "&:hover": {
                        backgroundColor: "#F9FAFB",
                      },
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 500, fontSize: 14, color: "#1F2937" }}>
                        {risk.risk_name || "Unnamed Risk"}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "#6B7280", mt: 0.5 }}>
                        Owner: {risk.risk_owner || "Unassigned"} • 
                        Created: {formatDate(risk.created_at || "")}
                      </Typography>
                    </Box>
                    
                    <Chip
                      label={getRiskLevelLabel(riskLevel)}
                      size="small"
                      sx={{
                        backgroundColor: riskColor,
                        color: "white",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
};

export default RiskTimeline;