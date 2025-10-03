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
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Type definitions
interface WidgetConfig {
  id: string;
  title: string;
  type: string;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  content?: React.ReactNode;
}

interface DashboardLayout {
  projectId: string;
  dashboardId: string;
  layouts: Layouts;
  widgets: WidgetConfig[];
  lastModified: Date;
}

// Make GridLayout responsive
const ResponsiveGridLayout = WidthProvider(Responsive);

// Dashboard Component
export const DragDropDashboard: React.FC = () => {
  const theme = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [layouts, setLayouts] = useState<Layouts>({});
  const [mounted, setMounted] = useState(false);

  // Sample widgets configuration
  const widgets: WidgetConfig[] = [
    {
      id: 'metrics',
      title: 'Key Metrics',
      type: 'metrics',
      minW: 2,
      minH: 2,
      maxW: 6,
      maxH: 4,
    },
    {
      id: 'projects',
      title: 'Active Projects',
      type: 'projects',
      minW: 2,
      minH: 3,
      maxW: 8,
      maxH: 6,
    },
    {
      id: 'risks',
      title: 'Risk Overview',
      type: 'risks',
      minW: 2,
      minH: 2,
      maxW: 6,
      maxH: 5,
    },
    {
      id: 'compliance',
      title: 'Compliance Status',
      type: 'compliance',
      minW: 2,
      minH: 2,
      maxW: 4,
      maxH: 4,
    },
    {
      id: 'activities',
      title: 'Recent Activities',
      type: 'activities',
      minW: 2,
      minH: 3,
      maxW: 6,
      maxH: 8,
    },
    {
      id: 'tasks',
      title: 'Pending Tasks',
      type: 'tasks',
      minW: 2,
      minH: 2,
      maxW: 5,
      maxH: 6,
    },
  ];

  // Default layouts if none in localStorage
  const defaultLayouts: Layouts = {
    lg: [
      { i: 'metrics', x: 0, y: 0, w: 4, h: 2 },
      { i: 'projects', x: 4, y: 0, w: 4, h: 3 },
      { i: 'risks', x: 8, y: 0, w: 4, h: 2 },
      { i: 'compliance', x: 0, y: 2, w: 3, h: 2 },
      { i: 'activities', x: 3, y: 3, w: 5, h: 4 },
      { i: 'tasks', x: 8, y: 2, w: 4, h: 3 },
    ],
    md: [
      { i: 'metrics', x: 0, y: 0, w: 5, h: 2 },
      { i: 'projects', x: 5, y: 0, w: 5, h: 3 },
      { i: 'risks', x: 0, y: 2, w: 5, h: 2 },
      { i: 'compliance', x: 5, y: 3, w: 5, h: 2 },
      { i: 'activities', x: 0, y: 4, w: 5, h: 4 },
      { i: 'tasks', x: 5, y: 5, w: 5, h: 3 },
    ],
    sm: [
      { i: 'metrics', x: 0, y: 0, w: 6, h: 2 },
      { i: 'projects', x: 0, y: 2, w: 6, h: 3 },
      { i: 'risks', x: 0, y: 5, w: 6, h: 2 },
      { i: 'compliance', x: 0, y: 7, w: 6, h: 2 },
      { i: 'activities', x: 0, y: 9, w: 6, h: 4 },
      { i: 'tasks', x: 0, y: 13, w: 6, h: 3 },
    ],
    xs: [
      { i: 'metrics', x: 0, y: 0, w: 4, h: 2 },
      { i: 'projects', x: 0, y: 2, w: 4, h: 3 },
      { i: 'risks', x: 0, y: 5, w: 4, h: 2 },
      { i: 'compliance', x: 0, y: 7, w: 4, h: 2 },
      { i: 'activities', x: 0, y: 9, w: 4, h: 4 },
      { i: 'tasks', x: 0, y: 13, w: 4, h: 3 },
    ],
    xxs: [
      { i: 'metrics', x: 0, y: 0, w: 2, h: 2 },
      { i: 'projects', x: 0, y: 2, w: 2, h: 3 },
      { i: 'risks', x: 0, y: 5, w: 2, h: 2 },
      { i: 'compliance', x: 0, y: 7, w: 2, h: 2 },
      { i: 'activities', x: 0, y: 9, w: 2, h: 4 },
      { i: 'tasks', x: 0, y: 13, w: 2, h: 3 },
    ],
  };

  // Load layouts from localStorage on mount
  useEffect(() => {
    const storedLayouts = localStorage.getItem('dashboard_layouts');
    if (storedLayouts) {
      try {
        const parsed = JSON.parse(storedLayouts);
        setLayouts(parsed);
      } catch (error) {
        console.error('Failed to parse stored layouts:', error);
        setLayouts(defaultLayouts);
      }
    } else {
      setLayouts(defaultLayouts);
    }
    setMounted(true);
  }, []);

  // Save layouts to localStorage
  const saveLayouts = useCallback((newLayouts: Layouts) => {
    setLayouts(newLayouts);
    localStorage.setItem('dashboard_layouts', JSON.stringify(newLayouts));
  }, []);

  // Handle layout change
  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    saveLayouts(allLayouts);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // Render a widget based on its type
  const renderWidget = (widget: WidgetConfig) => {
    // Sample content for different widget types
    switch (widget.type) {
      case 'metrics':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h3" color="primary">42</Typography>
            <Typography variant="subtitle1">Active Projects</Typography>
            <Typography variant="body2" color="text.secondary">
              +12% from last month
            </Typography>
          </Box>
        );
      case 'projects':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="body1">Project Alpha - 75% Complete</Typography>
            <Typography variant="body1">Project Beta - 45% Complete</Typography>
            <Typography variant="body1">Project Gamma - 90% Complete</Typography>
          </Box>
        );
      case 'risks':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" sx={{ color: 'error.main' }}>
              High Risk: 3 items
            </Typography>
            <Typography variant="body1" sx={{ color: 'warning.main' }}>
              Medium Risk: 8 items
            </Typography>
            <Typography variant="body1" sx={{ color: 'success.main' }}>
              Low Risk: 15 items
            </Typography>
          </Box>
        );
      case 'compliance':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h4" color="success.main">92%</Typography>
            <Typography variant="subtitle1">Compliance Score</Typography>
          </Box>
        );
      case 'activities':
        return (
          <Box sx={{ p: 1 }}>
            <Typography variant="body2">• User John updated risk assessment</Typography>
            <Typography variant="body2">• New policy document uploaded</Typography>
            <Typography variant="body2">• Compliance review completed</Typography>
            <Typography variant="body2">• Project milestone achieved</Typography>
          </Box>
        );
      case 'tasks':
        return (
          <Box sx={{ p: 1 }}>
            <Typography variant="body2">□ Review Q3 compliance report</Typography>
            <Typography variant="body2">□ Update risk matrix</Typography>
            <Typography variant="body2">□ Schedule team meeting</Typography>
            <Typography variant="body2">□ Complete audit checklist</Typography>
          </Box>
        );
      default:
        return <Typography>Widget content</Typography>;
    }
  };

  // Don't render until mounted to avoid SSR issues
  if (!mounted) return null;

  return (
    <Box sx={{ p: 3 }}>
      {/* Edit Mode Toggle */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Dashboard</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={editMode}
              onChange={toggleEditMode}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {editMode ? <EditIcon /> : <ViewIcon />}
              <Typography>{editMode ? 'Edit Mode' : 'View Mode'}</Typography>
            </Box>
          }
        />
      </Box>

      {/* CSS for drag and drop styling */}
      <style jsx global>{`
        .react-grid-layout {
          position: relative;
        }

        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top;
        }

        .react-grid-item.cssTransforms {
          transition-property: transform;
        }

        .react-grid-item.resizing {
          z-index: 100;
          will-change: width, height;
        }

        .react-grid-item.react-draggable-dragging {
          z-index: 100;
          will-change: transform;
          opacity: 0.9;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          transform: scale(1.02);
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
          width: 5px;
          height: 5px;
          border-right: 2px solid ${theme.palette.primary.main};
          border-bottom: 2px solid ${theme.palette.primary.main};
        }

        .react-grid-placeholder {
          background: transparent;
          border: 2px dashed ${theme.palette.primary.main};
          border-radius: 8px;
          z-index: 2;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          -o-user-select: none;
          user-select: none;
        }

        .dashboard-card-header {
          cursor: ${editMode ? 'grab' : 'default'};
        }

        .dashboard-card-header:active {
          cursor: ${editMode ? 'grabbing' : 'default'};
        }
      `}</style>

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={editMode}
        isResizable={editMode}
        draggableHandle=".dashboard-card-header"
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {widgets.map((widget) => (
          <Card
            key={widget.id}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transition: 'box-shadow 0.3s ease',
              '&:hover': editMode ? {
                boxShadow: theme.shadows[8],
              } : {},
            }}
          >
            <CardHeader
              className="dashboard-card-header"
              sx={{
                backgroundColor: theme.palette.grey[50],
                borderBottom: `1px solid ${theme.palette.divider}`,
                py: 1,
                '& .MuiCardHeader-title': {
                  fontSize: '1rem',
                },
              }}
              avatar={
                editMode && (
                  <DragIcon
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '1.2rem',
                    }}
                  />
                )
              }
              title={widget.title}
            />
            <CardContent
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                p: 2,
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

export default DragDropDashboard;