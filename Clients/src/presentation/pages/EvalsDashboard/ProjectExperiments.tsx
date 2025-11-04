import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Play, Eye, Trash2, TrendingUp } from "lucide-react";
import { deepEvalService } from "../../../infrastructure/api/deepEvalService";
import PerformanceChart from "./components/PerformanceChart";
import StandardModal from "../../components/Modals/StandardModal";
import Alert from "../../components/Alert";

interface ProjectExperimentsProps {
  projectId: string;
}

export default function ProjectExperiments({ projectId }: ProjectExperimentsProps) {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [alert, setAlert] = useState<any>(null);

  useEffect(() => {
    loadExperiments();
  }, [projectId]);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const data = await deepEvalService.getAllEvaluations();
      // TODO: Filter by projectId on backend
      setExperiments(data.evaluations);
    } catch (err: any) {
      console.error("Failed to load experiments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunExperiment = async () => {
    // TODO: Open configuration and run
    setRunModalOpen(false);
  };

  const handleViewExperiment = (evalId: string) => {
    // TODO: Navigate to detailed view
    console.log("View experiment:", evalId);
  };

  const handleDeleteExperiment = async (evalId: string) => {
    if (!window.confirm("Delete this experiment?")) return;

    try {
      await deepEvalService.deleteEvaluation(evalId);
      setAlert({ variant: "success", body: "Experiment deleted" });
      setTimeout(() => setAlert(null), 3000);
      loadExperiments();
    } catch (err: any) {
      setAlert({ variant: "error", body: "Failed to delete" });
      setTimeout(() => setAlert(null), 5000);
    }
  };

  return (
    <Box>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      {/* Header with Run button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Experiments</Typography>
        <Button
          variant="contained"
          startIcon={<Play size={20} />}
          onClick={() => setRunModalOpen(true)}
          sx={{
            textTransform: "none",
            backgroundColor: "#13715B",
            "&:hover": { backgroundColor: "#0f5a47" },
          }}
        >
          New Experiment
        </Button>
      </Box>

      {/* Performance Chart */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <TrendingUp size={20} color="#13715B" />
            <Typography variant="h6">Performance Tracking</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Track metric scores across experiment runs
          </Typography>

          <PerformanceChart projectId={projectId} />
        </CardContent>
      </Card>

      {/* Experiments Table (Braintrust-style) */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Experiments
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Run ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Answer Relevancy</TableCell>
                  <TableCell align="right">Bias</TableCell>
                  <TableCell align="right">Toxicity</TableCell>
                  <TableCell align="right">Samples</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {experiments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Box py={4}>
                        <Typography variant="body2" color="text.secondary">
                          No experiments yet. Click "New Experiment" to get started.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  experiments.map((exp) => (
                    <TableRow
                      key={exp.evalId}
                      sx={{
                        "&:hover": { bgcolor: "action.hover", cursor: "pointer" },
                      }}
                      onClick={() => handleViewExperiment(exp.evalId)}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {exp.evalId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={exp.status}
                          size="small"
                          color={
                            exp.status === "completed"
                              ? "success"
                              : exp.status === "failed"
                              ? "error"
                              : exp.status === "running"
                              ? "warning"
                              : "default"
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        {exp.metrics?.answerRelevancy?.toFixed(2) || "-"}
                      </TableCell>
                      <TableCell align="right">
                        {exp.metrics?.bias?.toFixed(2) || "-"}
                      </TableCell>
                      <TableCell align="right">
                        {exp.metrics?.toxicity?.toFixed(2) || "-"}
                      </TableCell>
                      <TableCell align="right">{exp.totalSamples || 0}</TableCell>
                      <TableCell>
                        {new Date(exp.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewExperiment(exp.evalId);
                            }}
                          >
                            <Eye size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExperiment(exp.evalId);
                            }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Run Experiment Modal (simplified for now) */}
      <StandardModal
        isOpen={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        title="Run New Experiment"
        description="Run a new evaluation experiment"
      >
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This will run an evaluation using the project's configured settings.
          </Typography>
          <Button
            variant="contained"
            onClick={handleRunExperiment}
            sx={{
              textTransform: "none",
              backgroundColor: "#13715B",
              "&:hover": { backgroundColor: "#0f5a47" },
            }}
          >
            Run Experiment
          </Button>
        </Box>
      </StandardModal>
    </Box>
  );
}

