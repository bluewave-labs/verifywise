import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  FormControlLabel,
  IconButton,
  useTheme,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  alpha,
} from '@mui/material';
import Toggle from '../../components/Inputs/Toggle';
import {
  Edit as EditIcon,
  Eye as ViewIcon,
  GripVertical as DragIcon,
  Settings as SettingsIcon,
  RefreshCw as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  RotateCcw as ResetIcon,
} from 'lucide-react';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import { DashboardProvider, useDashboardContext } from './contexts/DashboardContext';
import { MetricsWidget, ProjectsWidget, RisksWidget } from './widgets';
import { WidgetConfig } from '../../../domain/interfaces/iDashboard';
import { WidgetType } from '../../../domain/enums/dashboard.enum';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Make GridLayout responsive
const ResponsiveGridLayout = WidthProvider(Responsive);

// Main Dashboard Component (wrapped with context)
const DashboardContent: React.FC = () => {
  const theme = useTheme();
  const { state, actions } = useDashboardContext();
  const [mounted, setMounted] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null);

  // Sample widgets configuration
  const widgets: WidgetConfig[] = [
    {
      id: 'metrics',
      title: 'Key Metrics',
      type: WidgetType.METRICS,
      minW: 2,
      minH: 2,
      maxW: 6,
      maxH: 4,
    },
    {
      id: 'projects',
      title: 'Active Projects',
      type: WidgetType.PROJECTS,
      minW: 2,
      minH: 3,
      maxW: 8,
      maxH: 6,
    },
    {
      id: 'risks',
      title: 'Risk Overview',
      type: WidgetType.RISKS,
      minW: 2,
      minH: 2,
      maxW: 6,
      maxH: 5,
    },
    {
      id: 'compliance',
      title: 'Compliance Status',
      type: WidgetType.COMPLIANCE,
      minW: 2,
      minH: 2,
      maxW: 4,
      maxH: 4,
    },
    {
      id: 'activities',
      title: 'Recent Activities',
      type: WidgetType.ACTIVITIES,
      minW: 2,
      minH: 3,
      maxW: 6,
      maxH: 8,
    },
    {
      id: 'tasks',
      title: 'Pending Tasks',
      type: WidgetType.TASKS,
      minW: 2,
      minH: 2,
      maxW: 5,
      maxH: 6,
    },
  ];

  // Default layouts
  const defaultLayouts: Layouts = {
    lg: [
      { i: 'metrics', x: 0, y: 0, w: 4, h: 2 },
      { i: 'projects', x: 4, y: 0, w: 4, h: 3 },
      { i: 'risks', x: 8, y: 0, w: 4, h: 3 },
      { i: 'compliance', x: 0, y: 2, w: 3, h: 2 },
      { i: 'activities', x: 3, y: 3, w: 5, h: 3 },
      { i: 'tasks', x: 8, y: 3, w: 4, h: 3 },
    ],
    md: [
      { i: 'metrics', x: 0, y: 0, w: 5, h: 2 },
      { i: 'projects', x: 5, y: 0, w: 5, h: 3 },
      { i: 'risks', x: 0, y: 2, w: 5, h: 3 },
      { i: 'compliance', x: 5, y: 3, w: 5, h: 2 },
      { i: 'activities', x: 0, y: 5, w: 5, h: 3 },
      { i: 'tasks', x: 5, y: 5, w: 5, h: 3 },
    ],
    sm: [
      { i: 'metrics', x: 0, y: 0, w: 6, h: 2 },
      { i: 'projects', x: 0, y: 2, w: 6, h: 3 },
      { i: 'risks', x: 0, y: 5, w: 6, h: 3 },
      { i: 'compliance', x: 0, y: 8, w: 6, h: 2 },
      { i: 'activities', x: 0, y: 10, w: 6, h: 3 },
      { i: 'tasks', x: 0, y: 13, w: 6, h: 3 },
    ],
    xs: [
      { i: 'metrics', x: 0, y: 0, w: 4, h: 2 },
      { i: 'projects', x: 0, y: 2, w: 4, h: 3 },
      { i: 'risks', x: 0, y: 5, w: 4, h: 3 },
      { i: 'compliance', x: 0, y: 8, w: 4, h: 2 },
      { i: 'activities', x: 0, y: 10, w: 4, h: 3 },
      { i: 'tasks', x: 0, y: 13, w: 4, h: 3 },
    ],
  };

  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts);

  // Load layouts from localStorage on mount
  useEffect(() => {
    const storedLayouts = localStorage.getItem('verifywise_dashboard_layouts');
    if (storedLayouts) {
      try {
        setLayouts(JSON.parse(storedLayouts));
      } catch (error) {
        console.error('Failed to parse stored layouts:', error);
      }
    }
    setMounted(true);
  }, []);

  // Handle layout change
  const handleLayoutChange = useCallback((_: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
    localStorage.setItem('verifywise_dashboard_layouts', JSON.stringify(allLayouts));
    actions.saveLayout(allLayouts);
  }, [actions]);

  // Handle settings menu
  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchor(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchor(null);
  };

  // Render widget content
  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case WidgetType.METRICS:
        return <MetricsWidget loading={false} />;
      case WidgetType.PROJECTS:
        return <ProjectsWidget loading={false} />;
      case WidgetType.RISKS:
        return <RisksWidget loading={false} />;
      case WidgetType.COMPLIANCE:
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h2" color="success.main">92%</Typography>
            <Typography variant="subtitle1">Compliance Score</Typography>
            <Typography variant="body2" color="text.secondary">
              All systems operational
            </Typography>
          </Box>
        );
      case WidgetType.ACTIVITIES:
        return (
          <Box sx={{ p: 1 }}>
            <Typography variant="body2" gutterBottom>• User John updated risk assessment - 2 min ago</Typography>
            <Typography variant="body2" gutterBottom>• New policy document uploaded - 15 min ago</Typography>
            <Typography variant="body2" gutterBottom>• Compliance review completed - 1 hour ago</Typography>
            <Typography variant="body2" gutterBottom>• Project milestone achieved - 2 hours ago</Typography>
            <Typography variant="body2" gutterBottom>• Security scan initiated - 3 hours ago</Typography>
          </Box>
        );
      case WidgetType.TASKS:
        return (
          <Box sx={{ p: 1 }}>
            <Typography variant="body2" gutterBottom>☐ Review Q3 compliance report</Typography>
            <Typography variant="body2" gutterBottom>☐ Update risk matrix for Project Alpha</Typography>
            <Typography variant="body2" gutterBottom>☐ Schedule team meeting for next week</Typography>
            <Typography variant="body2" gutterBottom>☐ Complete security audit checklist</Typography>
            <Typography variant="body2" gutterBottom>☐ Review and approve new policies</Typography>
          </Box>
        );
      default:
        return <Typography>Widget content</Typography>;
    }
  };

  // Don't render until mounted (avoid SSR issues)
  if (!mounted) return null;

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.grey[50], minHeight: '100vh' }}>
      {/* Dashboard Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor your AI governance metrics and activities
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Refresh Button */}
          <Tooltip title="Refresh all widgets">
            <IconButton onClick={() => actions.refreshAllWidgets()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {/* Settings Menu */}
          <Tooltip title="Dashboard settings">
            <IconButton onClick={handleSettingsClick}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={settingsAnchor}
            open={Boolean(settingsAnchor)}
            onClose={handleSettingsClose}
          >
            <MenuItem onClick={() => { actions.resetLayout(); handleSettingsClose(); }}>
              <ResetIcon style={{ marginRight: 8 }} /> Reset Layout
            </MenuItem>
            <MenuItem onClick={() => { actions.exportDashboard(); handleSettingsClose(); }}>
              <DownloadIcon style={{ marginRight: 8 }} /> Export Dashboard
            </MenuItem>
            <Divider />
            <MenuItem disabled>
              <UploadIcon style={{ marginRight: 8 }} /> Import Dashboard
            </MenuItem>
          </Menu>

          {/* Edit Mode Toggle */}
          <FormControlLabel
            control={
              <Toggle
                checked={state.editMode}
                onChange={(e) => actions.setEditMode(e.target.checked)}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {state.editMode ? <EditIcon /> : <ViewIcon />}
                <Typography>{state.editMode ? 'Edit Mode' : 'View Mode'}</Typography>
              </Box>
            }
          />
        </Box>
      </Box>

      {/* Info Banner for Edit Mode */}
      {state.editMode && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          <Typography variant="body2" color="primary">
            <strong>Edit Mode Active:</strong> Drag widgets by their headers to rearrange.
            Resize using the bottom-right corner. Changes are saved automatically.
          </Typography>
        </Box>
      )}

      {/* CSS for enhanced styling */}
      <style>{`
        .react-grid-layout {
          position: relative;
        }

        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }

        .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }

        .react-grid-item.resizing {
          z-index: 100;
          will-change: width, height;
        }

        .react-grid-item.react-draggable-dragging {
          z-index: 100;
          will-change: transform;
          opacity: 0.85;
          box-shadow: 0 12px 32px rgba(0,0,0,0.25) !important;
          transform: scale(1.02);
          transition: opacity 200ms ease, transform 200ms ease !important;
        }

        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          background: transparent;
        }

        .react-grid-item > .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 6px;
          height: 6px;
          border-right: 2px solid ${alpha(theme.palette.primary.main, 0.5)};
          border-bottom: 2px solid ${alpha(theme.palette.primary.main, 0.5)};
          transition: border-color 200ms ease;
        }

        .react-grid-item:hover > .react-resizable-handle::after {
          border-color: ${theme.palette.primary.main};
        }

        .react-grid-placeholder {
          background: ${alpha(theme.palette.primary.main, 0.05)};
          border: 2px dashed ${theme.palette.primary.main};
          border-radius: 8px;
          z-index: 2;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          -o-user-select: none;
          user-select: none;
          transition: all 200ms ease;
        }

        .dashboard-card-header {
          cursor: ${state.editMode ? 'grab' : 'default'};
          user-select: ${state.editMode ? 'none' : 'auto'};
        }

        .dashboard-card-header:active {
          cursor: ${state.editMode ? 'grabbing' : 'default'};
        }

        /* VerifyWise green theme */
        .widget-card {
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .widget-card:hover {
          transform: ${state.editMode ? 'translateY(-2px)' : 'none'};
        }
      `}</style>

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
        rowHeight={60}
        isDraggable={state.editMode}
        isResizable={state.editMode}
        draggableHandle=".dashboard-card-header"
        draggableCancel=".no-drag"
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
      >
        {widgets.map((widget) => (
          <Card
            key={widget.id}
            className="widget-card"
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: 'background.paper',
              boxShadow: state.editMode && state.editMode ?
                theme.shadows[4] : theme.shadows[1],
              '&:hover': state.editMode ? {
                boxShadow: theme.shadows[8],
              } : {},
            }}
          >
            <CardHeader
              className="dashboard-card-header"
              sx={{
                backgroundColor: state.editMode ?
                  alpha(theme.palette.primary.main, 0.04) :
                  theme.palette.grey[50],
                borderBottom: `1px solid ${theme.palette.divider}`,
                py: 1.5,
                px: 2,
                '& .MuiCardHeader-title': {
                  fontSize: '0.95rem',
                  fontWeight: 600,
                },
              }}
              avatar={
                state.editMode && (
                  <DragIcon
                    style={{
                      color: alpha(theme.palette.text.secondary, 0.6),
                      fontSize: '1.2rem',
                    }}
                  />
                )
              }
              title={widget.title}
              action={
                state.editMode && (
                  <Tooltip title="Widget settings">
                    <IconButton size="small" className="no-drag">
                      <SettingsIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }
            />
            <CardContent
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                p: 0,
                '&:last-child': { pb: 0 },
              }}
            >
              {renderWidget(widget)}
            </CardContent>
          </Card>
        ))}
      </ResponsiveGridLayout>
    </Box>
  );
};

// Export wrapped component
export const EnhancedDashboard: React.FC = () => {
  return (
    <DashboardProvider
      projectId="default-project"
      dashboardId="main-dashboard"
      userId="current-user"
    >
      <DashboardContent />
    </DashboardProvider>
  );
};

export default EnhancedDashboard;