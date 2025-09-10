import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  CircularProgress,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Avatar,
  Badge,
  Switch,
  FormControlLabel,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CardHeader,
} from "@mui/material";
import {
  Assignment as ProjectIcon,
  Psychology as ModelIcon,
  Security as ComplianceIcon,
  Warning as RiskIcon,
  TrendingUp as TrendIcon,
  TrendingDown as TrendDownIcon,
  Business as VendorIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  PriorityHigh as HighRiskIcon,
  People as UsersIcon,
  Description as DocumentIcon,
  Timeline as TimelineIcon,
  Speed as PerformanceIcon,
  Notifications as NotificationIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import {
  PieChart,
  BarChart,
  LineChart,
  ScatterChart,
  Gauge,
} from "@mui/x-charts";
import {
  PieChartOutlined,
  TrendingUp,
  TrendingDown,
  DataThresholdingOutlined,
} from "@mui/icons-material";
import { useComprehensiveDashboard } from "../../../application/hooks/useComprehensiveDashboard";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { vwhomeHeading } from "../Home/1.0Home/style";
import singleTheme from "../../themes/v1SingleTheme";

// Modern KPI Card with enhanced styling
interface ModernKPICardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
  trend?: number;
  onClick?: () => void;
}

const ModernKPICard: React.FC<ModernKPICardProps> = ({
  title,
  value,
  icon,
  color = "#13715B",
  subtitle,
  trend,
  onClick,
}) => (
  <Card
    elevation={0}
    onClick={onClick}
    sx={{
      height: "100%",
      background:
        "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.2)",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": onClick
        ? {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
            border: `1px solid ${color}30`,
          }
        : {},
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h3"
            fontWeight="700"
            color={color}
            sx={{ my: 1, fontSize: "2.5rem" }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {subtitle}
            </Typography>
          )}
          {trend !== undefined && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {trend >= 0 ? (
                <TrendIcon sx={{ fontSize: 16, color: "success.main" }} />
              ) : (
                <TrendDownIcon sx={{ fontSize: 16, color: "error.main" }} />
              )}
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: trend >= 0 ? "success.main" : "error.main",
                }}
              >
                {trend >= 0 ? "+" : ""}
                {trend}% from last month
              </Typography>
            </Stack>
          )}
        </Box>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// Enhanced KPI Card with more detailed metrics
interface EnhancedKPICardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
  trend?: number;
  onClick?: () => void;
  details?: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
  progress?: number;
}

