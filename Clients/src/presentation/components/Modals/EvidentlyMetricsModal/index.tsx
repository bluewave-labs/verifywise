import React, { useState } from 'react';
import { Box, Tab } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import StandardModal from '../StandardModal';
import { getModelById } from '../../../pages/Integrations/EvidentlyManagement/mockData/mockEvidentlyData';
import {
  getDriftMetrics,
  getPerformanceMetrics,
  getFairnessMetrics
} from '../../../pages/Integrations/EvidentlyManagement/mockData/mockMetricsData';
import DriftMetricsTab from './DriftMetricsTab';
import PerformanceMetricsTab from './PerformanceMetricsTab';
import FairnessMetricsTab from './FairnessMetricsTab';

interface EvidentlyMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelId: string | null;
}

const EvidentlyMetricsModal: React.FC<EvidentlyMetricsModalProps> = ({
  isOpen,
  onClose,
  modelId
}) => {
  const [activeTab, setActiveTab] = useState('drift');

  // Get model and metrics data
  const model = modelId ? getModelById(modelId) : null;
  const driftMetrics = modelId ? getDriftMetrics(modelId) : null;
  const performanceMetrics = modelId ? getPerformanceMetrics(modelId) : null;
  const fairnessMetrics = modelId ? getFairnessMetrics(modelId) : null;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  if (!model) {
    return null;
  }

  return (
    <StandardModal
      open={isOpen}
      onClose={onClose}
      title={`Evidently Metrics - ${model.modelName}`}
      maxWidth="1200px"
    >
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList
            onChange={handleTabChange}
            TabIndicatorProps={{ style: { backgroundColor: '#6C5CE7' } }}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '13px',
                fontWeight: 500,
                color: '#6B7280',
                minHeight: '48px',
                '&.Mui-selected': {
                  color: '#6C5CE7',
                  fontWeight: 600
                },
                '&:hover': {
                  color: '#6C5CE7',
                  backgroundColor: 'transparent'
                }
              }
            }}
          >
            <Tab label="Drift" value="drift" />
            <Tab label="Performance" value="performance" />
            <Tab label="Fairness" value="fairness" />
          </TabList>
        </Box>

        <TabPanel value="drift" sx={{ p: 0, pt: 3 }}>
          {driftMetrics ? (
            <DriftMetricsTab metrics={driftMetrics} />
          ) : (
            <Box sx={{ p: 3, textAlign: 'center', color: '#6B7280' }}>
              No drift metrics available
            </Box>
          )}
        </TabPanel>

        <TabPanel value="performance" sx={{ p: 0, pt: 3 }}>
          {performanceMetrics ? (
            <PerformanceMetricsTab metrics={performanceMetrics} />
          ) : (
            <Box sx={{ p: 3, textAlign: 'center', color: '#6B7280' }}>
              No performance metrics available
            </Box>
          )}
        </TabPanel>

        <TabPanel value="fairness" sx={{ p: 0, pt: 3 }}>
          {fairnessMetrics ? (
            <FairnessMetricsTab metrics={fairnessMetrics} />
          ) : (
            <Box sx={{ p: 3, textAlign: 'center', color: '#6B7280' }}>
              No fairness metrics available
            </Box>
          )}
        </TabPanel>
      </TabContext>
    </StandardModal>
  );
};

export default EvidentlyMetricsModal;
