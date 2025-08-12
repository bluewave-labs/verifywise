import React, { useState, useEffect, useContext, Suspense } from "react";
import {
  Box,
  Stack,
  Typography,
  Tab,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert as MuiAlert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Info,
  ExpandMore,
  Speed,
  Security,
  Assessment,
  Timeline,
  Notifications,
  Insights
} from "@mui/icons-material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import CustomizableButton from "../../vw-v2-components/Buttons";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import singleTheme from "../../themes/v1SingleTheme";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import { useProjects } from "../../../application/hooks/useProjects";
import { useAISystemHealthOverview, useAISystemsList } from "../../../application/hooks/useAISystemHealth";
import {
  systemHealthStyles,
  healthScoreCardStyle,
  alertCardStyle,
  chartContainerStyle,
  healthIndicatorStyle,
  tabStyle,
  tabListStyle,
  tabPanelStyle
} from "./styles";

const Alert = React.lazy(() => import("../../components/Alert"));

// Fallback mock data for when API is not available
const generateMockData = () => ({
  systemHealth: {
    overall: 87,
    performance: 92,
    security: 85,
    compliance: 83,
    reliability: 90
  },
  alerts: [
    {
      id: 1,
      type: 'warning',
      title: 'Model Performance Degradation',
      description: 'Customer segmentation model accuracy dropped to 82%',
      timestamp: '2 hours ago',
      project: 'E-commerce Recommendations'
    },
    {
      id: 2,
      type: 'error',
      title: 'Compliance Issue Detected',
      description: 'GDPR data retention policy violation in user profiling system',
      timestamp: '4 hours ago',
      project: 'User Analytics Platform'
    },
    {
      id: 3,
      type: 'info',
      title: 'Model Update Available',
      description: 'New fraud detection model version 2.1 is ready for deployment',
      timestamp: '1 day ago',
      project: 'Fraud Prevention System'
    }
  ],
  metrics: {
    totalSystems: 24,
    activeAlerts: 7,
    riskScore: 'Medium',
    uptime: '99.7%',
    lastUpdated: new Date().toLocaleString()
  },
  healthTrends: [
    { month: 'Jan', score: 85 },
    { month: 'Feb', score: 88 },
    { month: 'Mar', score: 86 },
    { month: 'Apr', score: 89 },
    { month: 'May', score: 87 },
    { month: 'Jun', score: 87 }
  ],
  riskPredictions: [
    {
      category: 'Model Performance',
      risk: 'Medium',
      trend: 'increasing',
      prediction: 'Potential 15% accuracy drop in next 30 days',
      confidence: 78
    },
    {
      category: 'Compliance Drift',
      risk: 'Low',
      trend: 'stable',
      prediction: 'Compliance status expected to remain stable',
      confidence: 92
    },
    {
      category: 'Security Vulnerabilities',
      risk: 'High',
      trend: 'increasing',
      prediction: 'New attack vectors identified, update required',
      confidence: 85
    }
  ],
  systemDetails: [
    { name: 'Customer Recommendation Engine', health: 94, status: 'Excellent', lastCheck: '5 min ago' },
    { name: 'Fraud Detection System', health: 87, status: 'Good', lastCheck: '12 min ago' },
    { name: 'Chatbot NLP Service', health: 76, status: 'Fair', lastCheck: '3 min ago' },
    { name: 'Image Recognition API', health: 91, status: 'Excellent', lastCheck: '8 min ago' },
    { name: 'Sentiment Analysis Tool', health: 82, status: 'Good', lastCheck: '15 min ago' }
  ]
});

