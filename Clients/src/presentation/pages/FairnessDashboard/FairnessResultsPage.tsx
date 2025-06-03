import React from "react";
import { useParams, useNavigate } from "react-router-dom";
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
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { BarChart } from "@mui/x-charts";

const dummyMetrics = {
  model_name: "StockPickerBot",
  created_at: "2025-04-19",
  accuracy: 0.721,
  demographic_parity_difference: 0.046,
  equal_opportunity_difference: 0.035,
  equalized_odds_difference: 0.065,
  classification_report: {
    "<=50K": { precision: 0.68, recall: 0.67, f1_score: 0.68, support: 24760 },
    ">50K": { precision: 0.71, recall: 0.72, f1_score: 0.71, support: 37141 },
  },
  group_metrics: [
    { group: "White", accuracy: 0.73, selection_rate: 0.78, tpr: 0.67, tnr: 0.89 },
    { group: "Black", accuracy: 0.70, selection_rate: 0.68, tpr: 0.64, tnr: 0.86 },
    { group: "Asian", accuracy: 0.75, selection_rate: 0.72, tpr: 0.70, tnr: 0.87 },
  ],
  disparity_metrics: {
    selection_rate_diff: 0.12,
    tpr_diff: 0.06,
    tnr_diff: 0.03,
    equalized_odds_diff: 0.065,
  },
};

const dummyMetrics2 = {
    model_name: "InsuranceTracker",
    created_at: "2025-04-19",
    accuracy: 0.721,
    demographic_parity_difference: 0.046,
    equal_opportunity_difference: 0.035,
    equalized_odds_difference: 0.065,
    classification_report: {
      "<=50K": { precision: 0.68, recall: 0.67, f1_score: 0.68, support: 24760 },
      ">50K": { precision: 0.71, recall: 0.72, f1_score: 0.71, support: 37141 },
    },
    group_metrics: [
      { group: "White", accuracy: 0.73, selection_rate: 0.78, tpr: 0.67, tnr: 0.89 },
      { group: "Black", accuracy: 0.70, selection_rate: 0.68, tpr: 0.64, tnr: 0.86 },
      { group: "Asian", accuracy: 0.75, selection_rate: 0.72, tpr: 0.70, tnr: 0.87 },
    ],
    disparity_metrics: {
      selection_rate_diff: 0.12,
      tpr_diff: 0.06,
      tnr_diff: 0.03,
      equalized_odds_diff: 0.065,
    },
  };

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
  const { modelName } = useParams();
  console.log("Name of the site: " + modelName);
  const modelData = {
    "StockPickerBot": dummyMetrics,
    "InsuranceTracker": dummyMetrics2, 
  };
  const navigate = useNavigate();
  if (!modelName) {
    throw new Error("Model name is missing from the URL.");
  }
  function getModelData(model_name: string) {
    if (model_name in modelData) {
      return modelData[model_name as keyof typeof modelData];
    }
    return dummyMetrics;
  }
  const metrics = getModelData(modelName);
  
  
  

  return (
    <Box p={4}>
      <Box mb={2} display="flex" alignItems="center">
        <IconButton onClick={() => navigate("/fairness-dashboard")}
          sx={{ mr: 2 }}>
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
                <strong>Overall Fairness Metrics</strong></Typography>
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
                xAxis={[{ scaleType: "band", data: metrics.group_metrics.map(g => g.group) }]}
                series={[{
                  data: metrics.group_metrics.map(g => g[metricKey]),
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
                <strong>Disparity Metrics</strong></Typography>
            <Typography>Selection Rate Difference: {metrics.disparity_metrics.selection_rate_diff}</Typography>
            <Typography>True Positive Rate Difference: {metrics.disparity_metrics.tpr_diff}</Typography>
            <Typography>True Negative Rate Difference: {metrics.disparity_metrics.tnr_diff}</Typography>
            <Typography>Equalized Odds Difference: {metrics.disparity_metrics.equalized_odds_diff}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: "#F6FAF9" }}>
            <Typography variant="h6" color="#13715B" gutterBottom>
                <strong>Classification Report</strong></Typography>
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
                  {Object.entries(metrics.classification_report).map(([label, values]) => (
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
