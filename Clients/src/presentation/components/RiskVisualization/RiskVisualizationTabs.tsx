import React, { useState } from "react";
import { Box } from "@mui/material";
import { ProjectRisk } from "../../../domain/types/ProjectRisk";
import RiskHeatMap from "./RiskHeatMap";
import RiskCategories from "./RiskCategories";
import TabBar from "../../vw-v2-components/TabBar/TabBar";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}


interface RiskVisualizationTabsProps {
  risks: ProjectRisk[];
  selectedRisk?: ProjectRisk | null;
  onRiskSelect?: (risk: ProjectRisk) => void;
}

const RiskVisualizationTabs: React.FC<RiskVisualizationTabsProps> = ({
  risks,
  selectedRisk,
  onRiskSelect,
}) => {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Visualization components
  const HeatMapView = () => (
    <RiskHeatMap 
      risks={risks}
      selectedRisk={selectedRisk}
      onRiskSelect={onRiskSelect}
    />
  );


  const CategoryView = () => (
    <RiskCategories 
      risks={risks}
      selectedRisk={selectedRisk}
      onRiskSelect={onRiskSelect}
    />
  );

  const tabs = ["Heat Map", "Categories"];

  return (
    <Box sx={{ mt: 3 }}>
      <TabBar
        tabs={tabs}
        value={value}
        onChange={handleChange}
      />
      
      <Box 
        sx={{ 
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 2,
          borderTop: "none",
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        }}
      >
        <TabPanel value={value} index={0}>
          <HeatMapView />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <CategoryView />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default RiskVisualizationTabs;