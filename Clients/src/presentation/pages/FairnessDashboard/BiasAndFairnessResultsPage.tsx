import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Tab,
  Chip,
  Divider,
  Button,
  Stack,
  Alert,
  Tooltip,
} from "@mui/material";
import { ReactComponent as DownloadIcon } from "../../assets/icons/download.svg";
import { ReactComponent as SaveIcon } from "../../assets/icons/save-white.svg";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { BarChart } from "@mui/x-charts";
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-basic-dist';
const Plot = createPlotlyComponent(Plotly);
import { biasAndFairnessService } from "../../../infrastructure/api/biasAndFairnessService";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import MetricInfoIcon from "../../components/MetricInfoIcon";
import { styles } from "./styles";
import { tabPanelStyle } from "../Vendors/style";

// Constants
const PERFORMANCE_THRESHOLD = 70; // Consider 70%+ as good performance
const FAIRNESS_THRESHOLD_MODERATE = 0.05; // Moderate bias threshold
const FAIRNESS_THRESHOLD_SIGNIFICANT = 0.1; // Significant bias threshold
const EXTREME_VALUE_THRESHOLD = 2.0; // Filter out extreme values
const CHART_HEIGHT = 600;
const CHART_MARGIN = { t: 20, b: 180, l: 80, r: 40 };
const CHART_FONT_SIZE = 12;

// Color constants
const COLORS = {
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#dc2626',
  SEX_METRICS: '#ec4899',
  RACE_METRICS: '#3b82f6',
  PRIMARY: '#13715B',
  TEXT_PRIMARY: '#1c2130',
  TEXT_SECONDARY: '#6b7280',
  TEXT_MUTED: '#8594AC',
  BORDER: '#eaecf0',
  BACKGROUND: '#FFFFFF',
  BACKGROUND_HOVER: '#f3f4f6',
} as const;

