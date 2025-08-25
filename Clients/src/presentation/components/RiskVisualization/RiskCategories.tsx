import React, { useState } from "react";
import { Stack, Typography, Box, Card, CardContent, Chip, Button, Collapse } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { ProjectRisk } from "../../../domain/types/ProjectRisk";

interface RiskCategoriesProps {
  risks: ProjectRisk[];
}

const RiskCategories: React.FC<RiskCategoriesProps> = ({ risks }) => {
  const [viewMode, setViewMode] = useState<"categories" | "lifecycle">("categories");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

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

  const toggleCard = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  const riskCategories = {
    "Data Quality": risks.filter(r => r.risk_name?.toLowerCase().includes("data") || r.risk_name?.toLowerCase().includes("quality")),
    "Model Performance": risks.filter(r => r.risk_name?.toLowerCase().includes("model") || r.risk_name?.toLowerCase().includes("performance")),
    "Bias & Fairness": risks.filter(r => r.risk_name?.toLowerCase().includes("bias") || r.risk_name?.toLowerCase().includes("fairness")),
    "Privacy & Security": risks.filter(r => r.risk_name?.toLowerCase().includes("privacy") || r.risk_name?.toLowerCase().includes("security")),
    "Compliance": risks.filter(r => r.risk_name?.toLowerCase().includes("compliance") || r.risk_name?.toLowerCase().includes("regulatory")),
    "Other": risks.filter(r => {
      const name = r.risk_name?.toLowerCase() || "";
      return !name.includes("data") && !name.includes("quality") && !name.includes("model") && 
             !name.includes("performance") && !name.includes("bias") && !name.includes("fairness") &&
             !name.includes("privacy") && !name.includes("security") && !name.includes("compliance") && 
             !name.includes("regulatory");
    })
  };

  const aiLifecyclePhases = {
    "Data Collection": risks.filter(r => r.risk_name?.toLowerCase().includes("collection") || r.risk_name?.toLowerCase().includes("gathering")),
    "Model Development": risks.filter(r => r.risk_name?.toLowerCase().includes("development") || r.risk_name?.toLowerCase().includes("training")),
    "Model Validation": risks.filter(r => r.risk_name?.toLowerCase().includes("validation") || r.risk_name?.toLowerCase().includes("testing")),
    "Deployment": risks.filter(r => r.risk_name?.toLowerCase().includes("deployment") || r.risk_name?.toLowerCase().includes("production")),
    "Monitoring": risks.filter(r => r.risk_name?.toLowerCase().includes("monitoring") || r.risk_name?.toLowerCase().includes("maintenance")),
    "General": risks.filter(r => {
      const name = r.risk_name?.toLowerCase() || "";
      return !name.includes("collection") && !name.includes("gathering") && !name.includes("development") && 
             !name.includes("training") && !name.includes("validation") && !name.includes("testing") &&
             !name.includes("deployment") && !name.includes("production") && !name.includes("monitoring") && 
             !name.includes("maintenance");
    })
  };

  const currentGrouping = viewMode === "categories" ? riskCategories : aiLifecyclePhases;

  const renderRiskCard = (title: string, categoryRisks: ProjectRisk[]) => {
    const cardId = title.replace(/\s+/g, "-").toLowerCase();
    const isExpanded = expandedCards.has(cardId);
    
    const riskLevelCounts = categoryRisks.reduce((acc, risk) => {
      const level = getRiskLevelFromString(risk.current_risk_level?.toString() || "0");
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return (
      <Card 
        key={title} 
        sx={{ 
          border: "1px solid #E5E7EB",
          borderRadius: 2,
          "&:hover": { 
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)" 
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box 
            sx={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              cursor: categoryRisks.length > 0 ? "pointer" : "default"
            }}
            onClick={() => categoryRisks.length > 0 && toggleCard(cardId)}
          >
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#1F2937" }}>
                {title}
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#6B7280", mt: 0.5 }}>
                {categoryRisks.length} risk{categoryRisks.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Stack direction="row" spacing={1}>
                {[5, 4, 3, 2, 1].map(level => {
                  const count = riskLevelCounts[level] || 0;
                  if (count === 0) return null;
                  
                  return (
                    <Chip
                      key={level}
                      label={`${getRiskLevelLabel(level)}: ${count}`}
                      size="small"
                      sx={{
                        backgroundColor: getRiskLevelColor(level),
                        color: "white",
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    />
                  );
                })}
              </Stack>
              
              {categoryRisks.length > 0 && (
                <>
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </Box>
          </Box>
          
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #E5E7EB" }}>
              <Stack spacing={1}>
                {categoryRisks.map((risk, index) => {
                  const riskLevel = getRiskLevelFromString(risk.current_risk_level?.toString() || "0");
                  const riskColor = getRiskLevelColor(riskLevel);
                  
                  return (
                    <Box
                      key={`${risk.id}-${index}`}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1.5,
                        backgroundColor: "#F9FAFB",
                        borderRadius: 1,
                        borderLeft: `3px solid ${riskColor}`,
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#1F2937" }}>
                          {risk.risk_name || "Unnamed Risk"}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                          Owner: {risk.risk_owner || "Unassigned"}
                        </Typography>
                      </Box>
                      
                      <Chip
                        label={getRiskLevelLabel(riskLevel)}
                        size="small"
                        sx={{
                          backgroundColor: riskColor,
                          color: "white",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#1A1919" }}>
          Risk Categories Analysis
        </Typography>
        
        <Stack direction="row" spacing={1}>
          <Button
            variant={viewMode === "categories" ? "contained" : "outlined"}
            onClick={() => setViewMode("categories")}
            size="small"
            sx={{
              backgroundColor: viewMode === "categories" ? "#13715B" : "transparent",
              borderColor: "#13715B",
              color: viewMode === "categories" ? "white" : "#13715B",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Risk Categories
          </Button>
          <Button
            variant={viewMode === "lifecycle" ? "contained" : "outlined"}
            onClick={() => setViewMode("lifecycle")}
            size="small"
            sx={{
              backgroundColor: viewMode === "lifecycle" ? "#13715B" : "transparent",
              borderColor: "#13715B",
              color: viewMode === "lifecycle" ? "white" : "#13715B",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            AI Lifecycle Phases
          </Button>
        </Stack>
      </Box>
      
      <Stack spacing={2}>
        {Object.entries(currentGrouping)
          .filter(([_, categoryRisks]) => categoryRisks.length > 0)
          .sort(([, a], [, b]) => b.length - a.length)
          .map(([title, categoryRisks]) => renderRiskCard(title, categoryRisks))
        }
      </Stack>
      
      {Object.values(currentGrouping).every(arr => arr.length === 0) && (
        <Box sx={{ textAlign: "center", py: 4, color: "#6B7280" }}>
          <Typography>No risks available for category analysis</Typography>
        </Box>
      )}
    </Stack>
  );
};

export default RiskCategories;