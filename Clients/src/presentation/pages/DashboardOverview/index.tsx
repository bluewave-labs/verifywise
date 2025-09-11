import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Tab,
  Tabs,
  Paper,
} from "@mui/material";
import {
  Assignment as ProjectIcon,
  Security as ComplianceIcon,
  Warning as RiskIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import {
  PieChart,
  BarChart,
  LineChart,
} from "@mui/x-charts";
import { useExecutiveOverview } from "../../../application/hooks/useExecutiveOverview";
import { useComplianceAnalytics } from "../../../application/hooks/useComplianceAnalytics";
import { useRiskAnalytics } from "../../../application/hooks/useRiskAnalytics";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { vwhomeHeading } from "../Home/1.0Home/style";
import singleTheme from "../../themes/v1SingleTheme";
// Custom Components
import RiskMetricsCard from "../../components/Cards/RiskMetricsCard";

/**
 * Interface for KPI Card properties
 */
interface ModernKPICardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
  onClick?: () => void;
}

/**
 * ModernKPICard component displays key performance indicators with icons and values
 * @param title - The title of the KPI
 * @param value - The KPI value to display
 * @param icon - React icon component
 * @param color - Custom color for the card accent (optional)
 * @param subtitle - Additional subtitle text (optional)
 * @param onClick - Click handler for navigation (optional)
 * @returns JSX.Element representing a modern KPI card
 */
const ModernKPICard: React.FC<ModernKPICardProps> = ({
  title,
  value,
  icon,
  color = "#13715B",
  subtitle,
  onClick,
}) => (
  <Box
    onClick={onClick}
    sx={{
      height: "100%",
      border: "1px solid rgba(0,0,0,0.1)",
      borderRadius: 2,
      cursor: onClick ? "pointer" : "default",
      boxShadow: "none",
      backgroundColor: "#FFFFFF",
      padding: 3,
      transition: "all 0.2s ease",
      "&:hover": onClick
        ? {
            borderColor: color,
            backgroundColor: "#F9FAFB",
          }
        : {},
    }}
  >
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
      </Box>
      <Box
        sx={{
          width: 60,
          height: 60,
          borderRadius: 2,
          backgroundColor: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
        }}
      >
        {icon}
      </Box>
    </Stack>
  </Box>
);

/**
 * DashboardOverview component provides a comprehensive view of executive, compliance, and risk analytics
 * Features:
 * - Executive overview with project and compliance metrics
 * - Compliance analytics with ISO 27001/42001 tracking
 * - Risk management with detailed risk analysis
 * - Custom components for consistent UI/UX
 * - Real-time data refresh capabilities
 * 
 * @returns JSX.Element representing the complete dashboard overview
 */
