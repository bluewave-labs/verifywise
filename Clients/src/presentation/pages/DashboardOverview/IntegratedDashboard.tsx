import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Stack,
  CircularProgress,
  Button,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  Refresh as ResetIcon,
  LockOutlined as LockIcon,
  LockOpenOutlined as LockOpenIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import { useDashboard } from '../../../application/hooks/useDashboard';
import { useDashboardMetrics } from '../../../application/hooks/useDashboardMetrics';
import { cardStyles } from '../../themes';
import { useAuth } from '../../../application/hooks/useAuth';
import { ReactComponent as RightArrow } from '../../assets/icons/right-arrow.svg';
import StatusDonutChart, { StatusData } from '../../components/Charts/StatusDonutChart';
import { getDefaultStatusDistribution } from '../../utils/statusColors';
import { getDistributionSummary, getQuickStats, hasCriticalItems, getPriorityLevel } from '../../utils/cardEnhancements';
import DashboardErrorBoundary from '../../components/Dashboard/DashboardErrorBoundary';
import TextEditorCard from '../../components/Dashboard/TextEditorCard';
import WidgetErrorBoundary from '../../components/Dashboard/WidgetErrorBoundary';
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

  // Get status breakdown data
  const chartData = statusData || (entityType ? getDefaultStatusDistribution(entityType, typeof value === 'number' ? value : parseInt(String(value)) || 0) : []);
  const showChart = chartData.length > 0 && typeof value === 'number' && value > 0;

  // Get enhancements
  const distributionSummary = getDistributionSummary(chartData);
  const quickStats = getQuickStats(entityType, typeof value === 'number' ? value : parseInt(String(value)) || 0, chartData);
  const criticalInfo = hasCriticalItems(entityType, chartData);
  const priorityLevel = getPriorityLevel(entityType, typeof value === 'number' ? value : parseInt(String(value)) || 0, chartData);

  // Priority visual cues
  const getPriorityStyles = (theme: any) => {
    switch (priorityLevel) {
      case 'high':
        return {
          borderLeft: '4px solid #EF4444 !important',
          borderTop: `1px solid ${theme.palette.divider} !important`,
          borderRight: `1px solid ${theme.palette.divider} !important`,
          borderBottom: `1px solid ${theme.palette.divider} !important`,
          background: 'linear-gradient(135deg, #FEF2F2 0%, #FDE8E8 100%)'
        };
      case 'medium':
        return {
          borderLeft: '4px solid #F59E0B !important',
          borderTop: `1px solid ${theme.palette.divider} !important`,
          borderRight: `1px solid ${theme.palette.divider} !important`,
          borderBottom: `1px solid ${theme.palette.divider} !important`,
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF6D3 100%)'
        };
      default:
        return {
          border: `1px solid ${theme.palette.divider} !important`,
          background: 'linear-gradient(135deg, #FEFFFE 0%, #F8F9FA 100%)'
        };
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
        ...getPriorityStyles(theme),
        height: '100%',
        minHeight: compact ? '90px' : 'auto',
        cursor: navigable ? 'pointer' : 'default',
        position: 'relative',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        '&:hover': navigable
          ? {
              background: 'linear-gradient(135deg, #F9FAFB 0%, #F1F5F9 100%)',
              borderColor: '#D1D5DB',
            }
          : {}
      })}
    >
      <CardContent sx={{
        pt: 0,
        pb: compact ? 1.5 : 2,
        px: compact ? 1.5 : 2,
        position: 'relative',
        height: 'calc(100% - 1px)',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
      }}>
        {/* Header section with title and arrow icon */}
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: compact ? 1 : 2, mt: compact ? 1.5 : 2 }}>
          <Typography
            variant="body2"
            sx={(theme) => ({
              color: theme.palette.text.tertiary,
              fontSize: compact ? '12px' : theme.typography.fontSize,
              fontWeight: 400
            })}
          >
            {title}
          </Typography>

          {navigable && (
            <Box
              sx={{
                opacity: isHovered ? 1 : 0.3,
                transition: 'opacity 0.2s ease',
              }}
            >
              <RightArrow />
            </Box>
          )}
        </Box>

        {/* Content section */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: compact ? 'center' : 'flex-start' }}>
          {showChart ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
                <StatusDonutChart
                  data={chartData}
                  total={typeof value === 'number' ? value : parseInt(String(value)) || 0}
                  size={60}
                />
                <Box>
                  <Typography
                    variant="h6"
                    sx={(theme) => ({
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      fontSize: '1.25rem',
                      lineHeight: 1
                    })}
                  >
                    {value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={(theme) => ({
                      color: theme.palette.text.tertiary,
                      fontSize: '11px',
                      display: 'block',
                      mt: 0.5
                    })}
                  >
                    Total
                  </Typography>
                </Box>
              </Box>

              {/* Distribution Summary */}
              {distributionSummary && (
                <Typography
                  variant="caption"
                  sx={(theme) => ({
                    color: theme.palette.text.secondary,
                    fontSize: '12px',
                    display: 'block',
                    textAlign: 'center',
                    mb: 1
                  })}
                >
                  {distributionSummary}
                </Typography>
              )}

              {/* Quick Stats */}
              {quickStats && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                  <Chip
                    label={quickStats}
                    size="small"
                    sx={{
                      fontSize: '11px',
                      height: '22px',
                      background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
                      color: '#374151',
                      fontWeight: 500
                    }}
                  />
                </Box>
              )}

              {/* Quick Action Button - Bottom Right */}
              {criticalInfo.hasCritical && (
                <Box sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  zIndex: 1
                }}>
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
                        background: priorityLevel === 'high' ? 'linear-gradient(135deg, #FEF2F2 0%, #FDE8E8 100%)' : 'linear-gradient(135deg, #FFFBEB 0%, #FEF6D3 100%)'
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
  const { userToken: _ } = useAuth();

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Password notification state
  const [showPasswordNotification, setShowPasswordNotification] = useState(false);

  // Default layouts for the dashboard sections with 4-column constraint
  // Each widget takes exactly 1/4 of the width and cannot be smaller
  // Heights: Users/Reports/Projects/Evidence are always small (85px), others can be big (170px)
  const defaultLayouts: Layouts = {
    lg: [
      // First row - 4 widgets (small widgets = h:2, fixed width, not resizable)
      { i: 'projects', x: 0, y: 0, w: 3, h: 2, minW: 3, maxW: 3, minH: 2, maxH: 2 },
      { i: 'evidences', x: 3, y: 0, w: 3, h: 2, minW: 3, maxW: 3, minH: 2, maxH: 2 },
      { i: 'reports', x: 6, y: 0, w: 3, h: 2, minW: 3, maxW: 3, minH: 2, maxH: 2 },
      { i: 'users', x: 9, y: 0, w: 3, h: 2, minW: 3, maxW: 3, minH: 2, maxH: 2 },
      // Second row - 4 widgets (can be big = h:4)
      { i: 'models', x: 0, y: 2, w: 3, h: 4, minW: 3, maxW: 6, minH: 2, maxH: 4 },
      { i: 'vendors', x: 3, y: 2, w: 3, h: 4, minW: 3, maxW: 6, minH: 2, maxH: 4 },
      { i: 'vendor-risks', x: 6, y: 2, w: 3, h: 4, minW: 3, maxW: 6, minH: 2, maxH: 4 },
      { i: 'trainings', x: 9, y: 2, w: 3, h: 4, minW: 3, maxW: 6, minH: 2, maxH: 4 },
      // Third row - 2 widgets (can be big = h:4)
      { i: 'policies', x: 0, y: 6, w: 3, h: 4, minW: 3, maxW: 6, minH: 2, maxH: 4 },
      { i: 'text-editor', x: 3, y: 6, w: 3, h: 4 }, // No size constraints for note-taking widget
    ],
    md: [
      // First row - 4 widgets (2.5 columns each for 10-column grid, fixed width, not resizable)
      { i: 'projects', x: 0, y: 0, w: 2.5, h: 2, minW: 2.5, maxW: 2.5, minH: 2, maxH: 2 },
      { i: 'evidences', x: 2.5, y: 0, w: 2.5, h: 2, minW: 2.5, maxW: 2.5, minH: 2, maxH: 2 },
      { i: 'reports', x: 5, y: 0, w: 2.5, h: 2, minW: 2.5, maxW: 2.5, minH: 2, maxH: 2 },
      { i: 'users', x: 7.5, y: 0, w: 2.5, h: 2, minW: 2.5, maxW: 2.5, minH: 2, maxH: 2 },
      // Second row - 4 widgets
      { i: 'models', x: 0, y: 2, w: 2.5, h: 4, minW: 2.5, maxW: 5, minH: 2, maxH: 4 },
      { i: 'vendors', x: 2.5, y: 2, w: 2.5, h: 4, minW: 2.5, maxW: 5, minH: 2, maxH: 4 },
      { i: 'vendor-risks', x: 5, y: 2, w: 2.5, h: 4, minW: 2.5, maxW: 5, minH: 2, maxH: 4 },
      { i: 'trainings', x: 7.5, y: 2, w: 2.5, h: 4, minW: 2.5, maxW: 5, minH: 2, maxH: 4 },
      // Third row - 2 widgets
      { i: 'policies', x: 0, y: 6, w: 2.5, h: 4, minW: 2.5, maxW: 5, minH: 2, maxH: 4 },
      { i: 'text-editor', x: 2.5, y: 6, w: 2.5, h: 4 }, // No size constraints for note-taking widget
    ],
    sm: [
      // For small screens, 2 widgets per row (half width each)
      { i: 'projects', x: 0, y: 0, w: 3, h: 2, minW: 3, maxW: 3, minH: 2, maxH: 2 },
      { i: 'evidences', x: 3, y: 0, w: 3, h: 2, minW: 3, maxW: 3, minH: 2, maxH: 2 },
      { i: 'reports', x: 0, y: 2, w: 3, h: 2, minW: 3, maxW: 3, minH: 2, maxH: 2 },
      { i: 'users', x: 3, y: 2, w: 3, h: 2, minW: 3, maxW: 3, minH: 2, maxH: 2 },
      { i: 'models', x: 0, y: 4, w: 3, h: 4, minW: 3, maxW: 3, minH: 2, maxH: 4 },
      { i: 'vendors', x: 3, y: 4, w: 3, h: 4, minW: 3, maxW: 3, minH: 2, maxH: 4 },
      { i: 'vendor-risks', x: 0, y: 8, w: 3, h: 4, minW: 3, maxW: 3, minH: 2, maxH: 4 },
      { i: 'trainings', x: 3, y: 8, w: 3, h: 4, minW: 3, maxW: 3, minH: 2, maxH: 4 },
      { i: 'policies', x: 0, y: 12, w: 3, h: 4, minW: 3, maxW: 3, minH: 2, maxH: 4 },
      { i: 'text-editor', x: 3, y: 12, w: 3, h: 4 }, // No size constraints for note-taking widget
    ],
  };

  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts);

  // Helper function to check if a widget should always be small (85px)
  const isRestrictedToSmallHeight = useCallback((widgetId: string): boolean => {
    return ['users', 'reports', 'projects', 'evidences'].includes(widgetId);
  }, []);

  // Helper function to check if a widget should have unlimited size (text editor)
  const isUnlimitedSize = useCallback((widgetId: string): boolean => {
    return widgetId === 'text-editor';
  }, []);

  // Constraint utility functions to eliminate code duplication
  const getWidthConstraints = useCallback((breakpoint: string) => ({
    lg: { min: 3, max: 6 },    // 1/4 to 1/2 of 12 columns
    md: { min: 2.5, max: 5 },  // 1/4 to 1/2 of 10 columns
    sm: { min: 3, max: 3 }     // Fixed at 1/2 of 6 columns
  }[breakpoint] || { min: 3, max: 6 }), []);

  const getFixedWidths = useCallback((breakpoint: string) => ({
    lg: 3,    // 1/4 of 12 columns
    md: 2.5,  // 1/4 of 10 columns
    sm: 3     // 1/2 of 6 columns
  }[breakpoint] || 3), []);

  const enforceHeightConstraint = useCallback((height: number, isRestricted: boolean, isUnlimited: boolean): number => {
    if (isUnlimited) return height; // No height constraints for unlimited widgets
    if (isRestricted) return 2; // Always small for restricted widgets
    if (height <= 2) return 2;  // Small block (85px)
    if (height >= 4) return 4;  // Big block (170px) - max allowed
    return height < 3 ? 2 : 4;  // Snap to nearest
  }, []);

  const enforceWidthConstraint = useCallback((
    width: number,
    isRestricted: boolean,
    isUnlimited: boolean,
    breakpoint: string
  ): number => {
    if (isUnlimited) return width; // No width constraints for unlimited widgets
    if (isRestricted) return getFixedWidths(breakpoint);
    const constraint = getWidthConstraints(breakpoint);
    return Math.max(constraint.min, Math.min(constraint.max, width));
  }, [getFixedWidths, getWidthConstraints]);

  const enforceLayoutItemConstraints = useCallback((
    item: Layout,
    breakpoint: string
  ): Layout => {
    const isRestricted = isRestrictedToSmallHeight(item.i);
    const isUnlimited = isUnlimitedSize(item.i);

    if (isUnlimited) {
      // No constraints for unlimited widgets
      return item;
    }

    return {
      ...item,
      h: enforceHeightConstraint(item.h, isRestricted, isUnlimited),
      w: enforceWidthConstraint(item.w, isRestricted, isUnlimited, breakpoint)
    };
  }, [isRestrictedToSmallHeight, isUnlimitedSize, enforceHeightConstraint, enforceWidthConstraint]);


  useEffect(() => {
    // Run initial data fetch once on mount
    fetchDashboard();
  }, []); // Empty dependency array - only run once on mount

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

  const handleLayoutChange = useCallback((_: Layout[], allLayouts: Layouts) => {
    // Ensure all heights are exactly 2 or 4 and width constraints are enforced before saving
    const enforcedLayouts = { ...allLayouts };
    Object.keys(enforcedLayouts).forEach(breakpoint => {
      enforcedLayouts[breakpoint] = enforcedLayouts[breakpoint].map(item =>
        enforceLayoutItemConstraints(item, breakpoint)
      );
    });

    setLayouts(enforcedLayouts);

    // Safe localStorage save with error handling
    try {
      const serialized = JSON.stringify(enforcedLayouts);
      if (serialized.length > 4.5 * 1024 * 1024) { // 4.5MB safety margin
        console.error('Layout data too large for localStorage');
        console.warn('Layout is too complex and may not be saved. Consider resetting to default.');
        return;
      }
      localStorage.setItem('verifywise_integrated_dashboard_layouts', serialized);
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        console.error('localStorage quota exceeded:', error);
        console.warn('Storage quota exceeded. Layout changes not saved. Try resetting layout.');
      } else {
        console.error('Failed to save layout to localStorage:', error);
      }
    }
  }, [enforceLayoutItemConstraints]);

  // Handle resize to enforce constraints: height 2 or 4, width constraints
  const handleResize = useCallback((_: Layout[], __: Layout, newItem: Layout,
    placeholder: Layout, ___: MouseEvent, ____: HTMLElement) => {
    const isRestricted = isRestrictedToSmallHeight(newItem.i);
    const isUnlimited = isUnlimitedSize(newItem.i);

    // Skip constraints for unlimited widgets
    if (isUnlimited) return;

    // Enforce height constraints
    if (newItem.h !== undefined) {
      const constrainedHeight = enforceHeightConstraint(newItem.h, isRestricted, isUnlimited);
      newItem.h = constrainedHeight;
      placeholder.h = constrainedHeight;
    }

    // Enforce width constraints (use 'lg' breakpoint for real-time resize)
    if (newItem.w !== undefined) {
      const constrainedWidth = enforceWidthConstraint(newItem.w, isRestricted, isUnlimited, 'lg');
      newItem.w = constrainedWidth;
      placeholder.w = constrainedWidth;
    }
  }, [isRestrictedToSmallHeight, isUnlimitedSize, enforceHeightConstraint, enforceWidthConstraint]);

  // Ensure final constraints when resize stops
  const handleResizeStop = useCallback((_: Layout[], __: Layout, newItem: Layout,
    ___: Layout, ____: MouseEvent, _____: HTMLElement) => {
    const isUnlimited = isUnlimitedSize(newItem.i);

    // Update all responsive layouts to ensure consistency across breakpoints
    setLayouts(prevLayouts => {
      const updatedLayouts = { ...prevLayouts };
      Object.keys(updatedLayouts).forEach(breakpoint => {
        updatedLayouts[breakpoint] = updatedLayouts[breakpoint].map(item => {
          if (item.i === newItem.i) {
            if (isUnlimited) {
              // For unlimited widgets, just update with new dimensions
              return { ...item, h: newItem.h, w: newItem.w };
            } else {
              // Apply constraints using the current item dimensions from the resize
              return enforceLayoutItemConstraints(
                { ...item, h: newItem.h, w: newItem.w },
                breakpoint
              );
            }
          }
          return item;
        });
      });

      // Safe localStorage save with error handling
      try {
        const serialized = JSON.stringify(updatedLayouts);
        if (serialized.length > 4.5 * 1024 * 1024) { // 4.5MB safety margin
          console.error('Layout data too large for localStorage');
          console.warn('Layout is too complex and may not be saved. Consider resetting to default.');
        } else {
          localStorage.setItem('verifywise_integrated_dashboard_layouts', serialized);
        }
      } catch (error) {
        if (error instanceof DOMException && error.code === 22) {
          console.error('localStorage quota exceeded:', error);
          console.warn('Storage quota exceeded. Layout changes not saved. Try resetting layout.');
        } else {
          console.error('Failed to save layout to localStorage:', error);
        }
      }

      return updatedLayouts;
    });
  }, [isUnlimitedSize, enforceLayoutItemConstraints]);

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
      id: 'projects',
      content: (
        <MetricCard
          title="Projects"
          value={dashboard?.projects || 0}
          navigable={false}
        />
      ),
      title: 'Projects'
    },
    {
      id: 'evidences',
      content: (
        <MetricCard
          title="Evidence"
          value={evidenceMetrics?.total || 0}
          navigable={false}
        />
      ),
      title: 'Evidence'
    },
    {
      id: 'reports',
      content: (
        <MetricCard
          title="Reports"
          value={dashboard?.reports || 0}
          navigable={false}
        />
      ),
      title: 'Reports'
    },
    {
      id: 'users',
      content: (
        <MetricCard
          title="Users"
          value={usersMetrics?.total || 0}
          navigable={false}
        />
      ),
      title: 'Users'
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
          statusData={vendorMetrics?.statusDistribution?.map(item => ({ ...item, label: item.name }))}
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
          statusData={vendorRiskMetrics?.statusDistribution?.map(item => ({ ...item, label: item.name }))}
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
          statusData={policyMetrics?.statusDistribution?.map(item => ({ ...item, label: item.name }))}
          entityType="policies"
        />
      ),
      title: 'Policies'
    },
    {
      id: 'text-editor',
      content: (
        <TextEditorCard />
      ),
      title: 'Notes'
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
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
            <Typography
              variant="body2"
              color="primary"
              sx={{ fontWeight: 500, fontSize: '13px' }}
            >
              Edit mode active
            </Typography>
          )}
          <Tooltip title={editMode ? "Lock layout (view mode)" : "Unlock layout (edit mode)"}>
            <IconButton
              onClick={() => setEditMode(!editMode)}
              color="primary"
              size="medium"
            >
              {editMode ?
                <LockOpenIcon sx={{
                  color: '#344054',
                  '& path': { strokeWidth: '1.5px' }
                }} /> :
                <LockIcon sx={{
                  color: '#344054',
                  '& path': { strokeWidth: '1.5px' }
                }} />
              }
            </IconButton>
          </Tooltip>
          {editMode && (
            <Tooltip title="Reset Layout">
              <IconButton onClick={resetLayout} size="small">
                <ResetIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Stack>


      {/* CSS for drag and drop */}
      <style>{`
        .react-grid-layout {
          position: relative;
          margin-top: 20px;
          ${editMode ? `
            background-image:
              linear-gradient(${alpha(theme.palette.divider, 0.1)} 1px, transparent 1px),
              linear-gradient(90deg, ${alpha(theme.palette.divider, 0.1)} 1px, transparent 1px);
            background-size: calc(100% / 12) 42.5px;
            background-position: 0 0, 0 0;
          ` : ''}
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
          opacity: 0.6;
          box-shadow: 0 12px 24px rgba(0,0,0,0.2) !important;
        }

        /* Multiple resize handles styling */
        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
        }

        .react-grid-item > .react-resizable-handle::after {
          content: "";
          position: absolute;
          border: 2px solid transparent;
          transition: border-color 0.2s ease;
        }

        .react-grid-item > .react-resizable-handle-se {
          bottom: 0;
          right: 0;
          cursor: se-resize;
        }

        .react-grid-item > .react-resizable-handle-se::after {
          right: 3px;
          bottom: 3px;
          width: 5px;
          height: 5px;
          border-right: 2px solid transparent;
          border-bottom: 2px solid transparent;
        }

        .react-grid-item > .react-resizable-handle-sw {
          bottom: 0;
          left: 0;
          cursor: sw-resize;
        }

        .react-grid-item > .react-resizable-handle-sw::after {
          left: 3px;
          bottom: 3px;
          width: 5px;
          height: 5px;
          border-left: 2px solid transparent;
          border-bottom: 2px solid transparent;
        }

        .react-grid-item > .react-resizable-handle-ne {
          top: 0;
          right: 0;
          cursor: ne-resize;
        }

        .react-grid-item > .react-resizable-handle-ne::after {
          right: 3px;
          top: 3px;
          width: 5px;
          height: 5px;
          border-right: 2px solid transparent;
          border-top: 2px solid transparent;
        }

        .react-grid-item > .react-resizable-handle-nw {
          top: 0;
          left: 0;
          cursor: nw-resize;
        }

        .react-grid-item > .react-resizable-handle-nw::after {
          left: 3px;
          top: 3px;
          width: 5px;
          height: 5px;
          border-left: 2px solid transparent;
          border-top: 2px solid transparent;
        }

        .react-grid-item > .react-resizable-handle-s {
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          cursor: s-resize;
          width: 40px;
          height: 10px;
        }

        .react-grid-item > .react-resizable-handle-n {
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          cursor: n-resize;
          width: 40px;
          height: 10px;
        }

        .react-grid-item > .react-resizable-handle-e {
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          cursor: e-resize;
          width: 10px;
          height: 40px;
        }

        .react-grid-item > .react-resizable-handle-w {
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          cursor: w-resize;
          width: 10px;
          height: 40px;
        }

        .react-grid-placeholder {
          background: #E2E8F0 !important;
          background-image: radial-gradient(circle, #64748B 1px, transparent 1px) !important;
          background-size: 10px 10px !important;
          border: 2px dashed #94A3B8 !important;
          border-radius: 8px;
          z-index: 2;
          transition: all 200ms ease;
        }

        .widget-card-header {
          cursor: ${editMode ? 'grab' : 'default'};
          user-select: ${editMode ? 'none' : 'auto'};
        }

        .widget-card-header:active {
          cursor: ${editMode ? 'grabbing' : 'default'};
        }

        /* Handles remain invisible - no visual indicators */
      `}</style>


      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        onResize={handleResize}
        onResizeStop={handleResizeStop}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={42.5}
        isDraggable={editMode}
        isResizable={editMode}
        draggableHandle=".widget-card-header"
        resizeHandles={['se', 'sw', 'ne', 'nw', 's', 'e', 'n', 'w']}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
        autoSize={true}
        isBounded={true}
      >
        {widgets.map((widget) => (
          <Card
            key={widget.id}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'none',
              border: `1px solid ${theme.palette.divider}`,
              background: 'transparent',
            }}
          >
            {editMode && (
              <CardHeader
                className="widget-card-header"
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
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
              <WidgetErrorBoundary widgetId={widget.id} widgetTitle={widget.title}>
                {widget.content}
              </WidgetErrorBoundary>
            </Box>
          </Card>
        ))}
      </ResponsiveGridLayout>
    </Box>
  );
};

// Wrap the dashboard with error boundary for better error handling
const ProtectedIntegratedDashboard: React.FC = () => {
  return (
    <DashboardErrorBoundary>
      <IntegratedDashboard />
    </DashboardErrorBoundary>
  );
};

export default ProtectedIntegratedDashboard;