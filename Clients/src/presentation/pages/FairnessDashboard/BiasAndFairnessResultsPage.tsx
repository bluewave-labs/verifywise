import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { BarChart } from "@mui/x-charts";
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-basic-dist';
const Plot = createPlotlyComponent(Plotly);
import { biasAndFairnessService } from "../../../infrastructure/api/biasAndFairnessService";
import singleTheme from "../../themes/v1SingleTheme";

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

  // Extract fairness metrics by attribute
  const getFairnessMetricsByAttribute = (attribute: string) => {
    const attributeMetrics: Record<string, number> = {};
    
    // Check if we have results from the evaluation
    if (metrics?.results?.fairness_metrics) {
      Object.entries(metrics.results.fairness_metrics).forEach(([key, value]) => {
        if (key.endsWith(`_${attribute}`) && value && typeof value === 'object' && (value as { value?: number }).value !== undefined) {
          const metricName = key.replace(`_${attribute}`, '');
          attributeMetrics[metricName] = (value as { value: number }).value as number;
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

  // Extract metadata from config_data
  const performance: Record<string, number> = metrics?.results?.performance || {};
  const fairness_metrics: Record<string, MetricEntry> = metrics?.results?.fairness_metrics || {};
  const data_quality: DataQuality = metrics?.results?.data_quality || {};
  const flagged = data_quality?.flagged_metrics || {};
  const metricsCfg: MetricsConfiguration = metrics?.results?.metadata?.metrics_configuration || {};

  const handleCopyJSON = () => {
    try {
      const json = JSON.stringify(metrics?.results || {}, null, 2);
      navigator.clipboard.writeText(json);
    } catch {
      // no-op
    }
  };

  return (
    <Box p={4}>
      <Box mb={2} display="flex" alignItems="center">
        <IconButton
          onClick={() => navigate("/fairness-dashboard")}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          sx={{
            ...singleTheme.textStyles.pageTitle,
            variant: "h5",
            fontWeight: 600,
            fontSize: 20,
            mb: 2,
          }}
        >
          Bias & fairness evaluation results
        </Typography>
        {(
          <Chip
            label={metrics?.status === 'completed' ? 'Completed' : (metrics?.status || (isDemo ? 'Demo' : ''))}
            color="success"
            size="small"
            sx={{ ml: 2 }}
          />
        )}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" scrollButtons allowScrollButtonsMobile>
        <Tab sx={{ textTransform: 'none' }} label="Overview" />
        <Tab sx={{ textTransform: 'none' }} label="Plots & Graphs" />
        <Tab sx={{ textTransform: 'none' }} label="Raw JSON" />
        <Tab sx={{ textTransform: 'none' }} label="Metrics Explorer" />
        <Tab sx={{ textTransform: 'none' }} label="Data & Subgroups" />
        <Tab sx={{ textTransform: 'none' }} label="Mitigation" />
        <Tab sx={{ textTransform: 'none' }} label="Runs & History" />
        <Tab sx={{ textTransform: 'none' }} label="Settings / Config" />
      </Tabs>

      {/* Metadata */}
      {tab === 0 && (
      <Box mb={4}>
        <Paper elevation={0} sx={{ p: 3, backgroundColor: "white" }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Evaluation information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: "#6B7280" }}>
                <strong>Dataset:</strong> {metrics?.dataset_name || metrics?.results?.metadata?.dataset || "N/A"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#6B7280" }}>
                <strong>Model:</strong> {metrics?.model_name || metrics?.results?.metadata?.model || "N/A"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#6B7280" }}>
                <strong>Task:</strong> {(metrics?.model_task || metrics?.results?.metadata?.model_task || "N/A").toString().replace('_', ' ')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: "#6B7280" }}>
                <strong>Evaluation ID:</strong> {metrics?.eval_id || "N/A"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#6B7280" }}>
                <strong>Status:</strong> {metrics?.status || "N/A"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#6B7280" }}>
                <strong>Created:</strong> {metrics?.created_at ? new Date(metrics.created_at).toLocaleString() : (metrics?.results?.metadata?.evaluation_timestamp ? new Date(metrics.results.metadata.evaluation_timestamp).toLocaleString() : "N/A")}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
      )}

      {/* Performance Metrics */}
      {tab === 0 && Object.keys(performance).length > 0 && (
        <Box mb={4}>
          <Paper elevation={0} sx={{ p: 3, backgroundColor: "white" }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Performance metrics
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(performance).map(([metric, value]) => (
                <Grid item xs={6} md={3} key={metric}>
                  <Card sx={{ backgroundColor: "#f8fafc" }}>
                    <CardContent sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {(value as number) !== undefined ? ((value as number) * 100).toFixed(1) + '%' : ''}
                      </Typography>
                      <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                        {metric.replace('_', ' ')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      )}

      {/* Fairness Metrics by Attribute */}
      {tab === 0 && Object.keys(fairness_metrics).length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Fairness metrics by protected attribute
          </Typography>
          
          {/* Sex Metrics */}
          {Object.keys(sexMetrics).length > 0 && (
            <Box mb={4}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Sex attribute fairness metrics
              </Typography>
              {Plot ? (
                <Plot
                  data={[{
                    type: 'bar',
                    x: Object.keys(sexMetrics),
                    y: Object.values(sexMetrics),
                    marker: { color: barColors[0] },
                  }]}
                  layout={{ width: 800, height: 300, margin: { t: 20, b: 80 }, xaxis: { tickangle: 45 } }}
                />
              ) : (
                <BarChart
                  xAxis={[{ scaleType: 'band', data: Object.keys(sexMetrics), tickLabelStyle: { angle: 45, textAnchor: 'start', fontSize: 10 } }]}
                  series={[{ data: Object.values(sexMetrics), label: 'Sex Metrics', valueFormatter: (v) => (v != null ? v.toFixed(4) : 'N/A'), color: barColors[0] }]}
                  width={800}
                  height={300}
                />
              )}
            </Box>
          )}

          {/* Race Metrics */}
          {Object.keys(raceMetrics).length > 0 && (
            <Box mb={4}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Race attribute fairness metrics
              </Typography>
              {Plot ? (
                <Plot
                  data={[{
                    type: 'bar',
                    x: Object.keys(raceMetrics),
                    y: Object.values(raceMetrics),
                    marker: { color: barColors[1] },
                  }]}
                  layout={{ width: 800, height: 300, margin: { t: 20, b: 80 }, xaxis: { tickangle: 45 } }}
                />
              ) : (
                <BarChart
                  xAxis={[{ scaleType: 'band', data: Object.keys(raceMetrics), tickLabelStyle: { angle: 45, textAnchor: 'start', fontSize: 10 } }]}
                  series={[{ data: Object.values(raceMetrics), label: 'Race Metrics', valueFormatter: (v) => (v != null ? v.toFixed(4) : 'N/A'), color: barColors[1] }]}
                  width={800}
                  height={300}
                />
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Data Quality */}
      {tab === 0 && data_quality && Object.keys(data_quality).length > 0 && (
        <Box mb={4}>
          <Paper elevation={0} sx={{ p: 3, backgroundColor: "white" }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Data quality assessment
            </Typography>
            {data_quality.data_quality_score && (
              <>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
                  {(data_quality.data_quality_score * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" sx={{ color: "#6B7280", mb: 2 }}>
                  Overall data quality score
                </Typography>
              </>
            )}
            {flagged && Object.keys(flagged).length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Flagged metrics</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(flagged).map(([k, v]) => (
                    <Chip key={k} variant="outlined" label={`${k}: ${((v as { value?: number })?.value ?? '').toString().slice(0, 6)} - ${(
                      v as { reason?: string }
                    )?.reason || 'flagged'}`} />
                  ))}
                </Box>
              </Box>
            )}
            {data_quality.insights && (
              <Box>
                {data_quality.insights.map((insight: string, index: number) => (
                  <Typography key={index} variant="body2" sx={{ color: "#6B7280", mb: 1 }}>
                    • {insight}
                  </Typography>
                ))}
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
            <Button variant="outlined" size="small" onClick={handleCopyJSON}>Copy</Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
            {JSON.stringify(metrics?.results || {}, null, 2)}
          </pre>
        </Paper>
      )}

      {/* Metrics Explorer */}
      {tab === 3 && (
        <Paper elevation={0} sx={{ p: 3, backgroundColor: 'white' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Metrics Explorer</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>User-selected</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {(metricsCfg.user_selected_metrics || []).map(m => (
                  <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={!!explorerDraftSelection[m]} onChange={() => setExplorerDraftSelection(prev => ({ ...prev, [m]: !prev[m] }))} />
                    <span>{m}</span>
                  </label>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Compass Recommended</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {(metricsCfg.fairness_compass_recommended_metrics || []).map(m => (
                  <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={!!explorerDraftSelection[m]} onChange={() => setExplorerDraftSelection(prev => ({ ...prev, [m]: !prev[m] }))} />
                    <span>{m}</span>
                  </label>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>All Available</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 260, overflowY: 'auto' }}>
                {(metricsCfg.all_available_metrics || []).map(m => (
                  <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={!!explorerDraftSelection[m]} onChange={() => setExplorerDraftSelection(prev => ({ ...prev, [m]: !prev[m] }))} />
                    <span>{m}</span>
                  </label>
                ))}
              </Box>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" sx={{ color: '#6B7280' }}>Tip: select metrics to include/exclude them from charts on the Plots & Graphs tab.</Typography>
            <Button variant="contained" onClick={handleApplySelection} disabled={!hasDraftChanges}>Select</Button>
          </Box>
        </Paper>
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

      {/* Mitigation */}
      {tab === 5 && (
        <Paper elevation={0} sx={{ p: 3, backgroundColor: 'white' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Mitigation</Typography>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Recommended Metrics</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {(metricsCfg.fairness_compass_recommended_metrics || []).map(m => (
              <Chip key={m} label={m} />
            ))}
          </Box>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            Guidance and mitigation suggestions will appear here based on metric outcomes. (Coming soon)
          </Typography>
        </Paper>
      )}

      {/* Runs & History */}
      {tab === 6 && (
        <Paper elevation={0} sx={{ p: 3, backgroundColor: 'white' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Evaluation Runs & History</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            View past runs, compare configurations, and export results. (Coming soon)
          </Typography>
        </Paper>
      )}

      {/* Settings / Config */}
      {tab === 7 && (
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