const AISystemHealthMonitor: React.FC = () => {
  const [tabValue, setTabValue] = useState("overview");
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);
  const [alertState, setAlertState] = useState<any>(null);

  const { userRoleName } = useContext(VerifyWiseContext);
  const { projects } = useProjects();

  // Use real API hooks
  const {
    healthData,
    alerts,
    predictions,
    isLoading: isOverviewLoading,
    error: overviewError,
    refetch: refetchOverview
  } = useAISystemHealthOverview();

  const {
    systems,
    pagination,
    isLoading: isSystemsLoading,
    error: systemsError,
    refetch: refetchSystems
  } = useAISystemsList();

  // Fallback to mock data if API fails or returns empty
  const mockData = generateMockData();
  const displayData = healthData || mockData;
  const displayAlerts = alerts.length > 0 ? alerts : mockData.alerts;
  const displayPredictions = predictions.length > 0 ? predictions : mockData.riskPredictions;
  const displaySystems = systems.length > 0 ? systems : mockData.systemDetails;

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchOverview();
      if (tabValue === 'systems') {
        refetchSystems();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [tabValue, refetchOverview, refetchSystems]);

  const getHealthColor = (score: number) => {
    if (score >= 90) return "#10B981";
    if (score >= 80) return "#F59E0B";
    if (score >= 70) return "#EF4444";
    return "#DC2626";
  };

  const getHealthStatus = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Fair";
    return "Poor";
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return "#10B981";
      case 'medium': return "#F59E0B";
      case 'high': return "#EF4444";
      default: return "#6B7280";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <Error sx={{ color: "#EF4444" }} />;
      case 'warning': return <Warning sx={{ color: "#F59E0B" }} />;
      case 'info': return <Info sx={{ color: "#3B82F6" }} />;
      default: return <Info />;
    }
  };

  const OverviewTab = () => (
    <Stack spacing={3}>
      {isOverviewLoading && (
        <Box display="flex" justifyContent="center" p={3}>
          <Typography>Loading health data...</Typography>
        </Box>
      )}
      
      {overviewError && (
        <Alert
          variant="warning"
          body={`Failed to load real-time data. Showing demo data. Error: ${overviewError}`}
          isToast={false}
        />
      )}

      {/* Health Score Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card sx={healthScoreCardStyle}>
            <CardContent>
              <Stack spacing={2} alignItems="center">
                <Speed sx={{ fontSize: 40, color: "#13715B" }} />
                <Typography variant="h3" sx={{ fontWeight: 700, color: getHealthColor(displayData.systemHealth.overall) }}>
                  {displayData.systemHealth.overall}
                </Typography>
                <Typography variant="body2" color="textSecondary">Overall Health Score</Typography>
                <Chip 
                  label={getHealthStatus(displayData.systemHealth.overall)} 
                  sx={{ backgroundColor: getHealthColor(displayData.systemHealth.overall), color: "white" }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {Object.entries(displayData.systemHealth)
          .filter(([key]) => key !== 'overall')
          .map(([key, value]) => (
            <Grid item xs={12} md={2.25} key={key}>
              <Card sx={healthScoreCardStyle}>
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="h6" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                      {key}
                    </Typography>
                    <Typography variant="h4" sx={{ color: getHealthColor(value as number), fontWeight: 700 }}>
                      {value}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={value as number} 
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getHealthColor(value as number),
                          borderRadius: 3
                        }
                      }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      {/* Key Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card sx={healthIndicatorStyle}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Assessment sx={{ color: "#13715B" }} />
                <Stack>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {displayData.metrics.totalSystems}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    AI Systems Monitored
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={healthIndicatorStyle}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Warning sx={{ color: "#F59E0B" }} />
                <Stack>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {displayData.metrics.activeAlerts}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Alerts
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={healthIndicatorStyle}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Security sx={{ color: getRiskColor(displayData.metrics.riskScore) }} />
                <Stack>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {displayData.metrics.riskScore}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Overall Risk Level
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={healthIndicatorStyle}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <CheckCircle sx={{ color: "#10B981" }} />
                <Stack>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {displayData.metrics.uptime}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    System Uptime
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Alerts */}
      <Card sx={alertCardStyle}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Recent Alerts & Notifications
          </Typography>
          <Stack spacing={2}>
            {displayAlerts.map((alert) => (
              <Box
                key={alert.id}
                sx={{
                  p: 2,
                  border: "1px solid #E5E7EB",
                  borderRadius: 2,
                  backgroundColor: "#F9FAFB"
                }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  {getAlertIcon(alert.type)}
                  <Stack sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {alert.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      {alert.description}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="caption" color="textSecondary">
                        {alert.timestamp}
                      </Typography>
                      <Chip
                        label={alert.project}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Stack>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );

  const AnalyticsTab = () => (
    <Stack spacing={3}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Predictive Risk Analytics
      </Typography>
      
      <Grid container spacing={3}>
        {displayPredictions.map((prediction, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={healthIndicatorStyle}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {prediction.category}
                    </Typography>
                    <Chip 
                      label={prediction.risk}
                      sx={{ 
                        backgroundColor: getRiskColor(prediction.risk),
                        color: 'white',
                        fontWeight: 600
                      }}
                      size="small"
                    />
                  </Stack>
                  
                  <Typography variant="body2" color="textSecondary">
                    {prediction.prediction}
                  </Typography>
                  
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {prediction.trend === 'increasing' ? 
                        <TrendingUp sx={{ color: "#EF4444", fontSize: 16 }} /> :
                        <TrendingDown sx={{ color: "#10B981", fontSize: 16 }} />
                      }
                      <Typography variant="caption" color="textSecondary">
                        {prediction.trend}
                      </Typography>
                    </Stack>
                    
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {prediction.confidence}% confidence
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={chartContainerStyle}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Health Score Trends (6 Months)
          </Typography>
          <Box sx={{ height: 200, display: 'flex', alignItems: 'end', gap: 2, p: 2 }}>
            {displayData.healthTrends.map((trend, index) => (
              <Tooltip key={index} title={`${trend.month}: ${trend.score}`}>
                <Box
                  sx={{
                    height: `${trend.score}%`,
                    width: 40,
                    backgroundColor: getHealthColor(trend.score),
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'end',
                    justifyContent: 'center',
                    pb: 1,
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: getHealthColor(trend.score),
                      opacity: 0.8
                    }
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                    {trend.score}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      position: 'absolute', 
                      bottom: -20, 
                      color: 'text.secondary',
                      fontWeight: 500
                    }}
                  >
                    {trend.month}
                  </Typography>
                </Box>
              </Tooltip>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );

  const SystemsTab = () => (
    <Stack spacing={3}>
      {isSystemsLoading && (
        <Box display="flex" justifyContent="center" p={3}>
          <Typography>Loading systems data...</Typography>
        </Box>
      )}
      
      {systemsError && (
        <Alert
          variant="warning"
          body={`Failed to load systems data. Showing demo data. Error: ${systemsError}`}
          isToast={false}
        />
      )}

      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Individual System Health Status
      </Typography>
      
      <Grid container spacing={2}>
        {displaySystems.map((system, index) => (
          <Grid item xs={12} key={index}>
            <Card sx={healthIndicatorStyle}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: getHealthColor(system.health)
                      }}
                    />
                    <Stack sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {system.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Last check: {system.lastCheck}
                      </Typography>
                    </Stack>
                  </Stack>
                  
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <Stack alignItems="center">
                      <Typography variant="h6" sx={{ color: getHealthColor(system.health), fontWeight: 700 }}>
                        {system.health}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Score
                      </Typography>
                    </Stack>
                    
                    <Chip
                      label={system.status}
                      sx={{ 
                        backgroundColor: getHealthColor(system.health),
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );

  const helpContent = `
    <h2>AI System Health Monitor</h2>
    <p>This advanced monitoring dashboard provides real-time insights into your AI systems' health and performance.</p>
    
    <h3>Key Features:</h3>
    <ul>
      <li><strong>Health Scoring:</strong> Comprehensive health scores across performance, security, compliance, and reliability</li>
      <li><strong>Predictive Analytics:</strong> AI-powered risk predictions and trend analysis</li>
      <li><strong>Real-time Alerts:</strong> Immediate notifications for critical issues</li>
      <li><strong>System Monitoring:</strong> Individual system health tracking</li>
    </ul>
    
    <h3>Understanding Health Scores:</h3>
    <ul>
      <li><strong>90-100:</strong> Excellent - System performing optimally</li>
      <li><strong>80-89:</strong> Good - System healthy with minor areas for improvement</li>
      <li><strong>70-79:</strong> Fair - System functional but requires attention</li>
      <li><strong>Below 70:</strong> Poor - Immediate action required</li>
    </ul>
  `;

  return (
    <Stack className="ai-system-health-monitor" sx={systemHealthStyles}>
      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent={helpContent}
        pageTitle="AI System Health Monitor"
      />
      
      {alertState && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant={alertState.variant}
            title={alertState.title}
            body={alertState.body}
            isToast={true}
            onClick={() => setAlertState(null)}
          />
        </Suspense>
      )}

      <Stack className="header" sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Stack>
            <Typography sx={{ ...singleTheme.textStyles.pageTitle, fontSize: "24px" }}>
              AI System Health Monitor
            </Typography>
            <Typography sx={singleTheme.textStyles.pageDescription}>
              Real-time monitoring, predictive analytics, and health insights for your AI systems. 
              Monitor performance, detect anomalies, and prevent issues before they impact your operations.
            </Typography>
          </Stack>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
            Last updated: {displayData.metrics.lastUpdated || new Date().toLocaleString()}
          </Typography>
        </Stack>
      </Stack>

      <Stack className="content">
        <TabContext value={tabValue}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList
              onChange={handleTabChange}
              TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
              sx={tabListStyle}
            >
              <Tab sx={tabStyle} label="Overview" value="overview" disableRipple icon={<Speed />} />
              <Tab sx={tabStyle} label="Analytics" value="analytics" disableRipple icon={<Timeline />} />
              <Tab sx={tabStyle} label="Systems" value="systems" disableRipple icon={<Assessment />} />
            </TabList>
          </Box>
          
          <TabPanel value="overview" sx={tabPanelStyle}>
            <OverviewTab />
          </TabPanel>
          
          <TabPanel value="analytics" sx={tabPanelStyle}>
            <AnalyticsTab />
          </TabPanel>
          
          <TabPanel value="systems" sx={tabPanelStyle}>
            <SystemsTab />
          </TabPanel>
        </TabContext>
      </Stack>
    </Stack>
  );
};

export default AISystemHealthMonitor;