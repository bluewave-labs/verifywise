import React, { useState } from "react";
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
import { useComprehensiveDashboard } from "../../../application/hooks/useComprehensiveDashboard";
import { useExecutiveOverview } from "../../../application/hooks/useExecutiveOverview";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { vwhomeHeading } from "../Home/1.0Home/style";
import singleTheme from "../../themes/v1SingleTheme";

interface ModernKPICardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
  onClick?: () => void;
}

const ModernKPICard: React.FC<ModernKPICardProps> = ({
  title,
  value,
  icon,
  color = "#13715B",
  subtitle,
  onClick,
}) => (
  <Card
    onClick={onClick}
    sx={{
      height: "100%",
      border: "1px solid rgba(0,0,0,0.1)",
      borderRadius: 2,
      cursor: onClick ? "pointer" : "default",
      boxShadow: "none",
      "&:hover": onClick
        ? {
            borderColor: color,
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
    </CardContent>
  </Card>
);

const DashboardOverview: React.FC = () => {
  const { data, loading, error, lastUpdated, refresh } = useComprehensiveDashboard();
  const { data: executiveData, loading: executiveLoading, error: executiveError, refresh: refreshExecutive } = useExecutiveOverview();
  const [selectedTab, setSelectedTab] = useState(0);

  const handleRefresh = () => {
    refresh();
    refreshExecutive();
  };

  if (loading || executiveLoading) {
    return (
      <Box sx={{ width: "100%", p: 3, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={40} />
          <Typography variant="body1" color="text.secondary">
            Loading Dashboard...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error || executiveError) {
    return (
      <Box sx={{ width: "100%", p: 3 }}>
        <Alert
          severity="error"
          action={
            <IconButton size="small" onClick={handleRefresh} sx={{ color: "inherit" }}>
              <RefreshIcon />
            </IconButton>
          }
        >
          <Typography variant="h6">Error Loading Dashboard</Typography>
          <Typography variant="body2">{error || executiveError}</Typography>
        </Alert>
      </Box>
    );
  }

  if (!data || !executiveData) {
    return (
      <Box sx={{ width: "100%", p: 3 }}>
        <Alert severity="warning">
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
  ];

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
              {lastUpdated && (
                <Box component="span" sx={{ ml: 1, color: "text.secondary" }}>
                  • Updated: {lastUpdated.toLocaleTimeString()}
                </Box>
              )}
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
                    value={executiveData.total_projects.count}
                    icon={<ProjectIcon fontSize="large" />}
                    color="#667eea"
                    subtitle={`${executiveData.total_projects.active_count} active`}
                  />
                </Grid>
                <Grid item xs={12} sm={6} lg={4}>
                  <ModernKPICard
                    title="Compliance Score"
                    value={`${executiveData.compliance_score.score}%`}
                    icon={<ComplianceIcon fontSize="large" />}
                    color="#4CAF50"
                    subtitle="Organization wide"
                  />
                </Grid>
                <Grid item xs={12} sm={6} lg={4}>
                  <ModernKPICard
                    title="Critical Risks"
                    value={executiveData.critical_risks.count}
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
                            data: executiveData.total_projects.chart_data.map((item, index) => ({
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
                          data: executiveData.compliance_score.chart_data.map(item => item.month) 
                        }]}
                        series={[
                          {
                            data: executiveData.compliance_score.chart_data.map(item => item.iso27001),
                            label: 'ISO 27001',
                            color: '#2196F3'
                          },
                          {
                            data: executiveData.compliance_score.chart_data.map(item => item.iso42001),
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
                            data: executiveData.critical_risks.chart_data.map((item, index) => ({
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
            <Stack sx={{ gap: "24px" }}>
              {/* Compliance KPIs */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <ModernKPICard
                    title="ISO 27001"
                    value={`${data.compliance.iso27001_avg}%`}
                    icon={<ComplianceIcon fontSize="large" />}
                    color="#2196F3"
                    subtitle="Average completion"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ModernKPICard
                    title="ISO 42001"
                    value={`${data.compliance.iso42001_avg}%`}
                    icon={<ComplianceIcon fontSize="large" />}
                    color="#9C27B0"
                    subtitle="Average completion"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ModernKPICard
                    title="Overall Compliance"
                    value={`${data.compliance.overall_compliance}%`}
                    icon={<ComplianceIcon fontSize="large" />}
                    color="#4CAF50"
                    subtitle="Organization wide"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ModernKPICard
                    title="Projects Tracked"
                    value={data.compliance.compliance_trends.reduce((acc, framework) => acc + framework.projects.length, 0)}
                    icon={<ProjectIcon fontSize="large" />}
                    color="#FF9800"
                    subtitle="Total projects"
                  />
                </Grid>
              </Grid>

              {/* Compliance Trends */}
              <Card sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2, boxShadow: "none" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Compliance by Framework
                  </Typography>
                  {data.compliance.compliance_trends.map((framework) => (
                    <Box key={framework.framework} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                        {framework.framework}
                      </Typography>
                      <Grid container spacing={2}>
                        {framework.projects.slice(0, 6).map((project) => (
                          <Grid item xs={12} sm={6} md={4} key={project.project_id}>
                            <Box sx={{ p: 2, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                {project.project_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Completion: {project.completion_rate}%
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Stack>
          )}

          {/* Risk Management Tab */}
          {selectedTab === 2 && (
            <Stack sx={{ gap: "24px" }}>
              {/* Risk KPIs */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <ModernKPICard
                    title="Total Risks"
                    value={data.risks.total_risks}
                    icon={<RiskIcon fontSize="large" />}
                    color="#FF5722"
                    subtitle="All identified risks"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ModernKPICard
                    title="Critical Risks"
                    value={data.risks.critical_risks}
                    icon={<RiskIcon fontSize="large" />}
                    color="#f44336"
                    subtitle="High priority"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ModernKPICard
                    title="Vendor Risks"
                    value={data.risks.vendor_risks}
                    icon={<RiskIcon fontSize="large" />}
                    color="#FF9800"
                    subtitle="Third-party risks"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <ModernKPICard
                    title="Resolved Risks"
                    value={data.risks.risk_distribution.resolved}
                    icon={<RiskIcon fontSize="large" />}
                    color="#4CAF50"
                    subtitle="Successfully mitigated"
                  />
                </Grid>
              </Grid>

              {/* Risk Distribution */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2, boxShadow: "none" }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Risk Distribution
                      </Typography>
                      <PieChart
                        series={[
                          {
                            data: [
                              { id: 0, value: data.risks.risk_distribution.high, label: 'High' },
                              { id: 1, value: data.risks.risk_distribution.medium, label: 'Medium' },
                              { id: 2, value: data.risks.risk_distribution.low, label: 'Low' },
                              { id: 3, value: data.risks.risk_distribution.resolved, label: 'Resolved' },
                            ],
                          },
                        ]}
                        width={400}
                        height={200}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2, boxShadow: "none" }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Risk Trends by Category
                      </Typography>
                      <BarChart
                        xAxis={[{ scaleType: 'band', data: data.risks.risk_trends.map(trend => trend.category) }]}
                        series={[{ data: data.risks.risk_trends.map(trend => trend.count) }]}
                        width={400}
                        height={200}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Top Risk Projects */}
              <Card sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2, boxShadow: "none" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Top Risk Projects
                  </Typography>
                  <Grid container spacing={2}>
                    {data.risks.top_risk_projects.slice(0, 6).map((project) => (
                      <Grid item xs={12} sm={6} md={4} key={project.project_id}>
                        <Box sx={{ p: 2, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            {project.project_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Risk Count: {project.risk_count}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Severity: {project.severity_score}%
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

export default DashboardOverview;