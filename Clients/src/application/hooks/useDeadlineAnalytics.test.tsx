/**
 * Test component for useDeadlineAnalytics hook
 * This component demonstrates how to use the deadline analytics hook
 * and provides testing functionality
 */

import React from 'react';
import {
  useDeadlineAnalytics,
  useDeadlineSummary,
  useDeadlineDetails,
} from './useDeadlineAnalytics';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Refresh, Warning, Schedule } from '@mui/icons-material';

/**
 * DeadlineAnalyticsTest Component
 *
 * This component provides a comprehensive test interface for the deadline analytics hooks
 * It demonstrates:
 * 1. Basic usage of useDeadlineAnalytics
 * 2. Simplified usage with useDeadlineSummary
 * 3. Detailed view with useDeadlineDetails
 * 4. Error handling and loading states
 * 5. Refetch functionality
 */
export const DeadlineAnalyticsTest: React.FC = () => {
  // Full analytics hook with auto-refresh enabled
  const {
    state,
    summary,
    config,
    totalOverdue,
    totalDueSoon,
    totalDeadlineIssues,
    hasDeadlines,
    loading,
    error,
    refetchAll,
    invalidateCache,
    getDetails,
    useDeadlineDetails,
  } = useDeadlineAnalytics({
    entityType: 'tasks',
    autoRefresh: false, // Set to true to enable auto-refresh
    refreshInterval: 30000, // 30 seconds
    enableCache: true,
    onError: (error) => {
      console.error('Deadline analytics error:', error);
    },
    onSuccess: (data) => {
      console.log('Deadline analytics updated:', data);
    },
  });

  // Simplified summary hook
  const {
    summary: quickSummary,
    loading: quickLoading,
    totalOverdue: quickOverdue,
    totalDueSoon: quickDueSoon,
    hasDeadlines: quickHasDeadlines,
    refetch: quickRefetch,
  } = useDeadlineSummary('tasks');

  // Detailed view hook for overdue tasks
  const {
    data: overdueTasks,
    loading: overdueLoading,
    error: overdueError,
    refetch: refetchOverdue,
  } = useDeadlineDetails('tasks', 'overdue', 1, 5);

  // Detailed view hook for due-soon tasks
  const {
    data: dueSoonTasks,
    loading: dueSoonLoading,
    error: dueSoonError,
    refetch: refetchDueSoon,
  } = useDeadlineDetails('tasks', 'dueSoon', 1, 5);

  // Handle manual detail fetching
  const handleGetOverdueDetails = async () => {
    try {
      const details = await getDetails({ category: 'overdue', page: 1, limit: 10 });
      console.log('Overdue details:', details);
    } catch (error) {
      console.error('Error fetching overdue details:', error);
    }
  };

  const handleGetDueSoonDetails = async () => {
    try {
      const details = await getDetails({ category: 'dueSoon', page: 1, limit: 10 });
      console.log('Due-soon details:', details);
    } catch (error) {
      console.error('Error fetching due-soon details:', error);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Deadline Analytics Test Component
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        This component demonstrates the useDeadlineAnalytics hook functionality.
        Check the browser console for detailed logs and error messages.
      </Typography>

      {/* Error Display */}
      {(error.summary || error.config) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Errors:</Typography>
          {error.summary && <Typography>Error loading summary: {error.summary}</Typography>}
          {error.config && <Typography>Error loading config: {error.config}</Typography>}
        </Alert>
      )}

      {/* Loading Indicator */}
      {(loading.summary || loading.config) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Loading deadline analytics...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {/* Quick Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Quick Summary
              </Typography>
              {quickLoading ? (
                <LinearProgress />
              ) : (
                <Box>
                  <Typography variant="body2">Total Issues: {quickOverdue + quickDueSoon}</Typography>
                  <Typography variant="body2">Overdue: {quickOverdue}</Typography>
                  <Typography variant="body2">Due Soon: {quickDueSoon}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error" gutterBottom>
                Overdue Tasks
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h4">{totalOverdue}</Typography>
                <Warning color="error" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main" gutterBottom>
                Due Soon Tasks
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h4">{totalDueSoon}</Typography>
                <Schedule color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main" gutterBottom>
                Total Issues
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h4">{totalDeadlineIssues}</Typography>
                <Chip
                  label={hasDeadlines ? 'Action Needed' : 'All Clear'}
                  color={hasDeadlines ? 'warning' : 'success'}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Control Buttons */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Controls
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={refetchAll}
              disabled={loading.summary}
            >
              Refetch All Data
            </Button>
            <Button
              variant="outlined"
              onClick={invalidateCache}
            >
              Clear Cache
            </Button>
            <Button
              variant="outlined"
              onClick={quickRefetch}
              disabled={quickLoading}
            >
              Quick Refetch
            </Button>
            <Button
              variant="outlined"
              onClick={handleGetOverdueDetails}
              disabled={loading.summary}
            >
              Get Overdue Details
            </Button>
            <Button
              variant="outlined"
              onClick={handleGetDueSoonDetails}
              disabled={loading.summary}
            >
              Get Due Soon Details
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Detailed Task Lists */}
      <Grid container spacing={3}>
        {/* Overdue Tasks */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error" gutterBottom>
                Overdue Tasks ({overdueTasks?.length || 0})
              </Typography>
              {overdueLoading ? (
                <LinearProgress />
              ) : overdueError ? (
                <Alert severity="error">Error loading overdue tasks</Alert>
              ) : overdueTasks && overdueTasks.length > 0 ? (
                <List dense>
                  {overdueTasks.map((task: any) => (
                    <React.Fragment key={task.id}>
                      <ListItem>
                        <ListItemText
                          primary={task.title}
                          secondary={`Due: ${new Date(task.due_date).toLocaleDateString()} - Priority: ${task.priority}`}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">No overdue tasks found</Typography>
              )}
              <Button
                onClick={refetchOverdue}
                sx={{ mt: 1 }}
                size="small"
              >
                Refresh Overdue
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Due Soon Tasks */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main" gutterBottom>
                Due Soon Tasks ({dueSoonTasks?.length || 0})
              </Typography>
              {dueSoonLoading ? (
                <LinearProgress />
              ) : dueSoonError ? (
                <Alert severity="error">Error loading due-soon tasks</Alert>
              ) : dueSoonTasks && dueSoonTasks.length > 0 ? (
                <List dense>
                  {dueSoonTasks.map((task: any) => (
                    <React.Fragment key={task.id}>
                      <ListItem>
                        <ListItemText
                          primary={task.title}
                          secondary={`Due: ${new Date(task.due_date).toLocaleDateString()} - Priority: ${task.priority}`}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">No due-soon tasks found</Typography>
              )}
              <Button
                onClick={refetchDueSoon}
                sx={{ mt: 1 }}
                size="small"
              >
                Refresh Due Soon
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Configuration Display */}
      {config && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Configuration
            </Typography>
            <Typography variant="body2">
              Due-soon threshold: {config.dueSoonThresholdDays} days
            </Typography>
            <Typography variant="body2">
              Completed statuses: {config.completedStatuses.join(', ')}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Debug Information
          </Typography>
          <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
            {JSON.stringify({
              summary,
              config,
              loading,
              error,
              lastUpdated: state.lastUpdated,
            }, null, 2)}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DeadlineAnalyticsTest;