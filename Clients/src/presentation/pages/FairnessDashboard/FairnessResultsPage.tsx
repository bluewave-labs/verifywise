import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { BarChart } from "@mui/x-charts";
import { fairnessService } from "../../../infrastructure/api/fairnessService";

const metricDescriptions = {
  accuracy: "Overall correctness of the model's predictions.",
  selection_rate: "Proportion of individuals selected by the model per group.",
  tpr: "True Positive Rate - proportion of positives correctly identified.",
  tnr: "True Negative Rate - proportion of negatives correctly identified.",
  demographic_parity_difference: "Difference in selection rates across groups.",
  equal_opportunity_difference: "Difference in true positive rates across groups.",
  equalized_odds_difference: "Difference in true and false positive rates across groups.",
};

export default function FairnessResultsPage() {
  const { id } = useParams();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await fairnessService.getFairnessMetrics(id as string);
        setMetrics(data);
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
        setError("Failed to fetch metrics.");
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
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

  return (
    <Box p={4}>
      <Box mb={2} display="flex" alignItems="center">
        <IconButton onClick={() => navigate("/fairness-dashboard")} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={600}>
          {metrics.model_name} — Fairness Metrics
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: "#F6FAF9" }}>
            <Typography variant="h6" color="#13715B" gutterBottom>
              <strong>Overall Fairness Metrics</strong>
            </Typography>
            <Typography>Accuracy: {metrics.accuracy}</Typography>
            <Typography>Demographic Parity Difference: {metrics.demographic_parity_difference}</Typography>
            <Typography>Equal Opportunity Difference: {metrics.equal_opportunity_difference}</Typography>
            <Typography>Equalized Odds Difference: {metrics.equalized_odds_difference}</Typography>
          </Paper>
        </Grid>

        {["accuracy", "selection_rate", "tpr", "tnr"].map((metricKey) => (
          <Grid item xs={12} key={metricKey}>
            <Paper elevation={3} sx={{ p: 3, backgroundColor: "#F6FAF9" }}>
              <Typography variant="h6" color="#13715B" gutterBottom>
                <strong>{['tpr', 'tnr'].includes(metricKey) ? `Group-wise ${metricKey.toUpperCase()}` : `Group-wise ${metricKey.charAt(0).toUpperCase() + metricKey.slice(1).replace('_', ' ')}`}</strong>
              </Typography>
              <Accordion sx={{ backgroundColor: "#ffffff" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" color="text.secondary">
                    What does this mean?
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">
                    {metricDescriptions[metricKey]}
                  </Typography>
                </AccordionDetails>
              </Accordion>
              <BarChart
                xAxis={[{ scaleType: "band", data: metrics.group_metrics?.map(g => g.group) || [] }]}
                series={[{
                  data: metrics.group_metrics?.map(g => g[metricKey]) || [],
                  label: metricKey.replace("_", " "),
                  color: "gray"
                }]}
                width={600}
                height={300}
              />
            </Paper>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: "#F6FAF9" }}>
            <Typography variant="h6" color="#13715B" gutterBottom>
              <strong>Disparity Metrics</strong>
            </Typography>
            <Typography>Selection Rate Difference: {metrics.disparity_metrics?.selection_rate_diff}</Typography>
            <Typography>True Positive Rate Difference: {metrics.disparity_metrics?.tpr_diff}</Typography>
            <Typography>True Negative Rate Difference: {metrics.disparity_metrics?.tnr_diff}</Typography>
            <Typography>Equalized Odds Difference: {metrics.disparity_metrics?.equalized_odds_diff}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: "#F6FAF9" }}>
            <Typography variant="h6" color="#13715B" gutterBottom>
              <strong>Classification Report</strong>
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Class</TableCell>
                    <TableCell>Precision</TableCell>
                    <TableCell>Recall</TableCell>
                    <TableCell>F1 Score</TableCell>
                    <TableCell>Support</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.classification_report && Object.entries(metrics.classification_report).map(([label, values]: any) => (
                    <TableRow key={label}>
                      <TableCell>{label}</TableCell>
                      <TableCell>{values.precision}</TableCell>
                      <TableCell>{values.recall}</TableCell>
                      <TableCell>{values.f1_score}</TableCell>
                      <TableCell>{values.support}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