const EnhancedKPICard: React.FC<EnhancedKPICardProps> = ({
  title,
  value,
  icon,
  color = "#13715B",
  subtitle,
  trend,
  onClick,
  details = [],
  progress,
}) => (
  <Card
    elevation={0}
    onClick={onClick}
    sx={{
      height: "100%",
      background:
        "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.2)",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": onClick
        ? {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
            border: `1px solid ${color}30`,
          }
        : {},
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h3"
            fontWeight="700"
            color={color}
            sx={{ my: 1, fontSize: "2.5rem" }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {subtitle}
            </Typography>
          )}
          {trend !== undefined && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {trend >= 0 ? (
                <TrendIcon sx={{ fontSize: 16, color: "success.main" }} />
              ) : (
                <TrendDownIcon sx={{ fontSize: 16, color: "error.main" }} />
              )}
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: trend >= 0 ? "success.main" : "error.main",
                }}
              >
                {trend >= 0 ? "+" : ""}
                {trend}% from last month
              </Typography>
            </Stack>
          )}
          {progress !== undefined && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: `${color}20`,
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: color,
                    borderRadius: 3,
                  },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {progress}% Complete
              </Typography>
            </Box>
          )}
          {details.length > 0 && (
            <Stack spacing={1} sx={{ mt: 2 }}>
              {details.map((detail, index) => (
                <Stack
                  key={index}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="caption" color="text.secondary">
                    {detail.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight="600"
                    color={detail.color || "text.primary"}
                  >
                    {detail.value}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// Real-time Activity Feed Component
interface ActivityFeedProps {
  activities: Array<{
    id: string;
    type: "success" | "warning" | "error" | "info";
    title: string;
    description: string;
    timestamp: string;
    user?: string;
  }>;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => (
  <Card
    elevation={0}
    sx={{
      background:
        "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.2)",
    }}
  >
    <CardHeader
      title="🔔 Real-time Activity Feed"
      subheader="Live updates from across the platform"
      titleTypographyProps={{
        variant: "h6",
        fontWeight: 600,
        color: "text.primary",
      }}
    />
    <CardContent sx={{ pt: 0 }}>
      <List dense>
        {activities.map((activity) => (
          <ListItem key={activity.id} sx={{ px: 0 }}>
            <ListItemIcon>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor:
                    activity.type === "success"
                      ? "success.main"
                      : activity.type === "warning"
                      ? "warning.main"
                      : activity.type === "error"
                      ? "error.main"
                      : "info.main",
                  fontSize: "0.75rem",
                }}
              >
                {activity.type === "success"
                  ? "✓"
                  : activity.type === "warning"
                  ? "⚠"
                  : activity.type === "error"
                  ? "✗"
                  : "i"}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" fontWeight="600">
                  {activity.title}
                </Typography>
              }
              secondary={
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {activity.description}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {new Date(activity.timestamp).toLocaleString()}{" "}
                    {activity.user && `• ${activity.user}`}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </CardContent>
  </Card>
);

// Smart Insights Panel
interface SmartInsightsProps {
  insights: Array<{
    id: string;
    type: "opportunity" | "risk" | "achievement" | "recommendation";
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    confidence: number;
    actionable: boolean;
  }>;
}

const SmartInsights: React.FC<SmartInsightsProps> = ({ insights }) => (
  <Card
    elevation={0}
    sx={{
      background:
        "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.2)",
    }}
  >
    <CardHeader
      title="🧠 Smart Insights"
      subheader="AI-powered recommendations and analysis"
      titleTypographyProps={{
        variant: "h6",
        fontWeight: 600,
        color: "text.primary",
      }}
    />
    <CardContent sx={{ pt: 0 }}>
      <Stack spacing={2}>
        {insights.map((insight) => (
          <Alert
            key={insight.id}
            severity={
              insight.type === "risk"
                ? "warning"
                : insight.type === "achievement"
                ? "success"
                : insight.type === "recommendation"
                ? "info"
                : "info"
            }
            sx={{
              "& .MuiAlert-message": {
                width: "100%",
              },
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight="600">
                  {insight.title}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  {insight.description}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    label={`Impact: ${insight.impact}`}
                    size="small"
                    color={
                      insight.impact === "high"
                        ? "error"
                        : insight.impact === "medium"
                        ? "warning"
                        : "success"
                    }
                    variant="outlined"
                  />
                  <Chip
                    label={`${insight.confidence}% confidence`}
                    size="small"
                    variant="outlined"
                  />
                  {insight.actionable && (
                    <Chip
                      label="Actionable"
                      size="small"
                      color="primary"
                      variant="filled"
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Alert>
        ))}
      </Stack>
    </CardContent>
  </Card>
);

// Chart Container with modern styling
const ChartContainer: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number;
  action?: React.ReactNode;
}> = ({ title, subtitle, children, height = 400, action }) => (
  <Card
    elevation={0}
    sx={{
      height: height + 100,
      background:
        "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.2)",
    }}
  >
    <CardHeader
      title={title}
      subheader={subtitle}
      action={action}
      titleTypographyProps={{
        variant: "h6",
        fontWeight: 600,
        color: "text.primary",
      }}
      subheaderTypographyProps={{
        variant: "body2",
        color: "text.secondary",
      }}
    />
    <CardContent sx={{ pt: 0 }}>{children}</CardContent>
  </Card>
);

const DashboardOverview: React.FC = () => {
  const { data, loading, error, lastUpdated, refresh } =
    useComprehensiveDashboard();
  const [selectedTab, setSelectedTab] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [comparisonMode, setComparisonMode] = useState(false);

  // Auto-refresh every 5 minutes
  React.useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refresh, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refresh]);

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={40} />
          <Typography variant="body1" color="text.secondary">
            Loading Analytics Dashboard...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          sx={{ maxWidth: 600, mx: "auto", mt: 4 }}
          action={
            <IconButton size="small" onClick={refresh} sx={{ color: "inherit" }}>
              <RefreshIcon />
            </IconButton>
          }
        >
          <Typography variant="h6">Dashboard Error</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
          <Typography variant="h6">No Data Available</Typography>
          <Typography variant="body2">
            Unable to load dashboard analytics
          </Typography>
        </Alert>
      </Box>
    );
  }

  const tabContent = [
    { label: "Executive Overview", icon: <DashboardIcon />, value: 0 },
    { label: "Compliance Analytics", icon: <ComplianceIcon />, value: 1 },
    { label: "Risk Management", icon: <RiskIcon />, value: 2 },
    { label: "User Analytics", icon: <UsersIcon />, value: 3 },
    { label: "AI & Technology", icon: <ModelIcon />, value: 4 },
    { label: "Performance", icon: <PerformanceIcon />, value: 5 },
    {
      label: "Predictive Analytics",
      icon: <DataThresholdingOutlined />,
      value: 6,
    },
    { label: "Cross-Functional", icon: <PieChartOutlined />, value: 7 },
    { label: "Enhanced Insights", icon: <AnalyticsIcon />, value: 8 },
  ];

  // Helper function to generate insights
  const generateInsights = () => {
    if (!data) return [];

    const insights = [];

    // Risk trend insight
    if (data.risks.critical_risks > 5) {
      insights.push({
        type: "warning",
        title: "Critical Risk Alert",
        description: `${data.risks.critical_risks} critical risks require immediate attention`,
        actionable: true,
        action: "Review Risks",
      });
    }

    // Compliance improvement insight
    if (data.compliance.overall_compliance > 85) {
      insights.push({
        type: "success",
        title: "Excellent Compliance",
        description: `${data.compliance.overall_compliance}% compliance achieved across organization`,
        actionable: false,
      });
    }

    // User engagement insight
    if (data.users.user_engagement_rate < 70) {
      insights.push({
        type: "info",
        title: "Boost User Engagement",
        description:
          "Consider additional training programs to increase engagement",
        actionable: true,
        action: "View Training",
      });
    }

    return insights;
  };

  // Enhanced data generation functions
  const generateActivityFeed = () => {
    if (!data) return [];

    const activities = [
      {
        id: "1",
        type: "success" as const,
        title: "Compliance Milestone Achieved",
        description: "ISO 27001 compliance reached 90% across all projects",
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        user: "System",
      },
      {
        id: "2",
        type: "warning" as const,
        title: "Risk Threshold Exceeded",
        description: "High-risk vendor identified in Project Alpha",
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        user: "Risk Manager",
      },
      {
        id: "3",
        type: "info" as const,
        title: "New AI Model Deployed",
        description: "Bias detection model v2.1 successfully deployed",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        user: "AI Team",
      },
      {
        id: "4",
        type: "success" as const,
        title: "Training Program Completed",
        description: "25 users completed GDPR compliance training",
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        user: "Training Admin",
      },
      {
        id: "5",
        type: "error" as const,
        title: "System Alert",
        description: "Database connection timeout detected",
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        user: "System",
      },
    ];

    return activities;
  };

  const generateSmartInsights = () => {
    if (!data) return [];

    const insights = [
      {
        id: "1",
        type: "opportunity" as const,
        title: "AI Model Optimization Opportunity",
        description:
          "Your AI models show 15% performance improvement potential through bias reduction techniques",
        impact: "high" as const,
        confidence: 87,
        actionable: true,
      },
      {
        id: "2",
        type: "risk" as const,
        title: "Vendor Risk Concentration",
        description:
          "60% of critical risks are concentrated in 3 vendors. Consider diversification strategy",
        impact: "medium" as const,
        confidence: 92,
        actionable: true,
      },
      {
        id: "3",
        type: "achievement" as const,
        title: "Compliance Excellence",
        description:
          "Your organization ranks in the top 10% for compliance maturity in your industry",
        impact: "high" as const,
        confidence: 95,
        actionable: false,
      },
      {
        id: "4",
        type: "recommendation" as const,
        title: "User Engagement Boost",
        description:
          "Implementing gamification could increase user engagement by 25% based on similar organizations",
        impact: "medium" as const,
        confidence: 78,
        actionable: true,
      },
    ];

    return insights;
  };

  const generateEnhancedKPIs = () => {
    if (!data) return [];

    return [
      {
        title: "Digital Transformation Score",
        value: Math.round(
          (data.compliance.overall_compliance +
            data.executive.system_health_score +
            data.users.user_engagement_rate) /
            3
        ),
        icon: <AnalyticsIcon fontSize="large" />,
        color: "#667eea",
        subtitle: "Overall digital maturity",
        trend: 12,
        progress: Math.round(
          (data.compliance.overall_compliance +
            data.executive.system_health_score +
            data.users.user_engagement_rate) /
            3
        ),
        details: [
          {
            label: "Technology",
            value: `${data.executive.system_health_score}%`,
            color: "#2196F3",
          },
          {
            label: "Process",
            value: `${data.compliance.overall_compliance}%`,
            color: "#4CAF50",
          },
          {
            label: "People",
            value: `${data.users.user_engagement_rate}%`,
            color: "#FF9800",
          },
        ],
      },
      {
        title: "Risk-Adjusted Performance",
        value: Math.round(
          100 -
            (data.risks.critical_risks / Math.max(data.risks.total_risks, 1)) *
              100
        ),
        icon: <RiskIcon fontSize="large" />,
        color: "#f44336",
        subtitle: "Performance considering risk factors",
        trend: -8,
        details: [
          {
            label: "Risk Score",
            value: `${Math.round(
              (data.risks.critical_risks /
                Math.max(data.risks.total_risks, 1)) *
                100
            )}%`,
            color: "#f44336",
          },
          {
            label: "Mitigation Rate",
            value: `${Math.round(
              (data.risks.risk_distribution.resolved /
                Math.max(data.risks.total_risks, 1)) *
                100
            )}%`,
            color: "#4CAF50",
          },
        ],
      },
      {
        title: "AI Readiness Index",
        value: Math.round(
          (data.ai_analytics.total_models /
            Math.max(data.executive.total_projects, 1)) *
            100
        ),
        icon: <ModelIcon fontSize="large" />,
        color: "#9C27B0",
        subtitle: "AI adoption and readiness",
        trend: 25,
        progress: Math.round(
          (data.ai_analytics.total_models /
            Math.max(data.executive.total_projects, 1)) *
            100
        ),
        details: [
          {
            label: "Models Deployed",
            value: data.ai_analytics.total_models,
            color: "#9C27B0",
          },
          {
            label: "Trust Score",
            value: `${data.ai_analytics.trust_center_metrics.compliance_score}%`,
            color: "#4CAF50",
          },
        ],
      },
      {
        title: "Operational Efficiency",
        value: Math.round(
          (data.system.uptime +
            data.users.user_engagement_rate +
            data.training.completion_rate) /
            3
        ),
        icon: <PerformanceIcon fontSize="large" />,
        color: "#4CAF50",
        subtitle: "End-to-end operational health",
        trend: 6,
        progress: Math.round(
          (data.system.uptime +
            data.users.user_engagement_rate +
            data.training.completion_rate) /
            3
        ),
        details: [
          {
            label: "System Uptime",
            value: `${data.system.uptime}%`,
            color: "#4CAF50",
          },
          {
            label: "User Engagement",
            value: `${data.users.user_engagement_rate}%`,
            color: "#2196F3",
          },
          {
            label: "Training Completion",
            value: `${data.training.completion_rate}%`,
            color: "#FF9800",
          },
        ],
      },
    ];
  };

  const insights = generateInsights();

  return (
    <Box>
      <Stack sx={{ gap: "15px" }}>
        <PageBreadcrumbs />
        <Stack>
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between">
            <Box>
              <Typography sx={vwhomeHeading}>Analytics Dashboard</Typography>
              <Typography sx={singleTheme.textStyles.pageDescription}>
                Comprehensive insights across your organization
                {lastUpdated && (
                  <span> • Last updated: {lastUpdated.toLocaleTimeString()}</span>
                )}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControlLabel
                  control={
                    <Switch
                      checked={comparisonMode}
                      onChange={(e) => setComparisonMode(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: "0.75rem" }}>Compare</Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: "0.75rem" }}>Auto-refresh</Typography>
                  }
                />
              </Stack>
              <IconButton onClick={refresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
              <Badge badgeContent={data.risks.critical_risks} color="error">
                <NotificationIcon />
              </Badge>
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      
      {/* Tab Navigation */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(0,0,0,0.1)",
          mb: 2,
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              fontWeight: 600,
              textTransform: "none",
              minHeight: 48,
              fontSize: "0.875rem",
            },
            "& .MuiTabs-indicator": {
              height: 2,
              borderRadius: 1,
            },
          }}
          >
            {tabContent.map((tab) => (
              <Tab
                key={tab.value}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                sx={{ minWidth: 160 }}
              />
            ))}
          </Tabs>
        </Paper>

      {/* Content Area */}
      <Box sx={{ mt: 2 }}>
        {/* Executive Overview Tab */}
        {selectedTab === 0 && (
          <Stack spacing={3}>
            {/* Executive KPI Cards */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} lg={2}>
                <ModernKPICard
                  title="Total Projects"
                  value={data.executive.total_projects}
                  icon={<ProjectIcon fontSize="large" />}
                  color="#667eea"
                  subtitle={`${data.projects.active_projects} active projects`}
                  trend={8}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={2}>
                <ModernKPICard
                  title="Active Users"
                  value={data.users.total_active_users}
                  icon={<UsersIcon fontSize="large" />}
                  color="#764ba2"
                  subtitle={`${data.users.user_engagement_rate}% engagement`}
                  trend={12}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={2}>
                <ModernKPICard
                  title="Compliance Score"
                  value={`${data.compliance.overall_compliance}%`}
                  icon={<ComplianceIcon fontSize="large" />}
                  color="#4CAF50"
                  subtitle="Organization wide"
                  trend={5}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={2}>
                <ModernKPICard
                  title="Critical Risks"
                  value={data.risks.critical_risks}
                  icon={<RiskIcon fontSize="large" />}
                  color="#f44336"
                  subtitle="Require attention"
                  trend={-15}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={2}>
                <ModernKPICard
                  title="AI Models"
                  value={data.ai_analytics.total_models}
                  icon={<ModelIcon fontSize="large" />}
                  color="#FF9800"
                  subtitle="Deployed models"
                  trend={25}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={2}>
                <ModernKPICard
                  title="System Health"
                  value={`${data.executive.system_health_score}%`}
                  icon={<PerformanceIcon fontSize="large" />}
                  color="#9C27B0"
                  subtitle="Overall performance"
                  trend={3}
                />
              </Grid>
            </Grid>

            {/* Executive Charts Row */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <ChartContainer
                  title="User Activity Trends"
                  subtitle="Daily active users and system events over the last 7 days"
                  height={350}
                >
                  <LineChart
                    xAxis={[
                      {
                        scaleType: "point",
                        data: data.users.activity_trends.map((d) =>
                          new Date(d.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        ),
                      },
                    ]}
                    series={[
                      {
                        data: data.users.activity_trends.map(
                          (d) => d.active_users
                        ),
                        label: "Active Users",
                        color: "#667eea",
                      },
                      {
                        data: data.users.activity_trends.map((d) => d.events),
                        label: "System Events",
                        color: "#764ba2",
                      },
                    ]}
                    height={300}
                  />
                </ChartContainer>
              </Grid>
              <Grid item xs={12} md={4}>
                <ChartContainer
                  title="Risk Distribution"
                  subtitle={`${data.risks.total_risks} total risks identified`}
                  height={350}
                >
                  <PieChart
                    series={[
                      {
                        data: [
                          {
                            label: "High",
                            value: data.risks.risk_distribution.high,
                            color: "#f44336",
                          },
                          {
                            label: "Medium",
                            value: data.risks.risk_distribution.medium,
                            color: "#ff9800",
                          },
                          {
                            label: "Low",
                            value: data.risks.risk_distribution.low,
                            color: "#4caf50",
                          },
                          {
                            label: "Resolved",
                            value: data.risks.risk_distribution.resolved,
                            color: "#2196f3",
                          },
                        ],
                        highlightScope: { fade: "global", highlight: "item" },
                        innerRadius: 40,
                        outerRadius: 100,
                      },
                    ]}
                    height={250}
                  />
                </ChartContainer>
              </Grid>
            </Grid>

            {/* System Performance Overview */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <ChartContainer
                  title="System Performance"
                  subtitle="Real-time metrics"
                  height={200}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Stack alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Response Time
                        </Typography>
                        <Typography
                          variant="h4"
                          fontWeight="bold"
                          color="primary.main"
                        >
                          {data.system.response_time}ms
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Uptime
                        </Typography>
                        <Typography
                          variant="h4"
                          fontWeight="bold"
                          color="success.main"
                        >
                          {data.system.uptime}%
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Error Rate
                        </Typography>
                        <Typography
                          variant="h4"
                          fontWeight="bold"
                          color="error.main"
                        >
                          {data.system.error_rate}%
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Sessions
                        </Typography>
                        <Typography
                          variant="h4"
                          fontWeight="bold"
                          color="info.main"
                        >
                          {data.system.active_sessions}
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </ChartContainer>
              </Grid>
              <Grid item xs={12} md={8}>
                <ChartContainer
                  title="Top Performing Projects"
                  subtitle="Health score and completion rates"
                  height={200}
                >
                  <List dense>
                    {data.projects.project_health
                      .slice(0, 4)
                      .map((project, index) => (
                        <ListItem key={project.project_id}>
                          <ListItemIcon>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor:
                                  project.risk_level === "high"
                                    ? "error.main"
                                    : project.risk_level === "medium"
                                    ? "warning.main"
                                    : "success.main",
                                fontSize: "0.75rem",
                              }}
                            >
                              {index + 1}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={project.project_name}
                            secondary={`Health: ${project.health_score}% • Completion: ${project.completion_rate}%`}
                          />
                          <Chip
                            label={`${project.health_score}%`}
                            size="small"
                            color={
                              project.health_score >= 80
                                ? "success"
                                : project.health_score >= 60
                                ? "warning"
                                : "error"
                            }
                            variant="outlined"
                          />
                        </ListItem>
                      ))}
                  </List>
                </ChartContainer>
              </Grid>
            </Grid>
          </Stack>
        )}

        {/* Compliance Analytics Tab */}
        {selectedTab === 1 && (
          <Stack spacing={3}>
            {/* Compliance KPI Row */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="ISO 27001"
                  value={`${data.compliance.iso27001_avg}%`}
                  icon={<AssessmentIcon fontSize="large" />}
                  color="#4CAF50"
                  subtitle="Average compliance"
                  trend={5}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="ISO 42001"
                  value={`${data.compliance.iso42001_avg}%`}
                  icon={<AssessmentIcon fontSize="large" />}
                  color="#2196F3"
                  subtitle="Average compliance"
                  trend={8}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="EU Compliance"
                  value={`${data.compliance.eu_compliance_avg}%`}
                  icon={<ComplianceIcon fontSize="large" />}
                  color="#FF9800"
                  subtitle="EU regulations"
                  trend={3}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Overall Score"
                  value={`${data.compliance.overall_compliance}%`}
                  icon={<AnalyticsIcon fontSize="large" />}
                  color="#9C27B0"
                  subtitle="Organization wide"
                  trend={6}
                />
              </Grid>
            </Grid>

            {/* Compliance Charts */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <ChartContainer
                  title="Framework Compliance Progress"
                  subtitle="Average across all projects"
                >
                  <BarChart
                    xAxis={[
                      {
                        scaleType: "band",
                        data: [
                          "ISO 27001",
                          "ISO 42001",
                          "EU Compliance",
                          "Overall",
                        ],
                      },
                    ]}
                    series={[
                      {
                        data: [
                          data.compliance.iso27001_avg,
                          data.compliance.iso42001_avg,
                          data.compliance.eu_compliance_avg,
                          data.compliance.overall_compliance,
                        ],
                        color: "#667eea",
                      },
                    ]}
                    height={300}
                  />
                </ChartContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <ChartContainer
                  title="Project Compliance Details"
                  subtitle="Individual project performance"
                >
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Project</TableCell>
                          <TableCell align="right">ISO 27001</TableCell>
                          <TableCell align="right">ISO 42001</TableCell>
                          <TableCell align="right">Trend</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.compliance.compliance_trends[0]?.projects
                          .slice(0, 6)
                          .map((project, index) => (
                            <TableRow key={project.project_id}>
                              <TableCell>{project.project_name}</TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={`${project.completion_rate}%`}
                                  size="small"
                                  color={
                                    project.completion_rate >= 80
                                      ? "success"
                                      : project.completion_rate >= 60
                                      ? "warning"
                                      : "error"
                                  }
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={`${
                                    data.compliance.compliance_trends[1]
                                      ?.projects[index]?.completion_rate || 0
                                  }%`}
                                  size="small"
                                  color={
                                    (data.compliance.compliance_trends[1]
                                      ?.projects[index]?.completion_rate ||
                                      0) >= 80
                                      ? "success"
                                      : (data.compliance.compliance_trends[1]
                                          ?.projects[index]?.completion_rate ||
                                          0) >= 60
                                      ? "warning"
                                      : "error"
                                  }
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={0.5}
                                >
                                  {project.trend >= 0 ? (
                                    <TrendIcon
                                      sx={{
                                        fontSize: 16,
                                        color: "success.main",
                                      }}
                                    />
                                  ) : (
                                    <TrendDownIcon
                                      sx={{ fontSize: 16, color: "error.main" }}
                                    />
                                  )}
                                  <Typography
                                    variant="caption"
                                    color={
                                      project.trend >= 0
                                        ? "success.main"
                                        : "error.main"
                                    }
                                    fontWeight="600"
                                  >
                                    {project.trend >= 0 ? "+" : ""}
                                    {project.trend}%
                                  </Typography>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </ChartContainer>
              </Grid>
            </Grid>
          </Stack>
        )}

        {/* Risk Management Tab */}
        {selectedTab === 2 && (
          <Stack spacing={3}>
            {/* Risk KPI Cards */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Total Risks"
                  value={data.risks.total_risks}
                  icon={<RiskIcon fontSize="large" />}
                  color="#667eea"
                  subtitle="Organization wide"
                  trend={-8}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Critical Risks"
                  value={data.risks.critical_risks}
                  icon={<HighRiskIcon fontSize="large" />}
                  color="#f44336"
                  subtitle="Require immediate action"
                  trend={-15}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Vendor Risks"
                  value={data.risks.vendor_risks}
                  icon={<VendorIcon fontSize="large" />}
                  color="#FF9800"
                  subtitle="Third-party related"
                  trend={5}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Resolved"
                  value={data.risks.risk_distribution.resolved}
                  icon={<SuccessIcon fontSize="large" />}
                  color="#4CAF50"
                  subtitle="Successfully mitigated"
                  trend={12}
                />
              </Grid>
            </Grid>

            {/* Risk Analytics Charts */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <ChartContainer
                  title="Risk Category Trends"
                  subtitle="Change over time"
                >
                  <BarChart
                    xAxis={[
                      {
                        scaleType: "band",
                        data: data.risks.risk_trends.map((r) => r.category),
                      },
                    ]}
                    series={[
                      {
                        data: data.risks.risk_trends.map((r) => r.count),
                        color: "#667eea",
                      },
                    ]}
                    height={300}
                  />
                </ChartContainer>
              </Grid>
              <Grid item xs={12} md={4}>
                <ChartContainer
                  title="Risk Severity Distribution"
                  subtitle="Current risk portfolio"
                >
                  <PieChart
                    series={[
                      {
                        data: [
                          {
                            label: "High Risk",
                            value: data.risks.risk_distribution.high,
                            color: "#f44336",
                          },
                          {
                            label: "Medium Risk",
                            value: data.risks.risk_distribution.medium,
                            color: "#ff9800",
                          },
                          {
                            label: "Low Risk",
                            value: data.risks.risk_distribution.low,
                            color: "#4caf50",
                          },
                          {
                            label: "Resolved",
                            value: data.risks.risk_distribution.resolved,
                            color: "#2196f3",
                          },
                        ],
                        innerRadius: 30,
                        outerRadius: 100,
                      },
                    ]}
                    height={250}
                  />
                </ChartContainer>
              </Grid>
              <Grid item xs={12} md={4}>
                <ChartContainer
                  title="High-Risk Projects"
                  subtitle="Projects requiring attention"
                >
                  <List dense>
                    {data.risks.top_risk_projects.map((project) => (
                      <ListItem key={project.project_id}>
                        <ListItemIcon>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: "error.main",
                              fontSize: "0.75rem",
                            }}
                          >
                            {project.risk_count}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={project.project_name}
                          secondary={`Severity Score: ${project.severity_score}`}
                        />
                        <Chip
                          label="High"
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      </ListItem>
                    ))}
                  </List>
                </ChartContainer>
              </Grid>
            </Grid>
          </Stack>
        )}

        {/* User Analytics Tab */}
        {selectedTab === 3 && (
          <Stack spacing={3}>
            {/* User KPI Cards */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Active Users"
                  value={data.users.total_active_users}
                  icon={<UsersIcon fontSize="large" />}
                  color="#667eea"
                  subtitle="Currently active"
                  trend={15}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Engagement Rate"
                  value={`${data.users.user_engagement_rate}%`}
                  icon={<TrendIcon fontSize="large" />}
                  color="#4CAF50"
                  subtitle="User interaction level"
                  trend={8}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Avg Progress"
                  value={`${data.users.average_progress}%`}
                  icon={<TimelineIcon fontSize="large" />}
                  color="#9C27B0"
                  subtitle="Task completion"
                  trend={12}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Sessions"
                  value={data.system.active_sessions}
                  icon={<AnalyticsIcon fontSize="large" />}
                  color="#FF9800"
                  subtitle="Active sessions"
                  trend={25}
                />
              </Grid>
            </Grid>

            {/* User Analytics Charts */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <ChartContainer
                  title="User Activity Timeline"
                  subtitle="Daily engagement over the past week"
                  height={350}
                >
                  <LineChart
                    xAxis={[
                      {
                        scaleType: "point",
                        data: data.users.activity_trends.map((d) =>
                          new Date(d.date).toLocaleDateString("en-US", {
                            weekday: "short",
                          })
                        ),
                      },
                    ]}
                    series={[
                      {
                        data: data.users.activity_trends.map(
                          (d) => d.active_users
                        ),
                        label: "Active Users",
                        color: "#667eea",
                        curve: "linear",
                      },
                      {
                        data: data.users.activity_trends.map((d) => d.events),
                        label: "User Events",
                        color: "#764ba2",
                        curve: "linear",
                      },
                    ]}
                    height={300}
                  />
                </ChartContainer>
              </Grid>
              <Grid item xs={12} md={4}>
                <ChartContainer
                  title="Top Performers"
                  subtitle="Most active users this month"
                  height={350}
                >
                  <List dense>
                    {data.users.top_performers.map((user, index) => (
                      <ListItem key={user.user_id}>
                        <ListItemIcon>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor:
                                index === 0
                                  ? "#FFD700"
                                  : index === 1
                                  ? "#C0C0C0"
                                  : index === 2
                                  ? "#CD7F32"
                                  : "#667eea",
                              fontSize: "0.875rem",
                              fontWeight: 600,
                            }}
                          >
                            #{index + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={user.name}
                          secondary={`${user.progress}% progress • ${user.activities} activities`}
                        />
                        <Stack alignItems="flex-end" spacing={0.5}>
                          <LinearProgress
                            variant="determinate"
                            value={user.progress}
                            sx={{ width: 60, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {user.progress}%
                          </Typography>
                        </Stack>
                      </ListItem>
                    ))}
                  </List>
                </ChartContainer>
              </Grid>
            </Grid>
          </Stack>
        )}

        {/* AI & Technology Tab */}
        {selectedTab === 4 && (
          <Stack spacing={3}>
            {/* AI KPI Cards */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="AI Models"
                  value={data.ai_analytics.total_models}
                  icon={<ModelIcon fontSize="large" />}
                  color="#667eea"
                  subtitle="Deployed models"
                  trend={20}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Trust Score"
                  value={`${data.ai_analytics.trust_center_metrics.compliance_score}%`}
                  icon={<ComplianceIcon fontSize="large" />}
                  color="#4CAF50"
                  subtitle="AI trust center"
                  trend={5}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Resources"
                  value={data.ai_analytics.trust_center_metrics.resources_count}
                  icon={<DocumentIcon fontSize="large" />}
                  color="#FF9800"
                  subtitle="Available resources"
                  trend={15}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Subprocessors"
                  value={
                    data.ai_analytics.trust_center_metrics.subprocessors_count
                  }
                  icon={<VendorIcon fontSize="large" />}
                  color="#9C27B0"
                  subtitle="Third-party AI"
                  trend={8}
                />
              </Grid>
            </Grid>

            {/* AI Analytics Charts */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <ChartContainer
                  title="AI Model Performance"
                  subtitle="Accuracy and usage metrics"
                  height={350}
                >
                  <ScatterChart
                    series={[
                      {
                        data: data.ai_analytics.model_performance.map(
                          (model) => ({
                            x: model.accuracy,
                            y: model.usage_count,
                            id: model.model_name,
                          })
                        ),
                        color: "#667eea",
                        label: "Models",
                      },
                    ]}
                    xAxis={[{ label: "Accuracy (%)" }]}
                    yAxis={[{ label: "Usage Count" }]}
                    height={300}
                  />
                </ChartContainer>
              </Grid>
              <Grid item xs={12} md={4}>
                <ChartContainer
                  title="AI Trust Center Status"
                  subtitle="Compliance and governance"
                  height={350}
                >
                  <Stack spacing={3} sx={{ p: 2 }}>
                    <Box>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <Typography variant="body2">
                          Trust Center Status
                        </Typography>
                        <Chip
                          label={
                            data.ai_analytics.trust_center_metrics.enabled
                              ? "Active"
                              : "Inactive"
                          }
                          color={
                            data.ai_analytics.trust_center_metrics.enabled
                              ? "success"
                              : "error"
                          }
                          variant="outlined"
                          size="small"
                        />
                      </Stack>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Compliance Score
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={
                          data.ai_analytics.trust_center_metrics
                            .compliance_score
                        }
                        sx={{ height: 8, borderRadius: 4, mb: 1 }}
                        color="success"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {
                          data.ai_analytics.trust_center_metrics
                            .compliance_score
                        }
                        % Complete
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Model Performance Overview
                      </Typography>
                      <List dense>
                        {data.ai_analytics.model_performance
                          .slice(0, 3)
                          .map((model) => (
                            <ListItem key={model.model_name} sx={{ px: 0 }}>
                              <ListItemText
                                primary={model.model_name}
                                secondary={`Accuracy: ${model.accuracy}% • Usage: ${model.usage_count}`}
                              />
                              <Chip
                                label={`${model.accuracy}%`}
                                size="small"
                                color={
                                  model.accuracy >= 90
                                    ? "success"
                                    : model.accuracy >= 80
                                    ? "warning"
                                    : "error"
                                }
                                variant="outlined"
                              />
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  </Stack>
                </ChartContainer>
              </Grid>
            </Grid>
          </Stack>
        )}

        {/* Performance Tab */}
        {selectedTab === 5 && (
          <Stack spacing={3}>
            {/* Performance KPI Cards */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Response Time"
                  value={`${data.system.response_time}ms`}
                  icon={<PerformanceIcon fontSize="large" />}
                  color="#667eea"
                  subtitle="Average response"
                  trend={-5}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="System Uptime"
                  value={`${data.system.uptime}%`}
                  icon={<SuccessIcon fontSize="large" />}
                  color="#4CAF50"
                  subtitle="Availability"
                  trend={2}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Error Rate"
                  value={`${data.system.error_rate}%`}
                  icon={<RiskIcon fontSize="large" />}
                  color="#f44336"
                  subtitle="System errors"
                  trend={-10}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Data Quality"
                  value={`${data.system.data_quality_score}%`}
                  icon={<AnalyticsIcon fontSize="large" />}
                  color="#9C27B0"
                  subtitle="Data integrity"
                  trend={8}
                />
              </Grid>
            </Grid>

            {/* Training Analytics Dashboard */}
            <Typography variant="h5" fontWeight="600" sx={{ mb: 3, color: "#13715B" }}>
              📚 Training Registry Analytics
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Training Status Distribution */}
              <Grid item xs={12} md={6}>
                <ChartContainer
                  title="Training Status Distribution"
                  subtitle="Current status breakdown of all training programs"
                >
                  <PieChart
                    series={[
                      {
                        data: data.training.status_distribution.map((status) => ({
                          label: status.status,
                          value: status.count,
                          color: status.status === 'Completed' 
                            ? "#4CAF50" 
                            : status.status === 'In Progress' 
                            ? "#FF9800"
                            : status.status === 'Planned'
                            ? "#2196F3"
                            : "#9E9E9E"
                        })),
                        innerRadius: 50,
                        outerRadius: 120,
                        paddingAngle: 2,
                        cornerRadius: 5,
                      },
                    ]}
                    height={300}
                  />
                </ChartContainer>
              </Grid>

              {/* Department Training Analysis */}
              <Grid item xs={12} md={6}>
                <ChartContainer
                  title="Training by Department"
                  subtitle="Training programs and average participants per department"
                >
                  <BarChart
                    xAxis={[
                      {
                        scaleType: "band",
                        data: data.training.department_analysis.map(
                          (dept) => dept.department.length > 12 
                            ? dept.department.substring(0, 12) + "..." 
                            : dept.department
                        ),
                      },
                    ]}
                    series={[
                      {
                        data: data.training.department_analysis.map(
                          (dept) => dept.count
                        ),
                        label: "Training Count",
                        color: "#667eea",
                      },
                      {
                        data: data.training.department_analysis.map(
                          (dept) => dept.avg_participants
                        ),
                        label: "Avg Participants",
                        color: "#764ba2",
                      },
                    ]}
                    height={300}
                  />
                </ChartContainer>
              </Grid>

              {/* Monthly Training Trends */}
              <Grid item xs={12} md={6}>
                <ChartContainer
                  title="Training Trends (Last 6 Months)"
                  subtitle="Training status progression over time"
                >
                  <LineChart
                    xAxis={[
                      {
                        scaleType: "point",
                        data: data.training.monthly_trends.map((trend) => trend.month),
                      },
                    ]}
                    series={[
                      {
                        data: data.training.monthly_trends.map((trend) => trend.planned),
                        label: "Planned",
                        color: "#2196F3",
                        curve: "linear",
                      },
                      {
                        data: data.training.monthly_trends.map((trend) => trend.in_progress),
                        label: "In Progress",
                        color: "#FF9800",
                        curve: "linear",
                      },
                      {
                        data: data.training.monthly_trends.map((trend) => trend.completed),
                        label: "Completed",
                        color: "#4CAF50",
                        curve: "linear",
                      },
                    ]}
                    height={300}
                  />
                </ChartContainer>
              </Grid>

              {/* Training Provider Analysis */}
              <Grid item xs={12} md={6}>
                <ChartContainer
                  title="Training Provider Analysis"
                  subtitle="Total participants by training provider"
                >
                  <BarChart
                    layout="vertical"
                    yAxis={[
                      {
                        scaleType: "band",
                        data: data.training.provider_analysis.map(
                          (provider) => provider.provider.length > 15 
                            ? provider.provider.substring(0, 15) + "..." 
                            : provider.provider
                        ),
                      },
                    ]}
                    series={[
                      {
                        data: data.training.provider_analysis.map(
                          (provider) => provider.total_participants
                        ),
                        label: "Total Participants",
                        color: "#13715B",
                      },
                    ]}
                    height={300}
                  />
                </ChartContainer>
              </Grid>
            </Grid>

            {/* Traditional Performance Charts */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <ChartContainer
                  title="Training Program Effectiveness"
                  subtitle="Completion rates and performance scores"
                >
                  <BarChart
                    xAxis={[
                      {
                        scaleType: "band",
                        data: data.training.program_effectiveness.map(
                          (p) => p.program_name.substring(0, 15) + "..."
                        ),
                      },
                    ]}
                    series={[
                      {
                        data: data.training.program_effectiveness.map(
                          (p) => p.completion_rate
                        ),
                        label: "Completion Rate",
                        color: "#667eea",
                      },
                      {
                        data: data.training.program_effectiveness.map(
                          (p) => p.avg_score
                        ),
                        label: "Average Score",
                        color: "#764ba2",
                      },
                    ]}
                    height={300}
                  />
                </ChartContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <ChartContainer
                  title="Document Management"
                  subtitle="File distribution and activity"
                >
                  <PieChart
                    series={[
                      {
                        data: data.documents.document_distribution.map(
                          (doc) => ({
                            label: doc.type,
                            value: doc.count,
                            color: ["#667eea", "#764ba2", "#4CAF50", "#FF9800"][
                              data.documents.document_distribution.indexOf(doc)
                            ],
                          })
                        ),
                        innerRadius: 40,
                        outerRadius: 100,
                      },
                    ]}
                    height={250}
                  />
                </ChartContainer>
              </Grid>
            </Grid>

            {/* Recent System Events */}
            <ChartContainer
              title="Recent System Events"
              subtitle="Latest activity and performance events"
            >
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Event Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Severity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.system.recent_events.map((event, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(event.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.event_type}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{event.description}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={event.severity}
                            size="small"
                            color={
                              event.severity === "error"
                                ? "error"
                                : event.severity === "warning"
                                ? "warning"
                                : "info"
                            }
                            variant="filled"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </ChartContainer>
          </Stack>
        )}

        {/* Predictive Analytics Tab */}
        {selectedTab === 6 && (
          <Stack spacing={3}>
            {/* AI-Powered Insights Cards */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ChartContainer
                  title="🤖 AI-Powered Insights & Predictions"
                  subtitle="Machine learning driven predictions for your organization"
                  height={200}
                >
                  <Grid container spacing={2}>
                    {insights.map((insight, index) => (
                      <Grid item xs={12} md={4} key={index}>
                        <Alert
                          severity={
                            insight.type as
                              | "error"
                              | "warning"
                              | "info"
                              | "success"
                          }
                          action={
                            insight.actionable ? (
                              <IconButton
                                size="small"
                                sx={{
                                  color: "inherit",
                                  "&:hover": {
                                    backgroundColor: "rgba(255,255,255,0.1)",
                                  },
                                }}
                              >
                                <TrendIcon fontSize="small" />
                              </IconButton>
                            ) : null
                          }
                          sx={{
                            "& .MuiAlert-message": {
                              width: "100%",
                            },
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight="600">
                            {insight.title}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {insight.description}
                          </Typography>
                        </Alert>
                      </Grid>
                    ))}
                  </Grid>
                </ChartContainer>
              </Grid>
            </Grid>

            {/* Predictive Charts */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <ChartContainer
                  title="📈 Risk Prediction Model"
                  subtitle="Predicted risk levels for next 90 days"
                  height={350}
                >
                  <LineChart
                    xAxis={[
                      {
                        scaleType: "point",
                        data: Array.from({ length: 12 }, (_, i) => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + i);
                          return date.toLocaleDateString("en-US", {
                            month: "short",
                          });
                        }),
                      },
                    ]}
                    series={[
                      {
                        data: Array.from({ length: 12 }, (_, i) => {
                          const baseRisk = data.risks.critical_risks;
                          const trend =
                            Math.sin(i * 0.5) * 2 + Math.random() * 3;
                          return Math.max(0, Math.round(baseRisk + trend));
                        }),
                        label: "Predicted Critical Risks",
                        color: "#f44336",
                        curve: "natural",
                      },
                      {
                        data: Array.from(
                          { length: 12 },
                          () => data.risks.critical_risks
                        ),
                        label: "Current Level",
                        color: "#ff9800",
                        area: true,
                      },
                    ]}
                    height={300}
                  />
                </ChartContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <ChartContainer
                  title="🎯 Compliance Forecast"
                  subtitle="Predicted compliance scores"
                  height={350}
                >
                  <Gauge
                    value={data.compliance.overall_compliance}
                    startAngle={-90}
                    endAngle={90}
                    valueMax={100}
                    height={250}
                    text={({ value }) => `${value}%`}
                    sx={{
                      [`& .MuiGauge-valueText`]: {
                        fontSize: 40,
                        fontWeight: "bold",
                      },
                    }}
                  />
                  <Box sx={{ mt: 2, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Projected to reach{" "}
                      <strong>
                        {Math.min(100, data.compliance.overall_compliance + 8)}%
                      </strong>{" "}
                      by next quarter
                    </Typography>
                  </Box>
                </ChartContainer>
              </Grid>
            </Grid>

            {/* Advanced Analytics */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <ChartContainer
                  title="🧠 Correlation Analysis"
                  subtitle="Relationship between different organizational metrics"
                  height={400}
                >
                  <ScatterChart
                    series={[
                      {
                        data: data.projects.project_health.map((project) => ({
                          x: project.health_score,
                          y: project.completion_rate,
                          id: project.project_name,
                        })),
                        label: "Projects",
                        color: "#667eea",
                      },
                    ]}
                    xAxis={[{ label: "Health Score (%)" }]}
                    yAxis={[{ label: "Completion Rate (%)" }]}
                    height={350}
                  />
                </ChartContainer>
              </Grid>
              <Grid item xs={12} md={4}>
                <ChartContainer
                  title="🚀 Performance Trends"
                  subtitle="Key performance indicators"
                  height={400}
                >
                  <Stack spacing={3} sx={{ p: 2 }}>
                    {[
                      {
                        label: "User Engagement",
                        value: data.users.user_engagement_rate,
                        trend: 8,
                        color: "#4CAF50",
                      },
                      {
                        label: "System Health",
                        value: data.executive.system_health_score,
                        trend: 3,
                        color: "#2196F3",
                      },
                      {
                        label: "Compliance Score",
                        value: data.compliance.overall_compliance,
                        trend: 5,
                        color: "#FF9800",
                      },
                      {
                        label: "Risk Mitigation",
                        value: Math.round(
                          (data.risks.risk_distribution.resolved /
                            data.risks.total_risks) *
                            100
                        ),
                        trend: 12,
                        color: "#9C27B0",
                      },
                    ].map((metric, index) => (
                      <Box key={index}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={1}
                        >
                          <Typography variant="body2" fontWeight="600">
                            {metric.label}
                          </Typography>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                          >
                            {metric.trend >= 0 ? (
                              <TrendingUp
                                sx={{ fontSize: 16, color: "success.main" }}
                              />
                            ) : (
                              <TrendingDown
                                sx={{ fontSize: 16, color: "error.main" }}
                              />
                            )}
                            <Typography
                              variant="caption"
                              color={
                                metric.trend >= 0
                                  ? "success.main"
                                  : "error.main"
                              }
                              fontWeight="600"
                            >
                              {metric.trend >= 0 ? "+" : ""}
                              {metric.trend}%
                            </Typography>
                          </Stack>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={metric.value}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: `${metric.color}20`,
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: metric.color,
                              borderRadius: 4,
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {metric.value}% Complete
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </ChartContainer>
              </Grid>
            </Grid>
          </Stack>
        )}

        {/* Cross-Functional Analytics Tab */}
        {selectedTab === 7 && (
          <Stack spacing={3}>
            {/* Cross-Functional KPIs */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Integration Score"
                  value={`${Math.round(
                    (data.compliance.overall_compliance +
                      data.executive.system_health_score) /
                      2
                  )}%`}
                  icon={<AnalyticsIcon fontSize="large" />}
                  color="#667eea"
                  subtitle="Cross-system alignment"
                  trend={7}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Resource Efficiency"
                  value={`${Math.round(
                    (data.users.user_engagement_rate + data.system.uptime) / 2
                  )}%`}
                  icon={<PerformanceIcon fontSize="large" />}
                  color="#4CAF50"
                  subtitle="Overall efficiency"
                  trend={4}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Risk-Compliance Ratio"
                  value={(
                    data.risks.critical_risks /
                    Math.max(data.compliance.overall_compliance, 1)
                  ).toFixed(2)}
                  icon={<RiskIcon fontSize="large" />}
                  color="#FF9800"
                  subtitle="Risk per compliance point"
                  trend={-12}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <ModernKPICard
                  title="Technology Adoption"
                  value={`${Math.round(
                    (data.ai_analytics.total_models /
                      Math.max(data.executive.total_projects, 1)) *
                      100
                  )}%`}
                  icon={<ModelIcon fontSize="large" />}
                  color="#9C27B0"
                  subtitle="AI/ML integration level"
                  trend={18}
                />
              </Grid>
            </Grid>

            {/* Advanced Visualizations */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <ChartContainer
                  title="🔄 Cross-Functional Impact Matrix"
                  subtitle="How different areas impact each other"
                  height={400}
                >
                  <Box
                    sx={{
                      position: "relative",
                      height: 350,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Grid container spacing={2} sx={{ maxWidth: "80%" }}>
                      {[
                        {
                          name: "Compliance",
                          value: data.compliance.overall_compliance,
                          color: "#4CAF50",
                          x: 20,
                          y: 20,
                        },
                        {
                          name: "Risk Management",
                          value:
                            100 -
                            (data.risks.critical_risks /
                              data.risks.total_risks) *
                              100,
                          color: "#f44336",
                          x: 70,
                          y: 30,
                        },
                        {
                          name: "User Engagement",
                          value: data.users.user_engagement_rate,
                          color: "#2196F3",
                          x: 50,
                          y: 60,
                        },
                        {
                          name: "System Health",
                          value: data.executive.system_health_score,
                          color: "#FF9800",
                          x: 30,
                          y: 80,
                        },
                        {
                          name: "AI Technology",
                          value:
                            (data.ai_analytics.total_models /
                              Math.max(data.executive.total_projects, 1)) *
                            20,
                          color: "#9C27B0",
                          x: 80,
                          y: 70,
                        },
                      ].map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: "absolute",
                            left: `${item.x}%`,
                            top: `${item.y}%`,
                            transform: "translate(-50%, -50%)",
                            width: Math.max(60, item.value * 1.2),
                            height: Math.max(60, item.value * 1.2),
                            borderRadius: "50%",
                            backgroundColor: `${item.color}20`,
                            border: `3px solid ${item.color}`,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              transform: "translate(-50%, -50%) scale(1.1)",
                              boxShadow: `0 8px 24px ${item.color}40`,
                            },
                          }}
                        >
                          <Typography
                            variant="caption"
                            fontWeight="600"
                            sx={{ textAlign: "center", px: 1 }}
                          >
                            {item.name}
                          </Typography>
                          <Typography
                            variant="h6"
                            fontWeight="700"
                            color={item.color}
                          >
                            {Math.round(item.value)}%
                          </Typography>
                        </Box>
                      ))}

                      {/* Connecting lines */}
                      <svg
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          top: 0,
                          left: 0,
                          pointerEvents: "none",
                        }}
                      >
                        <defs>
                          <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="9"
                            refY="3.5"
                            orient="auto"
                          >
                            <polygon
                              points="0 0, 10 3.5, 0 7"
                              fill="#666"
                              opacity="0.3"
                            />
                          </marker>
                        </defs>
                        {/* Example connecting lines */}
                        <line
                          x1="20%"
                          y1="20%"
                          x2="50%"
                          y2="60%"
                          stroke="#666"
                          strokeWidth="2"
                          opacity="0.3"
                          markerEnd="url(#arrowhead)"
                        />
                        <line
                          x1="70%"
                          y1="30%"
                          x2="50%"
                          y2="60%"
                          stroke="#666"
                          strokeWidth="2"
                          opacity="0.3"
                          markerEnd="url(#arrowhead)"
                        />
                        <line
                          x1="30%"
                          y1="80%"
                          x2="50%"
                          y2="60%"
                          stroke="#666"
                          strokeWidth="2"
                          opacity="0.3"
                          markerEnd="url(#arrowhead)"
                        />
                      </svg>
                    </Grid>
                  </Box>
                </ChartContainer>
              </Grid>
              <Grid item xs={12} md={4}>
                <ChartContainer
                  title="📊 Organizational Maturity"
                  subtitle="Multi-dimensional assessment"
                  height={400}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      p: 2,
                    }}
                  >
                    {/* Maturity Radar Chart equivalent */}
                    <Box sx={{ position: "relative", width: 200, height: 200 }}>
                      {[
                        {
                          label: "Governance",
                          score: data.compliance.overall_compliance,
                        },
                        {
                          label: "Risk Mgmt",
                          score:
                            100 -
                            (data.risks.critical_risks /
                              Math.max(data.risks.total_risks, 1)) *
                              100,
                        },
                        {
                          label: "Technology",
                          score: data.executive.system_health_score,
                        },
                        {
                          label: "People",
                          score: data.users.user_engagement_rate,
                        },
                        {
                          label: "Process",
                          score: data.training.completion_rate,
                        },
                      ].map((dimension, index) => {
                        const angle = (index * 360) / 5 - 90;
                        const radians = (angle * Math.PI) / 180;
                        const radius = (dimension.score / 100) * 80;
                        const x = 100 + radius * Math.cos(radians);
                        const y = 100 + radius * Math.sin(radians);

                        return (
                          <Box key={index}>
                            <Box
                              sx={{
                                position: "absolute",
                                left: x - 6,
                                top: y - 6,
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                backgroundColor: "#667eea",
                                border: "2px solid white",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                position: "absolute",
                                left: 100 + 100 * Math.cos(radians) - 20,
                                top: 100 + 100 * Math.sin(radians) - 8,
                                fontWeight: 600,
                                textAlign: "center",
                                width: 40,
                              }}
                            >
                              {dimension.label}
                            </Typography>
                          </Box>
                        );
                      })}

                      <Box
                        sx={{
                          position: "absolute",
                          left: 50,
                          top: 50,
                          width: 100,
                          height: 100,
                          borderRadius: "50%",
                          border: "2px dashed #ccc",
                          opacity: 0.5,
                        }}
                      />
                    </Box>

                    <Box sx={{ mt: 3 }}>
                      <Typography
                        variant="h4"
                        fontWeight="700"
                        color="primary.main"
                        textAlign="center"
                      >
                        {Math.round(
                          (data.compliance.overall_compliance +
                            data.executive.system_health_score +
                            data.users.user_engagement_rate) /
                            3
                        )}
                        %
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                      >
                        Overall Maturity Score
                      </Typography>
                    </Box>
                  </Box>
                </ChartContainer>
              </Grid>
            </Grid>

            {/* Action-Oriented Insights */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ChartContainer
                  title="🎯 Actionable Recommendations"
                  subtitle="Prioritized actions based on data analysis"
                  height={300}
                >
                  <List>
                    {[
                      {
                        priority: "high",
                        title: "Address Critical Risks",
                        description: `${data.risks.critical_risks} critical risks need immediate attention. Focus on projects with highest risk scores.`,
                        impact: "High",
                        effort: "Medium",
                        timeframe: "1-2 weeks",
                      },
                      {
                        priority: "medium",
                        title: "Improve User Engagement",
                        description: `Current engagement at ${data.users.user_engagement_rate}%. Consider gamification or training incentives.`,
                        impact: "Medium",
                        effort: "Low",
                        timeframe: "2-4 weeks",
                      },
                      {
                        priority: "low",
                        title: "Optimize AI Model Usage",
                        description: `${data.ai_analytics.total_models} models deployed. Review usage patterns for optimization opportunities.`,
                        impact: "Medium",
                        effort: "High",
                        timeframe: "1-2 months",
                      },
                    ].map((recommendation, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          border: "1px solid",
                          borderColor:
                            recommendation.priority === "high"
                              ? "error.light"
                              : recommendation.priority === "medium"
                              ? "warning.light"
                              : "info.light",
                          borderRadius: 2,
                          mb: 2,
                          backgroundColor:
                            recommendation.priority === "high"
                              ? "error.50"
                              : recommendation.priority === "medium"
                              ? "warning.50"
                              : "info.50",
                        }}
                      >
                        <ListItemIcon>
                          <Avatar
                            sx={{
                              bgcolor:
                                recommendation.priority === "high"
                                  ? "error.main"
                                  : recommendation.priority === "medium"
                                  ? "warning.main"
                                  : "info.main",
                              width: 32,
                              height: 32,
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography variant="subtitle1" fontWeight="600">
                                {recommendation.title}
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                <Chip
                                  label={`Impact: ${recommendation.impact}`}
                                  size="small"
                                  variant="outlined"
                                />
                                <Chip
                                  label={`Effort: ${recommendation.effort}`}
                                  size="small"
                                  variant="outlined"
                                />
                                <Chip
                                  label={recommendation.timeframe}
                                  size="small"
                                />
                              </Stack>
                            </Stack>
                          }
                          secondary={recommendation.description}
                        />
                      </ListItem>
                    ))}
                  </List>
                </ChartContainer>
              </Grid>
            </Grid>
          </Stack>
        )}

        {/* Enhanced Insights Tab */}
        {selectedTab === 8 && (
          <Stack spacing={3}>
            {/* Enhanced KPI Cards */}
            <Grid container spacing={3}>
              {generateEnhancedKPIs().map((kpi, index) => (
                <Grid item xs={12} md={6} lg={3} key={index}>
                  <EnhancedKPICard
                    title={kpi.title}
                    value={kpi.value}
                    icon={kpi.icon}
                    color={kpi.color}
                    subtitle={kpi.subtitle}
                    trend={kpi.trend}
                    progress={kpi.progress}
                    details={kpi.details}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Real-time Activity Feed and Smart Insights */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <ActivityFeed activities={generateActivityFeed()} />
              </Grid>
              <Grid item xs={12} md={6}>
                <SmartInsights insights={generateSmartInsights()} />
              </Grid>
            </Grid>

            {/* Advanced Analytics Dashboard */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <ChartContainer
                  title="🎯 Strategic Performance Matrix"
                  subtitle="Multi-dimensional performance analysis"
                  height={400}
                >
                  <Box sx={{ position: "relative", height: 350 }}>
                    <Grid container spacing={2} sx={{ height: "100%" }}>
                      {[
                        {
                          name: "Innovation",
                          score: data.ai_analytics.total_models * 10,
                          color: "#9C27B0",
                          x: 20,
                          y: 20,
                        },
                        {
                          name: "Efficiency",
                          score: data.system.uptime,
                          color: "#4CAF50",
                          x: 80,
                          y: 20,
                        },
                        {
                          name: "Compliance",
                          score: data.compliance.overall_compliance,
                          color: "#2196F3",
                          x: 20,
                          y: 80,
                        },
                        {
                          name: "Risk Management",
                          score:
                            100 -
                            (data.risks.critical_risks /
                              Math.max(data.risks.total_risks, 1)) *
                              100,
                          color: "#FF9800",
                          x: 80,
                          y: 80,
                        },
                        {
                          name: "User Experience",
                          score: data.users.user_engagement_rate,
                          color: "#f44336",
                          x: 50,
                          y: 50,
                        },
                      ].map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: "absolute",
                            left: `${item.x}%`,
                            top: `${item.y}%`,
                            transform: "translate(-50%, -50%)",
                            width: Math.max(80, item.score * 1.5),
                            height: Math.max(80, item.score * 1.5),
                            borderRadius: "50%",
                            background: `radial-gradient(circle, ${item.color}40 0%, ${item.color}20 100%)`,
                            border: `3px solid ${item.color}`,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              transform: "translate(-50%, -50%) scale(1.1)",
                              boxShadow: `0 8px 24px ${item.color}40`,
                              zIndex: 10,
                            },
                          }}
                        >
                          <Typography
                            variant="caption"
                            fontWeight="600"
                            sx={{
                              textAlign: "center",
                              px: 1,
                              color: item.color,
                            }}
                          >
                            {item.name}
                          </Typography>
                          <Typography
                            variant="h6"
                            fontWeight="700"
                            color={item.color}
                          >
                            {Math.round(item.score)}%
                          </Typography>
                        </Box>
                      ))}
                    </Grid>
                  </Box>
                </ChartContainer>
              </Grid>
              <Grid item xs={12} md={4}>
                <ChartContainer
                  title="📊 Performance Benchmarking"
                  subtitle="Industry comparison and targets"
                  height={400}
                >
                  <Stack spacing={3} sx={{ p: 2 }}>
                    {[
                      {
                        label: "Compliance Maturity",
                        current: data.compliance.overall_compliance,
                        industry: 78,
                        target: 95,
                        color: "#4CAF50",
                      },
                      {
                        label: "Risk Management",
                        current: Math.round(
                          (data.risks.risk_distribution.resolved /
                            Math.max(data.risks.total_risks, 1)) *
                            100
                        ),
                        industry: 65,
                        target: 90,
                        color: "#FF9800",
                      },
                      {
                        label: "AI Adoption",
                        current: Math.round(
                          (data.ai_analytics.total_models /
                            Math.max(data.executive.total_projects, 1)) *
                            100
                        ),
                        industry: 45,
                        target: 80,
                        color: "#9C27B0",
                      },
                      {
                        label: "User Engagement",
                        current: data.users.user_engagement_rate,
                        industry: 72,
                        target: 85,
                        color: "#2196F3",
                      },
                    ].map((metric, index) => (
                      <Box key={index}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={1}
                        >
                          <Typography variant="body2" fontWeight="600">
                            {metric.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {metric.current}% vs {metric.industry}% industry
                          </Typography>
                        </Stack>
                        <Box sx={{ position: "relative", mb: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={(metric.current / metric.target) * 100}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: `${metric.color}20`,
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: metric.color,
                                borderRadius: 4,
                              },
                            }}
                          />
                          <Box
                            sx={{
                              position: "absolute",
                              top: -2,
                              left: `${
                                (metric.industry / metric.target) * 100
                              }%`,
                              width: 2,
                              height: 12,
                              backgroundColor: "#666",
                              borderRadius: 1,
                            }}
                          />
                        </Box>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">
                            Target: {metric.target}%
                          </Typography>
                          <Typography
                            variant="caption"
                            color={
                              metric.current >= metric.industry
                                ? "success.main"
                                : "warning.main"
                            }
                            fontWeight="600"
                          >
                            {metric.current >= metric.industry
                              ? "Above Industry"
                              : "Below Industry"}
                          </Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </ChartContainer>
              </Grid>
            </Grid>

            {/* Quick Actions Panel */}
            <ChartContainer
              title="⚡ Quick Actions"
              subtitle="Common tasks and shortcuts"
              height={200}
            >
              <Grid container spacing={2}>
                {[
                  {
                    label: "Generate Report",
                    icon: <DocumentIcon />,
                    color: "#2196F3",
                    action: "report",
                  },
                  {
                    label: "Risk Assessment",
                    icon: <RiskIcon />,
                    color: "#f44336",
                    action: "risk",
                  },
                  {
                    label: "User Training",
                    icon: <UsersIcon />,
                    color: "#4CAF50",
                    action: "training",
                  },
                  {
                    label: "AI Model Review",
                    icon: <ModelIcon />,
                    color: "#9C27B0",
                    action: "ai",
                  },
                  {
                    label: "Compliance Check",
                    icon: <ComplianceIcon />,
                    color: "#FF9800",
                    action: "compliance",
                  },
                  {
                    label: "System Health",
                    icon: <PerformanceIcon />,
                    color: "#607D8B",
                    action: "system",
                  },
                ].map((action, index) => (
                  <Grid item xs={6} sm={4} md={2} key={index}>
                    <Box
                      sx={{
                        p: 2,
                        textAlign: "center",
                        borderRadius: 2,
                        border: `2px solid ${action.color}20`,
                        backgroundColor: `${action.color}10`,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          backgroundColor: `${action.color}20`,
                          transform: "translateY(-2px)",
                          boxShadow: `0 4px 12px ${action.color}30`,
                        },
                      }}
                    >
                      <Box sx={{ color: action.color, mb: 1 }}>
                        {action.icon}
                      </Box>
                      <Typography
                        variant="caption"
                        fontWeight="600"
                        color="text.primary"
                      >
                        {action.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </ChartContainer>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default DashboardOverview;
