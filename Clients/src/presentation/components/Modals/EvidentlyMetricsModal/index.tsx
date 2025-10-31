import React, { useState, useEffect } from 'react';
import { Box, Tab, CircularProgress } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import StandardModal from '../StandardModal';
import {
  getDriftMetrics as fetchDriftMetrics,
  getPerformanceMetrics as fetchPerformanceMetrics,
  getFairnessMetrics as fetchFairnessMetrics,
  DriftMetrics,
  PerformanceMetrics,
  FairnessMetrics
} from '../../../../infrastructure/api/evidentlyService';
import DriftMetricsTab from './DriftMetricsTab';
import PerformanceMetricsTab from './PerformanceMetricsTab';
import FairnessMetricsTab from './FairnessMetricsTab';

interface EvidentlyMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  modelName?: string;
}

const EvidentlyMetricsModal: React.FC<EvidentlyMetricsModalProps> = ({
  isOpen,
  onClose,
  projectId,
  modelName = 'Model'
}) => {
  const [activeTab, setActiveTab] = useState('drift');
  const [isLoading, setIsLoading] = useState(false);
  const [driftMetrics, setDriftMetrics] = useState<DriftMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [fairnessMetrics, setFairnessMetrics] = useState<FairnessMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load metrics when modal opens or projectId changes
   */
  useEffect(() => {
    if (!isOpen || !projectId) {
      return;
    }

    const loadMetrics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load all metrics in parallel
        const [drift, performance, fairness] = await Promise.all([
          fetchDriftMetrics(projectId).catch(() => null),
          fetchPerformanceMetrics(projectId).catch(() => null),
          fetchFairnessMetrics(projectId).catch(() => null)
        ]);

        setDriftMetrics(drift);
        setPerformanceMetrics(performance);
        setFairnessMetrics(fairness);
      } catch (err: any) {
        console.error('Failed to load metrics:', err);
        setError('Failed to load metrics. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, [isOpen, projectId]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  if (!projectId) {
    return null;
  }

  return (
    <StandardModal
      open={isOpen}
      onClose={onClose}
      title={`Evidently Metrics - ${modelName}`}
      maxWidth="1200px"
    >
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress size={40} />
        </Box>
      ) : error ? (
        <Box sx={{ p: 3, textAlign: 'center', color: '#EF4444' }}>
          {error}
        </Box>
      ) : (
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
      )}
    </StandardModal>
  );
};

export default EvidentlyMetricsModal;
