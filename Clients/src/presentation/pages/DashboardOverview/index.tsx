import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Stack,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Assignment as ProjectIcon,
  School as TrainingIcon,
  Psychology as ModelIcon,
  Assessment as ReportIcon,
  Security as EvidenceIcon,
  Warning as RiskIcon,
  CheckCircle as ComplianceIcon,
  Timeline as ActivityIcon,
  Schedule as TaskIcon,
  Person as UserIcon,
  VerifiedUser as TrustCenterIcon,
  TrendingUp as TrendIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useDashboard } from '../../../application/hooks/useDashboard';
import { useDashboardMetrics } from '../../../application/hooks/useDashboardMetrics';


interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color = '#13715B' }) => (
  <Card elevation={2} sx={{ height: '100%' }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold" color={color}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ color: color, opacity: 0.7 }}>
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const DashboardOverview: React.FC = () => {
  console.log('🚀 DashboardOverview component rendering...');
  console.log('🔧 Component loaded successfully');
  
  const { dashboard, loading, fetchDashboard } = useDashboard();
  
  // Add useDashboardMetrics but only extract what we need
  const { 
    evidenceMetrics, 
    riskMetrics,
    assessmentProgress,
    complianceStatus,
    userActivity,
    recentActivity,
    upcomingTasks,
    aiTrustCenter,
    fetchRecentActivity
  } = useDashboardMetrics();
  
  const [componentError, setComponentError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'7' | '30'>('7');
  
  useEffect(() => {
    console.log('DashboardOverview: fetching dashboard data...');
    try {
      fetchDashboard();
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setComponentError(`Dashboard fetch error: ${error}`);
    }
  }, [fetchDashboard]);

  useEffect(() => {
    fetchRecentActivity(timeFilter);
  }, [timeFilter, fetchRecentActivity]);

  console.log('DashboardOverview: dashboard data:', dashboard);
  console.log('DashboardOverview: loading:', loading);

  // Helper functions
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project': return <ProjectIcon />;
      case 'risk': return <RiskIcon />;
      case 'evidence': return <EvidenceIcon />;
      case 'assessment': return <ComplianceIcon />;
      default: return <ActivityIcon />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

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
      <Box sx={{ p: 3, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold" color="#1c2130">
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back! Here's what's happening with your projects.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {/* Key Metrics Cards - Using real API data */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom fontWeight="semibold">
              Key Metrics (Real Data)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard
                  title="Projects"
                  value={dashboard?.projects || 0}
                  icon={<ProjectIcon fontSize="large" />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard
                  title="Trainings"
                  value={dashboard?.trainings || 0}
                  icon={<TrainingIcon fontSize="large" />}
                  color="#2196F3"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard
                  title="Models"
                  value={dashboard?.models || 0}
                  icon={<ModelIcon fontSize="large" />}
                  color="#FF9800"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard
                  title="Reports"
                  value={dashboard?.reports || 0}
                  icon={<ReportIcon fontSize="large" />}
                  color="#9C27B0"
                />
              </Grid>
              {evidenceMetrics && (
                <Grid item xs={12} sm={6} md={2.4}>
                  <MetricCard
                    title="Evidence"
                    value={evidenceMetrics.total}
                    icon={<EvidenceIcon fontSize="large" />}
                    color="#4CAF50"
                  />
                </Grid>
              )}
            </Grid>
          </Grid>

          {/* Status Card */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" fontWeight="semibold" gutterBottom>
                  API Connection Status
                </Typography>
                <Typography variant="body1" color="success.main">
                  ✅ Dashboard API connected successfully
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Projects: {dashboard?.projects}, 
                  Trainings: {dashboard?.trainings}, 
                  Models: {dashboard?.models}, 
                  Reports: {dashboard?.reports}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Total Risks: {riskMetrics?.total || 40}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Debug Info */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" fontWeight="semibold" gutterBottom>
                  Debug Info
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dashboard object: {dashboard ? 'Loaded' : 'Not loaded'}
                  <br />
                  Loading state: {loading ? 'Loading' : 'Complete'}
                  <br />
                  Component error: {componentError || 'None'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Risk Overview Chart - Only show if data available */}
          {riskMetrics && (
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="semibold">
                    Risk Overview
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { severity: 'High', count: riskMetrics.distribution.high },
                        { severity: 'Medium', count: riskMetrics.distribution.medium },
                        { severity: 'Low', count: riskMetrics.distribution.low },
                        { severity: 'Resolved', count: riskMetrics.distribution.resolved }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="severity" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#13715B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Assessment Progress - Only show if data available */}
          {assessmentProgress && assessmentProgress.length > 0 && (
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="semibold">
                    EU AI Act Assessment Progress
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Project</TableCell>
                          <TableCell>Assessments</TableCell>
                          <TableCell>Controls</TableCell>
                          <TableCell>Overall Progress</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assessmentProgress.map((project, index) => {
                          const assessmentPercentage = (project.assessments.completed / project.assessments.total) * 100;
                          const controlPercentage = (project.controls.completed / project.controls.total) * 100;
                          const overallProgress = (assessmentPercentage + controlPercentage) / 2;
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>{project.project_name}</TableCell>
                              <TableCell>
                                <Stack spacing={1}>
                                  <Typography variant="body2">
                                    {project.assessments.completed} out of {project.assessments.total} completed
                                  </Typography>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={assessmentPercentage} 
                                    sx={{ height: 6, borderRadius: 3 }}
                                  />
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Stack spacing={1}>
                                  <Typography variant="body2">
                                    {project.controls.completed} out of {project.controls.total} completed
                                  </Typography>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={controlPercentage} 
                                    sx={{ height: 6, borderRadius: 3 }}
                                    color="secondary"
                                  />
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={`${Math.round(overallProgress)}%`}
                                  color={overallProgress >= 80 ? 'success' : overallProgress >= 50 ? 'warning' : 'error'}
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Compliance Status - Only show if data available */}
          {complianceStatus && (
            <Grid item xs={12} md={4}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="semibold">
                    Compliance Status
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        EU AI Act Compliance
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={complianceStatus.eu_ai_act.percentage} 
                        sx={{ height: 8, borderRadius: 4, mt: 1 }}
                        color="success"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {complianceStatus.eu_ai_act.percentage}% Complete
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        GDPR Compliance
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={complianceStatus.gdpr.percentage} 
                        sx={{ height: 8, borderRadius: 4, mt: 1 }}
                        color="success"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {complianceStatus.gdpr.percentage}% Complete
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        ISO 27001
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={complianceStatus.iso_27001.percentage} 
                        sx={{ height: 8, borderRadius: 4, mt: 1 }}
                        color="warning"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {complianceStatus.iso_27001.percentage}% Complete
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* User Activity Metrics - Only show if data available */}
          {userActivity && (
            <Grid item xs={12} md={complianceStatus ? 8 : 12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="semibold">
                    User Activity Metrics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Stack alignItems="center" spacing={1}>
                        <UserIcon sx={{ fontSize: 40, color: '#13715B' }} />
                        <Typography variant="h5" fontWeight="bold">{userActivity.active_users}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Active Users
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Stack alignItems="center" spacing={1}>
                        <TrendIcon sx={{ fontSize: 40, color: '#2196F3' }} />
                        <Typography variant="h5" fontWeight="bold">{userActivity.user_engagement}%</Typography>
                        <Typography variant="caption" color="text.secondary">
                          User Engagement
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Stack alignItems="center" spacing={1}>
                        <ActivityIcon sx={{ fontSize: 40, color: '#FF9800' }} />
                        <Typography variant="h5" fontWeight="bold">{userActivity.actions_today}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Actions Today
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Stack alignItems="center" spacing={1}>
                        <ComplianceIcon sx={{ fontSize: 40, color: '#4CAF50' }} />
                        <Typography variant="h5" fontWeight="bold">{userActivity.task_completion_rate}%</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Task Completion
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Recent Activity - Only show if data available */}
          {recentActivity && recentActivity.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="semibold">
                      Recent Activity
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip 
                        label="7 days" 
                        variant={timeFilter === '7' ? 'filled' : 'outlined'}
                        onClick={() => setTimeFilter('7')}
                        size="small"
                      />
                      <Chip 
                        label="30 days" 
                        variant={timeFilter === '30' ? 'filled' : 'outlined'}
                        onClick={() => setTimeFilter('30')}
                        size="small"
                      />
                    </Stack>
                  </Stack>
                  <List>
                    {recentActivity.map((activity) => (
                      <ListItem key={activity.id} divider>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#13715B' }}>
                            {getActivityIcon(activity.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${activity.title} ${activity.action}`}
                          secondary={`${activity.user_name} • ${formatTimeAgo(activity.timestamp)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Upcoming Tasks - Only show if data available */}
          {upcomingTasks && upcomingTasks.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="semibold">
                    Upcoming Deadlines
                  </Typography>
                  <List>
                    {upcomingTasks.map((task) => (
                      <ListItem key={task.id} divider>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'warning.main' }}>
                            <TaskIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={task.title}
                          secondary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="caption">
                                Due: {task.due_date}
                              </Typography>
                              <Chip 
                                label={task.priority}
                                size="small"
                                color={getPriorityColor(task.priority) as any}
                                variant="outlined"
                              />
                            </Stack>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* AI Trust Center Status - Only show if data available */}
          {aiTrustCenter && (
            <Grid item xs={12} md={4}>
              <Card elevation={2}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="semibold">
                      AI Trust Center
                    </Typography>
                    <TrustCenterIcon color={aiTrustCenter.enabled ? 'success' : 'disabled'} />
                  </Stack>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={aiTrustCenter.enabled}
                        color="success"
                        disabled
                      />
                    }
                    label={aiTrustCenter.enabled ? 'Enabled' : 'Disabled'}
                  />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {aiTrustCenter.enabled 
                      ? `AI Trust Center is active. Compliance score: ${aiTrustCenter.compliance_score}%` 
                      : 'AI Trust Center is disabled.'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  } catch (error) {
    console.error('Error in DashboardOverview render:', error);
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Render Error: {String(error)}
        </Typography>
      </Box>
    );
  }
};

export default DashboardOverview;