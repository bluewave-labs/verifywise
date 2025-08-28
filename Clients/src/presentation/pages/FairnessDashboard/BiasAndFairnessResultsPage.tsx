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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { BarChart } from "@mui/x-charts";
import { biasAndFairnessService } from "../../../infrastructure/api/biasAndFairnessService";
import singleTheme from "../../themes/v1SingleTheme";

const metricDescriptions = {
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
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const barColors = [
    "#E6194B", "#3CB44B", "#FFE119", "#4363D8", "#F58231",
    "#911EB4", "#42D4F4", "#F032E6", "#BFef45", "#FABEBE",
  ];

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Fetch real data from the database
        const data = await biasAndFairnessService.getBiasFairnessEvaluation(id as string);
        setMetrics(data);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
        setError("Failed to fetch metrics.");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchMetrics();
    }
  }, [id]);

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
        if (key.endsWith(`_${attribute}`) && value && typeof value === 'object' && 'value' in value) {
          const metricName = key.replace(`_${attribute}`, '');
          attributeMetrics[metricName] = (value as any).value;
        }
      });
    }
    
    return attributeMetrics;
  };

  const sexMetrics = getFairnessMetricsByAttribute('sex');
  const raceMetrics = getFairnessMetricsByAttribute('race');

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
  const performance = metrics?.results?.performance || {};
  const fairness_metrics = metrics?.results?.fairness_metrics || {};
  const data_quality = metrics?.results?.data_quality || {};

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
          Bias & Fairness Evaluation Results
        </Typography>
      </Box>

      {/* Metadata */}
      <Box mb={4}>
        <Paper elevation={0} sx={{ p: 3, backgroundColor: "white" }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#13715B", fontWeight: 600 }}>
            Evaluation Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: "#6B7280" }}>
                <strong>Dataset:</strong> {metrics?.dataset_name || "N/A"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#6B7280" }}>
                <strong>Model:</strong> {metrics?.model_name || "N/A"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#6B7280" }}>
                <strong>Task:</strong> {metrics?.model_task?.replace('_', ' ') || "N/A"}
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
                <strong>Created:</strong> {metrics?.created_at ? new Date(metrics.created_at).toLocaleString() : "N/A"}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Performance Metrics */}
      {Object.keys(performance).length > 0 && (
        <Box mb={4}>
          <Paper elevation={0} sx={{ p: 3, backgroundColor: "white" }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#13715B", fontWeight: 600 }}>
              Performance Metrics
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(performance).map(([metric, value]) => (
                <Grid item xs={6} md={3} key={metric}>
                  <Card sx={{ backgroundColor: "#f8fafc" }}>
                    <CardContent sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="h6" sx={{ color: "#13715B", fontWeight: 600 }}>
                        {typeof value === 'number' ? (value * 100).toFixed(1) + '%' : String(value)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#6B7280", textTransform: "capitalize" }}>
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
      {Object.keys(fairness_metrics).length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" sx={{ mb: 2, color: "#13715B", fontWeight: 600 }}>
            Fairness Metrics by Protected Attribute
          </Typography>
          
          {/* Sex Metrics */}
          {Object.keys(sexMetrics).length > 0 && (
            <Box mb={4}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Sex Attribute Fairness Metrics
              </Typography>
              <BarChart
                xAxis={[{
                  scaleType: "band",
                  data: Object.keys(sexMetrics),
                  tickLabelStyle: {
                    angle: 45,
                    textAnchor: "start",
                    fontSize: 10,
                  },
                }]}
                series={[{
                  data: Object.values(sexMetrics),
                  label: "Sex Metrics",
                  valueFormatter: (v: number | null) => (v != null ? v.toFixed(4) : "N/A"),
                  color: barColors[0],
                }]}
                width={800}
                height={300}
              />
            </Box>
          )}

          {/* Race Metrics */}
          {Object.keys(raceMetrics).length > 0 && (
            <Box mb={4}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Race Attribute Fairness Metrics
              </Typography>
              <BarChart
                xAxis={[{
                  scaleType: "band",
                  data: Object.keys(raceMetrics),
                  tickLabelStyle: {
                    angle: 45,
                    textAnchor: "start",
                    fontSize: 10,
                  },
                }]}
                series={[{
                  data: Object.values(raceMetrics),
                  label: "Race Metrics",
                  valueFormatter: (v: number | null) => (v != null ? v.toFixed(4) : "N/A"),
                  color: barColors[1],
                }]}
                width={800}
                height={300}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Data Quality */}
      {data_quality && Object.keys(data_quality).length > 0 && (
        <Box mb={4}>
          <Paper elevation={0} sx={{ p: 3, backgroundColor: "white" }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#13715B", fontWeight: 600 }}>
              Data Quality Assessment
            </Typography>
            {data_quality.data_quality_score && (
              <>
                <Typography variant="h4" sx={{ color: "#13715B", fontWeight: 600, mb: 2 }}>
                  {(data_quality.data_quality_score * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" sx={{ color: "#6B7280", mb: 2 }}>
                  Overall Data Quality Score
                </Typography>
              </>
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
      {uniqueMetrics.length > 0 && (
        <Box mb={4}>
          <Paper elevation={0} sx={{ p: 3, backgroundColor: "white" }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#13715B", fontWeight: 600 }}>
              Metric Descriptions
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
    </Box>
  );
}
