import { useState, useEffect, useMemo } from 'react';
import { Box, Button, Tab, Typography, Stack, Alert } from '@mui/material';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import TabContext from '@mui/lab/TabContext';
import { tabStyle, tabPanelStyle } from '../V1.0ProjectView/style';
import VWSkeleton from '../../../vw-v2-components/Skeletons';
import ComplianceTracker from '../../../pages/ComplianceTracker/1.0ComplianceTracker';
import { Project } from '../../../../domain/types/Project';
import AssessmentTracker from '../../Assessment/1.0AssessmentTracker';
import useFrameworks from '../../../../application/hooks/useFrameworks';
import {
  containerStyle,
  headerContainerStyle,
  frameworkTabsContainerStyle,
  getFrameworkTabStyle,
  addButtonStyle,
  tabListStyle,
} from "./styles";
import ISO42001Annex from "../../ISO/Annex";
import ISO42001Clauses from "../../ISO/Clause";

const trackerTabs = [
  { label: "Compliance tracker", value: "compliance" },
  { label: "Assessment tracker", value: "assessment" },
];

const ComingSoonMessage = () => (
  <Stack 
    sx={{ 
      height: 400, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#F5F6F6',
      borderRadius: 2,
      p: 4
    }}
  >
    <Typography variant="h6" sx={{ color: '#13715B', mb: 2 }}>
      Coming Soon!
    </Typography>
    <Typography sx={{ color: '#232B3A', textAlign: 'center' }}>
      We're currently working on implementing this framework.
      <br />
      Please check back later for updates.
    </Typography>
  </Stack>
);

const ProjectFrameworks = ({ project }: { project: Project }) => {
  const { frameworks, loading, error, refreshFrameworks } = useFrameworks();
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<number | null>(null);
  const [tracker, setTracker] = useState('compliance');

  // Set initial framework when frameworks are loaded
  useEffect(() => {
    if (frameworks.length > 0 && !selectedFrameworkId) {
      setSelectedFrameworkId(frameworks[0].id);
    }
  }, [frameworks, selectedFrameworkId]);

  // Memoize the current framework to avoid unnecessary re-renders
  const currentFramework = useMemo(() => 
    frameworks.find(fw => fw.id === selectedFrameworkId),
    [frameworks, selectedFrameworkId]
  );

  const handleFrameworkChange = (frameworkId: number) => {
    setSelectedFrameworkId(frameworkId);
  };

  const renderFrameworkContent = () => {
    if (!project) {
      return <VWSkeleton variant="rectangular" width="100%" height={400} />;
    }

    if (!currentFramework) {
      return <ComingSoonMessage />;
    }

    const isEUAIAct = currentFramework.id === 1; // EU AI Act framework ID

    return (
      <>
        {isEUAIAct ? (
          tracker === 'compliance' ? (
            <ComplianceTracker project={project} />
          ) : (
            <AssessmentTracker project={project} />
          )
        ) : (
          <ComingSoonMessage />
        )}
      </>
    );
  };

  if (error) {
    return (
      <Box sx={containerStyle}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={refreshFrameworks} variant="contained">
          Retry
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={containerStyle}>
      {/* Framework Tabs and Add Button */}
      <Box sx={headerContainerStyle}>
        {/* Framework Tabs as classic tabs, not buttons */}
        <Box sx={frameworkTabsContainerStyle}>
          {loading ? (
            <VWSkeleton variant="rectangular" width={200} height={40} />
          ) : (
            frameworks.map((fw, idx) => {
              const isActive = selectedFrameworkId === fw.id;
              return (
                <Box
                  key={fw.id}
                  onClick={() => handleFrameworkChange(fw.id)}
                  sx={getFrameworkTabStyle(isActive, idx === frameworks.length - 1)}
                >
                  {fw.name}
                </Box>
              );
            })
          )}
        </Box>
        <Button variant="contained" sx={addButtonStyle}>
          Add new framework
        </Button>
      </Box>

      {/* Tracker Tabs */}
      <TabContext value={currentValue}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
          <TabList
            onChange={(_, v) => setCurrentValue(v)}
            TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
            sx={tabListStyle}
          >
            {currentTabs.map((tab) => (
              <Tab
                key={tab.value}
                sx={tabStyle}
                label={tab.label}
                value={tab.value}
                disableRipple
              />
            ))}
          </TabList>
        </Box>
        <TabPanel value="compliance" sx={tabPanelStyle}>
          {renderFrameworkContent()}
        </TabPanel>
        <TabPanel value="assessment" sx={tabPanelStyle}>
          {renderFrameworkContent()}
        </TabPanel>
      </TabContext>
    </Box>
  );
};

export default ProjectFrameworks;
