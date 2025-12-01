import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";
import { Play, Beaker, ChevronRight } from "lucide-react";
import CustomizableButton from "../../components/Button/CustomizableButton";
import VWLink from "../../components/Link/VWLink";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import { experimentsService, type Experiment } from "../../../infrastructure/api/evaluationLogsService";
import NewExperimentModal from "./NewExperimentModal";
import type { DeepEvalProject } from "./types";
import { useNavigate } from "react-router-dom";

interface ProjectOverviewProps {
  projectId: string;
  project: DeepEvalProject | null;
  onProjectUpdate: (project: DeepEvalProject) => void;
  onViewExperiment?: (experimentId: string) => void;
}

export default function ProjectOverview({
  projectId,
  project,
  onProjectUpdate,
  onViewExperiment,
}: ProjectOverviewProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ totalExperiments: number; lastRunDate: string | null; avgMetrics: Record<string, number> } | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [newExperimentModalOpen, setNewExperimentModalOpen] = useState(false);

  const loadOverviewData = useCallback(async () => {
    try {
      setLoading(true);

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
    }
  }, [projectId, project, onProjectUpdate]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  const handleNewExperiment = () => {
    setNewExperimentModalOpen(true);
  };

  const handleExperimentSuccess = () => {
    // Reload stats after experiment is created
    loadOverviewData();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  const hasExperiments = experiments.length > 0 || (stats?.totalExperiments ?? 0) > 0;

  return (
    <Box>
      {/* Header with New Experiment button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: 600 }}>
            Project overview
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "13px", color: "#6B7280", mt: 0.5 }}>
            Track your LLM evaluation experiments and monitor performance metrics
          </Typography>
        </Box>
        <CustomizableButton
          onClick={handleNewExperiment}
          variant="contained"
          text="New experiment"
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

      {/* Two-column layout */}
      <Box sx={{ display: "flex", gap: 3 }}>
        {/* Column 1: Recent experiments */}
        <Box
          sx={{
            flex: 1,
            borderRadius: 2,
            p: 4,
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "15px" }}>
              Recent experiments
            </Typography>
            {hasExperiments && (
              <VWLink
                onClick={() => navigate(`/evals/${projectId}#experiments`)}
                showIcon={false}
                sx={{ fontSize: "12px" }}
              >
                View all experiments
              </VWLink>
            )}
          </Box>

          {/* Recent experiments list - always show this layout */}
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            border: "1px solid #d0d5dd",
            borderRadius: "4px",
            overflow: "hidden",
          }}>
            {!hasExperiments ? (
              /* Empty state inside the consistent layout */
              <Box sx={{ textAlign: "center", py: 4, px: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Beaker size={32} color="#9CA3AF" strokeWidth={1} />
                </Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 1, fontSize: "13px" }}
                >
                  No experiments yet
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, fontSize: "12px", maxWidth: 320, mx: "auto", lineHeight: 1.5 }}
                >
                  Run your first experiment to start evaluating your LLM.
                </Typography>
                <CustomizableButton
                  onClick={handleNewExperiment}
                  variant="contained"
                  text="Run first experiment"
                  icon={<Play size={14} />}
                  sx={{
                    backgroundColor: "#13715B",
                    border: "1px solid #13715B",
                    gap: 1,
                    fontSize: "12px",
                    height: "32px",
                    "&:hover": {
                      backgroundColor: "#0f5a47",
                    },
                  }}
                />
              </Box>
            ) : (
              [...experiments]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((exp, index, arr) => {
                  const cfg = exp.config as { model?: { name?: string }; judgeLlm?: { model?: string; provider?: string } } | undefined;
                  const modelName = cfg?.model?.name || "-";
                  const statusLabel = exp.status === "completed" ? "Completed" :
                    exp.status === "failed" ? "Failed" :
                    exp.status === "running" ? "Running" : "Pending";
                  const statusColor = exp.status === "completed" ? "#065F46" :
                    exp.status === "failed" ? "#991B1B" :
                    exp.status === "running" ? "#1E40AF" : "#6B7280";
                  const statusBg = exp.status === "completed" ? "#D1FAE5" :
                    exp.status === "failed" ? "#FEE2E2" :
                    exp.status === "running" ? "#DBEAFE" : "#F3F4F6";

                  const createdDate = new Date(exp.created_at);
                  const formattedDate = createdDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <Box
                      key={exp.id}
                      onClick={() => {
                                        if (onViewExperiment) {
                                          onViewExperiment(exp.id);
                                        } else {
                                          navigate(`/evals/${projectId}/experiment/${exp.id}`);
                                        }
                                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 2,
                        px: 2,
                        cursor: "pointer",
                        borderBottom: index < arr.length - 1 ? "1px solid #d0d5dd" : "none",
                        "&:hover": {
                          backgroundColor: "#F9FAFB",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            sx={{
                              fontSize: "13px",
                              fontWeight: 500,
                              color: "#111827",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {exp.name || exp.id}
                          </Typography>
                          <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                            {modelName} · {formattedDate}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Chip
                          label={statusLabel}
                          size="small"
                          sx={{
                            backgroundColor: statusBg,
                            color: statusColor,
                            fontWeight: 500,
                            fontSize: "11px",
                            height: "22px",
                            borderRadius: "4px",
                          }}
                        />
                        <ChevronRight size={16} color="#9CA3AF" />
                      </Box>
                    </Box>
                  );
                })
            )}
          </Box>
        </Box>

        {/* Column 2: Placeholder for future content */}
        <Box
          sx={{
            flex: 1,
            borderRadius: 2,
            p: 4,
            backgroundColor: "#FFFFFF",
            border: "1px dashed #d0d5dd",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 200,
          }}
        >
          <Typography sx={{ color: "#9CA3AF", fontSize: "14px" }}>
            Coming soon
          </Typography>
        </Box>
      </Box>

      {/* New Experiment Modal */}
      <NewExperimentModal
        isOpen={newExperimentModalOpen}
        onClose={() => setNewExperimentModalOpen(false)}
        projectId={projectId}
        onSuccess={handleExperimentSuccess}
      />
    </Box>
  );
}
