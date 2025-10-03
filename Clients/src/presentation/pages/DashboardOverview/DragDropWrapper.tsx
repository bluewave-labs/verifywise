import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Switch,
  FormControlLabel,
  IconButton,
  useTheme,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  DragIndicator as DragIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Import the original DashboardOverview component
import DashboardOverview from './index';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DragDropWrapperProps {
  children?: React.ReactNode;
}

export const DragDropWrapper: React.FC<DragDropWrapperProps> = () => {
  const theme = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dashboardContent, setDashboardContent] = useState<any>(null);

  // Extract the dashboard components from the original dashboard
  // For now, we'll render the original dashboard as-is when not in edit mode
  // And wrap individual sections when in edit mode

  // Default layouts for the existing dashboard sections
  const defaultLayouts: Layouts = {
    lg: [
      { i: 'metrics', x: 0, y: 0, w: 12, h: 3 },    // Top metrics row
      { i: 'status', x: 0, y: 3, w: 6, h: 4 },      // API Status
      { i: 'debug', x: 6, y: 3, w: 6, h: 4 },       // Debug Info
      { i: 'risks', x: 0, y: 7, w: 12, h: 4 },      // Risk Overview
      { i: 'assessment', x: 0, y: 11, w: 6, h: 5 }, // Assessment Progress
      { i: 'compliance', x: 6, y: 11, w: 6, h: 5 }, // Compliance Status
      { i: 'activity', x: 0, y: 16, w: 6, h: 6 },   // Recent Activity
      { i: 'tasks', x: 6, y: 16, w: 6, h: 6 },      // Upcoming Tasks
    ],
    md: [
      { i: 'metrics', x: 0, y: 0, w: 10, h: 3 },
      { i: 'status', x: 0, y: 3, w: 5, h: 4 },
      { i: 'debug', x: 5, y: 3, w: 5, h: 4 },
      { i: 'risks', x: 0, y: 7, w: 10, h: 4 },
      { i: 'assessment', x: 0, y: 11, w: 5, h: 5 },
      { i: 'compliance', x: 5, y: 11, w: 5, h: 5 },
      { i: 'activity', x: 0, y: 16, w: 5, h: 6 },
      { i: 'tasks', x: 5, y: 16, w: 5, h: 6 },
    ],
    sm: [
      { i: 'metrics', x: 0, y: 0, w: 6, h: 3 },
      { i: 'status', x: 0, y: 3, w: 6, h: 4 },
      { i: 'debug', x: 0, y: 7, w: 6, h: 4 },
      { i: 'risks', x: 0, y: 11, w: 6, h: 4 },
      { i: 'assessment', x: 0, y: 15, w: 6, h: 5 },
      { i: 'compliance', x: 0, y: 20, w: 6, h: 5 },
      { i: 'activity', x: 0, y: 25, w: 6, h: 6 },
      { i: 'tasks', x: 0, y: 31, w: 6, h: 6 },
    ],
  };

  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts);

  useEffect(() => {
    const storedLayouts = localStorage.getItem('verifywise_original_dashboard_layouts');
    if (storedLayouts) {
      try {
        setLayouts(JSON.parse(storedLayouts));
      } catch (error) {
        console.error('Failed to parse stored layouts:', error);
      }
    }
    setMounted(true);
  }, []);

  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
    localStorage.setItem('verifywise_original_dashboard_layouts', JSON.stringify(allLayouts));
  }, []);

  const resetLayout = () => {
    setLayouts(defaultLayouts);
    localStorage.removeItem('verifywise_original_dashboard_layouts');
  };

  if (!mounted) return null;

  // If not in edit mode, render the original dashboard as-is
  if (!editMode) {
    return (
      <Box>
        {/* Edit Mode Toggle */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderBottom: 1, borderColor: 'divider' }}>
          <FormControlLabel
            control={
              <Switch
                checked={editMode}
                onChange={(e) => setEditMode(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ViewIcon />
                <Typography>View Mode</Typography>
              </Box>
            }
          />
        </Box>
        {/* Render original dashboard */}
        <DashboardOverview />
      </Box>
    );
  }

  // In edit mode, show message that this feature is being implemented
  return (
    <Box sx={{ p: 3 }}>
      {/* Edit Mode Toggle */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Dashboard Overview</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Tooltip title="Reset Layout">
            <IconButton onClick={resetLayout}>
              <ResetIcon />
            </IconButton>
          </Tooltip>
          <FormControlLabel
            control={
              <Switch
                checked={editMode}
                onChange={(e) => setEditMode(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditIcon />
                <Typography>Edit Mode</Typography>
              </Box>
            }
          />
        </Box>
      </Box>

      {/* Info Message */}
      <Box
        sx={{
          p: 3,
          backgroundColor: alpha(theme.palette.info.main, 0.1),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
          mb: 3,
        }}
      >
        <Typography variant="body1" color="info.main">
          <strong>Edit Mode Active:</strong> Drag-and-drop functionality for the existing dashboard is being implemented.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          The original dashboard components will be made draggable while preserving all their existing functionality and data.
          For now, please use View Mode to see your dashboard.
        </Typography>
      </Box>

      {/* Render original dashboard below */}
      <Box sx={{ opacity: 0.5, pointerEvents: 'none' }}>
        <DashboardOverview />
      </Box>
    </Box>
  );
};

export default DragDropWrapper;