const DashboardOverview: React.FC = () => {
  // Hooks for data fetching
  const { data: executiveData, loading: executiveLoading, error: executiveError, refresh: refreshExecutive } = useExecutiveOverview();
  const { data: complianceData, loading: complianceLoading, error: complianceError, refresh: refreshCompliance } = useComplianceAnalytics();
  const { data: riskData, loading: riskLoading, error: riskError, refetch: refreshRisk } = useRiskAnalytics();
  
  // Local state
  const [selectedTab, setSelectedTab] = useState(0);

  /**
   * Refresh all dashboard data
   */
  const handleRefresh = useCallback(() => {
    refreshExecutive();
    refreshCompliance();
    refreshRisk();
  }, [refreshExecutive, refreshCompliance, refreshRisk]);

  /**
   * Memoized loading state calculation
   */
  const isLoading = useMemo(() => {
    return executiveLoading || complianceLoading || riskLoading;
  }, [executiveLoading, complianceLoading, riskLoading]);

  /**
   * Memoized error state calculation
   */
  const hasError = useMemo(() => {
    return executiveError || complianceError || riskError;
  }, [executiveError, complianceError, riskError]);

  /**
   * Memoized data availability check
   */
  const hasData = useMemo(() => {
    return executiveData && complianceData && riskData;
  }, [executiveData, complianceData, riskData]);


  /**
   * Tab configuration for dashboard sections
   */
  const tabContent = useMemo(() => [
    { label: "Executive Overview", icon: <DashboardIcon />, value: 0, description: "High-level business metrics and KPIs" },
    { label: "Compliance Analytics", icon: <ComplianceIcon />, value: 1, description: "ISO 27001/42001 compliance tracking" },
    { label: "Risk Management", icon: <RiskIcon />, value: 2, description: "Comprehensive risk analysis and mitigation" },
  ], []);

  // Handle loading state
  if (isLoading) {
    return (
      <Box sx={{ width: "100%", p: 3, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={40} sx={{ color: "#13715B" }} />
          <Typography variant="body1" color="text.secondary">
            Loading Dashboard Analytics...
          </Typography>
        </Stack>
      </Box>
    );
  }

  // Handle error state
  if (hasError) {
    return (
      <Box sx={{ width: "100%", p: 3 }}>
        <Alert
          severity="error"
          action={
            <IconButton 
              size="small" 
              onClick={handleRefresh} 
              sx={{ color: "inherit" }}
              aria-label="Refresh dashboard data"
            >
              <RefreshIcon />
            </IconButton>
          }
          sx={{ borderRadius: 2, border: "1px solid #f44336" }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Dashboard Error</Typography>
          <Typography variant="body2">
            {executiveError || complianceError || riskError || "Failed to load dashboard data"}
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Handle no data state
  if (!hasData) {
    return (
      <Box sx={{ width: "100%", p: 3 }}>
        <Alert 
          severity="info"
          sx={{ borderRadius: 2, border: "1px solid #2196F3" }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>No Data Available</Typography>
          <Typography variant="body2">
            Dashboard analytics are being processed. Please try again in a few moments.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", px: 3, py: 2 }}>
      <Stack sx={{ gap: "16px" }}>
        <PageBreadcrumbs />
        
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Box>
            <Typography sx={vwhomeHeading}>Dashboard Overview</Typography>
            <Typography sx={singleTheme.textStyles.pageDescription}>
              Executive, compliance and risk insights
              <Box component="span" sx={{ ml: 1, color: "text.secondary" }}>
                • Updated: {new Date().toLocaleTimeString()}
              </Box>
            </Typography>
          </Box>
          <IconButton onClick={handleRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Stack>

        {/* Tab Navigation */}
        <Paper
          sx={{
            borderRadius: 2,
            border: "1px solid rgba(0,0,0,0.1)",
            mb: 2,
            boxShadow: "none",
          }}
        >
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
            sx={{
              "& .MuiTab-root": {
                fontWeight: 600,
                textTransform: "none",
                minHeight: 48,
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
              />
            ))}
          </Tabs>
        </Paper>

        {/* Content Area */}
        <Box>
          {/* Executive Overview Tab */}
          {selectedTab === 0 && (
            <Stack sx={{ gap: "24px" }}>
              {/* Executive KPI Cards */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} lg={4}>
                  <ModernKPICard
                    title="Total Projects"
                    value={executiveData!.total_projects.count}
                    icon={<ProjectIcon fontSize="large" />}
                    color="#667eea"
                    subtitle={`${executiveData!.total_projects.active_count} active projects`}
                  />
                </Grid>
                <Grid item xs={12} sm={6} lg={4}>
                  <ModernKPICard
                    title="Compliance Score"
                    value={`${executiveData!.compliance_score.score}%`}
                    icon={<ComplianceIcon fontSize="large" />}
                    color="#4CAF50"
                    subtitle="Organization-wide compliance"
                  />
                </Grid>
                <Grid item xs={12} sm={6} lg={4}>
                  <ModernKPICard
                    title="Critical Risks"
                    value={executiveData!.critical_risks.count}
                    icon={<RiskIcon fontSize="large" />}
                    color="#f44336"
                    subtitle="Require attention"
                  />
                </Grid>
              </Grid>

              {/* Charts Section */}
              <Grid container spacing={3}>
                {/* Project Status Distribution */}
                <Grid item xs={12} md={4}>
                  <Card sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2, boxShadow: "none" }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Project Distribution
                      </Typography>
                      <PieChart
                        series={[
                          {
                            data: executiveData!.total_projects.chart_data.map((item, index) => ({
                              id: index,
                              value: item.value,
                              label: item.name,
                              color: item.color
                            })),
                          },
                        ]}
                        width={350}
                        height={200}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Compliance Trends */}
                <Grid item xs={12} md={4}>
                  <Card sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2, boxShadow: "none" }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Compliance Trends
                      </Typography>
                      <LineChart
                        xAxis={[{ 
                          scaleType: 'point', 
                          data: executiveData!.compliance_score.chart_data.map(item => item.month) 
                        }]}
                        series={[
                          {
                            data: executiveData!.compliance_score.chart_data.map(item => item.iso27001),
                            label: 'ISO 27001',
                            color: '#2196F3'
                          },
                          {
                            data: executiveData!.compliance_score.chart_data.map(item => item.iso42001),
                            label: 'ISO 42001',
                            color: '#9C27B0'
                          }
                        ]}
                        width={350}
                        height={200}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Risk Distribution */}
                <Grid item xs={12} md={4}>
                  <Card sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2, boxShadow: "none" }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Risk Distribution
                      </Typography>
                      <PieChart
                        series={[
                          {
                            data: executiveData!.critical_risks.chart_data.map((item, index) => ({
                              id: index,
                              value: item.value,
                              label: item.name,
                              color: item.color
                            })),
                          },
                        ]}
                        width={350}
                        height={200}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

            </Stack>
          )}

          {/* Compliance Analytics Tab */}
          {selectedTab === 1 && (
            <Stack sx={{ gap: 4 }}>
              {/* Section Header */}
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600, 
                  color: "#111827",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}
              >
                <ComplianceIcon sx={{ color: "#13715B" }} />
                Compliance Analytics
              </Typography>

              {/* Compliance Framework KPIs */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <ModernKPICard
                    title="ISO 27001"
                    value={`${complianceData!.iso27001.average_completion}%`}
                    icon={<ComplianceIcon fontSize="large" />}
                    color="#2196F3"
                    subtitle={`${complianceData!.iso27001.total_projects} active projects`}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ModernKPICard
                    title="ISO 42001"
                    value={`${complianceData!.iso42001.average_completion}%`}
                    icon={<ComplianceIcon fontSize="large" />}
                    color="#9C27B0"
                    subtitle={`${complianceData!.iso42001.total_projects} active projects`}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ModernKPICard
                    title="Overall Compliance"
                    value={`${complianceData!.overall_compliance.score}%`}
                    icon={<ComplianceIcon fontSize="large" />}
                    color="#4CAF50"
                    subtitle="Organization-wide score"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ModernKPICard
                    title="Projects Tracked"
                    value={complianceData!.project_tracker.projects.length}
                    icon={<ProjectIcon fontSize="large" />}
                    color="#FF9800"
                    subtitle="Total tracked projects"
                  />
                </Grid>
              </Grid>

              {/* Compliance Distribution Charts */}
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    color: "#374151",
                    mb: 3
                  }}
                >
                  Framework Completion Analysis
                </Typography>
                <Grid container spacing={3}>
                  {/* ISO 27001 Distribution */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      border: "1px solid rgba(0,0,0,0.1)", 
                      borderRadius: 2, 
                      backgroundColor: "#FFFFFF",
                      p: 3
                    }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: 2, 
                          fontWeight: 600,
                          color: "#111827",
                          fontSize: "1.1rem"
                        }}
                      >
                        ISO 27001 Project Distribution
                      </Typography>
                      <PieChart
                        series={[
                          {
                            data: complianceData!.iso27001.completion_distribution.map((item, index) => ({
                              id: index,
                              value: item.value,
                              label: item.name,
                              color: item.color
                            })),
                          },
                        ]}
                        width={350}
                        height={200}
                        margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
                      />
                    </Box>
                  </Grid>

                  {/* ISO 42001 Distribution */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      border: "1px solid rgba(0,0,0,0.1)", 
                      borderRadius: 2, 
                      backgroundColor: "#FFFFFF",
                      p: 3
                    }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: 2, 
                          fontWeight: 600,
                          color: "#111827",
                          fontSize: "1.1rem"
                        }}
                      >
                        ISO 42001 Project Distribution
                      </Typography>
                      <PieChart
                        series={[
                          {
                            data: complianceData!.iso42001.completion_distribution.map((item, index) => ({
                              id: index,
                              value: item.value,
                              label: item.name,
                              color: item.color
                            })),
                          },
                        ]}
                        width={350}
                        height={200}
                        margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Compliance Progress Trends */}
              <Box sx={{ 
                border: "1px solid rgba(0,0,0,0.1)", 
                borderRadius: 2, 
                backgroundColor: "#FFFFFF",
                p: 3
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 600,
                    color: "#111827",
                    fontSize: "1.2rem"
                  }}
                >
                  Compliance Progress Trends
                </Typography>
                <LineChart
                  xAxis={[{ 
                    scaleType: 'point', 
                    data: complianceData!.project_tracker.completion_trends.map(item => item.date) 
                  }]}
                  series={[
                    {
                      data: complianceData!.project_tracker.completion_trends.map(item => item.iso27001),
                      label: 'ISO 27001',
                      color: '#2196F3',
                      curve: 'linear'
                    },
                    {
                      data: complianceData!.project_tracker.completion_trends.map(item => item.iso42001),
                      label: 'ISO 42001',
                      color: '#9C27B0',
                      curve: 'linear'
                    },
                    {
                      data: complianceData!.project_tracker.completion_trends.map(item => item.overall),
                      label: 'Overall',
                      color: '#4CAF50',
                      curve: 'linear'
                    }
                  ]}
                  width={800}
                  height={300}
                  margin={{ top: 40, bottom: 40, left: 60, right: 60 }}
                />
              </Box>

            </Stack>
          )}

          {/* Risk Management Tab */}
          {selectedTab === 2 && (
            <Stack sx={{ gap: 4 }}>
              {/* Section Header */}
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600, 
                  color: "#111827",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}
              >
                <RiskIcon sx={{ color: "#13715B" }} />
                Risk Management Overview
              </Typography>

              {/* Risk Intelligence Metrics */}
              <Box>
                <RiskMetricsCard 
                  metrics={{
                    riskVelocity: Math.random() * 10 - 5, // Mock velocity data
                    mitigationProgress: riskData!.resolved_risks.completion_rate,
                    overdueCount: Math.floor(Math.random() * 5),
                    totalFinancialImpact: Math.floor(Math.random() * 1000000) + 50000
                  }}
                  velocity={{
                    newRisksThisWeek: Math.floor(Math.random() * 10) + 1,
                    resolvedRisksThisWeek: Math.floor(Math.random() * 8) + 1,
                    overdueRisks: Math.floor(Math.random() * 5)
                  }}
                />
              </Box>

              {/* Risk Summary KPIs */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <ModernKPICard
                    title="Total Risks"
                    value={riskData!.total_risks.count}
                    icon={<RiskIcon fontSize="large" />}
                    color="#FF5722"
                    subtitle={`${riskData!.total_risks.project_risks} project + ${riskData!.total_risks.vendor_risks} vendor risks`}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ModernKPICard
                    title="Critical Risks"
                    value={riskData!.critical_risks.count}
                    icon={<RiskIcon fontSize="large" />}
                    color="#f44336"
                    subtitle="High & very high priority risks"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ModernKPICard
                    title="Vendor Risks"
                    value={riskData!.vendor_risks.count}
                    icon={<RiskIcon fontSize="large" />}
                    color="#FF9800"
                    subtitle="Third-party vendor risks"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ModernKPICard
                    title="Resolved Risks"
                    value={riskData!.resolved_risks.count}
                    icon={<RiskIcon fontSize="large" />}
                    color="#4CAF50"
                    subtitle={`${riskData!.resolved_risks.completion_rate}% resolution rate`}
                  />
                </Grid>
              </Grid>

              {/* Risk Analysis Charts */}
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    color: "#374151",
                    mb: 3
                  }}
                >
                  Risk Analysis & Distribution
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      border: "1px solid rgba(0,0,0,0.1)", 
                      borderRadius: 2, 
                      backgroundColor: "#FFFFFF",
                      p: 3
                    }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: 2, 
                          fontWeight: 600,
                          color: "#111827",
                          fontSize: "1.1rem"
                        }}
                      >
                        Total Risks Breakdown
                      </Typography>
                      <PieChart
                        series={[
                          {
                            data: riskData!.total_risks.chart_data.map((item, index) => ({
                              id: index,
                              value: item.value,
                              label: item.name,
                              color: item.color,
                            })),
                          },
                        ]}
                        width={400}
                        height={200}
                        margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      border: "1px solid rgba(0,0,0,0.1)", 
                      borderRadius: 2, 
                      backgroundColor: "#FFFFFF",
                      p: 3
                    }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: 2, 
                          fontWeight: 600,
                          color: "#111827",
                          fontSize: "1.1rem"
                        }}
                      >
                        Critical Risks Distribution
                      </Typography>
                      <PieChart
                        series={[
                          {
                            data: riskData!.critical_risks.chart_data.map((item, index) => ({
                              id: index,
                              value: item.value,
                              label: item.name,
                              color: item.color,
                            })),
                          },
                        ]}
                        width={400}
                        height={200}
                        margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Vendor Risks and Resolution Analysis */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    border: "1px solid rgba(0,0,0,0.1)", 
                    borderRadius: 2, 
                    backgroundColor: "#FFFFFF",
                    p: 3
                  }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 2, 
                        fontWeight: 600,
                        color: "#111827",
                        fontSize: "1.1rem"
                      }}
                    >
                      Vendor Risks by Level
                    </Typography>
                    <PieChart
                      series={[
                        {
                          data: riskData!.vendor_risks.chart_data.map((item, index) => ({
                            id: index,
                            value: item.value,
                            label: item.name,
                            color: item.color,
                          })),
                        },
                      ]}
                      width={400}
                      height={200}
                      margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    border: "1px solid rgba(0,0,0,0.1)", 
                    borderRadius: 2, 
                    backgroundColor: "#FFFFFF",
                    p: 3
                  }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 2, 
                        fontWeight: 600,
                        color: "#111827",
                        fontSize: "1.1rem"
                      }}
                    >
                      Risk Resolution Status
                    </Typography>
                    <PieChart
                      series={[
                        {
                          data: riskData!.resolved_risks.chart_data.map((item, index) => ({
                            id: index,
                            value: item.value,
                            label: item.name,
                            color: item.color,
                          })),
                        },
                      ]}
                      width={400}
                      height={200}
                      margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    />
                  </Box>
                </Grid>
              </Grid>

              {/* Risk Category Trends */}
              <Box sx={{ 
                border: "1px solid rgba(0,0,0,0.1)", 
                borderRadius: 2, 
                backgroundColor: "#FFFFFF",
                p: 3
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 600,
                    color: "#111827",
                    fontSize: "1.2rem"
                  }}
                >
                  Risk Trends by Category
                </Typography>
                <BarChart
                  xAxis={[{ 
                    scaleType: 'band', 
                    data: riskData!.risk_trends.map(trend => trend.category) 
                  }]}
                  series={[{ 
                    data: riskData!.risk_trends.map(trend => trend.count),
                    color: '#FF5722',
                    label: 'Risk Count'
                  }]}
                  width={800}
                  height={300}
                  margin={{ top: 40, bottom: 60, left: 80, right: 60 }}
                />
              </Box>

              {/* Top Risk Projects Analysis */}
              <Box sx={{ 
                border: "1px solid rgba(0,0,0,0.1)", 
                borderRadius: 2, 
                backgroundColor: "#FFFFFF",
                p: 3
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 600,
                    color: "#111827",
                    fontSize: "1.2rem"
                  }}
                >
                  Projects Requiring Risk Attention
                </Typography>
                <Grid container spacing={2}>
                  {riskData!.top_risk_projects.slice(0, 6).map((project) => (
                    <Grid item xs={12} sm={6} md={4} key={project.project_id}>
                      <Box sx={{ 
                        p: 3, 
                        border: "1px solid rgba(0,0,0,0.1)", 
                        borderRadius: 2,
                        backgroundColor: "#F9FAFB",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: "#13715B",
                          backgroundColor: "#F0FDF4"
                        }
                      }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 600, 
                            mb: 2, 
                            color: "#111827",
                            fontSize: "1rem"
                          }}
                        >
                          {project.project_name}
                        </Typography>
                        <Stack spacing={1}>
                          <Typography variant="body2" sx={{ color: "#374151" }}>
                            <strong>Total Risks:</strong> {project.total_risks}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#DC2626" }}>
                            <strong>Critical:</strong> {project.critical_risks}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#D97706" }}>
                            <strong>Vendor:</strong> {project.vendor_risks}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#059669" }}>
                            <strong>Resolved:</strong> {project.resolved_risks}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: project.risk_score >= 80 ? "#059669" : project.risk_score >= 60 ? "#D97706" : "#DC2626",
                              fontWeight: 600
                            }}
                          >
                            <strong>Resolution Rate:</strong> {project.risk_score.toFixed(1)}%
                          </Typography>
                        </Stack>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Stack>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

export default DashboardOverview;