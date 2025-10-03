import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Stack,
  CircularProgress,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  DragIndicator as DragIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import { useDashboard } from '../../../application/hooks/useDashboard';
import { useDashboardMetrics } from '../../../application/hooks/useDashboardMetrics';
import { cardStyles } from '../../themes';
import { useAuth } from '../../../application/hooks/useAuth';
import { getUserById } from '../../../application/repository/user.repository';
import { ReactComponent as RightArrow } from '../../assets/icons/right-arrow.svg';
import StatusDonutChart, { StatusData } from '../../components/Charts/StatusDonutChart';
import { getDefaultStatusDistribution } from '../../utils/statusColors';
import { getDistributionSummary, getQuickStats, hasCriticalItems, getPriorityLevel } from '../../utils/cardEnhancements';
import PageHeader from '../../components/Layout/PageHeader';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const Alert = lazy(() => import('../../components/Alert'));
const ResponsiveGridLayout = WidthProvider(Responsive);

// Import MetricCard component from WorkingDashboard
interface MetricCardProps {
  title: string;
  value: number | string;
  onClick?: () => void;
  navigable?: boolean;
  statusData?: StatusData[];
  entityType?: 'models' | 'vendors' | 'policies' | 'trainings' | 'vendorRisks';
  compact?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, onClick, navigable = false, statusData, entityType, compact = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const chartData = statusData || (entityType ? getDefaultStatusDistribution(entityType, typeof value === 'number' ? value : parseInt(String(value)) || 0) : []);
  const showChart = chartData.length > 0 && typeof value === 'number' && value > 0;

  const distributionSummary = getDistributionSummary(chartData);
  const quickStats = getQuickStats(entityType, typeof value === 'number' ? value : parseInt(String(value)) || 0, chartData);
  const criticalInfo = hasCriticalItems(entityType, chartData);
  const priorityLevel = getPriorityLevel(entityType, typeof value === 'number' ? value : parseInt(String(value)) || 0, chartData);

  const getPriorityStyles = () => {
    switch (priorityLevel) {
      case 'high':
        return {
          borderLeft: '4px solid #EF4444',
          backgroundColor: '#FEF2F2'
        };
      case 'medium':
        return {
          borderLeft: '4px solid #F59E0B',
          backgroundColor: '#FFFBEB'
        };
      default:
        return {};
    }
  };

