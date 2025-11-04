import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Play, Beaker } from "lucide-react";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import NewExperimentModal from "./NewExperimentModal";
import type { DeepEvalProject } from "./types";

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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ totalExperiments: number; lastRunDate: string | null; avgMetrics: Record<string, number> } | null>(null);
  const [newExperimentModalOpen, setNewExperimentModalOpen] = useState(false);

  const loadOverviewData = useCallback(async () => {
    try {
      setLoading(true);

      // Load project if not provided
      if (!project) {
        const projectData = await deepEvalProjectsService.getProject(projectId);
        onProjectUpdate(projectData.project);
      }

      // Load project stats
      const statsData = await deepEvalProjectsService.getProjectStats(projectId);
      setStats(statsData.stats);
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

  const hasExperiments = (stats?.totalExperiments ?? 0) > 0;

  return (
    <Box>
      {/* Header with New Eval button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: 600 }}>
            Project overview
          </Typography>
        </Box>
        <CustomizableButton
          onClick={handleNewExperiment}
          variant="contained"
          text="New Eval"
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
            Trace your AI app interactions
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
              Trace user interactions for monitoring, real-time scoring, and review. Annotate logs data and use it as the source for evaluations.
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
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, fontSize: "15px" }}>
            Evaluation
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: "13px" }}>
            Experiment score progress
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
                Run your first experiment to start evaluating your LLM. Configure your model, dataset, and metrics to get started.
              </Typography>
              <CustomizableButton
                onClick={handleNewExperiment}
                variant="contained"
                text="Run first experiment"
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
            /* Show experiments summary when data exists */
            <Box>
              <Typography variant="h5" sx={{ mb: 3 }}>
                {stats?.totalExperiments ?? 0} Experiments
              </Typography>
              {/* TODO: Add performance chart and experiment list here when data exists */}
              <Typography variant="body2" color="text.secondary">
                Experiment data will appear here
              </Typography>
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
      />
    </Box>
  );
}
