import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Play, Beaker, TrendingUp } from "lucide-react";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import { experimentsService, type Experiment } from "../../../infrastructure/api/evaluationLogsService";
import NewExperimentModal from "./NewExperimentModal";
import type { DeepEvalProject } from "./types";
import { useNavigate } from "react-router-dom";

interface ProjectOverviewProps {
  projectId: string;
  project: DeepEvalProject | null;
  onProjectUpdate: (project: DeepEvalProject) => void;
}

export default function ProjectOverview({
  projectId,
  project,
  onProjectUpdate,
}: ProjectOverviewProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<{ totalExperiments: number; lastRunDate: string | null; avgMetrics: Record<string, number> } | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [newExperimentModalOpen, setNewExperimentModalOpen] = useState(false);

  const loadOverviewData = useCallback(async (background: boolean = false) => {
    try {
      if (background) setRefreshing(true);
      else setLoading(true);

      // Load project if not provided
      if (!project) {
        const projectData = await deepEvalProjectsService.getProject(projectId);
        onProjectUpdate(projectData.project);
      }

      // Load project stats and experiments
      const [statsData, experimentsData] = await Promise.all([
        deepEvalProjectsService.getProjectStats(projectId),
        experimentsService.getExperiments({ project_id: projectId, limit: 10 }),
      ]);
      
      setStats(statsData.stats);
      setExperiments(experimentsData.experiments || []);
    } catch (err) {
      console.error("Failed to load overview data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, project, onProjectUpdate]);

  useEffect(() => {
    // Initial load (shows page spinner)
    loadOverviewData(false);
    // Background refresh every 10s without blocking UI
    const interval = setInterval(() => loadOverviewData(true), 10000);
    return () => clearInterval(interval);
  }, [loadOverviewData]);

  const handleNewExperiment = () => {
    setNewExperimentModalOpen(true);
  };

  const handleExperimentSuccess = () => {
    // Refresh in background so UI stays responsive
    loadOverviewData(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  const hasExperiments = experiments.length > 0 || (stats?.totalExperiments ?? 0) > 0;
  const totalEvals = experiments.length > 0 ? experiments.length : (stats?.totalExperiments ?? 0);

  return (
    <Box sx={{ userSelect: "none" }}>
      {/* Header with New Experiment button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: 600 }}>
            Project overview
          </Typography>
        </Box>
        <CustomizableButton
          onClick={handleNewExperiment}
          variant="contained"
          text="New eval"
          icon={<Play size={16} />}
          sx={{
            backgroundColor: "#13715B",
            border: "1px solid #13715B",
            gap: 2,
            "&:hover": {
              backgroundColor: "#0f5a47",
            },
          }}
        />
        {refreshing && (
          <Box sx={{ ml: 2, display: "flex", alignItems: "center" }}>
            <CircularProgress size={18} sx={{ color: "#13715B" }} />
          </Box>
        )}
      </Box>

      {/* Two-column layout like Braintrust */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
        {/* Left: Observability / Tracing */}
        <Box
          sx={{
            border: "1px solid #E5E7EB",
            borderRadius: 2,
            p: 3,
            backgroundColor: "#FFFFFF",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, fontSize: "15px" }}>
            Observability
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontSize: "13px" }}>
            Monitor your LLM interactions
          </Typography>

          {/* Empty state */}
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              px: 2,
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Beaker size={48} color="#9CA3AF" strokeWidth={1.5} />
            </Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, mb: 1, fontSize: "14px" }}
            >
              Get started with observability
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, fontSize: "13px", maxWidth: 400, mx: "auto", lineHeight: 1.6 }}
            >
              Capture user interactions for monitoring, real-time scoring and review; annotate logs and use them as the source for evaluations.
            </Typography>
            <CustomizableButton
              variant="outlined"
              sx={{
                textTransform: "none",
                fontSize: "13px",
                borderColor: "#D0D5DD",
                color: "#344054",
                "&:hover": {
                  backgroundColor: "#F9FAFB",
                  borderColor: "#D0D5DD",
                },
              }}
            >
              Setup tracing
            </CustomizableButton>
          </Box>
        </Box>

        {/* Right: Evaluation / Experiments */}
        <Box
          sx={{
            border: "1px solid #E5E7EB",
            borderRadius: 2,
            p: 3,
            backgroundColor: "#FFFFFF",
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "15px" }}>
              Evaluation
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {hasExperiments && (
                <CustomizableButton
                  variant="contained"
                  text="Experiments"
                  onClick={() => navigate(`/evals/${projectId}#experiments`)}
                  sx={{
                    textTransform: "none",
                    fontSize: "12px",
                    height: 30,
                    px: 1.5,
                    backgroundColor: "#13715B",
                    border: "1px solid #13715B",
                    "&:hover": { backgroundColor: "#0f5a47" },
                  }}
                />
              )}
              <CustomizableButton
                variant="outlined"
                text="Configuration"
                onClick={() => navigate(`/evals/${projectId}/configuration`)}
                sx={{
                  textTransform: "none",
                  fontSize: "12px",
                  height: 30,
                  px: 1.5,
                }}
              />
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: "13px" }}>
            Eval score progress
          </Typography>

          {!hasExperiments ? (
            /* Empty state */
            <Box sx={{ textAlign: "center", py: 6, px: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Play size={48} color="#9CA3AF" strokeWidth={1.5} />
              </Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 1, fontSize: "14px" }}
              >
                No experiments yet
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, fontSize: "13px", maxWidth: 400, mx: "auto", lineHeight: 1.6 }}
              >
                Run your first eval to start evaluating your LLM. Configure your model, dataset, and metrics to get started.
              </Typography>
              <CustomizableButton
                onClick={handleNewExperiment}
                variant="contained"
                text="Run first eval"
                icon={<Play size={16} />}
                sx={{
                  backgroundColor: "#13715B",
                  border: "1px solid #13715B",
                  gap: 2,
                  "&:hover": {
                    backgroundColor: "#0f5a47",
                  },
                }}
              />
            </Box>
          ) : (
            /* Experiments list (Braintrust style) */
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <TrendingUp size={16} color="#13715B" />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "12px" }}>
                  {totalEvals} experiment{totalEvals !== 1 ? "s" : ""}
                </Typography>
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: "11px", color: "#374151" }}>Eval id</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "11px", color: "#374151" }}>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...experiments]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 5)
                      .map((exp) => (
                      <TableRow
                        key={exp.id}
                        hover
                        onClick={() => navigate(`/evals/${projectId}/experiment/${exp.id}`)}
                        sx={{
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: "#F9FAFB",
                          },
                        }}
                      >
                        <TableCell sx={{ fontSize: "12px", fontFamily: "monospace" }}>{exp.id}</TableCell>
                        <TableCell sx={{ fontSize: "11px", color: "#6B7280" }}>
                          {new Date(exp.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric"
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </Box>

      {/* New Experiment Modal */}
      <NewExperimentModal
        isOpen={newExperimentModalOpen}
        onClose={() => setNewExperimentModalOpen(false)}
        projectId={projectId}
        onSuccess={handleExperimentSuccess}
        onStarted={(exp) => {
          // Optimistically show running eval
          setExperiments((prev) => [
            {
              id: exp.id,
              status: exp.status,
              created_at: exp.created_at || new Date().toISOString(),
              config: exp.config,
            } as Experiment,
            ...prev,
          ]);
        }}
      />
    </Box>
  );
}