  return (
    <Card
      elevation={0}
      onClick={navigable ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={(theme) => ({
        ...cardStyles.base(theme) as any,
        ...getPriorityStyles(),
        height: '100%',
        minHeight: compact ? '90px' : 'auto',
        cursor: navigable ? 'pointer' : 'default',
        position: 'relative',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': navigable
          ? {
              backgroundColor: '#F9FAFB',
              borderColor: '#D1D5DB',
            }
          : {}
      })}
    >
      <CardContent sx={{
        p: compact ? 1.5 : 2,
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: compact ? 0.5 : 1 }}>
          <Typography
            variant="subtitle2"
            sx={(theme) => ({
              fontWeight: 400,
              fontSize: compact ? '0.75rem' : '0.875rem',
              color: theme.palette.text.tertiary
            })}
          >
            {title}
          </Typography>
          {navigable && (
            <RightArrow
              style={{
                width: '14px',
                height: '14px',
                opacity: isHovered ? 1 : 0.5,
                transition: 'opacity 0.2s ease'
              }}
            />
          )}
        </Stack>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          {showChart ? (
            <>
              <Box sx={{ flexShrink: 0 }}>
                <StatusDonutChart
                  data={chartData}
                  size={compact ? 60 : 70}
                  centerValue={value}
                  entityType={entityType}
                />
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {distributionSummary && !compact && (
                  <Typography variant="caption" sx={(theme) => ({
                    color: theme.palette.text.tertiary,
                    lineHeight: 1.2,
                    fontSize: '10px'
                  })}>
                    {distributionSummary}
                  </Typography>
                )}
                {quickStats && quickStats.length > 0 && !compact && (
                  <Box sx={{ mt: 0.5 }}>
                    {quickStats.map((stat, idx) => (
                      <Chip
                        key={idx}
                        label={stat}
                        size="small"
                        sx={{
                          height: '16px',
                          fontSize: '9px',
                          mr: 0.5,
                          '& .MuiChip-label': { px: 0.5 }
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
              {criticalInfo && criticalInfo.hasIssues && !compact && (
                <Box sx={{ position: 'absolute', bottom: 8, right: 8, zIndex: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(criticalInfo.actionRoute);
                    }}
                    sx={{
                      fontSize: '9px',
                      textTransform: 'none',
                      padding: '2px 6px',
                      minWidth: 'auto',
                      height: '20px',
                      borderColor: priorityLevel === 'high' ? '#EF4444' : '#F59E0B',
                      color: priorityLevel === 'high' ? '#EF4444' : '#F59E0B',
                      '&:hover': {
                        borderColor: priorityLevel === 'high' ? '#DC2626' : '#D97706',
                        backgroundColor: priorityLevel === 'high' ? '#FEF2F2' : '#FFFBEB'
                      }
                    }}
                  >
                    {criticalInfo.actionLabel}
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Typography
              variant="h6"
              sx={(theme) => ({
                fontWeight: 400,
                color: theme.palette.text.primary,
                fontSize: compact ? '1rem' : '1.25rem'
              })}
            >
              {value}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Integrated Dashboard Component
const IntegratedDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { dashboard, loading, fetchDashboard } = useDashboard();
  const { evidenceMetrics, vendorRiskMetrics, vendorMetrics, usersMetrics, policyMetrics } = useDashboardMetrics();
  const { userToken } = useAuth();

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Password notification state
  const [showPasswordNotification, setShowPasswordNotification] = useState(false);

  // Default layouts for the dashboard sections
  const defaultLayouts: Layouts = {
    lg: [
      { i: 'projects-evidences', x: 0, y: 0, w: 3, h: 4 },
      { i: 'reports-users', x: 3, y: 0, w: 3, h: 4 },
      { i: 'models', x: 6, y: 0, w: 3, h: 4 },
      { i: 'vendors', x: 9, y: 0, w: 3, h: 4 },
      { i: 'vendor-risks', x: 0, y: 4, w: 3, h: 4 },
      { i: 'trainings', x: 3, y: 4, w: 3, h: 4 },
      { i: 'policies', x: 6, y: 4, w: 3, h: 4 },
    ],
    md: [
      { i: 'projects-evidences', x: 0, y: 0, w: 2.5, h: 4 },
      { i: 'reports-users', x: 2.5, y: 0, w: 2.5, h: 4 },
      { i: 'models', x: 5, y: 0, w: 2.5, h: 4 },
      { i: 'vendors', x: 7.5, y: 0, w: 2.5, h: 4 },
      { i: 'vendor-risks', x: 0, y: 4, w: 2.5, h: 4 },
      { i: 'trainings', x: 2.5, y: 4, w: 2.5, h: 4 },
      { i: 'policies', x: 5, y: 4, w: 2.5, h: 4 },
    ],
    sm: [
      { i: 'projects-evidences', x: 0, y: 0, w: 3, h: 4 },
      { i: 'reports-users', x: 3, y: 0, w: 3, h: 4 },
      { i: 'models', x: 0, y: 4, w: 3, h: 4 },
      { i: 'vendors', x: 3, y: 4, w: 3, h: 4 },
      { i: 'vendor-risks', x: 0, y: 8, w: 3, h: 4 },
      { i: 'trainings', x: 3, y: 8, w: 3, h: 4 },
      { i: 'policies', x: 0, y: 12, w: 3, h: 4 },
    ],
  };

  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts);

  // Fetch user data to check pwd_set status
  const checkPasswordStatus = useCallback(async () => {
    if (!userToken || !userToken.id) return;

    try {
      const response = await getUserById({ userId: parseInt(userToken.id) });
      const userData = response.data || response;

      if (userData && userData.pwd_set === false) {
        setShowPasswordNotification(true);
      }
    } catch (error) {
      console.error('Error checking user password status:', error);
    }
  }, [userToken]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    checkPasswordStatus();
  }, [checkPasswordStatus]);

  useEffect(() => {
    const storedLayouts = localStorage.getItem('verifywise_integrated_dashboard_layouts');
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
    localStorage.setItem('verifywise_integrated_dashboard_layouts', JSON.stringify(allLayouts));
  }, []);

  const resetLayout = () => {
    setLayouts(defaultLayouts);
    localStorage.removeItem('verifywise_integrated_dashboard_layouts');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Dashboard...</Typography>
      </Box>
    );
  }

  if (!mounted) return null;

  // Widget definitions with your actual dashboard data
  const widgets = [
    {
      id: 'projects-evidences',
      content: (
        <Stack spacing={1.5} sx={{ height: '100%' }}>
          <Box sx={{ flex: '1 1 50%' }}>
            <MetricCard
              title="Projects"
              value={dashboard?.projects || 0}
              navigable={false}
              compact={true}
            />
          </Box>
          <Box sx={{ flex: '1 1 50%' }}>
            <MetricCard
              title="Evidence"
              value={evidenceMetrics?.total || 0}
              onClick={() => navigate('/file-manager')}
              navigable={true}
              compact={true}
            />
          </Box>
        </Stack>
      ),
      title: 'Projects & Evidence'
    },
    {
      id: 'reports-users',
      content: (
        <Stack spacing={1.5} sx={{ height: '100%' }}>
          <Box sx={{ flex: '1 1 50%' }}>
            <MetricCard
              title="Reports"
              value={dashboard?.reports || 0}
              onClick={() => navigate('/reporting')}
              navigable={true}
              compact={true}
            />
          </Box>
          <Box sx={{ flex: '1 1 50%' }}>
            <MetricCard
              title="Users"
              value={usersMetrics?.total || 0}
              navigable={false}
              compact={true}
            />
          </Box>
        </Stack>
      ),
      title: 'Reports & Users'
    },
    {
      id: 'models',
      content: (
        <MetricCard
          title="Models"
          value={dashboard?.models || 0}
          onClick={() => navigate('/model-inventory')}
          navigable={true}
          statusData={getDefaultStatusDistribution('models', dashboard?.models || 0)}
          entityType="models"
        />
      ),
      title: 'AI Models'
    },
    {
      id: 'vendors',
      content: (
        <MetricCard
          title="Vendors"
          value={vendorMetrics?.total || 0}
          onClick={() => navigate('/vendors')}
          navigable={true}
          statusData={vendorMetrics?.statusDistribution}
          entityType="vendors"
        />
      ),
      title: 'Vendors'
    },
    {
      id: 'vendor-risks',
      content: (
        <MetricCard
          title="Vendor Risks"
          value={vendorRiskMetrics?.total || 0}
          onClick={() => navigate('/vendors')}
          navigable={true}
          statusData={vendorRiskMetrics?.statusDistribution}
          entityType="vendorRisks"
        />
      ),
      title: 'Vendor Risks'
    },
    {
      id: 'trainings',
      content: (
        <MetricCard
          title="Trainings"
          value={dashboard?.trainings || 0}
          onClick={() => navigate('/training')}
          navigable={true}
          statusData={getDefaultStatusDistribution('trainings', dashboard?.trainings || 0)}
          entityType="trainings"
        />
      ),
      title: 'Trainings'
    },
    {
      id: 'policies',
      content: (
        <MetricCard
          title="Policies"
          value={policyMetrics?.total || 0}
          onClick={() => navigate('/policies')}
          navigable={true}
          statusData={policyMetrics?.statusDistribution}
          entityType="policies"
        />
      ),
      title: 'Policies'
    },
  ];

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      {/* Password notification */}
      {showPasswordNotification && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant="warning"
            title="Set Your Password"
            body="You signed in with Google but haven't set a password yet. For account security, please set a password that you can use to access your account."
            isToast={true}
            onClick={() => {
              setShowPasswordNotification(false);
            }}
          />
        </Suspense>
      )}

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography
            variant="h5"
            sx={(theme) => ({
              fontWeight: 400,
              color: theme.palette.text.primary,
              fontSize: '1.5rem'
            })}
          >
            Dashboard
          </Typography>
          <Typography
            variant="body2"
            sx={(theme) => ({
              color: theme.palette.text.tertiary,
              fontSize: theme.typography.fontSize,
              fontWeight: 400
            })}
          >
            Overview of your AI governance platform
          </Typography>
        </Box>

        {/* Edit Mode Controls */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {editMode && (
            <Tooltip title="Reset Layout">
              <IconButton onClick={resetLayout} size="small">
                <ResetIcon />
              </IconButton>
            </Tooltip>
          )}
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
                {editMode ? <EditIcon /> : <ViewIcon />}
                <Typography>{editMode ? 'Edit Mode' : 'View Mode'}</Typography>
              </Box>
            }
          />
        </Box>
      </Stack>

      <PageHeader title="" description="" />

      {/* Info Banner for Edit Mode */}
      {editMode && (
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

      {/* CSS for drag and drop */}
      <style jsx global>{`
        .react-grid-layout {
          position: relative;
          margin-top: 20px;
        }

        .react-grid-item {
          transition: all 200ms ease;
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
          opacity: 0.9;
          box-shadow: 0 12px 24px rgba(0,0,0,0.2) !important;
        }

        .react-grid-item > .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 5px;
          height: 5px;
          border-right: 2px solid ${alpha(theme.palette.primary.main, 0.4)};
          border-bottom: 2px solid ${alpha(theme.palette.primary.main, 0.4)};
        }

        .react-grid-placeholder {
          background: ${alpha(theme.palette.primary.main, 0.05)};
          border: 2px dashed ${theme.palette.primary.main};
          border-radius: 8px;
          z-index: 2;
        }

        .widget-card-header {
          cursor: ${editMode ? 'grab' : 'default'};
          user-select: ${editMode ? 'none' : 'auto'};
        }

        .widget-card-header:active {
          cursor: ${editMode ? 'grabbing' : 'default'};
        }
      `}</style>

      {/* Key Metrics Section Title */}
      <Typography
        variant="subtitle1"
        gutterBottom
        sx={(theme) => ({
          fontWeight: 400,
          color: theme.palette.text.secondary,
          fontSize: theme.typography.fontSize,
          mt: 4
        })}
      >
        Key Metrics
      </Typography>

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={50}
        isDraggable={editMode}
        isResizable={editMode}
        draggableHandle=".widget-card-header"
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
      >
        {widgets.map((widget) => (
          <Card
            key={widget.id}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: editMode ? theme.shadows[2] : theme.shadows[0],
            }}
          >
            {editMode && (
              <CardHeader
                className="widget-card-header"
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  py: 1,
                  px: 2,
                  '& .MuiCardHeader-title': {
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  },
                }}
                avatar={
                  <DragIcon
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.6),
                      fontSize: '1rem',
                    }}
                  />
                }
                title={widget.title}
              />
            )}
            <Box sx={{ flexGrow: 1, p: editMode ? 2 : 0 }}>
              {widget.content}
            </Box>
          </Card>
        ))}
      </ResponsiveGridLayout>
    </Box>
  );
};

export default IntegratedDashboard;