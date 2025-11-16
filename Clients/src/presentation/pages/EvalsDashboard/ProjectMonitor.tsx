import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Stack,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { monitoringService } from "../../../infrastructure/api/evaluationLogsService";
import type { MonitorDashboard } from "../../../infrastructure/api/evaluationLogsService";

interface ProjectMonitorProps {
  projectId: string;
}

export default function ProjectMonitor({ projectId }: ProjectMonitorProps) {
  const [dashboardData, setDashboardData] = useState<MonitorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const response = await monitoringService.getDashboard(projectId);
      setDashboardData(response.data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [projectId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="body2" color="text.secondary">
          No monitoring data available
        </Typography>
      </Box>
    );
  }

  const { metrics, logs, recent_experiments } = dashboardData;

  // Calculate trends (placeholder - would need historical data)
  const errorRateTrend = logs.error_rate > 5 ? "up" : "down";

  return (
    <Box sx={{ userSelect: "none" }}>
      {/* Header with Refresh */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Activity size={24} color="#13715B" />
          <Typography variant="h5">Real-time Monitor</Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={() => loadDashboardData(true)} disabled={refreshing}>
            <RefreshCw size={20} className={refreshing ? "spinning" : ""} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} mb={3}>
        {/* Total Logs */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%", border: "1px solid #E5E7EB", boxShadow: "none" }}>
            <CardContent>
              <Stack spacing={1}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Total Logs
                  </Typography>
                  <BarChart3 size={16} color="#6B7280" />
                </Box>
                <Typography variant="h4" fontWeight={600}>
                  {logs.total.toLocaleString()}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <CheckCircle size={14} color="#10B981" />
                  <Typography variant="caption" color="text.secondary">
                    {logs.success} successful
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Error Rate */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%", border: "1px solid #E5E7EB", boxShadow: "none" }}>
            <CardContent>
              <Stack spacing={1}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Error Rate
                  </Typography>
                  {errorRateTrend === "up" ? (
                    <TrendingUp size={16} color="#EF4444" />
                  ) : (
                    <TrendingDown size={16} color="#10B981" />
                  )}
                </Box>
                <Typography variant="h4" fontWeight={600}>
                  {logs.error_rate.toFixed(1)}%
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <XCircle size={14} color="#EF4444" />
                  <Typography variant="caption" color="text.secondary">
                    {logs.error} errors
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Avg Latency */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%", border: "1px solid #E5E7EB", boxShadow: "none" }}>
            <CardContent>
              <Stack spacing={1}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Avg Latency
                  </Typography>
                  <Clock size={16} color="#6B7280" />
                </Box>
                <Typography variant="h4" fontWeight={600}>
                  {metrics.latency?.average ? `${metrics.latency.average.toFixed(0)}ms` : "N/A"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {metrics.latency?.count || 0} samples
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Cost */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%", border: "1px solid #E5E7EB", boxShadow: "none" }}>
            <CardContent>
              <Stack spacing={1}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Total Cost
                  </Typography>
                  <DollarSign size={16} color="#6B7280" />
                </Box>
                <Typography variant="h4" fontWeight={600}>
                  ${metrics.cost?.average ? (metrics.cost.average * (metrics.cost.count || 0)).toFixed(4) : "0.00"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg ${metrics.cost?.average?.toFixed(6) || "0.00"}/call
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Experiments */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: "1px solid #E5E7EB", boxShadow: "none" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Recent Experiments
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {recent_experiments.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary">
                    No experiments yet
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {recent_experiments.slice(0, 5).map((exp) => (
                    <Box
                      key={exp.id}
                      sx={{
                        p: 2,
                        border: "1px solid #F3F4F6",
                        borderRadius: 1,
                        backgroundColor: "#FAFBFC",
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" fontWeight={600}>
                          {exp.name}
                        </Typography>
                        <Chip
                          label={exp.status}
                          size="small"
                          sx={{
                            backgroundColor:
                              exp.status === "completed"
                                ? "#c8e6c9"
                                : exp.status === "running"
                                ? "#fff3e0"
                                : exp.status === "failed"
                                ? "#ffebee"
                                : "#e0e0e0",
                            color:
                              exp.status === "completed"
                                ? "#388e3c"
                                : exp.status === "running"
                                ? "#ef6c00"
                                : exp.status === "failed"
                                ? "#c62828"
                                : "#616161",
                            fontWeight: 500,
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            borderRadius: "4px",
                            "& .MuiChip-label": {
                              padding: "4px 8px",
                            },
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(exp.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: "1px solid #E5E7EB", boxShadow: "none" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Performance Metrics
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={3}>
                {/* Latency Stats */}
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Latency Distribution
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="caption" color="text.secondary">
                          Min
                        </Typography>
                        <Typography variant="h6">
                          {metrics.latency?.min ? `${metrics.latency.min.toFixed(0)}ms` : "N/A"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="caption" color="text.secondary">
                          Avg
                        </Typography>
                        <Typography variant="h6">
                          {metrics.latency?.average ? `${metrics.latency.average.toFixed(0)}ms` : "N/A"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="caption" color="text.secondary">
                          Max
                        </Typography>
                        <Typography variant="h6">
                          {metrics.latency?.max ? `${metrics.latency.max.toFixed(0)}ms` : "N/A"}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Token Usage Stats */}
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Token Usage
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Average Tokens
                        </Typography>
                        <Typography variant="h6">
                          {metrics.token_count?.average ? metrics.token_count.average.toFixed(0) : "N/A"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Total Tokens
                        </Typography>
                        <Typography variant="h6">
                          {metrics.token_count?.average && metrics.token_count?.count
                            ? (metrics.token_count.average * metrics.token_count.count).toFixed(0)
                            : "N/A"}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Quality Score */}
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Quality Score Average
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box flex={1}>
                      <LinearProgress
                        variant="determinate"
                        value={(metrics.score_average?.average || 0) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: "#E5E7EB",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: "#13715B",
                          },
                        }}
                      />
                    </Box>
                    <Typography variant="h6" fontWeight={600}>
                      {metrics.score_average?.average ? (metrics.score_average.average * 100).toFixed(1) : "0"}%
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
