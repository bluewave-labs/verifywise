import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import React from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Divider,
  Button,
  Stack,
  Avatar,
  Alert,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import InfoIcon from "@mui/icons-material/Info";
import DownloadIcon from "@mui/icons-material/Download";
import { BarChart } from "@mui/x-charts";
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-basic-dist';
const Plot = createPlotlyComponent(Plotly);
import { biasAndFairnessService } from "../../../infrastructure/api/biasAndFairnessService";

type MetricEntry = { value: number; status?: string; confidence?: string; [k: string]: unknown };
type DataQuality = {
  data_quality_score?: number;
  insights?: string[];
  flagged_metrics?: Record<string, { value?: number; reason?: string; recommendation?: string }>;
};
type MetricsConfiguration = {
  user_selected_metrics?: string[];
  fairness_compass_recommended_metrics?: string[];
  all_available_metrics?: string[];
};
type CleanResults = {
  metadata?: { dataset?: string; model?: string; model_task?: string; evaluation_timestamp?: string; metrics_configuration?: MetricsConfiguration };
  performance?: Record<string, number>;
  fairness_metrics?: Record<string, MetricEntry>;
  data_quality?: DataQuality;
};
type ResultsResponse = { results: CleanResults; status?: string; eval_id?: string; dataset_name?: string; model_name?: string; model_task?: string; created_at?: string };

const metricDescriptions: { [metric: string]: string } = {
  demographic_parity: "Measures how equally outcomes are distributed across groups. Lower is fairer.",
  equalized_odds: "Difference in true positive and false positive rates between groups. Lower means less bias.",
  predictive_parity: "Measures consistency in positive predictive value across groups.",
  equalized_opportunity: "Measures gaps in true positive rate (TPR) between groups. Lower means more equal opportunity.",
  predictive_equality: "Measures consistency in false positive rate (FPR) across groups.",
  conditional_use_accuracy_equality: "Measures consistency in accuracy across groups.",
  accuracy_difference: "Difference in accuracy between privileged and unprivileged groups.",
  precision_difference: "Difference in precision between privileged and unprivileged groups.",
  recall_difference: "Difference in recall between privileged and unprivileged groups.",
  f1_difference: "Difference in F1 score between privileged and unprivileged groups.",
  toxicity_gap: "Difference in toxicity scores between groups.",
  sentiment_gap: "Difference in sentiment scores between groups.",
  stereotype_gap: "Difference in stereotype scores between groups.",
  exposure_disparity: "Difference in exposure to model outputs between groups.",
  representation_disparity: "Difference in representation in model outputs between groups.",
  prompt_fairness: "Fairness in prompt handling across groups.",
  balance_positive_class: "Balance in positive class predictions across groups.",
  balance_negative_class: "Balance in negative class predictions across groups.",
  calibration: "Calibration consistency across groups.",
  accuracy: "Overall correctness of the model's predictions",
  precision: "Proportion of positive predictions that are correct",
  recall: "Proportion of actual positives that are correctly identified",
  f1_score: "Harmonic mean of precision and recall"
};

