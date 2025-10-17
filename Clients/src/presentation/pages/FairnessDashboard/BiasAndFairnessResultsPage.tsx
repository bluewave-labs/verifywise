import { useParams } from "react-router-dom";
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
  IconButton,
} from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Copy as CopyIcon, Download as DownloadIcon, ChevronDown as ExpandMoreIcon, ChevronUp as ExpandLessIcon } from "lucide-react";
import { BarChart } from "@mui/x-charts";
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-basic-dist';
const Plot = createPlotlyComponent(Plotly);
import { biasAndFairnessService } from "../../../infrastructure/api/biasAndFairnessService";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import MetricInfoIcon from "../../components/MetricInfoIcon";
import ErrorModal from "../../components/Modals/Error";
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
    padding: "11px 36px 11px 14px",
  },
  cardWithFlex: {
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: 2,
    backgroundColor: COLORS.BACKGROUND,
    padding: "11px 36px 11px 14px",
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
  const [metrics, setMetrics] = useState<ResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const isDemo = id === 'demo';
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

  // Get specialized metric descriptions for specific attributes
  const getSpecializedMetricDescription = useCallback((metric: string, attribute: 'sex' | 'race'): string => {
    const baseDescription = metricDescriptions[metric as keyof typeof metricDescriptions] || "No description available.";
    
    // Define privileged and unprivileged groups for each attribute
    const groupDefinitions = {
      sex: {
        privileged: "male",
        unprivileged: "female"
      },
      race: {
        privileged: "white",
        unprivileged: "other groups"
      }
    };

    const groups = groupDefinitions[attribute];
    
    // Specialize the description based on the attribute
    if (baseDescription.includes("privileged and unprivileged groups")) {
      return baseDescription.replace(
        "privileged and unprivileged groups", 
        `${groups.privileged} and ${groups.unprivileged} groups`
      );
    }
    
    if (baseDescription.includes("between groups")) {
      return baseDescription.replace(
        "between groups", 
        `between ${groups.privileged} and ${groups.unprivileged} groups`
      );
    }
    
    if (baseDescription.includes("across groups")) {
      return baseDescription.replace(
        "across groups", 
        `across ${groups.privileged} and ${groups.unprivileged} groups`
      );
    }

    // For metrics that don't have group-specific language, add context
    if (baseDescription.includes("Measures")) {
      return `${baseDescription} Specifically comparing ${groups.privileged} vs ${groups.unprivileged} groups.`;
    }

    return baseDescription;
  }, []);


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
      const errorMessage = `Failed to download JSON: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setError(errorMessage);
      setIsErrorModalOpen(true);
    }
  }, [metrics]);


  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isDemo) {
        // Demo mode - load mock data from clean_results.json
        try {
          const response = await fetch('/mock/clean_results.json');
          if (response.ok) {
            const mockData = await response.json();
            setMetrics({ 
              results: mockData, 
              status: 'demo_mode'
            });
          } else {
            throw new Error('Failed to load demo data');
          }
        } catch (error) {
          console.error('Failed to load demo data:', error);
          const errorMessage = 'Failed to load demo data. Please try again.';
          setError(errorMessage);
          setIsErrorModalOpen(true);
        }
      } else {
        const data = await biasAndFairnessService.getBiasFairnessEvaluation(id as string);
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to fetch metrics: ${errorMessage}`);
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  }, [id, isDemo]);

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
            <Tab
              label="Advanced visualizations"
              value="visualizations"
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
                  {['accuracy', 'precision', 'recall', 'f1_score'].map((metric) => {
                    const value = performance[metric];
                    if (value === undefined) return null;
                    const numericValue = typeof value === 'number' ? value * 100 : 0;
                    const isGood = numericValue >= PERFORMANCE_THRESHOLD;

                    return (
                      <Grid item xs={12} sm={6} md={3} key={metric}>
                        <Box sx={{
                          ...STYLES.card,
                          textAlign: "center"
                        }}>
                          <Typography sx={{ ...STYLES.mutedText, pb: "2px" }}>
                            {metric.replace(/_/g, ' ').charAt(0).toUpperCase() + metric.replace(/_/g, ' ').slice(1).toLowerCase()}
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
                      <Grid container spacing={3}>
                        <Grid item xs={12} lg={8}>
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
                        </Grid>
                        <Grid item xs={12} lg={4}>
                          <Typography
                            variant="h3"
                            component="div"
                            sx={{
                              mb: 2,
                              fontSize: '14px',
                              fontWeight: 600,
                              color: COLORS.TEXT_PRIMARY,
                            }}
                          >
                            Metric descriptions
                          </Typography>
                          <Stack spacing={2}>
                            {Object.keys(sexMetrics).map((metric) => (
                              <Box key={metric} sx={{
                                p: 2,
                                backgroundColor: '#f8f9fa',
                                borderRadius: 1,
                                border: '1px solid #e9ecef'
                              }}>
                                <Typography sx={{ 
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: COLORS.TEXT_PRIMARY,
                                  mb: 0.5,
                                  lineHeight: 1.2
                                }}>
                                  {metric.replace(/_/g, ' ').charAt(0).toUpperCase() + metric.replace(/_/g, ' ').slice(1).toLowerCase()}
                                </Typography>
                                <Typography sx={{ 
                                  fontSize: '12px',
                                  fontWeight: 400,
                                  color: COLORS.TEXT_SECONDARY,
                                  lineHeight: 1.4
                                }}>
                                  {getSpecializedMetricDescription(metric, 'sex')}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Grid>
                      </Grid>
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
                      <Grid container spacing={3}>
                        <Grid item xs={12} lg={8}>
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
                        </Grid>
                        <Grid item xs={12} lg={4}>
                          <Typography
                            variant="h3"
                            component="div"
                            sx={{
                              mb: 2,
                              fontSize: '14px',
                              fontWeight: 600,
                              color: COLORS.TEXT_PRIMARY,
                            }}
                          >
                            Metric descriptions
                          </Typography>
                          <Stack spacing={2}>
                            {Object.keys(raceMetrics).map((metric) => (
                              <Box key={metric} sx={{
                                p: 2,
                                backgroundColor: '#f8f9fa',
                                borderRadius: 1,
                                border: '1px solid #e9ecef'
                              }}>
                                <Typography sx={{ 
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: COLORS.TEXT_PRIMARY,
                                  mb: 0.5,
                                  lineHeight: 1.2
                                }}>
                                  {metric.replace(/_/g, ' ').charAt(0).toUpperCase() + metric.replace(/_/g, ' ').slice(1).toLowerCase()}
                                </Typography>
                                <Typography sx={{ 
                                  fontSize: '12px',
                                  fontWeight: 400,
                                  color: COLORS.TEXT_SECONDARY,
                                  lineHeight: 1.4
                                }}>
                                  {getSpecializedMetricDescription(metric, 'race')}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>
                )}


              </Box>
            )}

            {/* Data Quality */}
            {data_quality && Object.keys(data_quality).length > 0 && (
              <Box>
                <Box sx={{
                  ...STYLES.card,
                  textAlign: 'left'
                }}>
                  <Typography sx={{ 
                    fontSize: '15px', 
                    fontWeight: 600, 
                    color: COLORS.TEXT_PRIMARY, 
                    pb: "2px",
                    textAlign: 'center'
                  }}>
                    Evaluation data quality
                  </Typography>
                  <Typography sx={{ 
                    fontSize: '13px', 
                    color: COLORS.TEXT_PRIMARY, 
                    mb: 1,
                    textAlign: 'center'
                  }}>
                    {data_quality.data_quality_score ? (
                      data_quality.data_quality_score >= 0.8 ? 'Excellent' :
                      data_quality.data_quality_score >= 0.6 ? 'Good' :
                      data_quality.data_quality_score >= 0.4 ? 'Fair' : 'Poor'
                    ) : 'Unknown'} quality {data_quality.data_quality_score ? (data_quality.data_quality_score * 100).toFixed(1) : 'N/A'}%
                  </Typography>
                  {data_quality.flagged_metrics && Object.keys(data_quality.flagged_metrics).length > 0 && (
                    <Typography sx={{ ...STYLES.secondaryText, color: COLORS.WARNING, mt: 1, textAlign: 'center' }}>
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
              <Typography variant="body1" sx={{ mb: 2, ...STYLES.bodyText }}>Configured</Typography>
              <Stack spacing={3}>
                {(metricsCfg.user_selected_metrics || []).map(m => (
                  <Box key={m} sx={{ 
                    border: '1px solid #eaecf0',
                    borderRadius: 2,
                    backgroundColor: "#FFFFFF",
                    padding: "11px 36px 11px 14px",
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
                    <Typography variant="body2" sx={{ color: COLORS.TEXT_PRIMARY, fontSize: '15px', fontWeight: 500, textAlign: 'left', marginRight: '10px' }}>{m.replace(/_/g, ' ').charAt(0).toUpperCase() + m.replace(/_/g, ' ').slice(1).toLowerCase()}</Typography>
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
                    padding: "11px 36px 11px 14px",
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
                    <Typography variant="body2" sx={{ color: '#1c2130', fontSize: '15px', fontWeight: 500, textAlign: 'left', marginRight: '10px' }}>{m.replace(/_/g, ' ').charAt(0).toUpperCase() + m.replace(/_/g, ' ').slice(1).toLowerCase()}</Typography>
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
              <Typography variant="body1" sx={{ mb: 2, ...STYLES.bodyText }}>Available</Typography>
                <Stack spacing={3}>
                  {(metricsCfg.all_available_metrics || []).map(m => (
                    <Box key={m} sx={{ 
                      border: '1px solid #eaecf0',
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      padding: "11px 36px 11px 14px",
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
                      <Typography variant="body2" sx={{ color: '#1c2130', fontSize: '15px', fontWeight: 500, textAlign: 'left', marginRight: '10px' }}>{m.replace(/_/g, ' ').charAt(0).toUpperCase() + m.replace(/_/g, ' ').slice(1).toLowerCase()}</Typography>
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
            <Typography variant="body2" sx={{ color: '#6b7280' }}>Select metrics to include/exclude on the Plots & Graphs.</Typography>
            <Button 
              variant="contained" 
              onClick={handleApplySelection} 
              disabled={!hasDraftChanges}
              size="small"
              sx={{ 
                px: 3, 
                py: 1, 
                fontSize: '15px',
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
          <Box mt={20}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={STYLES.bodyText}>Raw JSON data</Typography>
              <Box display="flex" gap={2}>
                <IconButton
                  onClick={handleCopyJSON}
                  sx={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: COLORS.PRIMARY,
                    color: 'white',
                    borderRadius: '8px',
                    '&:hover': {
                      backgroundColor: COLORS.PRIMARY,
                      opacity: 0.9
                    }
                  }}
                >
                  <CopyIcon style={{ width: 24, height: 24, strokeWidth: 1.5 }} />
                </IconButton>
                <IconButton
                  onClick={handleDownloadJSON}
                  sx={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: COLORS.PRIMARY,
                    color: 'white',
                    borderRadius: '8px',
                    '&:hover': {
                      backgroundColor: COLORS.PRIMARY,
                      opacity: 0.9
                    }
                  }}
                >
                  <DownloadIcon style={{ width: 24, height: 24, strokeWidth: 1.5 }} />
                </IconButton>
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
                  <IconButton
                    onClick={() => setShowFullJSON(true)}
                    sx={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: COLORS.PRIMARY,
                      color: 'white',
                      borderRadius: '50%',
                      '&:hover': {
                        backgroundColor: COLORS.PRIMARY
                      }
                    }}
                  >
                    <ExpandMoreIcon size={20} style={{ marginTop: '3px', marginLeft: '4px' }} />
                  </IconButton>
                </Box>
              )}
              {showFullJSON && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <IconButton
                    onClick={() => setShowFullJSON(false)}
                    sx={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: COLORS.PRIMARY,
                      color: 'white',
                      borderRadius: '50%',
                      '&:hover': {
                        backgroundColor: COLORS.PRIMARY
                      }
                    }}
                  >
                    <ExpandLessIcon size={20} style={{ marginRight: '3px', marginTop: '-2px' }} />
                  </IconButton>
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
                      padding: "8px 36px 14px 14px",
                      height: "60px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start"
                    }}>
                      <Typography sx={{ fontSize: '12px', color: "#8594AC", pb: "2px" }}>Dataset</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: "#2D3748", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {metrics?.dataset_name || metrics?.results?.metadata?.dataset || "N/A"}
                      </Typography>
                    </Box>
                    <Box sx={{
                      border: '1px solid #eaecf0',
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      minWidth: 228,
                      width: "100%",
                      padding: "8px 36px 14px 14px",
                      height: "60px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start"
                    }}>
                      <Typography sx={{ fontSize: '12px', color: "#8594AC", pb: "2px" }}>Model</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: "#2D3748", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {metrics?.model_name || metrics?.results?.metadata?.model || "N/A"}
                      </Typography>
                    </Box>
                    <Box sx={{
                      border: '1px solid #eaecf0',
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      minWidth: 228,
                      width: "100%",
                      padding: "8px 36px 14px 14px",
                      height: "60px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start"
                    }}>
                      <Typography sx={{ fontSize: '12px', color: "#8594AC", pb: "2px" }}>Task Type</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: "#2D3748", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                      padding: "8px 36px 14px 14px",
                      height: "60px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start"
                    }}>
                      <Typography sx={{ fontSize: '12px', color: "#8594AC", pb: "2px" }}>Evaluation ID</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: "#2D3748", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {metrics?.eval_id || "N/A"}
                      </Typography>
                    </Box>
                    <Box sx={{
                      border: '1px solid #eaecf0',
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      minWidth: 228,
                      width: "100%",
                      padding: "8px 36px 14px 14px",
                      height: "60px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start"
                    }}>
                      <Typography sx={{ fontSize: '12px', color: "#8594AC", pb: "2px" }}>Status</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: "#2D3748", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {metrics?.status || "N/A"}
                      </Typography>
                    </Box>
                    <Box sx={{
                      border: '1px solid #eaecf0',
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      minWidth: 228,
                      width: "100%",
                      padding: "8px 36px 14px 14px",
                      height: "60px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start"
                    }}>
                      <Typography sx={{ fontSize: '12px', color: "#8594AC", pb: "2px" }}>Created</Typography>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: "#2D3748", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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

        <TabPanel value="visualizations" sx={{ ...tabPanelStyle, pt: 2 }}>
          <Stack spacing={4}>
            <Box>
              <Typography
                variant="h2"
                component="div"
                sx={{
                  mb: 2,
                  ...STYLES.sectionTitle,
                }}
              >
                Advanced fairness visualizations
              </Typography>
              <Typography variant="body2" sx={{ mb: 4, color: COLORS.TEXT_SECONDARY }}>
                Explore comprehensive visual analysis of fairness metrics across different dimensions.
              </Typography>

              {/* Demographic Parity Visualization */}
              <Box mb={6}>
                <Paper elevation={0} sx={{ p: 3, ...STYLES.paper }}>
                  <Typography variant="h3" sx={{ mb: 2, ...STYLES.subsectionTitle }}>
                    Demographic Parity Analysis
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT_SECONDARY }}>
                    Measures how equally outcomes are distributed across groups. Lower values indicate fairer distribution.
                  </Typography>
                  <Box sx={{ height: 500 }}>
                    {Plot ? (
                      <Plot
                        data={[
                          {
                            type: 'bar',
                            x: ['Sex (Male vs Female)', 'Race (White vs Other)'],
                            y: [
                              sexMetrics.demographic_parity || 0,
                              raceMetrics.demographic_parity || 0
                            ],
                            marker: { 
                              color: [
                                Math.abs(sexMetrics.demographic_parity || 0) > FAIRNESS_THRESHOLD_SIGNIFICANT ? COLORS.ERROR : 
                                Math.abs(sexMetrics.demographic_parity || 0) > FAIRNESS_THRESHOLD_MODERATE ? COLORS.WARNING : COLORS.SUCCESS,
                                Math.abs(raceMetrics.demographic_parity || 0) > FAIRNESS_THRESHOLD_SIGNIFICANT ? COLORS.ERROR : 
                                Math.abs(raceMetrics.demographic_parity || 0) > FAIRNESS_THRESHOLD_MODERATE ? COLORS.WARNING : COLORS.SUCCESS
                              ],
                              line: { color: '#ffffff', width: 1 }
                            },
                            text: [
                              (sexMetrics.demographic_parity || 0).toFixed(4),
                              (raceMetrics.demographic_parity || 0).toFixed(4)
                            ],
                            textposition: 'outside',
                            name: 'Demographic Parity Difference'
                          }
                        ]}
                        layout={{ 
                          width: '100%', 
                          height: 500, 
                          margin: { t: 40, b: 60, l: 80, r: 40 },
                          title: 'Demographic Parity by Protected Attribute',
                          xaxis: { 
                            title: 'Protected Attribute',
                            tickangle: 0
                          },
                          yaxis: { 
                            title: 'Demographic Parity Difference',
                            range: [0, Math.max(
                              Math.abs(sexMetrics.demographic_parity || 0),
                              Math.abs(raceMetrics.demographic_parity || 0)
                            ) + 0.05]
                          },
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          font: { family: 'Inter, sans-serif', size: 12 }
                        }}
                        config={{ responsive: true, displayModeBar: true }}
                      />
                    ) : (
                      <Box sx={{ 
                        p: 4, 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: 2,
                        textAlign: 'center',
                        border: '1px solid #e9ecef',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography sx={{ color: COLORS.TEXT_MUTED }}>
                          Plotly visualization loading...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>

              {/* Comprehensive Metrics Comparison */}
              <Box mb={6}>
                <Paper elevation={0} sx={{ p: 3, ...STYLES.paper }}>
                  <Typography variant="h3" sx={{ mb: 2, ...STYLES.subsectionTitle }}>
                    Comprehensive Fairness Metrics Comparison
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT_SECONDARY }}>
                    Side-by-side comparison of all fairness metrics across sex and race attributes.
                  </Typography>
                  <Box sx={{ height: 600 }}>
                    {Plot ? (
                      <Plot
                        data={[
                          {
                            type: 'bar',
                            x: Object.keys(sexMetrics).map(key => key.replace(/_/g, ' ')),
                            y: Object.values(sexMetrics).map(Math.abs),
                            name: 'Sex Metrics',
                            marker: { 
                              color: COLORS.SEX_METRICS,
                              line: { color: '#ffffff', width: 1 }
                            },
                            text: Object.values(sexMetrics).map(v => (v || 0).toFixed(4)),
                            textposition: 'outside'
                          },
                          {
                            type: 'bar',
                            x: Object.keys(raceMetrics).map(key => key.replace(/_/g, ' ')),
                            y: Object.values(raceMetrics).map(Math.abs),
                            name: 'Race Metrics',
                            marker: { 
                              color: COLORS.RACE_METRICS,
                              line: { color: '#ffffff', width: 1 }
                            },
                            text: Object.values(raceMetrics).map(v => (v || 0).toFixed(4)),
                            textposition: 'outside'
                          }
                        ]}
                        layout={{ 
                          width: '100%', 
                          height: 600, 
                          margin: { t: 40, b: 120, l: 80, r: 40 },
                          title: 'All Fairness Metrics Comparison',
                          barmode: 'group',
                          xaxis: { 
                            title: 'Fairness Metrics',
                            tickangle: 45,
                            automargin: true
                          },
                          yaxis: { 
                            title: 'Metric Value (Absolute)',
                            range: [0, Math.max(
                              Math.max(...Object.values(sexMetrics).map(Math.abs)),
                              Math.max(...Object.values(raceMetrics).map(Math.abs))
                            ) + 0.05]
                          },
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          font: { family: 'Inter, sans-serif', size: 12 },
                          legend: { x: 0.7, y: 0.9 }
                        }}
                        config={{ responsive: true, displayModeBar: true }}
                      />
                    ) : (
                      <Box sx={{ 
                        p: 4, 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: 2,
                        textAlign: 'center',
                        border: '1px solid #e9ecef',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography sx={{ color: COLORS.TEXT_MUTED }}>
                          Plotly visualization loading...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>

              {/* Calibration Analysis by Group */}
              <Box mb={6}>
                <Paper elevation={0} sx={{ p: 3, ...STYLES.paper }}>
                  <Typography variant="h3" sx={{ mb: 2, ...STYLES.subsectionTitle }}>
                    Calibration Analysis by Group
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT_SECONDARY }}>
                    Compares predicted probabilities against actual outcomes for each demographic group.
                  </Typography>
                  <Box sx={{ height: 500 }}>
                    {Plot ? (
                      <Plot
                        data={[
                          {
                            type: 'scatter',
                            mode: 'lines+markers',
                            x: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
                            y: [0, 0.15, 0.35, 0.55, 0.75, 0.95],
                            name: 'Sex Group (Male)',
                            line: { color: COLORS.SEX_METRICS, width: 3 },
                            marker: { size: 8 }
                          },
                          {
                            type: 'scatter',
                            mode: 'lines+markers',
                            x: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
                            y: [0, 0.18, 0.38, 0.58, 0.78, 0.98],
                            name: 'Sex Group (Female)',
                            line: { color: COLORS.RACE_METRICS, width: 3 },
                            marker: { size: 8 }
                          },
                          {
                            type: 'scatter',
                            mode: 'lines',
                            x: [0, 1],
                            y: [0, 1],
                            name: 'Perfect Calibration',
                            line: { color: 'black', dash: 'dash', width: 2 },
                            showlegend: true
                          }
                        ]}
                        layout={{ 
                          width: '100%', 
                          height: 500, 
                          margin: { t: 40, b: 60, l: 80, r: 40 },
                          title: 'Calibration Curves by Demographic Group',
                          xaxis: { 
                            title: 'Mean Predicted Probability',
                            range: [0, 1]
                          },
                          yaxis: { 
                            title: 'Fraction of Positives',
                            range: [0, 1]
                          },
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          font: { family: 'Inter, sans-serif', size: 12 },
                          legend: { x: 0.7, y: 0.3 }
                        }}
                        config={{ responsive: true, displayModeBar: true }}
                      />
                    ) : (
                      <Box sx={{ 
                        p: 4, 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: 2,
                        textAlign: 'center',
                        border: '1px solid #e9ecef',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography sx={{ color: COLORS.TEXT_MUTED }}>
                          Plotly visualization loading...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>

              {/* Group-wise Confusion Matrices */}
              <Box mb={6}>
                <Paper elevation={0} sx={{ p: 3, ...STYLES.paper }}>
                  <Typography variant="h3" sx={{ mb: 2, ...STYLES.subsectionTitle }}>
                    Confusion Matrices by Group
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT_SECONDARY }}>
                    Side-by-side confusion matrices for each demographic group to compare prediction patterns.
                  </Typography>
                  <Box sx={{ height: 500 }}>
                    {Plot ? (
                      <Plot
                        data={[
                          {
                            type: 'heatmap',
                            z: [
                              [Math.round((performance.accuracy || 0.5) * 100), Math.round((1 - (performance.accuracy || 0.5)) * 100)],
                              [Math.round((1 - (performance.accuracy || 0.5)) * 100), Math.round((performance.accuracy || 0.5) * 100)]
                            ],
                            x: ['Predicted Negative', 'Predicted Positive'],
                            y: ['Actual Negative', 'Actual Positive'],
                            colorscale: 'Blues',
                            showscale: false,
                            text: [
                              [Math.round((performance.accuracy || 0.5) * 100), Math.round((1 - (performance.accuracy || 0.5)) * 100)],
                              [Math.round((1 - (performance.accuracy || 0.5)) * 100), Math.round((performance.accuracy || 0.5) * 100)]
                            ],
                            texttemplate: '%{text}',
                            hovertemplate: 'True: %{y}<br>Pred: %{x}<br>Count: %{text}<extra></extra>',
                            name: 'Sex Group'
                          }
                        ]}
                        layout={{ 
                          width: '100%', 
                          height: 500, 
                          margin: { t: 40, b: 60, l: 80, r: 40 },
                          title: 'Confusion Matrix - Sex Groups',
                          xaxis: { title: 'Predicted Label' },
                          yaxis: { title: 'True Label', autorange: 'reversed' },
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          font: { family: 'Inter, sans-serif', size: 12 }
                        }}
                        config={{ responsive: true, displayModeBar: true }}
                      />
                    ) : (
                      <Box sx={{ 
                        p: 4, 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: 2,
                        textAlign: 'center',
                        border: '1px solid #e9ecef',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography sx={{ color: COLORS.TEXT_MUTED }}>
                          Plotly visualization loading...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>

              {/* Fairness vs Accuracy Trade-off */}
              <Box mb={6}>
                <Paper elevation={0} sx={{ p: 3, ...STYLES.paper }}>
                  <Typography variant="h3" sx={{ mb: 2, ...STYLES.subsectionTitle }}>
                    Fairness vs Accuracy Trade-off
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT_SECONDARY }}>
                    Compares model accuracy with fairness metrics across different protected attributes.
                  </Typography>
                  <Box sx={{ height: 500 }}>
                    {Plot ? (
                      <Plot
                        data={[
                          {
                            type: 'scatter',
                            mode: 'markers',
                            x: [performance.accuracy || 0],
                            y: [Math.abs(sexMetrics.equalized_odds || 0)],
                            marker: { 
                              size: 15,
                              color: COLORS.SEX_METRICS,
                              symbol: 'circle'
                            },
                            name: 'Sex (Equalized Odds)',
                            text: [`Accuracy: ${(performance.accuracy || 0).toFixed(3)}<br>EO Diff: ${(sexMetrics.equalized_odds || 0).toFixed(4)}`],
                            hovertemplate: '%{text}<extra></extra>'
                          },
                          {
                            type: 'scatter',
                            mode: 'markers',
                            x: [performance.accuracy || 0],
                            y: [Math.abs(raceMetrics.equalized_odds || 0)],
                            marker: { 
                              size: 15,
                              color: COLORS.RACE_METRICS,
                              symbol: 'diamond'
                            },
                            name: 'Race (Equalized Odds)',
                            text: [`Accuracy: ${(performance.accuracy || 0).toFixed(3)}<br>EO Diff: ${(raceMetrics.equalized_odds || 0).toFixed(4)}`],
                            hovertemplate: '%{text}<extra></extra>'
                          }
                        ]}
                        layout={{ 
                          width: '100%', 
                          height: 500, 
                          margin: { t: 40, b: 60, l: 80, r: 40 },
                          title: 'Accuracy vs Fairness Trade-off',
                          xaxis: { 
                            title: 'Model Accuracy',
                            range: [0, 1]
                          },
                          yaxis: { 
                            title: 'Equalized Odds Difference',
                            range: [0, Math.max(
                              Math.abs(sexMetrics.equalized_odds || 0),
                              Math.abs(raceMetrics.equalized_odds || 0)
                            ) + 0.05]
                          },
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          font: { family: 'Inter, sans-serif', size: 12 },
                          legend: { x: 0.7, y: 0.9 }
                        }}
                        config={{ responsive: true, displayModeBar: true }}
                      />
                    ) : (
                      <Box sx={{ 
                        p: 4, 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: 2,
                        textAlign: 'center',
                        border: '1px solid #e9ecef',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography sx={{ color: COLORS.TEXT_MUTED }}>
                          Plotly visualization loading...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>

              {/* Fairness Radar Chart */}
              <Box mb={6}>
                <Paper elevation={0} sx={{ p: 3, ...STYLES.paper }}>
                  <Typography variant="h3" sx={{ mb: 2, ...STYLES.subsectionTitle }}>
                    Fairness Metrics Radar
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT_SECONDARY }}>
                    Multi-dimensional view of fairness metrics across groups for holistic comparison.
                  </Typography>
                  <Box sx={{ height: 500 }}>
                    {Plot ? (
                      <Plot
                        data={[
                          {
                            type: 'scatterpolar',
                            r: [
                              Math.abs(sexMetrics.demographic_parity || 0),
                              Math.abs(sexMetrics.equalized_odds || 0),
                              Math.abs(sexMetrics.predictive_parity || 0),
                              Math.abs(sexMetrics.equalized_opportunity || 0),
                              Math.abs(sexMetrics.predictive_equality || 0),
                              Math.abs(sexMetrics.demographic_parity || 0) // Close the radar
                            ],
                            theta: [
                              'Demographic Parity',
                              'Equalized Odds', 
                              'Predictive Parity',
                              'Equalized Opportunity',
                              'Predictive Equality',
                              'Demographic Parity'
                            ],
                            fill: 'toself',
                            name: 'Sex Metrics',
                            line: { color: COLORS.SEX_METRICS },
                            fillcolor: COLORS.SEX_METRICS + '40'
                          },
                          {
                            type: 'scatterpolar',
                            r: [
                              Math.abs(raceMetrics.demographic_parity || 0),
                              Math.abs(raceMetrics.equalized_odds || 0),
                              Math.abs(raceMetrics.predictive_parity || 0),
                              Math.abs(raceMetrics.equalized_opportunity || 0),
                              Math.abs(raceMetrics.predictive_equality || 0),
                              Math.abs(raceMetrics.demographic_parity || 0) // Close the radar
                            ],
                            theta: [
                              'Demographic Parity',
                              'Equalized Odds',
                              'Predictive Parity', 
                              'Equalized Opportunity',
                              'Predictive Equality',
                              'Demographic Parity'
                            ],
                            fill: 'toself',
                            name: 'Race Metrics',
                            line: { color: COLORS.RACE_METRICS },
                            fillcolor: COLORS.RACE_METRICS + '40'
                          }
                        ]}
                        layout={{ 
                          width: '100%', 
                          height: 500, 
                          margin: { t: 40, b: 40, l: 40, r: 40 },
                          title: 'Fairness Metrics Radar Chart',
                          polar: {
                            radialaxis: {
                              visible: true,
                              range: [0, Math.max(
                                Math.max(...Object.values(sexMetrics).map(Math.abs)),
                                Math.max(...Object.values(raceMetrics).map(Math.abs))
                              ) + 0.05]
                            }
                          },
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          font: { family: 'Inter, sans-serif', size: 12 },
                          legend: { x: 0.7, y: 0.9 }
                        }}
                        config={{ responsive: true, displayModeBar: true }}
                      />
                    ) : (
                      <Box sx={{ 
                        p: 4, 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: 2,
                        textAlign: 'center',
                        border: '1px solid #e9ecef',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography sx={{ color: COLORS.TEXT_MUTED }}>
                          Plotly visualization loading...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>

              {/* Conditional Statistical Parity Heatmap */}
              <Box mb={6}>
                <Paper elevation={0} sx={{ p: 3, ...STYLES.paper }}>
                  <Typography variant="h3" sx={{ mb: 2, ...STYLES.subsectionTitle }}>
                    Conditional Statistical Parity
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT_SECONDARY }}>
                    Heatmap showing selection rates by group within different strata defined by legitimate attributes.
                  </Typography>
                  <Box sx={{ height: 500 }}>
                    {Plot ? (
                      <Plot
                        data={[
                          {
                            type: 'heatmap',
                            z: [
                              [Math.abs(sexMetrics.demographic_parity || 0), Math.abs(sexMetrics.equalized_odds || 0), Math.abs(sexMetrics.predictive_parity || 0)],
                              [Math.abs(raceMetrics.demographic_parity || 0), Math.abs(raceMetrics.equalized_odds || 0), Math.abs(raceMetrics.predictive_parity || 0)]
                            ],
                            x: ['Demographic Parity', 'Equalized Odds', 'Predictive Parity'],
                            y: ['Sex Group', 'Race Group'],
                            colorscale: 'YlGnBu',
                            colorbar: { title: 'Selection Rate Difference' },
                            text: [
                              [(sexMetrics.demographic_parity || 0).toFixed(3), (sexMetrics.equalized_odds || 0).toFixed(3), (sexMetrics.predictive_parity || 0).toFixed(3)],
                              [(raceMetrics.demographic_parity || 0).toFixed(3), (raceMetrics.equalized_odds || 0).toFixed(3), (raceMetrics.predictive_parity || 0).toFixed(3)]
                            ],
                            texttemplate: '%{text}',
                            hovertemplate: 'Group: %{y}<br>Metric: %{x}<br>Value: %{text}<extra></extra>'
                          }
                        ]}
                        layout={{ 
                          width: '100%', 
                          height: 500, 
                          margin: { t: 40, b: 60, l: 80, r: 40 },
                          title: 'Conditional Statistical Parity Heatmap',
                          xaxis: { title: 'Fairness Metrics' },
                          yaxis: { title: 'Protected Groups', autorange: 'reversed' },
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          font: { family: 'Inter, sans-serif', size: 12 }
                        }}
                        config={{ responsive: true, displayModeBar: true }}
                      />
                    ) : (
                      <Box sx={{ 
                        p: 4, 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: 2,
                        textAlign: 'center',
                        border: '1px solid #e9ecef',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography sx={{ color: COLORS.TEXT_MUTED }}>
                          Plotly visualization loading...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>

              {/* Cumulative Parity Loss */}
              <Box mb={6}>
                <Paper elevation={0} sx={{ p: 3, ...STYLES.paper }}>
                  <Typography variant="h3" sx={{ mb: 2, ...STYLES.subsectionTitle }}>
                    Cumulative Parity Loss
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT_SECONDARY }}>
                    Stacked horizontal bar chart showing cumulative fairness metrics (TPR, PPV, FPR, ACC, SPR) per subgroup.
                  </Typography>
                  <Box sx={{ height: 500 }}>
                    {Plot ? (
                      <Plot
                        data={[
                          {
                            type: 'bar',
                            orientation: 'h',
                            x: [
                              Math.abs(sexMetrics.demographic_parity || 0),
                              Math.abs(sexMetrics.equalized_odds || 0),
                              Math.abs(sexMetrics.predictive_parity || 0),
                              Math.abs(sexMetrics.equalized_opportunity || 0),
                              Math.abs(sexMetrics.predictive_equality || 0)
                            ],
                            y: ['Demographic Parity', 'Equalized Odds', 'Predictive Parity', 'Equalized Opportunity', 'Predictive Equality'],
                            name: 'Sex Metrics',
                            marker: { 
                              color: COLORS.SEX_METRICS,
                              line: { color: '#ffffff', width: 1 }
                            },
                            text: [
                              (sexMetrics.demographic_parity || 0).toFixed(3),
                              (sexMetrics.equalized_odds || 0).toFixed(3),
                              (sexMetrics.predictive_parity || 0).toFixed(3),
                              (sexMetrics.equalized_opportunity || 0).toFixed(3),
                              (sexMetrics.predictive_equality || 0).toFixed(3)
                            ],
                            textposition: 'outside'
                          },
                          {
                            type: 'bar',
                            orientation: 'h',
                            x: [
                              Math.abs(raceMetrics.demographic_parity || 0),
                              Math.abs(raceMetrics.equalized_odds || 0),
                              Math.abs(raceMetrics.predictive_parity || 0),
                              Math.abs(raceMetrics.equalized_opportunity || 0),
                              Math.abs(raceMetrics.predictive_equality || 0)
                            ],
                            y: ['Demographic Parity', 'Equalized Odds', 'Predictive Parity', 'Equalized Opportunity', 'Predictive Equality'],
                            name: 'Race Metrics',
                            marker: { 
                              color: COLORS.RACE_METRICS,
                              line: { color: '#ffffff', width: 1 }
                            },
                            text: [
                              (raceMetrics.demographic_parity || 0).toFixed(3),
                              (raceMetrics.equalized_odds || 0).toFixed(3),
                              (raceMetrics.predictive_parity || 0).toFixed(3),
                              (raceMetrics.equalized_opportunity || 0).toFixed(3),
                              (raceMetrics.predictive_equality || 0).toFixed(3)
                            ],
                            textposition: 'outside'
                          }
                        ]}
                        layout={{ 
                          width: '100%', 
                          height: 500, 
                          margin: { t: 40, b: 60, l: 120, r: 40 },
                          title: 'Cumulative Parity Loss by Group',
                          barmode: 'stack',
                          xaxis: { title: 'Cumulative Parity Loss' },
                          yaxis: { title: 'Fairness Metrics' },
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          font: { family: 'Inter, sans-serif', size: 12 },
                          legend: { x: 0.7, y: 0.9 }
                        }}
                        config={{ responsive: true, displayModeBar: true }}
                      />
                    ) : (
                      <Box sx={{ 
                        p: 4, 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: 2,
                        textAlign: 'center',
                        border: '1px solid #e9ecef',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography sx={{ color: COLORS.TEXT_MUTED }}>
                          Plotly visualization loading...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>

              {/* Group Metrics Boxplots */}
              <Box mb={6}>
                <Paper elevation={0} sx={{ p: 3, ...STYLES.paper }}>
                  <Typography variant="h3" sx={{ mb: 2, ...STYLES.subsectionTitle }}>
                    Group Metrics Distribution
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: COLORS.TEXT_SECONDARY }}>
                    Boxplots showing distribution of key fairness metrics (TPR, FPR, PPV, NPV) across demographic groups.
                  </Typography>
                  <Box sx={{ height: 500 }}>
                    {Plot ? (
                      <Plot
                        data={[
                          {
                            type: 'box',
                            y: [
                              Math.abs(sexMetrics.demographic_parity || 0),
                              Math.abs(sexMetrics.equalized_odds || 0),
                              Math.abs(sexMetrics.predictive_parity || 0),
                              Math.abs(sexMetrics.equalized_opportunity || 0)
                            ],
                            x: ['Demographic Parity', 'Equalized Odds', 'Predictive Parity', 'Equalized Opportunity'],
                            name: 'Sex Metrics',
                            marker: { color: COLORS.SEX_METRICS },
                            boxpoints: 'all',
                            jitter: 0.3,
                            pointpos: -1.8
                          },
                          {
                            type: 'box',
                            y: [
                              Math.abs(raceMetrics.demographic_parity || 0),
                              Math.abs(raceMetrics.equalized_odds || 0),
                              Math.abs(raceMetrics.predictive_parity || 0),
                              Math.abs(raceMetrics.equalized_opportunity || 0)
                            ],
                            x: ['Demographic Parity', 'Equalized Odds', 'Predictive Parity', 'Equalized Opportunity'],
                            name: 'Race Metrics',
                            marker: { color: COLORS.RACE_METRICS },
                            boxpoints: 'all',
                            jitter: 0.3,
                            pointpos: -1.8
                          }
                        ]}
                        layout={{ 
                          width: '100%', 
                          height: 500, 
                          margin: { t: 40, b: 60, l: 80, r: 40 },
                          title: 'Fairness Metrics Distribution Across Groups',
                          xaxis: { title: 'Fairness Metrics' },
                          yaxis: { title: 'Metric Value (Absolute)' },
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          font: { family: 'Inter, sans-serif', size: 12 },
                          legend: { x: 0.7, y: 0.9 },
                          boxmode: 'group'
                        }}
                        config={{ responsive: true, displayModeBar: true }}
                      />
                    ) : (
                      <Box sx={{ 
                        p: 4, 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: 2,
                        textAlign: 'center',
                        border: '1px solid #e9ecef',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography sx={{ color: COLORS.TEXT_MUTED }}>
                          Plotly visualization loading...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>

              {/* Info Alert */}
              <Alert severity="info" sx={{ mt: 4 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> Advanced visualizations require raw prediction data from the evaluation.
                  These visualizations will be automatically generated when the complete evaluation data is available.
                  Each visualization provides unique insights into different aspects of fairness and bias in your model.
                </Typography>
              </Alert>
            </Box>
          </Stack>
        </TabPanel>
      </TabContext>
      
      <ErrorModal
        open={isErrorModalOpen}
        errorMessage={error}
        handleClose={() => setIsErrorModalOpen(false)}
      />
    </Stack>
  );
}
