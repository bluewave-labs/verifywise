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
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { BarChart } from "@mui/x-charts";
import { fairnessService } from "../../../infrastructure/api/fairnessService";
import singleTheme from "../../themes/v1SingleTheme";


const metricDescriptions = {
  accuracy: "Overall correctness of the model's predictions",
  selection_rate: "Proportion of individuals selected by the model",
  tpr: "True Positive Rate - proportion of positives correctly identified",
  tnr: "True Negative Rate - proportion of negatives correctly identified",
  demographic_parity_difference: "Measures how equally outcomes are distributed across groups. Lower is fairer.",
  equal_opportunity_difference: "Measures gaps in true positive rate (TPR) between groups. Lower means more equal opportunity",
  equalized_odds_difference: "Difference in true positive and false positive rates between groups. Lower means less bias.",
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
        console.log("Fetched metrics:", data);
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
        <Typography sx={{...singleTheme.textStyles.pageTitle, variant:"h5", fontWeight:600, fontSize:20, mb:2}}>
          Fairness Report Metrics
        </Typography>
      </Box>

        
          <Paper elevation={3} sx={{ p: 3, backgroundColor: "#F6FAF9" }}>
          <Box display="flex" alignItems="center" mb={1}>
            <Typography sx={{ ...singleTheme.textStyles.pageTitle, variant: "h6", color: "#13715B", mb:0.35}}>
              <strong>Overall Fairness Metrics</strong>
            </Typography>
            <Tooltip title={<div>
                <div>These metrics evaluate your model’s performance and fairness across all data.</div>
                <div>Accuracy: {metricDescriptions.accuracy}.</div>
                <div>Demographic Parity Difference: {metricDescriptions.demographic_parity_difference}</div>
                <div>Equal Opportunity Difference: {metricDescriptions.equal_opportunity_difference}</div>
                <div>Equalized Odds Difference: {metricDescriptions.equalized_odds_difference}</div>
                </div>}>
                <IconButton size="small" sx={{ ml: 1 }}>
                <InfoOutlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            </Box>
            <Typography sx={ singleTheme.textStyles.pageDescription}>
                Accuracy: {metrics.overall.accuracy.toFixed(4)}
                </Typography>
            <Typography sx={ singleTheme.textStyles.pageDescription}>
                Demographic Parity Difference: {metrics.demographic_parity_difference.toFixed(4)}
                </Typography>
            <Typography sx={ singleTheme.textStyles.pageDescription}>
                Equal Opportunity Difference: {metrics.equal_opportunity_difference.toFixed(4)}
                </Typography>
            <Typography sx={ singleTheme.textStyles.pageDescription}>
                Equalized Odds Difference: {metrics.equalized_odds_difference.toFixed(4)}
                </Typography>
          </Paper>
          

          <Paper elevation={3} sx={{ p: 3, backgroundColor: "#F6FAF9" }}>
            <Box display="flex" alignItems="center" mb={1}>
            <Typography sx={{ ...singleTheme.textStyles.pageTitle, variant: "h6", color: "#13715B", mb:0.35}}>
              <strong>Disparity Metrics</strong>
            </Typography>
            <Tooltip title={<div>
                <div>Shows the difference between groups for each metric — the smaller the gap, the fairer the model.</div>
                </div>}>
                <IconButton size="small" sx={{ ml: 1 }}>
                <InfoOutlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            </Box>
            <Typography sx={ singleTheme.textStyles.pageDescription}>
                Selection Rate Difference: {metrics.overall.selection_rate.toFixed(4)}
                </Typography>
            <Typography sx={ singleTheme.textStyles.pageDescription}>
                True Positive Rate Difference: {metrics.overall.TPR.toFixed(4)}
                </Typography>
            <Typography sx={ singleTheme.textStyles.pageDescription}>
                True Negative Rate Difference: {metrics.overall.TNR.toFixed(4)}
                </Typography>
          </Paper>
        

        {["accuracy", "selection_rate", "tpr", "tnr"].map((metricKey) => (
          <Grid item xs={12} key={metricKey}>
            <Paper elevation={3} sx={{ p: 3, backgroundColor: "#F6FAF9" }}>
                <Box display="flex" alignItems="center" mb={1}>
              <Typography sx={{ ...singleTheme.textStyles.pageTitle, variant: "h6", color: "#13715B", mb:0.35}}>
                <strong>{['tpr', 'tnr'].includes(metricKey) ? `Group-wise ${metricKey.toUpperCase()}` : `Group-wise ${metricKey.charAt(0).toUpperCase() + metricKey.slice(1).replace('_', ' ')}`}</strong>
              </Typography>
              <Tooltip title={<div>
                <div>{metricDescriptions[metricKey]} per group.</div>
                </div>}>
                <IconButton size="small" sx={{ ml: 1 }}>
                <InfoOutlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            </Box>
              <BarChart
                xAxis={[{ scaleType: "band", data: Object.keys(metrics.by_group?.[metricKey === "tpr" ? "TPR" : metricKey === "tnr" ? "TNR" : metricKey] || {}) }]}
                series={[{
                    data: Object.values(metrics.by_group?.[metricKey === "tpr" ? "TPR" : metricKey === "tnr" ? "TNR" : metricKey] || {}),
                    label: metricKey.replace("_", " "),
                    color: "gray"
                }]}
                width={600}
                height={300}
                />
            </Paper>
          </Grid>
        ))}
        
      
    </Box>
  );
}