export default function BiasAndFairnessResultsPage() {
  const { id } = useParams();
  const [metrics, setMetrics] = useState<ResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const isDemo = !id;
  const [tab, setTab] = useState(0);
  // Applied selection affects charts; draft holds checkbox changes until user clicks Select
  const [appliedSelection, setAppliedSelection] = useState<Record<string, boolean>>({});
  const [explorerDraftSelection, setExplorerDraftSelection] = useState<Record<string, boolean>>({});

  const barColors = [
    "#E6194B", "#3CB44B", "#FFE119", "#4363D8", "#F58231",
    "#911EB4", "#42D4F4", "#F032E6", "#BFef45", "#FABEBE",
  ];

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        if (isDemo) {
          // Load mock data shipped with the app (structure matches clean_results.json)
          const resp = await fetch('/mock/clean_results.json');
          const data = await resp.json();
          setMetrics({ results: data, status: 'completed' });
        } else {
          const data = await biasAndFairnessService.getBiasFairnessEvaluation(id as string);
          setMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        setError('Failed to fetch metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [id, isDemo]);

  // Initialize checkbox selections when metrics are loaded
  useEffect(() => {
    if (metrics?.results?.metadata?.metrics_configuration) {
      const userSelected = metrics.results.metadata.metrics_configuration.user_selected_metrics || [];
      const compassRecommended = metrics.results.metadata.metrics_configuration.fairness_compass_recommended_metrics || [];
      const displayMetrics = [...new Set([...userSelected, ...compassRecommended])];
      
      const initialSelection: Record<string, boolean> = {};
      displayMetrics.forEach(metric => {
        initialSelection[metric] = true;
      });
      
      setAppliedSelection(initialSelection);
      setExplorerDraftSelection(initialSelection);
    }
  }, [metrics]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <Typography>No metrics found.</Typography>
      </Box>
    );
  }

  // Extract metadata from config_data - move this before functions that use it
  const performance: Record<string, number> = metrics?.results?.performance || {};
  const fairness_metrics: Record<string, MetricEntry> = metrics?.results?.fairness_metrics || {};
  const data_quality: DataQuality = metrics?.results?.data_quality || {};
  const metricsCfg: MetricsConfiguration = metrics?.results?.metadata?.metrics_configuration || {};

  // Get metrics to display based on user selection and compass recommendations
  const getMetricsToDisplay = () => {
    const userSelected = metricsCfg.user_selected_metrics || [];
    const compassRecommended = metricsCfg.fairness_compass_recommended_metrics || [];
    
    // Combine user selected and compass recommended metrics, removing duplicates
    const displayMetrics = [...new Set([...userSelected, ...compassRecommended])];
    
    return displayMetrics;
  };

  // Check if a metric value is valid (not flagged as faulty)
  const isMetricValid = (metricName: string, attribute: string) => {
    const fullKey = `${metricName}_${attribute}`;
    const flagged = data_quality?.flagged_metrics || {};
    
    // Exclude if flagged as faulty
    if (flagged[fullKey]) {
      return false;
    }
    
    return true;
  };

  // Extract fairness metrics by attribute with intelligent filtering
  const getFairnessMetricsByAttribute = (attribute: string) => {
    const attributeMetrics: Record<string, number> = {};
    const metricsToDisplay = getMetricsToDisplay();
    
    // Check if we have results from the evaluation
    if (metrics?.results?.fairness_metrics) {
      Object.entries(metrics.results.fairness_metrics).forEach(([key, value]) => {
        if (key.endsWith(`_${attribute}`) && value && typeof value === 'object' && (value as { value?: number }).value !== undefined) {
          const metricName = key.replace(`_${attribute}`, '');
          const metricValue = (value as { value: number }).value as number;
          
          // Only include if:
          // 1. It's in the user-selected or compass-recommended metrics
          // 2. It's not flagged as faulty
          // 3. The value is reasonable (not extremely large like 19.0)
          if (metricsToDisplay.includes(metricName) && 
              isMetricValid(metricName, attribute) &&
              Math.abs(metricValue) < 2.0) { // Filter out extreme values
            attributeMetrics[metricName] = metricValue;
          }
        }
      });
    }
    
    return attributeMetrics;
  };

  const sexMetricsAll = getFairnessMetricsByAttribute('sex');
  const raceMetricsAll = getFairnessMetricsByAttribute('race');

  // Apply explorer selection: if any metrics are selected, filter charts to those; else show all
  const selectedMetricNames = Object.keys(appliedSelection).filter(k => appliedSelection[k]);
  const filterBySelection = (data: Record<string, number>) => {
    if (selectedMetricNames.length === 0) return data;
    const filtered: Record<string, number> = {};
    for (const [k, v] of Object.entries(data)) {
      if (selectedMetricNames.includes(k)) filtered[k] = v;
    }
    return filtered;
  };
  const sexMetrics = filterBySelection(sexMetricsAll);
  const raceMetrics = filterBySelection(raceMetricsAll);

  // Determine if draft differs from applied
  const hasDraftChanges = (() => {
    const keys = new Set<string>([...Object.keys(appliedSelection), ...Object.keys(explorerDraftSelection)]);
    for (const k of keys) {
      if (!!appliedSelection[k] !== !!explorerDraftSelection[k]) return true;
    }
    return false;
  })();

  const handleApplySelection = () => {
    setAppliedSelection({ ...explorerDraftSelection });
  };

  // Get unique metric names for charting
  const getUniqueMetricNames = () => {
    const names = new Set<string>();
    
    if (metrics?.results?.fairness_metrics) {
      Object.keys(metrics.results.fairness_metrics).forEach(key => {
        const parts = key.split('_');
        if (parts.length > 1) {
          names.add(parts.slice(0, -1).join('_'));
        }
      });
    }
    
    return Array.from(names);
  };

  const uniqueMetrics = getUniqueMetricNames();

  const handleCopyJSON = () => {
    try {
      const json = JSON.stringify(metrics?.results || {}, null, 2);
      navigator.clipboard.writeText(json);
    } catch {
      // no-op
    }
  };

  const handleDownloadJSON = () => {
    try {
      const json = JSON.stringify(metrics?.results || {}, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `evaluation-results-${metrics?.eval_id || 'unknown'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download JSON:', error);
    }
  };

  return (
    <Box p={4} sx={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton
            onClick={() => navigate("/fairness-dashboard")}
            sx={{ 
              mr: 2, 
              backgroundColor: 'white',
              boxShadow: 1,
              '&:hover': { backgroundColor: '#f3f4f6' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box display="flex" alignItems="center" flex={1}>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#1f2937',
                  mb: 0.5
                }}
              >
                Bias & Fairness Evaluation Results
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Comprehensive analysis of model fairness across protected attributes
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
            label={metrics?.status === 'completed' ? 'Completed' : (metrics?.status || (isDemo ? 'Demo' : ''))}
            color="success"
            variant="filled"
            sx={{ 
              fontWeight: 600,
              px: 2,
              py: 1,
              height: 'auto'
            }}
          />
        </Box>
      </Box>

      <Paper 
        elevation={0} 
        sx={{ 
          mb: 4,
          backgroundColor: 'white',
          borderRadius: 3,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
        }}
      >
        <Tabs 
          value={tab} 
          onChange={(_, v) => setTab(v)} 
          sx={{ 
            px: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              minHeight: 56,
              color: '#6b7280',
              '&.Mui-selected': {
                color: '#13715B',
                fontWeight: 700
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#13715B',
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }} 
          variant="scrollable" 
          scrollButtons allowScrollButtonsMobile
        >
          <Tab label="Overview" />
          <Tab label="Plots & Graphs" />
          <Tab label="Raw JSON" />
          <Tab label="Metrics Explorer" />
          <Tab label="Data & Subgroups" />
          <Tab label="Settings / Config" />
        </Tabs>
      </Paper>

      {/* Metadata */}
      {tab === 0 && (
      <Box mb={4}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            backgroundColor: "white",
            borderRadius: 3,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
          }}
        >
          <Box display="flex" alignItems="center" mb={3}>
            <Avatar sx={{ backgroundColor: '#059669', mr: 2, width: 32, height: 32 }}>
              <InfoIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1f2937' }}>
              Evaluation Information
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box sx={{ p: 2, backgroundColor: '#f0fdf4', borderRadius: 2, border: '1px solid #dcfce7' }}>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5, fontWeight: 600 }}>
                    Dataset
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1f2937', fontWeight: 500 }}>
                    {metrics?.dataset_name || metrics?.results?.metadata?.dataset || "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ p: 2, backgroundColor: '#fef3c7', borderRadius: 2, border: '1px solid #fde68a' }}>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5, fontWeight: 600 }}>
                    Model
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1f2937', fontWeight: 500 }}>
                    {metrics?.model_name || metrics?.results?.metadata?.model || "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ p: 2, backgroundColor: '#e0e7ff', borderRadius: 2, border: '1px solid #c7d2fe' }}>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5, fontWeight: 600 }}>
                    Task Type
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1f2937', fontWeight: 500 }}>
                    {(metrics?.model_task || metrics?.results?.metadata?.model_task || "N/A").toString().replace('_', ' ')}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box sx={{ p: 2, backgroundColor: '#f3f4f6', borderRadius: 2, border: '1px solid #d1d5db' }}>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5, fontWeight: 600 }}>
                    Evaluation ID
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1f2937', fontWeight: 500, fontFamily: 'monospace' }}>
                    {metrics?.eval_id || "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ p: 2, backgroundColor: '#ecfdf5', borderRadius: 2, border: '1px solid #d1fae5' }}>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5, fontWeight: 600 }}>
                    Status
                  </Typography>
                  <Chip 
                    label={metrics?.status || "N/A"} 
                    color="success" 
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <Box sx={{ p: 2, backgroundColor: '#fef7ff', borderRadius: 2, border: '1px solid #f3e8ff' }}>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5, fontWeight: 600 }}>
                    Created
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1f2937', fontWeight: 500 }}>
                    {metrics?.created_at ? new Date(metrics.created_at).toLocaleString() : (metrics?.results?.metadata?.evaluation_timestamp ? new Date(metrics.results.metadata.evaluation_timestamp).toLocaleString() : "N/A")}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Box>
      )}

      {/* Performance Metrics */}
      {tab === 0 && Object.keys(performance).length > 0 && (
        <Box mb={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              backgroundColor: "white",
              borderRadius: 3,
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
            }}
          >
            <Box display="flex" alignItems="center" mb={3}>
              <Avatar sx={{ backgroundColor: '#3b82f6', mr: 2, width: 32, height: 32 }}>
                <TrendingUpIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1f2937' }}>
                Performance Metrics
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {Object.entries(performance).map(([metric, value]) => {
                const numericValue = (value as number) * 100;
                const isGood = numericValue >= 70; // Consider 70%+ as good performance
                const icon = isGood ? <TrendingUpIcon /> : <TrendingDownIcon />;
                const color = isGood ? '#10b981' : '#f59e0b';
                
                return (
                  <Grid item xs={12} sm={6} md={3} key={metric}>
                    <Card 
                      sx={{ 
                        backgroundColor: "white",
                        border: `2px solid ${color}20`,
                        borderRadius: 2,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px 0 rgb(0 0 0 / 0.15)',
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3, textAlign: "center" }}>
                        <Avatar sx={{ backgroundColor: color, mx: 'auto', mb: 2, width: 36, height: 36 }}>
                          {React.cloneElement(icon, { sx: { fontSize: 20 } })}
                        </Avatar>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontWeight: 700, 
                            color: '#1f2937',
                            mb: 1
                          }}
                        >
                          {numericValue.toFixed(1)}%
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            textTransform: "capitalize",
                            fontWeight: 600,
                            color: '#6b7280'
                          }}
                        >
                          {metric.replace('_', ' ')}
                        </Typography>
                        <Chip 
                          label={isGood ? 'Good' : 'Needs Attention'}
                          size="small"
                          sx={{
                            mt: 1,
                            backgroundColor: color,
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Box>
      )}

      {/* Fairness Metrics by Attribute */}
      {tab === 0 && Object.keys(fairness_metrics).length > 0 && (
        <Box mb={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              backgroundColor: "white",
              borderRadius: 3,
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
            }}
          >
            <Box display="flex" alignItems="center" mb={4}>
              <Avatar sx={{ backgroundColor: '#8b5cf6', mr: 2, width: 32, height: 32 }}>
                <WarningIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1f2937' }}>
                Fairness Metrics by Protected Attribute
              </Typography>
            </Box>
            
            {/* Sex Metrics */}
            {Object.keys(sexMetrics).length > 0 && (
              <Box mb={4}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar sx={{ backgroundColor: '#ec4899', mr: 2, width: 28, height: 28 }}>
                    <InfoIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937' }}>
                    Sex Attribute Fairness Metrics
                  </Typography>
                </Box>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    backgroundColor: '#fef7ff',
                    borderRadius: 2,
                    border: '1px solid #ec489920'
                  }}
                >
                  {Plot ? (
                    <Plot
                      data={[{
                        type: 'bar',
                        x: Object.keys(sexMetrics),
                        y: Object.values(sexMetrics),
                        marker: { 
                          color: Object.values(sexMetrics).map(v => 
                            Math.abs(v as number) > 0.1 ? '#dc2626' : 
                            Math.abs(v as number) > 0.05 ? '#f59e0b' : '#10b981'
                          ),
                          line: { color: '#ffffff', width: 1 }
                        },
                        text: Object.values(sexMetrics).map(v => v?.toFixed(4)),
                        textposition: 'outside',
                      }]}
                      layout={{ 
                        width: '100%', 
                        height: 400, 
                        margin: { t: 40, b: 120, l: 60, r: 40 }, 
                        xaxis: { 
                          tickangle: 45,
                          title: { text: 'Fairness Metrics', font: { size: 14, color: '#374151' } }
                        },
                        yaxis: { 
                          title: { text: 'Metric Value', font: { size: 14, color: '#374151' } }
                        },
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        font: { family: 'Inter, sans-serif', size: 12 }
                      }}
                      config={{ responsive: true, displayModeBar: false }}
                    />
                  ) : (
                    <BarChart
                      xAxis={[{ 
                        scaleType: 'band', 
                        data: Object.keys(sexMetrics), 
                        tickLabelStyle: { angle: 45, textAnchor: 'start', fontSize: 10 } 
                      }]}
                      series={[{ 
                        data: Object.values(sexMetrics), 
                        label: 'Sex Metrics', 
                        valueFormatter: (v) => (v != null ? v.toFixed(4) : 'N/A'), 
                        color: '#ec4899' 
                      }]}
                      height={400}
                      sx={{ width: '100%' }}
                    />
                  )}
                </Paper>
              </Box>
            )}

            {/* Race Metrics */}
            {Object.keys(raceMetrics).length > 0 && (
              <Box mb={4}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar sx={{ backgroundColor: '#3b82f6', mr: 2, width: 28, height: 28 }}>
                    <InfoIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937' }}>
                    Race Attribute Fairness Metrics
                  </Typography>
                </Box>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    backgroundColor: '#eff6ff',
                    borderRadius: 2,
                    border: '1px solid #3b82f620'
                  }}
                >
                  {Plot ? (
                    <Plot
                      data={[{
                        type: 'bar',
                        x: Object.keys(raceMetrics),
                        y: Object.values(raceMetrics),
                        marker: { 
                          color: Object.values(raceMetrics).map(v => 
                            Math.abs(v as number) > 0.1 ? '#dc2626' : 
                            Math.abs(v as number) > 0.05 ? '#f59e0b' : '#10b981'
                          ),
                          line: { color: '#ffffff', width: 1 }
                        },
                        text: Object.values(raceMetrics).map(v => v?.toFixed(4)),
                        textposition: 'outside',
                      }]}
                      layout={{ 
                        width: '100%', 
                        height: 400, 
                        margin: { t: 40, b: 120, l: 60, r: 40 }, 
                        xaxis: { 
                          tickangle: 45,
                          title: { text: 'Fairness Metrics', font: { size: 14, color: '#374151' } }
                        },
                        yaxis: { 
                          title: { text: 'Metric Value', font: { size: 14, color: '#374151' } }
                        },
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        font: { family: 'Inter, sans-serif', size: 12 }
                      }}
                      config={{ responsive: true, displayModeBar: false }}
                    />
                  ) : (
                    <BarChart
                      xAxis={[{ 
                        scaleType: 'band', 
                        data: Object.keys(raceMetrics), 
                        tickLabelStyle: { angle: 45, textAnchor: 'start', fontSize: 10 } 
                      }]}
                      series={[{ 
                        data: Object.values(raceMetrics), 
                        label: 'Race Metrics', 
                        valueFormatter: (v) => (v != null ? v.toFixed(4) : 'N/A'), 
                        color: '#3b82f6' 
                      }]}
                      height={400}
                      sx={{ width: '100%' }}
                    />
                  )}
                </Paper>
              </Box>
            )}

            {/* Fairness Legend and Info */}
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Fairness Interpretation:</strong> Values closer to 0 indicate better fairness. 
                Green bars show good fairness (&lt;0.05), yellow shows moderate bias (0.05-0.1), 
                and red shows significant bias (&gt;0.1).
              </Typography>
              <Typography variant="body2">
                <strong>Showing:</strong> {Object.keys(sexMetrics).length + Object.keys(raceMetrics).length} metrics 
                from user-selected ({metricsCfg.user_selected_metrics?.length || 0}) and compass-recommended 
                ({metricsCfg.fairness_compass_recommended_metrics?.length || 0}) categories. 
                Faulty metrics are automatically filtered out.
              </Typography>
            </Alert>
          </Paper>
        </Box>
      )}

      {/* Data Quality */}
      {tab === 0 && data_quality && Object.keys(data_quality).length > 0 && (
        <Box mb={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              backgroundColor: "white",
              borderRadius: 3,
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
            }}
          >
            <Box display="flex" alignItems="center" mb={3}>
              <Avatar sx={{ backgroundColor: '#f59e0b', mr: 2, width: 32, height: 32 }}>
                <AssessmentIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1f2937' }}>
                Data Quality Assessment
              </Typography>
            </Box>
            
            {data_quality.data_quality_score && (
              <Box mb={4}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 4,
                    backgroundColor: '#fef3c7',
                    borderRadius: 2,
                    border: '1px solid #fde68a',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h2" sx={{ fontWeight: 700, color: '#92400e', mb: 1 }}>
                    {(data_quality.data_quality_score * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#92400e', fontWeight: 600 }}>
                    Overall Data Quality Score
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#a16207', mt: 1 }}>
                    {data_quality.data_quality_score >= 0.8 ? 'Excellent' : 
                     data_quality.data_quality_score >= 0.6 ? 'Good' : 
                     data_quality.data_quality_score >= 0.4 ? 'Fair' : 'Poor'} quality assessment
                  </Typography>
                </Paper>
              </Box>
            )}
            
            
            {data_quality.insights && data_quality.insights.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1f2937' }}>
                  Quality Insights
                </Typography>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    backgroundColor: '#f0f9ff',
                    borderRadius: 2,
                    border: '1px solid #bae6fd'
                  }}
                >
                  {data_quality.insights.map((insight: string, index: number) => (
                    <Box key={index} display="flex" alignItems="flex-start" mb={1}>
                      <InfoIcon sx={{ color: '#0284c7', mr: 1, mt: 0.2, fontSize: 16 }} />
                      <Typography variant="body2" sx={{ color: "#374151", flex: 1 }}>
                        {insight}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* Metric Descriptions */}
      {tab === 0 && uniqueMetrics.length > 0 && (
        <Box mb={4}>
          <Paper elevation={0} sx={{ p: 3, backgroundColor: "white" }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Metric descriptions
            </Typography>
            <Grid container spacing={2}>
              {uniqueMetrics.slice(0, 6).map((metric) => (
                <Grid item xs={12} md={6} key={metric}>
                  <Box sx={{ p: 2, backgroundColor: "#f8fafc", borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "0.875rem" }}>
                      {metricDescriptions[metric as keyof typeof metricDescriptions] || "No description available."}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          {/* Reuse charts with larger canvas */}
          {Object.keys(sexMetrics).length > 0 && (
            <Box mb={4}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Sex Attribute</Typography>
              <Plot data={[{ type: 'bar', x: Object.keys(sexMetrics), y: Object.values(sexMetrics), marker: { color: barColors[0] } }]} layout={{ width: 900, height: 340, margin: { t: 24, b: 100 }, xaxis: { tickangle: 45 } }} />
            </Box>
          )}
          {Object.keys(raceMetrics).length > 0 && (
            <Box mb={4}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Race Attribute</Typography>
              <Plot data={[{ type: 'bar', x: Object.keys(raceMetrics), y: Object.values(raceMetrics), marker: { color: barColors[1] } }]} layout={{ width: 900, height: 340, margin: { t: 24, b: 100 }, xaxis: { tickangle: 45 } }} />
            </Box>
          )}
        </Box>
      )}

      {/* Raw JSON */}
      {tab === 2 && (
        <Paper elevation={0} sx={{ p: 2, backgroundColor: 'white' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Raw JSON</Typography>
            <Box display="flex" gap={1}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleCopyJSON}
                startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
              >
                Copy
              </Button>
              <Button 
                variant="contained" 
                size="small" 
                onClick={handleDownloadJSON}
                startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                sx={{
                  backgroundColor: '#13715B',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Download
              </Button>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
            {JSON.stringify(metrics?.results || {}, null, 2)}
          </pre>
        </Paper>
      )}

      {/* Metrics Explorer */}
      {tab === 3 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1f2937' }}>Metrics Explorer</Typography>
          <Typography variant="body2" sx={{ mb: 3, color: '#6b7280' }}>
            Currently displaying {getMetricsToDisplay().length} metrics (user-selected + compass-recommended metrics).
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, color: '#1f2937' }}>User-selected</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {(metricsCfg.user_selected_metrics || []).map(m => (
                  <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!explorerDraftSelection[m]} onChange={() => setExplorerDraftSelection(prev => ({ ...prev, [m]: !prev[m] }))} />
                    <Typography variant="body2" sx={{ color: '#374151' }}>{m}</Typography>
                    <Tooltip title={metricDescriptions[m as keyof typeof metricDescriptions] || "No description available."} placement="top">
                      <InfoIcon sx={{ fontSize: 16, color: '#6b7280', ml: 1 }} />
                    </Tooltip>
                  </label>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, color: '#1f2937' }}>Compass Recommended</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {(metricsCfg.fairness_compass_recommended_metrics || []).map(m => (
                  <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!explorerDraftSelection[m]} onChange={() => setExplorerDraftSelection(prev => ({ ...prev, [m]: !prev[m] }))} />
                    <Typography variant="body2" sx={{ color: '#374151' }}>{m}</Typography>
                    <Tooltip title={metricDescriptions[m as keyof typeof metricDescriptions] || "No description available."} placement="top">
                      <InfoIcon sx={{ fontSize: 16, color: '#6b7280', ml: 1 }} />
                    </Tooltip>
                  </label>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, color: '#1f2937' }}>All Available</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 300, overflowY: 'auto' }}>
                {(metricsCfg.all_available_metrics || []).map(m => (
                  <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!explorerDraftSelection[m]} onChange={() => setExplorerDraftSelection(prev => ({ ...prev, [m]: !prev[m] }))} />
                    <Typography variant="body2" sx={{ color: '#374151' }}>{m}</Typography>
                    <Tooltip title={metricDescriptions[m as keyof typeof metricDescriptions] || "No description available."} placement="top">
                      <InfoIcon sx={{ fontSize: 16, color: '#6b7280', ml: 1 }} />
                    </Tooltip>
                  </label>
                ))}
              </Box>
            </Grid>
          </Grid>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 4, pt: 2, borderTop: '1px solid #e5e7eb' }}>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>Select metrics to include/exclude them from charts on the Plots & Graphs tab.</Typography>
            <Button 
              variant="contained" 
              onClick={handleApplySelection} 
              disabled={!hasDraftChanges}
              sx={{
                backgroundColor: '#13715B',
                color: 'white',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Apply Selection
            </Button>
          </Box>
        </Box>
      )}

      {/* Data & Subgroups */}
      {tab === 4 && (
        <Paper elevation={0} sx={{ p: 3, backgroundColor: 'white' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Data & Subgroups</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            Explore distributions of protected attributes and subgroup sample sizes. (Coming soon)
          </Typography>
        </Paper>
      )}

      {/* Settings / Config */}
      {tab === 5 && (
        <Paper elevation={0} sx={{ p: 3, backgroundColor: 'white' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Settings / Config</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            Configure default thresholds, sampling, and integration settings. (Coming soon)
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