// Reusable styles
const STYLES = {
  card: {
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: 2,
    backgroundColor: COLORS.BACKGROUND,
    padding: "8px 36px 14px 14px",
  },
  cardWithFlex: {
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: 2,
    backgroundColor: COLORS.BACKGROUND,
    padding: "8px 36px 14px 14px",
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
  paper: {
    elevation: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
    border: 'none',
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    color: 'white',
    textTransform: 'none',
    fontWeight: 600,
  },
  buttonOutlined: {
    borderColor: COLORS.PRIMARY,
    color: COLORS.PRIMARY,
    textTransform: 'none',
    fontWeight: 600,
  },
  iconButton: {
    backgroundColor: COLORS.BACKGROUND,
    boxShadow: 'none !important',
    '&:hover': {
      backgroundColor: COLORS.BACKGROUND_HOVER,
      boxShadow: 'none !important'
    }
  },
  sectionTitle: {
    fontWeight: 500,
    fontSize: '15px',
    color: COLORS.TEXT_PRIMARY,
  },
  subsectionTitle: {
    fontWeight: 600,
    fontSize: '14px',
    color: COLORS.TEXT_PRIMARY,
  },
  bodyText: {
    fontSize: '15px',
    fontWeight: 500,
    color: COLORS.TEXT_PRIMARY,
  },
  mutedText: {
    fontSize: '13px',
    color: COLORS.TEXT_MUTED,
  },
  secondaryText: {
    fontSize: '13px',
    color: COLORS.TEXT_SECONDARY,
  },
} as const;

interface MetricEntry {
  value: number;
  status?: string;
  confidence?: string;
  [k: string]: unknown;
}

interface DataQuality {
  data_quality_score?: number;
  insights?: string[];
  flagged_metrics?: Record<string, {
    value?: number;
    reason?: string;
    recommendation?: string;
  }>;
}

interface MetricsConfiguration {
  user_selected_metrics?: string[];
  fairness_compass_recommended_metrics?: string[];
  all_available_metrics?: string[];
}

interface EvaluationMetadata {
  dataset?: string;
  model?: string;
  model_task?: string;
  evaluation_timestamp?: string;
  metrics_configuration?: MetricsConfiguration;
}

interface CleanResults {
  metadata?: EvaluationMetadata;
  performance?: Record<string, number>;
  fairness_metrics?: Record<string, MetricEntry>;
  data_quality?: DataQuality;
}

interface ResultsResponse {
  results: CleanResults;
  status?: string;
  eval_id?: string;
  dataset_name?: string;
  model_name?: string;
  model_task?: string;
  created_at?: string;
}

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
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const isDemo = !id;
  const [tab, setTab] = useState("overview");
  // Applied selection affects charts; draft holds checkbox changes until user clicks Select
  const [appliedSelection, setAppliedSelection] = useState<Record<string, boolean>>({});
  const [explorerDraftSelection, setExplorerDraftSelection] = useState<Record<string, boolean>>({});
  const [showFullJSON, setShowFullJSON] = useState(false);
  const [showMetricTooltip, setShowMetricTooltip] = useState<string | null>(null);

  // Extract metadata from config_data - move this before functions that use it
  const performance: Record<string, number> = metrics?.results?.performance || {};
  const fairness_metrics: Record<string, MetricEntry> = metrics?.results?.fairness_metrics || {};
  const data_quality: DataQuality = useMemo(() => metrics?.results?.data_quality || {}, [metrics?.results?.data_quality]);
  const metricsCfg: MetricsConfiguration = metrics?.results?.metadata?.metrics_configuration || {};

  // Get metrics to display based on user selection and compass recommendations
  const getMetricsToDisplay = useCallback(() => {
    const userSelected = metricsCfg.user_selected_metrics || [];
    const compassRecommended = metricsCfg.fairness_compass_recommended_metrics || [];
    
    // Combine user selected and compass recommended metrics, removing duplicates
    const displayMetrics = [...new Set([...userSelected, ...compassRecommended])];
    
    return displayMetrics;
  }, [metricsCfg.user_selected_metrics, metricsCfg.fairness_compass_recommended_metrics]);

  // Check if a metric value is valid (not flagged as faulty)
  const isMetricValid = useCallback((metricName: string, attribute: string) => {
    const fullKey = `${metricName}_${attribute}`;
    const flagged = data_quality?.flagged_metrics || {};
    
    // Exclude if flagged as faulty
    if (flagged[fullKey]) {
      return false;
    }
    
    return true;
  }, [data_quality]);

  // Extract fairness metrics by attribute with intelligent filtering
  const getFairnessMetricsByAttribute = useCallback((attribute: string): Record<string, number> => {
    const attributeMetrics: Record<string, number> = {};
    
    // Check if we have results from the evaluation
    if (metrics?.results?.fairness_metrics) {
      Object.entries(metrics.results.fairness_metrics).forEach(([key, value]) => {
        if (key.endsWith(`_${attribute}`) &&
            value &&
            typeof value === 'object' &&
            'value' in value &&
            typeof value.value === 'number') {
          const metricName = key.replace(`_${attribute}`, '');
          const metricValue = value.value;
          
          // Only include if:
          // 1. It's not flagged as faulty
          // 2. The value is reasonable (not extremely large like 19.0)
          if (isMetricValid(metricName, attribute) &&
              Math.abs(metricValue) < EXTREME_VALUE_THRESHOLD) { // Filter out extreme values
            attributeMetrics[metricName] = metricValue;
          }
        }
      });
    }
    
    return attributeMetrics;
  }, [metrics, isMetricValid]);

  const sexMetricsAll = useMemo(() => getFairnessMetricsByAttribute('sex'), [getFairnessMetricsByAttribute]);
  const raceMetricsAll = useMemo(() => getFairnessMetricsByAttribute('race'), [getFairnessMetricsByAttribute]);

  // Apply explorer selection: if any metrics are selected, filter charts to those; else show all
  const selectedMetricNames = Object.keys(appliedSelection).filter(k => appliedSelection[k]);
  const filterBySelection = useCallback((data: Record<string, number>) => {
    if (selectedMetricNames.length === 0) return data;
    const filtered: Record<string, number> = {};
    for (const [k, v] of Object.entries(data)) {
      if (selectedMetricNames.includes(k)) filtered[k] = v;
    }
    return filtered;
  }, [selectedMetricNames]);

  const sexMetrics = useMemo(() => filterBySelection(sexMetricsAll), [sexMetricsAll, filterBySelection]);
  const raceMetrics = useMemo(() => filterBySelection(raceMetricsAll), [raceMetricsAll, filterBySelection]);

  // Calculate dynamic y-axis range based on data values
  const getYAxisRange = useCallback((data: Record<string, number>) => {
    const values = Object.values(data);
    if (values.length === 0) return [0, 0.65];
    const maxValue = Math.max(...values);
    return [0, maxValue + 0.1]; // Add 0.1 buffer to max value
  }, []);

  // Determine if draft differs from applied
  const hasDraftChanges = useMemo(() => {
    const keys = new Set<string>([...Object.keys(appliedSelection), ...Object.keys(explorerDraftSelection)]);
    for (const k of keys) {
      if (!!appliedSelection[k] !== !!explorerDraftSelection[k]) return true;
    }
    return false;
  }, [appliedSelection, explorerDraftSelection]);

  const handleApplySelection = useCallback(() => {
    setAppliedSelection({ ...explorerDraftSelection });
  }, [explorerDraftSelection]);

  const handleMetricInfoClick = useCallback((metricName: string) => {
    setShowMetricTooltip(showMetricTooltip === metricName ? null : metricName);
  }, [showMetricTooltip]);

  // Get currently selected metrics for descriptions
  const getSelectedMetricsForDescriptions = useCallback(() => {
    const selectedMetricNames = Object.keys(appliedSelection).filter(k => appliedSelection[k]);
    if (selectedMetricNames.length === 0) {
      // If no metrics are selected, show all available metrics
      return getMetricsToDisplay();
    }
    return selectedMetricNames;
  }, [appliedSelection, getMetricsToDisplay]);

  const handleCopyJSON = useCallback(async () => {
    try {
      const json = JSON.stringify(metrics?.results || {}, null, 2);
      await navigator.clipboard.writeText(json);
      // Could add a toast notification here for success feedback
    } catch (error) {
      console.error('Failed to copy JSON:', error);
      // Could add a toast notification here for error feedback
    }
  }, [metrics]);

  const handleDownloadJSON = useCallback(() => {
    try {
      if (!metrics?.results) {
        throw new Error('No data available to download');
      }

      const json = JSON.stringify(metrics.results, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `evaluation-results-${metrics?.eval_id || 'unknown'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      // Could add a toast notification here for success feedback
    } catch (error) {
      console.error('Failed to download JSON:', error);
      setError(`Failed to download JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Could add a toast notification here for error feedback
    }
  }, [metrics]);


  const fetchMetrics = useCallback(async (isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
      } else {
        setLoading(true);
      }
      setError(null);

      if (isDemo) {
        // Demo mode - show placeholder data or message
        setMetrics({
          results: {},
          status: 'demo_mode'
        });
      } else {
        const data = await biasAndFairnessService.getBiasFairnessEvaluation(id as string);
        setMetrics(data);
      }
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to fetch metrics: ${errorMessage}`);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [id, isDemo]);

  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      fetchMetrics(true);
    }
  }, [retryCount, fetchMetrics]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

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
      <Box display="flex" flexDirection="column" alignItems="center" mt={6} gap={2}>
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            {error}
          </Typography>
          {retryCount < 3 && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Attempt {retryCount + 1} of 3. Would you like to try again?
            </Typography>
          )}
        </Alert>
        {retryCount < 3 ? (
                <Button
                  variant="contained"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  startIcon={isRetrying ? <CircularProgress size={20} /> : null}
                  sx={{ boxShadow: 'none !important' }}
                >
                  {isRetrying ? 'Retrying...' : 'Retry'}
                </Button>
        ) : (
          <Button
            variant="outlined"
            onClick={() => navigate("/fairness-dashboard#biasModule")}
            sx={{ boxShadow: 'none !important' }}
          >
            Back to Dashboard
          </Button>
        )}
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
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography
              sx={{
                ...STYLES.sectionTitle,
                mb: 0.5
              }}
            >
              Bias & fairness evaluation results
            </Typography>
            <Typography sx={STYLES.secondaryText}>
              Comprehensive analysis of model fairness across protected attributes
            </Typography>
          </Box>
        </Box>
      </Box>

      <TabContext value={tab}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            onChange={(_, newVal) => setTab(newVal)}
            TabIndicatorProps={{
              style: { backgroundColor: COLORS.PRIMARY, height: "2px" },
            }}
            sx={styles.tabList}
          >
            <Tab
              label="Overview"
              value="overview"
              disableRipple
              sx={{ textTransform: "none !important" }}
            />
            <Tab
              label="Metric selection"
              value="explorer"
              disableRipple
              sx={{ textTransform: "none !important" }}
            />
            <Tab
              label="Evaluation details"
              value="settings"
              disableRipple
              sx={{ textTransform: "none !important" }}
            />
          </TabList>
        </Box>

        <TabPanel value="overview" sx={{ ...tabPanelStyle, pt: 2 }}>
          <Stack spacing={4}>
            {/* Performance Metrics */}
            {Object.keys(performance).length > 0 && (
              <Box>
                <Typography
                  variant="h2"
                  component="div"
                  sx={{
                    mb: 3,
                    ...STYLES.sectionTitle,
                  }}
                >
                  Performance metrics
                </Typography>
                <Grid container spacing={3}>
                  {Object.entries(performance).map(([metric, value]) => {
                    const numericValue = typeof value === 'number' ? value * 100 : 0;
                    const isGood = numericValue >= PERFORMANCE_THRESHOLD;

                    return (
                      <Grid item xs={12} sm={6} md={3} key={metric}>
                        <Box sx={{
                          ...STYLES.card,
                          textAlign: "center"
                        }}>
                          <Typography sx={{ ...STYLES.mutedText, pb: "2px" }}>
                            {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                          <Typography sx={{ ...STYLES.bodyText, mb: 1 }}>
                            {numericValue.toFixed(1)}%
                          </Typography>
                          <Chip
                            label={isGood ? 'Good' : 'Needs Attention'}
                            size="small"
                            sx={{
                              backgroundColor: isGood ? COLORS.SUCCESS : COLORS.WARNING,
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
            {Object.keys(fairness_metrics).length > 0 && (
              <Box>
                <Typography
                  variant="h2"
                  component="div"
                  sx={{
                    mt: 4,
                    mb: 3,
                    ...STYLES.sectionTitle,
                  }}
                >
                  Fairness metrics by protected attribute
                </Typography>

                {/* Fairness Legend and Info */}
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Plot interpretation:</strong> Values closer to 0 indicate better fairness.
                    Green bars show good fairness (&lt;{FAIRNESS_THRESHOLD_MODERATE}), yellow shows moderate bias ({FAIRNESS_THRESHOLD_MODERATE}-{FAIRNESS_THRESHOLD_SIGNIFICANT}),
                    and red shows significant bias (&gt;{FAIRNESS_THRESHOLD_SIGNIFICANT}).
                  </Typography>
                </Alert>

                {/* Sex Metrics */}
                {Object.keys(sexMetrics).length > 0 && (
                  <Box mb={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        ...STYLES.paper
                      }}
                    >
                      <Typography
                        variant="h2"
                        component="div"
                        sx={{
                          mt: 3,
                          mb: 1,
                          ...STYLES.subsectionTitle,
                          fontSize: '15px',
                        }}
                      >
                        Sex attribute fairness metrics
                      </Typography>
                  {Plot ? (
                    <Plot
                      data={[{
                        type: 'bar',
                        x: Object.keys(sexMetrics).map(key => key.replace(/_/g, ' ')),
                        y: Object.values(sexMetrics),
                        marker: { 
                          color: Object.values(sexMetrics).map(v => {
                            const numValue = typeof v === 'number' ? v : 0;
                            return Math.abs(numValue) > FAIRNESS_THRESHOLD_SIGNIFICANT ? COLORS.ERROR :
                                   Math.abs(numValue) > FAIRNESS_THRESHOLD_MODERATE ? COLORS.WARNING : COLORS.SUCCESS;
                          }),
                          line: { color: '#ffffff', width: 1 }
                        },
                        text: Object.values(sexMetrics).map(v => typeof v === 'number' ? v.toFixed(4) : 'N/A'),
                        textposition: 'outside',
                      }]}
                      layout={{ 
                        width: '100%', 
                        height: CHART_HEIGHT,
                        margin: CHART_MARGIN,
                        xaxis: { 
                          tickangle: 45,
                          title: { text: 'Fairness Metrics', font: { size: 13, color: '#374151' }, standoff: 2 },
                          tickfont: { size: 12 },
                          automargin: true
                        },
                        yaxis: { 
                          title: { text: 'Metric Value', font: { size: 13, color: '#374151' }, standoff: 20 },
                          range: getYAxisRange(sexMetrics)
                        },
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        font: { family: 'Inter, sans-serif', size: CHART_FONT_SIZE }
                      }}
                      config={{ responsive: true, displayModeBar: false }}
                      aria-label="Sex attribute fairness metrics chart"
                    />
                  ) : (
                    <BarChart
                      xAxis={[{ 
                        scaleType: 'band', 
                        data: Object.keys(sexMetrics).map(key => key.replace(/_/g, ' ')),
                        tickLabelStyle: { angle: 45, textAnchor: 'start', fontSize: 10 } 
                      }]}
                      series={[{ 
                        data: Object.values(sexMetrics), 
                        label: 'Sex Metrics', 
                        valueFormatter: (v) => (typeof v === 'number' ? v.toFixed(4) : 'N/A'),
                        color: COLORS.SEX_METRICS
                      }]}
                      height={CHART_HEIGHT}
                      yAxis={[{ max: getYAxisRange(sexMetrics)[1] }]}
                      sx={{ width: '100%' }}
                      aria-label="Sex attribute fairness metrics chart"
                    />
                  )}
                    </Paper>
                  </Box>
                )}

                {/* Race Metrics */}
                {Object.keys(raceMetrics).length > 0 && (
                  <Box mb={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        ...STYLES.paper
                      }}
                    >
                      <Typography
                        variant="h2"
                        component="div"
                        sx={{
                          mt: 3,
                          mb: 1,
                          ...STYLES.subsectionTitle,
                          fontSize: '15px',
                        }}
                      >
                        Race attribute fairness metrics
                      </Typography>
                  {Plot ? (
                    <Plot
                      data={[{
                        type: 'bar',
                        x: Object.keys(raceMetrics).map(key => key.replace(/_/g, ' ')),
                        y: Object.values(raceMetrics),
                        marker: { 
                          color: Object.values(raceMetrics).map(v => {
                            const numValue = typeof v === 'number' ? v : 0;
                            return Math.abs(numValue) > FAIRNESS_THRESHOLD_SIGNIFICANT ? COLORS.ERROR :
                                   Math.abs(numValue) > FAIRNESS_THRESHOLD_MODERATE ? COLORS.WARNING : COLORS.SUCCESS;
                          }),
                          line: { color: '#ffffff', width: 1 }
                        },
                        text: Object.values(raceMetrics).map(v => typeof v === 'number' ? v.toFixed(4) : 'N/A'),
                        textposition: 'outside',
                      }]}
                      layout={{ 
                        width: '100%', 
                        height: CHART_HEIGHT,
                        margin: CHART_MARGIN,
                        xaxis: { 
                          tickangle: 45,
                          title: { text: 'Fairness Metrics', font: { size: 13, color: '#374151' }, standoff: 2 },
                          tickfont: { size: 12 },
                          automargin: true
                        },
                        yaxis: { 
                          title: { text: 'Metric Value', font: { size: 13, color: '#374151' }, standoff: 20 },
                          range: getYAxisRange(raceMetrics)
                        },
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        font: { family: 'Inter, sans-serif', size: CHART_FONT_SIZE }
                      }}
                      config={{ responsive: true, displayModeBar: false }}
                      aria-label="Race attribute fairness metrics chart"
                    />
                  ) : (
                    <BarChart
                      xAxis={[{ 
                        scaleType: 'band', 
                        data: Object.keys(raceMetrics).map(key => key.replace(/_/g, ' ')),
                        tickLabelStyle: { angle: 45, textAnchor: 'start', fontSize: 10 } 
                      }]}
                      series={[{ 
                        data: Object.values(raceMetrics), 
                        label: 'Race Metrics', 
                        valueFormatter: (v) => (typeof v === 'number' ? v.toFixed(4) : 'N/A'),
                        color: COLORS.RACE_METRICS
                      }]}
                      height={CHART_HEIGHT}
                      yAxis={[{ max: getYAxisRange(raceMetrics)[1] }]}
                      sx={{ width: '100%' }}
                      aria-label="Race attribute fairness metrics chart"
                    />
                  )}
                    </Paper>
                  </Box>
                )}


                {/* Metric Descriptions - Dynamic based on selected metrics */}
                {getSelectedMetricsForDescriptions().length > 0 && (
                  <Box mt={4}>
                    <Typography
                      variant="h2"
                      component="div"
                      sx={{
                        mt: 4,
                        mb: 3,
                        ...STYLES.sectionTitle,
                      }}
                    >
                      Metric descriptions
                    </Typography>
                    <Grid container spacing={2}>
                      {getSelectedMetricsForDescriptions().map((metric) => (
                        <Grid item xs={12} md={6} key={metric}>
                          <Box sx={{
                            ...STYLES.card,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start'
                          }}>
                            <Typography sx={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: COLORS.TEXT_PRIMARY,
                              pb: "4px",
                              lineHeight: 1.2
                            }}>
                              {(() => {
                                const formattedMetric = metric.replace(/_/g, ' ');
                                return formattedMetric.charAt(0).toUpperCase() + formattedMetric.slice(1);
                              })()}
                            </Typography>
                            <Typography sx={{
                              fontSize: '13px',
                              fontWeight: 400,
                              color: COLORS.TEXT_SECONDARY,
                              lineHeight: 1.4
                            }}>
                              {metricDescriptions[metric as keyof typeof metricDescriptions] || "No description available."}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            )}

            {/* Data Quality */}
            {data_quality && Object.keys(data_quality).length > 0 && (
              <Box>
                <Box sx={{
                  ...STYLES.card,
                  textAlign: 'center'
                }}>
                  <Typography sx={{ ...STYLES.mutedText, pb: "2px" }}>
                    Evaluation data quality
                  </Typography>
                  <Typography sx={{ ...STYLES.bodyText, mb: 1 }}>
                    {data_quality.data_quality_score ? (data_quality.data_quality_score * 100).toFixed(1) : 'N/A'}%
                  </Typography>
                  <Typography sx={{ ...STYLES.secondaryText, mt: 1 }}>
                    {data_quality.data_quality_score ? (
                      data_quality.data_quality_score >= 0.8 ? 'Excellent' :
                      data_quality.data_quality_score >= 0.6 ? 'Good' :
                      data_quality.data_quality_score >= 0.4 ? 'Fair' : 'Poor'
                    ) : 'Unknown'} quality assessment
                  </Typography>
                  {data_quality.flagged_metrics && Object.keys(data_quality.flagged_metrics).length > 0 && (
                    <Typography sx={{ ...STYLES.secondaryText, color: COLORS.WARNING, mt: 1 }}>
                      {Object.keys(data_quality.flagged_metrics).length} flagged metrics were not calculated
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

          </Stack>
        </TabPanel>



        <TabPanel value="explorer" sx={{ ...tabPanelStyle, pt: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 2, ...STYLES.bodyText }}>Metric selection</Typography>
            <Typography variant="body2" sx={{ mb: 6, color: COLORS.TEXT_SECONDARY }}>
              Currently displaying {getMetricsToDisplay().length} metrics (user-selected + compass-recommended metrics).
            </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="body1" sx={{ mb: 2, ...STYLES.bodyText }}>User-selected</Typography>
              <Stack spacing={3}>
                {(metricsCfg.user_selected_metrics || []).map(m => (
                  <Box key={m} sx={{ 
                    border: '1px solid #eaecf0',
                    borderRadius: 2,
                    backgroundColor: "#FFFFFF",
                    padding: "8px 36px 14px 14px",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    <input 
                      type="checkbox" 
                      checked={!!explorerDraftSelection[m]} 
                      onChange={() => setExplorerDraftSelection(prev => ({ ...prev, [m]: !prev[m] }))}
                      aria-label={`Toggle ${m} metric`}
                      aria-describedby={`${m}-description`}
                      style={{ marginRight: '8px' }}
                    />
                    <Typography variant="body2" sx={{ color: COLORS.TEXT_PRIMARY, fontSize: '15px', fontWeight: 500, flex: 1, textAlign: 'center' }}>{m.replace(/_/g, ' ')}</Typography>
                    <Tooltip
                      title={metricDescriptions[m as keyof typeof metricDescriptions] || "No description available."}
                      placement="top"
                      open={showMetricTooltip === m}
                      onClose={() => setShowMetricTooltip(null)}
                    >
                      <MetricInfoIcon onClick={() => handleMetricInfoClick(m)} size="small" />
                    </Tooltip>
                  </Box>
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body1" sx={{ mb: 2, ...STYLES.bodyText }}>Recommended</Typography>
              <Stack spacing={3}>
                {(metricsCfg.fairness_compass_recommended_metrics || []).map(m => (
                  <Box key={m} sx={{ 
                    border: '1px solid #eaecf0',
                    borderRadius: 2,
                    backgroundColor: "#FFFFFF",
                    padding: "8px 36px 14px 14px",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    <input 
                      type="checkbox" 
                      checked={!!explorerDraftSelection[m]} 
                      onChange={() => setExplorerDraftSelection(prev => ({ ...prev, [m]: !prev[m] }))} 
                      style={{ marginRight: '8px' }}
                    />
                    <Typography variant="body2" sx={{ color: '#1c2130', fontSize: '15px', fontWeight: 500, flex: 1, textAlign: 'center' }}>{m.replace(/_/g, ' ')}</Typography>
                    <Tooltip
                      title={metricDescriptions[m as keyof typeof metricDescriptions] || "No description available."}
                      placement="top"
                      open={showMetricTooltip === m}
                      onClose={() => setShowMetricTooltip(null)}
                    >
                      <MetricInfoIcon onClick={() => handleMetricInfoClick(m)} size="small" />
                    </Tooltip>
                  </Box>
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body1" sx={{ mb: 2, ...STYLES.bodyText }}>All Available</Typography>
                <Stack spacing={3}>
                  {(metricsCfg.all_available_metrics || []).map(m => (
                    <Box key={m} sx={{ 
                      border: '1px solid #eaecf0',
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      padding: "8px 36px 14px 14px",
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}>
                      <input 
                        type="checkbox" 
                        checked={!!explorerDraftSelection[m]} 
                        onChange={() => setExplorerDraftSelection(prev => ({ ...prev, [m]: !prev[m] }))} 
                        style={{ marginRight: '8px' }}
                      />
                      <Typography variant="body2" sx={{ color: '#1c2130', fontSize: '15px', fontWeight: 500, flex: 1, textAlign: 'center' }}>{m.replace(/_/g, ' ')}</Typography>
                      <Tooltip
                        title={metricDescriptions[m as keyof typeof metricDescriptions] || "No description available."}
                        placement="top"
                        open={showMetricTooltip === m}
                        onClose={() => setShowMetricTooltip(null)}
                      >
                        <MetricInfoIcon onClick={() => handleMetricInfoClick(m)} size="small" />
                      </Tooltip>
                    </Box>
                  ))}
                </Stack>
            </Grid>
          </Grid>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 6, pt: 3, borderTop: '1px solid #e5e7eb' }}>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>Select metrics to include/exclude them from charts on the Plots & Graphs tab.</Typography>
            <Button 
              variant="contained" 
              onClick={handleApplySelection} 
              disabled={!hasDraftChanges}
              size="small"
              sx={{
                px: 3,
                py: 1,
                fontSize: '13px',
                boxShadow: 'none !important',
                '&:hover': {
                  boxShadow: 'none !important'
                }
              }}
            >
              Apply Selection
            </Button>
          </Box>

          {/* Raw JSON Section */}
          <Box mt={6}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={STYLES.bodyText}>Raw JSON data</Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleCopyJSON}
                  startIcon={<SaveIcon style={{ width: '16', height: '16' }} />}
                  sx={{
                    fontSize: '13px',
                    boxShadow: 'none !important',
                    '&:hover': {
                      boxShadow: 'none !important'
                    }
                  }}
                >
                  Copy
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleDownloadJSON}
                  startIcon={<DownloadIcon style={{ width: '16', height: '16' }} />}
                  sx={{
                    fontSize: '13px',
                    boxShadow: 'none !important',
                    '&:hover': {
                      boxShadow: 'none !important'
                    }
                  }}
                >
                  Download
                </Button>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{
              ...STYLES.card,
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef'
            }}>
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
                fontSize: '12px',
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                maxHeight: showFullJSON ? 'none' : '200px',
                overflow: showFullJSON ? 'visible' : 'hidden'
              }}>
                {showFullJSON
                  ? JSON.stringify(metrics?.results || {}, null, 2)
                  : JSON.stringify(metrics?.results || {}, null, 2).split('\n').slice(0, 10).join('\n') + '\n...'
                }
              </pre>
              {!showFullJSON && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowFullJSON(true)}
                    sx={{
                      color: COLORS.PRIMARY,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '13px',
                      backgroundColor: 'transparent',
                      boxShadow: 'none !important',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: COLORS.PRIMARY,
                        boxShadow: 'none !important'
                      }
                    }}
                  >
                    View Full
                  </Button>
                </Box>
              )}
              {showFullJSON && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowFullJSON(false)}
                    sx={{
                      color: COLORS.PRIMARY,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '13px',
                      backgroundColor: 'transparent',
                      boxShadow: 'none !important',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: COLORS.PRIMARY,
                        boxShadow: 'none !important'
                      }
                    }}
                  >
                    Show Less
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
          </Box>
        </TabPanel>


        <TabPanel value="settings" sx={{ ...tabPanelStyle, pt: 2 }}>
          <Box>
            {/* Evaluation Information */}
            <Box mb={4}>
              <Typography
                variant="h2"
                component="div"
                sx={{
                  mb: 2,
                  fontSize: '15px',
                  fontWeight: 600,
                  color: COLORS.TEXT_PRIMARY,
                }}
              >
                Evaluation information
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Box sx={{
                      border: '1px solid #eaecf0',
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      minWidth: 228,
                      width: "100%",
                      padding: "8px 36px 14px 14px"
                    }}>
                      <Typography sx={{ fontSize: '12px', color: "#8594AC", pb: "2px" }}>Dataset</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: "#2D3748" }}>
                        {metrics?.dataset_name || metrics?.results?.metadata?.dataset || "N/A"}
                      </Typography>
                    </Box>
                    <Box sx={{
                      border: '1px solid #eaecf0',
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      minWidth: 228,
                      width: "100%",
                      padding: "8px 36px 14px 14px"
                    }}>
                      <Typography sx={{ fontSize: '12px', color: "#8594AC", pb: "2px" }}>Model</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: "#2D3748" }}>
                        {metrics?.model_name || metrics?.results?.metadata?.model || "N/A"}
                      </Typography>
                    </Box>
                    <Box sx={{
                      border: '1px solid #eaecf0',
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      minWidth: 228,
                      width: "100%",
                      padding: "8px 36px 14px 14px"
                    }}>
                      <Typography sx={{ fontSize: '12px', color: "#8594AC", pb: "2px" }}>Task Type</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: "#2D3748" }}>
                        {(metrics?.model_task || metrics?.results?.metadata?.model_task || "N/A").toString().replace('_', ' ')}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <Box sx={{
                      border: '1px solid #eaecf0',
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      minWidth: 228,
                      width: "100%",
                      padding: "8px 36px 14px 14px"
                    }}>
                      <Typography sx={{ fontSize: '12px', color: "#8594AC", pb: "2px" }}>Evaluation ID</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: "#2D3748" }}>
                        {metrics?.eval_id || "N/A"}
                      </Typography>
                    </Box>
                    <Box sx={{
                      border: '1px solid #eaecf0',
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      minWidth: 228,
                      width: "100%",
                      padding: "8px 36px 14px 14px"
                    }}>
                      <Typography sx={{ fontSize: '12px', color: "#8594AC", pb: "2px" }}>Status</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: "#2D3748", height: '24px', display: 'flex', alignItems: 'center' }}>
                        {metrics?.status || "N/A"}
                      </Typography>
                    </Box>
                    <Box sx={{
                      border: '1px solid #eaecf0',
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      minWidth: 228,
                      width: "100%",
                      padding: "8px 36px 14px 14px"
                    }}>
                      <Typography sx={{ fontSize: '12px', color: "#8594AC", pb: "2px" }}>Created</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: "#2D3748" }}>
                        {metrics?.created_at ? new Date(metrics.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : (metrics?.results?.metadata?.evaluation_timestamp ? new Date(metrics.results.metadata.evaluation_timestamp).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : "N/A")}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Box>

            <Typography variant="body2" sx={{ color: COLORS.TEXT_SECONDARY }}>
              Configure default thresholds, sampling, and integration settings. (Coming soon)
            </Typography>
          </Box>
        </TabPanel>
      </TabContext>
    </Stack>
  );
}
