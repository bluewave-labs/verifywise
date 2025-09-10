import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Stack,
  CircularProgress
} from '@mui/material';
import { useDashboard } from '../../../application/hooks/useDashboard';
import { useDashboardMetrics } from '../../../application/hooks/useDashboardMetrics';
import { cardStyles } from '../../themes';

interface MetricCardProps {
  title: string;
  value: number | string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value }) => (
  <Card elevation={0} sx={(theme) => ({ 
    ...cardStyles.base(theme),
    height: '100%',
    cursor: 'default',
    '&:hover': { 
      backgroundColor: theme.palette.action?.hover || '#fafafa'
    }
  })}>
    <CardContent sx={{ p: 2 }}>
      <Box>
        <Typography 
          variant="body2" 
          sx={(theme) => ({
            color: theme.palette.text.tertiary,
            fontSize: theme.typography.fontSize,
            fontWeight: 400
          })}
          gutterBottom
        >
          {title}
        </Typography>
        <Typography 
          variant="h6" 
          sx={(theme) => ({
            fontWeight: 400,
            color: theme.palette.text.primary,
            fontSize: '1.25rem'
          })}
        >
          {value}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const WorkingDashboard: React.FC = () => {
  const { dashboard, loading, fetchDashboard } = useDashboard();
  const { evidenceMetrics, vendorRiskMetrics, vendorMetrics, usersMetrics, policyMetrics } = useDashboardMetrics();
  const [componentError, setComponentError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (componentError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Component Error: {componentError}
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Dashboard...</Typography>
      </Box>
    );
  }

  try {
    return (
      <Box sx={{ p: 3, minHeight: '100vh' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
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
        </Stack>

        <Grid container spacing={3}>
          {/* Key Metrics Cards */}
          <Grid item xs={12}>
            <Typography 
              variant="subtitle1" 
              gutterBottom 
              sx={(theme) => ({
                fontWeight: 400,
                color: theme.palette.text.secondary,
                fontSize: theme.typography.fontSize
              })}
            >
              Key Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard
                  title="Projects"
                  value={dashboard?.projects || 0}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard
                  title="Trainings"
                  value={dashboard?.trainings || 0}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard
                  title="Models"
                  value={dashboard?.models || 0}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard
                  title="Reports"
                  value={dashboard?.reports || 0}
                />
              </Grid>
              {evidenceMetrics && (
                <Grid item xs={12} sm={6} md={2.4}>
                  <MetricCard
                    title="Evidences"
                    value={evidenceMetrics.total}
                  />
                </Grid>
              )}
              {vendorRiskMetrics && (
                <Grid item xs={12} sm={6} md={2.4}>
                  <MetricCard
                    title="Vendor Risks"
                    value={vendorRiskMetrics.total}
                  />
                </Grid>
              )}
              {vendorMetrics && (
                <Grid item xs={12} sm={6} md={2.4}>
                  <MetricCard
                    title="Vendors"
                    value={vendorMetrics.total}
                  />
                </Grid>
              )}
              {usersMetrics && (
                <Grid item xs={12} sm={6} md={2.4}>
                  <MetricCard
                    title="Users"
                    value={usersMetrics.total}
                  />
                </Grid>
              )}
              {policyMetrics && (
                <Grid item xs={12} sm={6} md={2.4}>
                  <MetricCard
                    title="Policies"
                    value={policyMetrics.total}
                  />
                </Grid>
              )}
            </Grid>
          </Grid>

        </Grid>
      </Box>
    );
  } catch (error) {
    console.error('❌ Error in WorkingDashboard render:', error);
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Render Error: {String(error)}
        </Typography>
      </Box>
    );
  }
};

export default WorkingDashboard;