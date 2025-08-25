import React, { useState, useEffect } from "react";
import { Stack, Box, Typography } from "@mui/material";
import { ProjectRisk } from "../../../domain/types/ProjectRisk";
import RiskHeatMap from "./RiskHeatMap";
import RiskTimeline from "./RiskTimeline";
import RiskCategories from "./RiskCategories";
import RiskFiltersComponent, { RiskFilters } from "./RiskFilters";
import TabBar from "../../vw-v2-components/TabBar/TabBar";

interface RiskVisualizationTabsProps {
  risks: ProjectRisk[];
}

const RiskVisualizationTabs: React.FC<RiskVisualizationTabsProps> = ({ risks }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [filteredRisks, setFilteredRisks] = useState<ProjectRisk[]>(risks);
  const [filters, setFilters] = useState<RiskFilters>({
    riskLevel: "",
    owner: "",
    status: ""
  });

  const tabs = [
    { id: 0, label: "Heat Map", content: "heat-map" },
    { id: 1, label: "Timeline", content: "timeline" }, 
    { id: 2, label: "Categories", content: "categories" }
  ];

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

  const uniqueOwners = Array.from(new Set(
    risks.map(risk => risk.risk_owner).filter(Boolean)
  ));

  const uniqueStatuses = Array.from(new Set(
    risks.map(risk => risk.mitigation_status).filter(Boolean)
  ));

  const applyFilters = (currentFilters: RiskFilters) => {
    let filtered = [...risks];

    if (currentFilters.riskLevel) {
      const targetLevel = parseInt(currentFilters.riskLevel);
      filtered = filtered.filter(risk => {
        const riskLevel = getRiskLevelFromString(risk.current_risk_level?.toString() || "0");
        return riskLevel === targetLevel;
      });
    }

    if (currentFilters.owner) {
      filtered = filtered.filter(risk => risk.risk_owner === currentFilters.owner);
    }

    if (currentFilters.status) {
      filtered = filtered.filter(risk => risk.mitigation_status === currentFilters.status);
    }

    setFilteredRisks(filtered);
  };

  useEffect(() => {
    applyFilters(filters);
  }, [risks, filters]);

  const handleFiltersChange = (newFilters: RiskFilters) => {
    setFilters(newFilters);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <RiskHeatMap risks={filteredRisks} />;
      case 1:
        return <RiskTimeline risks={filteredRisks} />;
      case 2:
        return <RiskCategories risks={filteredRisks} />;
      default:
        return <RiskHeatMap risks={filteredRisks} />;
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ 
        backgroundColor: "#FCFCFD", 
        borderRadius: 2, 
        border: "1px solid #E5E7EB",
        overflow: "hidden"
      }}>
        <Box sx={{ 
          backgroundColor: "#F9FAFB", 
          px: 3, 
          py: 2,
          borderBottom: "1px solid #E5E7EB"
        }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#1A1919" }}>
            Risk Intelligence Dashboard
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#6B7280", mt: 0.5 }}>
            Advanced analytics and insights for project risk management
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          <RiskFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            owners={uniqueOwners}
            statuses={uniqueStatuses}
          />
        </Box>

        <Box sx={{ px: 3 }}>
          <TabBar
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </Box>

        <Box sx={{ p: 3 }}>
          {renderTabContent()}
        </Box>
      </Box>
    </Stack>
  );
};

export default RiskVisualizationTabs;