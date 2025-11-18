import { useState, useEffect, useRef } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { Play, TrendingUp } from "lucide-react";
import { experimentsService, evaluationLogsService, type Experiment, type EvaluationLog } from "../../../infrastructure/api/evaluationLogsService";
import Alert from "../../components/Alert";
import NewExperimentModal from "./NewExperimentModal";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { useNavigate } from "react-router-dom";
import EvaluationTable from "../../components/Table/EvaluationTable";
import PerformanceChart from "./components/PerformanceChart";
import type { IEvaluationRow } from "../../../domain/interfaces/i.table";

interface ProjectExperimentsProps {
  projectId: string;
}

interface ExperimentWithMetrics extends Experiment {
  avgMetrics?: Record<string, number>;
  sampleCount?: number;
}

interface AlertState {
  variant: "success" | "error";
  body: string;
}

export default function ProjectExperiments({ projectId }: ProjectExperimentsProps) {
  const navigate = useNavigate();
  const [experiments, setExperiments] = useState<ExperimentWithMetrics[]>([]);
  const [, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [newEvalModalOpen, setNewEvalModalOpen] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadExperiments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Auto-poll when there are running experiments
  useEffect(() => {
    const hasRunningExperiments = experiments.some(
      (exp) => exp.status === "running" || exp.status === "pending"
    );

    // Clear existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Start polling if there are running experiments
    if (hasRunningExperiments) {
      pollIntervalRef.current = setInterval(() => {
        loadExperiments();
      }, 10000); // Poll every 10 seconds
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experiments]);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const data = await experimentsService.getAllExperiments({
        project_id: projectId
      });

      // Load metrics for each experiment (skip for running/pending experiments)
      const experimentsWithMetrics = await Promise.all(
        (data.experiments || []).map(async (exp: Experiment) => {
          // Skip log fetching for running/pending experiments to avoid timeout
          if (exp.status === "running" || exp.status === "pending") {
            return {
              ...exp,
              avgMetrics: {},
              sampleCount: 0,
            };
          }

          try {
            // Get logs for this experiment to calculate metrics
            const logsData = await evaluationLogsService.getLogs({
              experiment_id: exp.id,
              limit: 1000
            });

            const logs = logsData.logs || [];

            // Calculate average metrics from logs
            const metricsSum: Record<string, { sum: number; count: number }> = {};
            logs.forEach((log: EvaluationLog) => {
              if (log.metadata?.metric_scores) {
                Object.entries(log.metadata.metric_scores).forEach(([key, value]) => {
                  if (typeof value === "number" || (typeof value === "object" && value !== null && "score" in value)) {
                    const scoreValue = typeof value === "number" ? value : (value as { score: number }).score;
                    if (typeof scoreValue === "number") {
                      if (!metricsSum[key]) {
                        metricsSum[key] = { sum: 0, count: 0 };
                      }
                      metricsSum[key].sum += scoreValue;
                      metricsSum[key].count += 1;
                    }
                  }
                });
              }
            });

            const avgMetrics: Record<string, number> = {};
            Object.entries(metricsSum).forEach(([key, { sum, count }]) => {
              avgMetrics[key] = count > 0 ? sum / count : 0;
            });

            return {
              ...exp,
              avgMetrics,
              sampleCount: logs.length,
            };
          } catch {
            return {
              ...exp,
              avgMetrics: {},
              sampleCount: 0,
            };
          }
        })
      );

      setExperiments(experimentsWithMetrics);
    } catch (err) {
      console.error("Failed to load experiments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewExperiment = (row: IEvaluationRow) => {
    navigate(`/evals/${projectId}/experiment/${row.id}`);
  };

  const handleDeleteExperiment = async (experimentId: string) => {
    // Confirmation is handled by ConfirmableDeleteIconButton
    try {
      await experimentsService.deleteExperiment(experimentId);
      setAlert({ variant: "success", body: "Eval deleted" });
      setTimeout(() => setAlert(null), 3000);
      loadExperiments();
    } catch {
      setAlert({ variant: "error", body: "Failed to delete" });
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const handleStarted = (exp: { id: string; config: Record<string, unknown>; status: string; created_at?: string }) => {
    const cfg = exp.config as { model?: { name?: string }; judgeLlm?: { model?: string; provider?: string } };
    const cfgForState: Record<string, unknown> = {
      model: { name: cfg.model?.name },
      judgeLlm: { model: cfg.judgeLlm?.model, provider: cfg.judgeLlm?.provider },
    };
    setExperiments((prev) => [
      ({
        id: exp.id,
        project_id: projectId,
        name: cfg.model?.name || exp.id,
        description: `Pending eval for ${cfg.model?.name || "model"}`,
        config: cfgForState,
        baseline_experiment_id: undefined,
        status: "running",
        results: undefined,
        error_message: undefined,
        started_at: exp.created_at,
        completed_at: undefined,
        created_at: exp.created_at || new Date().toISOString(),
        updated_at: exp.created_at || new Date().toISOString(),
        tenant: "",
        created_by: undefined,
        avgMetrics: {},
        sampleCount: 0,
      } as unknown as ExperimentWithMetrics),
      ...prev,
    ]);
  };

  // Transform to table format (exact match to Bias & Fairness structure)
  const tableColumns = ["EXPERIMENT ID", "MODEL", "JUDGE", "DATASET", "STATUS", "REPORT", "ACTION"];
  
  const tableRows: IEvaluationRow[] = experiments.map((exp) => ({
    id: exp.id,
    model: exp.config?.model?.name || exp.name || "Unknown",
    judge: exp.config?.judgeLlm?.model || exp.config?.judgeLlm?.provider || "-",
    dataset: `${exp.sampleCount || 0} samples`,
    status: 
      exp.status === "completed" ? "Completed" :
      exp.status === "failed" ? "Failed" :
      exp.status === "running" ? "Running" :
      "Pending",
  }));

  return (
    <Box sx={{ userSelect: "none" }}>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={4} gap={2}>
        <CustomizableButton
          variant="contained"
          text="New experiment"
          icon={<Play size={16} />}
          sx={{
            backgroundColor: "#13715B",
            border: "1px solid #13715B",
            gap: 2,
          }}
          onClick={() => setNewEvalModalOpen(true)}
        />
      </Box>

      {/* Performance Chart */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <TrendingUp size={20} color="#13715B" />
            <Typography variant="h6">Performance tracking</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Track metric scores across eval runs
          </Typography>

          <PerformanceChart projectId={projectId} />
        </CardContent>
      </Card>

      {/* Experiments Table with Pagination */}
      <Box mb={4}>
        <EvaluationTable
          columns={tableColumns}
          rows={tableRows}
          removeModel={{
            onConfirm: handleDeleteExperiment,
          }}
          page={currentPage}
          setCurrentPagingation={setCurrentPage}
          onShowDetails={handleViewExperiment}
        />
      </Box>

      {/* New Experiment Modal */}
      <NewExperimentModal
        isOpen={newEvalModalOpen}
        onClose={() => setNewEvalModalOpen(false)}
        projectId={projectId}
        onSuccess={() => {
          setNewEvalModalOpen(false);
          loadExperiments();
        }}
        onStarted={handleStarted}
      />
    </Box>
  );
}
