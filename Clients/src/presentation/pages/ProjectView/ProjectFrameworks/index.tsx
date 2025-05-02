import { useState } from 'react';
import { Box, Button, Tab, Typography, Stack } from '@mui/material';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import TabContext from '@mui/lab/TabContext';
import { tabStyle, tabPanelStyle } from '../V1.0ProjectView/style';
import VWSkeleton from '../../../vw-v2-components/Skeletons';
import ComplianceTracker from '../../../pages/ComplianceTracker/1.0ComplianceTracker';
import { Project } from '../../../../domain/types/Project';
import AssessmentTracker from '../../Assessment/1.0AssessmentTracker';

import {
  containerStyle,
  headerContainerStyle,
  frameworkTabsContainerStyle,
  getFrameworkTabStyle,
  addButtonStyle,
  tabListStyle,
} from './styles';

const frameworks = [
  { label: 'EU AI Act', value: 'eu-ai-act' },
  { label: 'ISO 42001', value: 'iso-42001' },
];

const trackerTabs = [
  { label: 'Compliance tracker', value: 'compliance' },
  { label: 'Assessment tracker', value: 'assessment' },
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
      EU AI Act is currently available for your compliance and assessment needs.
    </Typography>
  </Stack>
);

const ProjectFrameworks = ({ project }: { project: Project }) => {
  const [framework, setFramework] = useState('eu-ai-act');
  const [tracker, setTracker] = useState('compliance');
  
  return (
    <Box sx={containerStyle}>
      {/* Framework Tabs and Add Button */}
      <Box sx={headerContainerStyle}>
        {/* Framework Tabs as classic tabs, not buttons */}
        <Box sx={frameworkTabsContainerStyle}>
          {frameworks.map((fw, idx) => {
            const isActive = framework === fw.value;
            return (
              <Box
                key={fw.value}
                onClick={() => setFramework(fw.value)}
                sx={getFrameworkTabStyle(isActive, idx === frameworks.length - 1)}
              >
                {fw.label}
              </Box>
            );
          })}
        </Box>
        <Button variant="contained" sx={addButtonStyle}>
          Add new framework
        </Button>
      </Box>

      {/* Tracker Tabs */}
      <TabContext value={tracker}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <TabList
            onChange={(_, v) => setTracker(v)}
            TabIndicatorProps={{ style: { backgroundColor: '#13715B' } }}
            sx={tabListStyle}
          >
            {trackerTabs.map(tab => (
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
          {project ? (
            framework === 'eu-ai-act' ? (
              <ComplianceTracker project={project} />
            ) : (
              <ComingSoonMessage />
            )
          ) : (
            <VWSkeleton variant="rectangular" width="100%" height={400} />
          )}
        </TabPanel>
        <TabPanel value="assessment" sx={tabPanelStyle}>
          {project ? (
            framework === 'eu-ai-act' ? (
              <AssessmentTracker project={project} />
            ) : (
              <ComingSoonMessage />
            )
          ) : (
            <VWSkeleton variant="rectangular" width="100%" height={400} />
          )}
        </TabPanel>
      </TabContext>
    </Box>
  );
};

export default ProjectFrameworks;