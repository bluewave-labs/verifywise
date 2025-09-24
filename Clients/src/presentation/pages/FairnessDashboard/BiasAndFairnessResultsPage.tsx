import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  Chip,
  Divider,
  Button,
  Stack,
  Alert,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { ReactComponent as GreyCircleInfoIcon } from "../../assets/icons/info-circle-grey.svg";
import { ReactComponent as BlueInfoIcon } from "../../assets/icons/info-circle-blue.svg";
import DownloadIcon from "@mui/icons-material/Download";
import { BarChart } from "@mui/x-charts";
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-basic-dist';
const Plot = createPlotlyComponent(Plotly);
import { biasAndFairnessService } from "../../../infrastructure/api/biasAndFairnessService";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import InfoCard from "../../components/Cards/InfoCard";

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
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<ResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isDemo = !id;
  const [tab, setTab] = useState(0);
  // Applied selection affects charts; draft holds checkbox changes until user clicks Select
  const [appliedSelection, setAppliedSelection] = useState<Record<string, boolean>>({});
  const [explorerDraftSelection, setExplorerDraftSelection] = useState<Record<string, boolean>>({});


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
    <Stack className="vwhome" gap="20px">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height: 10 }}>
        <PageBreadcrumbs 
          items={[
            { label: "Dashboard", path: "/" },
            { label: "Bias & Fairness", path: "/fairness-dashboard#biasModule" },
            { label: "Results", path: "" }
          ]}
          autoGenerate={false}
          sx={{ fontSize: 13 }}
        />
      </Stack>

      {/* Header Section */}
      <Box>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton
            onClick={() => navigate("/fairness-dashboard#biasModule")}
            sx={{ 
              mr: 2, 
              backgroundColor: 'white',
              boxShadow: 1,
              '&:hover': { backgroundColor: '#f3f4f6' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '15px',
                color: '#1c2130',
                mb: 0.5
              }}
            >
              Bias & Fairness Evaluation Results
            </Typography>
            <Typography sx={{ color: '#6b7280', fontSize: '13px' }}>
              Comprehensive analysis of model fairness across protected attributes
            </Typography>
          </Box>
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
          TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
          sx={{ 
            minHeight: "20px",
            "& .MuiTabs-flexContainer": { columnGap: "34px" },
            '& .MuiTab-root': {
              textTransform: "none",
              fontWeight: 400,
              alignItems: "center",
              justifyContent: "flex-end",
              padding: "16px 0 7px",
              minHeight: "20px",
              minWidth: "auto",
              "&.Mui-selected": {
                color: "#13715B",
              },
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

      {/* Evaluation Information */}
      {tab === 0 && (
        <Box>
          <Typography
            variant="h2"
            component="div"
            sx={{
              pb: 8.5,
              color: "#1c2130",
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            Evaluation Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <InfoCard 
                  title="Dataset" 
                  body={metrics?.dataset_name || metrics?.results?.metadata?.dataset || "N/A"} 
                />
                <InfoCard 
                  title="Model" 
                  body={metrics?.model_name || metrics?.results?.metadata?.model || "N/A"} 
                />
                <InfoCard 
                  title="Task Type" 
                  body={(metrics?.model_task || metrics?.results?.metadata?.model_task || "N/A").toString().replace('_', ' ')} 
                />
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <InfoCard 
                  title="Evaluation ID" 
                  body={metrics?.eval_id || "N/A"} 
                />
                <Box sx={{ 
                  border: '1px solid #eaecf0', 
                  borderRadius: 2, 
                  backgroundColor: "#FFFFFF",
                  padding: "8px 36px 14px 14px",
                  minWidth: 228,
                  width: "100%",
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}>
                  <Typography sx={{ fontSize: 13, color: "#8594AC", pb: "2px" }}>Status</Typography>
                  <Chip 
                    label={metrics?.status || "N/A"} 
                    color="success" 
                    size="small"
                    sx={{ 
                      fontWeight: 600,
                      alignSelf: 'flex-start'
                    }}
                  />
                </Box>
                <InfoCard 
                  title="Created" 
                  body={metrics?.created_at ? new Date(metrics.created_at).toLocaleString() : (metrics?.results?.metadata?.evaluation_timestamp ? new Date(metrics.results.metadata.evaluation_timestamp).toLocaleString() : "N/A")} 
                />
              </Stack>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Performance Metrics */}
      {tab === 0 && Object.keys(performance).length > 0 && (
        <Box>
          <Typography
            variant="h2"
            component="div"
            sx={{
              pb: 8.5,
              color: "#1c2130",
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            Performance Metrics
          </Typography>
          <Grid container spacing={3}>
            {Object.entries(performance).map(([metric, value]) => {
              const numericValue = (value as number) * 100;
              const isGood = numericValue >= 70; // Consider 70%+ as good performance
              
              return (
                <Grid item xs={12} sm={6} md={3} key={metric}>
                  <Box sx={{ 
                    border: '1px solid #eaecf0',
                    borderRadius: 2,
                    backgroundColor: "#FFFFFF",
                    padding: "8px 36px 14px 14px",
                    textAlign: "center"
                  }}>
                    <Typography sx={{ fontSize: 13, color: "#8594AC", pb: "2px" }}>
                      {metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                    <Typography sx={{ fontSize: 15, fontWeight: 500, color: "#1c2130", mb: 1 }}>
                      {numericValue.toFixed(1)}%
                    </Typography>
                    <Chip 
                      label={isGood ? 'Good' : 'Needs Attention'}
                      size="small"
                      sx={{
                        backgroundColor: isGood ? '#10b981' : '#f59e0b',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Fairness Metrics by Attribute */}
      {tab === 0 && Object.keys(fairness_metrics).length > 0 && (
        <Box>
          <Typography
            variant="h2"
            component="div"
            sx={{
              pb: 8.5,
              color: "#1c2130",
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            Fairness Metrics by Protected Attribute
          </Typography>
            
            {/* Sex Metrics */}
            {Object.keys(sexMetrics).length > 0 && (
              <Box mb={4}>
                <Typography
                  variant="h2"
                  component="div"
                  sx={{
                    pb: 4,
                    color: "#1c2130",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Sex Attribute Fairness Metrics
                </Typography>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    backgroundColor: 'white',
                    borderRadius: 2,
                    border: '1px solid #eaecf0'
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
                <Typography
                  variant="h2"
                  component="div"
                  sx={{
                    pb: 4,
                    color: "#1c2130",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Race Attribute Fairness Metrics
                </Typography>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    backgroundColor: 'white',
                    borderRadius: 2,
                    border: '1px solid #eaecf0'
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
        </Box>
      )}

      {/* Data Quality */}
      {tab === 0 && data_quality && Object.keys(data_quality).length > 0 && (
        <Box>
          <Typography
            variant="h2"
            component="div"
            sx={{
              pb: 8.5,
              color: "#1c2130",
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            Data Quality Assessment
          </Typography>
            
            {data_quality.data_quality_score && (
              <Box mb={4}>
                <Box sx={{ 
                  border: '1px solid #eaecf0',
                  borderRadius: 2,
                  backgroundColor: "#FFFFFF",
                  padding: "8px 36px 14px 14px",
                  textAlign: 'center'
                }}>
                  <Typography sx={{ fontSize: 13, color: "#8594AC", pb: "2px" }}>
                    Overall Data Quality Score
                  </Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 500, color: "#1c2130", mb: 1 }}>
                    {(data_quality.data_quality_score * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
                    {data_quality.data_quality_score >= 0.8 ? 'Excellent' : 
                     data_quality.data_quality_score >= 0.6 ? 'Good' : 
                     data_quality.data_quality_score >= 0.4 ? 'Fair' : 'Poor'} quality assessment
                  </Typography>
                </Box>
              </Box>
            )}
            
            
            {data_quality.insights && data_quality.insights.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, fontSize: '15px', color: '#1c2130' }}>
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
                      <BlueInfoIcon/>
                      <Typography variant="body2" sx={{ color: "#1c2130", fontSize: '15px', fontWeight: 500, flex: 1 }}>
                        {insight}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            )}
        </Box>
      )}

      {/* Metric Descriptions */}
      {tab === 0 && uniqueMetrics.length > 0 && (
        <Box>
          <Typography
            variant="h2"
            component="div"
            sx={{
              pb: 8.5,
              color: "#1c2130",
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            Metric Descriptions
          </Typography>
          <Grid container spacing={2}>
            {uniqueMetrics.slice(0, 6).map((metric) => (
              <Grid item xs={12} md={6} key={metric}>
                <Box sx={{ 
                  border: '1px solid #eaecf0',
                  borderRadius: 2,
                  backgroundColor: "#FFFFFF",
                  padding: "8px 36px 14px 14px"
                }}>
                  <Typography sx={{ fontSize: 13, color: "#8594AC", pb: "2px" }}>
                    {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 500, color: "#1c2130" }}>
                    {metricDescriptions[metric as keyof typeof metricDescriptions] || "No description available."}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          {/* Reuse charts with larger canvas */}
          {Object.keys(sexMetrics).length > 0 && (
            <Box mb={4}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500, fontSize: 13 }}>Sex Attribute</Typography>
              <Plot data={[{ type: 'bar', x: Object.keys(sexMetrics), y: Object.values(sexMetrics), marker: { color: '#ec4899' } }]} layout={{ width: 900, height: 340, margin: { t: 24, b: 100 }, xaxis: { tickangle: 45 } }} />
            </Box>
          )}
          {Object.keys(raceMetrics).length > 0 && (
            <Box mb={4}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500, fontSize: 13 }}>Race Attribute</Typography>
              <Plot data={[{ type: 'bar', x: Object.keys(raceMetrics), y: Object.values(raceMetrics), marker: { color: '#3b82f6' } }]} layout={{ width: 900, height: 340, margin: { t: 24, b: 100 }, xaxis: { tickangle: 45 } }} />
            </Box>
          )}
        </Box>
      )}

      {/* Raw JSON */}
      {tab === 2 && (
        <Paper elevation={0} sx={{ p: 2, backgroundColor: 'white' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: 13 }}>Raw JSON</Typography>
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
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, fontSize: '15px', color: '#1c2130' }}>Metrics Explorer</Typography>
          <Typography variant="body2" sx={{ mb: 3, color: '#6b7280' }}>
            Currently displaying {getMetricsToDisplay().length} metrics (user-selected + compass-recommended metrics).
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, fontSize: '15px', color: '#1c2130' }}>User-selected</Typography>
              <Stack spacing={2}>
                {(metricsCfg.user_selected_metrics || []).map(m => (
                  <Box key={m} sx={{ 
                    border: '1px solid #eaecf0',
                    borderRadius: 2,
                    backgroundColor: "#FFFFFF",
                    padding: "8px 36px 14px 14px",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <input 
                      type="checkbox" 
                      checked={!!explorerDraftSelection[m]} 
                      onChange={() => setExplorerDraftSelection(prev => ({ ...prev, [m]: !prev[m] }))} 
                    />
                    <Typography variant="body2" sx={{ color: '#1c2130', fontSize: '15px', fontWeight: 500, flex: 1 }}>{m}</Typography>
                    <Tooltip title={metricDescriptions[m as keyof typeof metricDescriptions] || "No description available."} placement="top">
                      <GreyCircleInfoIcon style={{ fontSize: 16, color: '#6b7280' }} />
                    </Tooltip>
                  </Box>
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, fontSize: '15px', color: '#1c2130' }}>Compass Recommended</Typography>
              <Stack spacing={2}>
                {(metricsCfg.fairness_compass_recommended_metrics || []).map(m => (
                  <Box key={m} sx={{ 
                    border: '1px solid #eaecf0',
                    borderRadius: 2,
                    backgroundColor: "#FFFFFF",
                    padding: "8px 36px 14px 14px",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <input 
                      type="checkbox" 
                      checked={!!explorerDraftSelection[m]} 
                      onChange={() => setExplorerDraftSelection(prev => ({ ...prev, [m]: !prev[m] }))} 
                    />
                    <Typography variant="body2" sx={{ color: '#1c2130', fontSize: '15px', fontWeight: 500, flex: 1 }}>{m}</Typography>
                    <Tooltip title={metricDescriptions[m as keyof typeof metricDescriptions] || "No description available."} placement="top">
                      <GreyCircleInfoIcon style={{ fontSize: 16, color: '#6b7280' }} />
                    </Tooltip>
                  </Box>
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, fontSize: '15px', color: '#1c2130' }}>All Available</Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                <Stack spacing={2}>
                  {(metricsCfg.all_available_metrics || []).map(m => (
                    <Box key={m} sx={{ 
                      border: '1px solid #eaecf0',
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      padding: "8px 36px 14px 14px",
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <input 
                        type="checkbox" 
                        checked={!!explorerDraftSelection[m]} 
                        onChange={() => setExplorerDraftSelection(prev => ({ ...prev, [m]: !prev[m] }))} 
                      />
                      <Typography variant="body2" sx={{ color: '#1c2130', fontSize: '15px', fontWeight: 500, flex: 1 }}>{m}</Typography>
                      <Tooltip title={metricDescriptions[m as keyof typeof metricDescriptions] || "No description available."} placement="top">
                        <GreyCircleInfoIcon style={{ fontSize: 16, color: '#6b7280' }} />
                      </Tooltip>
                    </Box>
                  ))}
                </Stack>
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
    </Stack>
  );
}
