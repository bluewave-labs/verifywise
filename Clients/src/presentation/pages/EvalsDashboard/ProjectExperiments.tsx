import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Box, Card, CardContent, Typography, Stack } from "@mui/material";
import { Play } from "lucide-react";
import { experimentsService, evaluationLogsService, type Experiment, type EvaluationLog } from "../../../infrastructure/api/evaluationLogsService";
import Alert from "../../components/Alert";
import NewExperimentModal from "./NewExperimentModal";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { useNavigate } from "react-router-dom";
import EvaluationTable from "../../components/Table/EvaluationTable";
import PerformanceChart from "./components/PerformanceChart";
import type { IEvaluationRow } from "../../../domain/interfaces/i.table";
import SearchBox from "../../components/Search/SearchBox";
import { FilterBy, type FilterColumn } from "../../components/Table/FilterBy";
import { GroupBy } from "../../components/Table/GroupBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";
import HelperIcon from "../../components/HelperIcon";

interface ProjectExperimentsProps {
  projectId: string;
  onViewExperiment?: (experimentId: string) => void;
}

interface ExperimentWithMetrics extends Experiment {
  avgMetrics?: Record<string, number>;
  sampleCount?: number;
}

interface AlertState {
  variant: "success" | "error";
  body: string;
}

export default function ProjectExperiments({ projectId, onViewExperiment }: ProjectExperimentsProps) {
  const navigate = useNavigate();
  const [experiments, setExperiments] = useState<ExperimentWithMetrics[]>([]);
  const [, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [newEvalModalOpen, setNewEvalModalOpen] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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
          // Get prompt count from config (available immediately)
          const configPromptCount = exp.config?.dataset?.count || 
                                    exp.config?.dataset?.prompts?.length || 
                                    exp.results?.total_prompts || 
                                    0;
          
          // Skip log fetching for running/pending experiments to avoid timeout
          if (exp.status === "running" || exp.status === "pending") {
            return {
              ...exp,
              avgMetrics: {},
              sampleCount: configPromptCount,
            };
          }

          try {
            // Get logs for this experiment to calculate metrics
            const logsData = await evaluationLogsService.getLogs({
              experiment_id: exp.id,
              limit: 1000
            });

            const logs = logsData.logs || [];

            // Map display names to camelCase keys for backwards compatibility
            const displayNameToKey: Record<string, string> = {
              "Answer Relevancy": "answerRelevancy",
              "Faithfulness": "faithfulness",
              "Contextual Relevancy": "contextualRelevancy",
              "Bias": "bias",
              "Toxicity": "toxicity",
              "Hallucination": "hallucination",
              "Knowledge Retention": "knowledgeRetention",
              "Conversation Completeness": "conversationCompleteness",
              "Conversation Relevancy": "conversationRelevancy",
              "Role Adherence": "roleAdherence",
              "Task Completion": "taskCompletion",
              "Tool Correctness": "toolCorrectness",
              "Answer Correctness": "answerCorrectness",
              "Coherence": "coherence",
              "Tonality": "tonality",
              "Safety": "safety",
            };

            // Calculate average metrics from logs
            const metricsSum: Record<string, { sum: number; count: number }> = {};
            logs.forEach((log: EvaluationLog) => {
              if (log.metadata?.metric_scores) {
                Object.entries(log.metadata.metric_scores).forEach(([rawKey, value]) => {
                  // Normalize key: convert display names to camelCase
                  const key = displayNameToKey[rawKey] || rawKey;
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
              sampleCount: configPromptCount,
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
    if (onViewExperiment) {
      onViewExperiment(row.id);
    } else {
      navigate(`/evals/${projectId}/experiment/${row.id}`);
    }
  };

  const handleRerunExperiment = async (row: IEvaluationRow) => {
    // Find the original experiment to get its config
    const originalExp = experiments.find((e) => e.id === row.id);
    if (!originalExp) {
      setAlert({ variant: "error", body: "Could not find experiment to rerun" });
      setTimeout(() => setAlert(null), 4000);
      return;
    }

    try {
      const baseConfig = originalExp.config || {};
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const nextName = `${originalExp.name || "Eval"} (rerun ${dateStr}, ${timeStr})`;

      const payload = {
        project_id: projectId,
        name: nextName,
        description: originalExp.description || "",
        config: {
          ...baseConfig,
          project_id: projectId,
        },
      };

      setAlert({ variant: "success", body: "Starting new evaluation run..." });
      
      const response = await experimentsService.createExperiment(payload);

      if (response?.experiment?.id) {
        // Add the new experiment to the list optimistically
        handleStarted({
          id: response.experiment.id,
          config: payload.config as Record<string, unknown>,
          status: "running",
          created_at: new Date().toISOString(),
        });
        
        setAlert({ variant: "success", body: `Rerun started: ${nextName}` });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (err) {
      console.error("Failed to rerun experiment:", err);
      setAlert({ variant: "error", body: "Failed to start rerun" });
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const handleDeleteExperiment = async (experimentId: string) => {
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
    const cfg = exp.config as { 
      model?: { name?: string }; 
      judgeLlm?: { model?: string; provider?: string };
      dataset?: { count?: number; prompts?: unknown[] };
    };
    const cfgForState: Record<string, unknown> = {
      model: { name: cfg.model?.name },
      judgeLlm: { model: cfg.judgeLlm?.model, provider: cfg.judgeLlm?.provider },
      dataset: cfg.dataset,
    };
    // Get prompt count from config
    const promptCount = cfg.dataset?.count || cfg.dataset?.prompts?.length || 0;
    
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
        sampleCount: promptCount,
      } as unknown as ExperimentWithMetrics),
      ...prev,
    ]);
  };

  // Filters (shared FilterBy component)
  const experimentFilterColumns: FilterColumn[] = useMemo(
    () => [
      { id: "name", label: "Experiment name", type: "text" },
      {
        id: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "completed", label: "Completed" },
          { value: "running", label: "Running" },
          { value: "pending", label: "Pending" },
          { value: "failed", label: "Failed" },
        ],
      },
      { id: "model", label: "Model", type: "text" },
      { id: "judge", label: "Judge", type: "text" },
    ],
    []
  );

  const getExperimentFieldValue = useCallback(
    (exp: ExperimentWithMetrics, fieldId: string): string | number | Date | null | undefined => {
      const cfg = exp.config as {
        model?: { name?: string };
        judgeLlm?: { model?: string; provider?: string };
        evaluationMode?: string;
        scorerName?: string;
      } | undefined;

      switch (fieldId) {
        case "name":
          return exp.name;
        case "status":
          return exp.status;
        case "model":
          return cfg?.model?.name || "";
        case "judge": {
          const evaluationMode = cfg?.evaluationMode || "standard";
          const judgeModel = cfg?.judgeLlm?.model || cfg?.judgeLlm?.provider || "";
          const scorerName = cfg?.scorerName || "";
          if (evaluationMode === "scorer") return scorerName;
          if (evaluationMode === "both") return `${judgeModel} + ${scorerName}`;
          return judgeModel;
        }
        default:
          return "";
      }
    },
    []
  );

  const { filterData, handleFilterChange } = useFilterBy<ExperimentWithMetrics>(getExperimentFieldValue);

  const filteredExperiments = useMemo(() => {
    const afterFilter = filterData(experiments);
    if (!searchTerm.trim()) return afterFilter;
    const q = searchTerm.toLowerCase();
    return afterFilter.filter((exp) => {
      const cfg = exp.config as {
        model?: { name?: string };
        judgeLlm?: { model?: string; provider?: string };
      } | undefined;

      const text = [
        exp.id,
        exp.name,
        cfg?.model?.name,
        cfg?.judgeLlm?.model,
        cfg?.judgeLlm?.provider,
        exp.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [experiments, filterData, searchTerm]);

  // Transform to table format
  const tableColumns = ["EXPERIMENT ID", "MODEL", "JUDGE", "# PROMPTS", "DATASET", "STATUS", "DATE", "ACTION"];

  const tableRows: IEvaluationRow[] = filteredExperiments.map((exp) => {
    // Get dataset name from config - try multiple sources
    let datasetName = "Dataset";
    const datasetConfig = exp.config?.dataset;
    if (datasetConfig) {
      if (datasetConfig.name) {
        datasetName = datasetConfig.name;
      } else if (datasetConfig.path) {
        // Extract friendly name from path like "chatbot/chatbot_coding_helper.json"
        const pathParts = datasetConfig.path.split("/");
        const fileName = pathParts[pathParts.length - 1]?.replace(/\.json$/i, "") || "";
        // Convert snake_case to Title Case
        datasetName = fileName
          .split("_")
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      } else if (datasetConfig.datasetId) {
        datasetName = datasetConfig.datasetId;
      } else if (datasetConfig.categories?.[0]) {
        datasetName = datasetConfig.categories[0];
      } else if (datasetConfig.useBuiltin) {
        datasetName = "Template";
      }
    }
    
    // Format the date with time
    const createdDate = exp.created_at 
      ? new Date(exp.created_at).toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric", 
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

    // Determine judge display based on evaluation mode
    const evaluationMode = exp.config?.evaluationMode || "standard";
    const judgeModel = exp.config?.judgeLlm?.model || exp.config?.judgeLlm?.provider || "";
    const scorerName = exp.config?.scorerName || "";
    
    let judgeDisplay = "-";
    if (evaluationMode === "scorer" && scorerName) {
      judgeDisplay = `${scorerName}`;
    } else if (evaluationMode === "standard" && judgeModel) {
      judgeDisplay = judgeModel;
    } else if (evaluationMode === "both" && judgeModel && scorerName) {
      judgeDisplay = `${judgeModel} + ${scorerName}`;
    } else if (judgeModel) {
      judgeDisplay = judgeModel;
    } else if (scorerName) {
      judgeDisplay = `${scorerName}`;
    }

    return {
      id: exp.id,
      name: exp.name,
      model: exp.config?.model?.name || "Unknown",
      judge: judgeDisplay,
      dataset: datasetName,
      prompts: exp.sampleCount || 0,
      date: createdDate,
      status:
        exp.status === "completed" ? "Completed" :
        exp.status === "failed" ? "Failed" :
        exp.status === "running" ? "Running" :
        "Pending",
    };
  });

  return (
    <Box>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      {/* Header + description */}
      <Stack spacing={1} mb={4}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" fontSize={15} fontWeight="600" color="#111827">
            Experiments
          </Typography>
          <HelperIcon articlePath="llm-evals/running-experiments" />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: "14px" }}>
          Experiments run evaluations on your models using datasets and scorers. Track performance metrics over time and compare different model configurations.
        </Typography>
      </Stack>

      {/* Performance Chart */}
      <Card sx={{ marginBottom: "16px", border: "1px solid #d0d5dd", borderRadius: "4px", boxShadow: "none" }}>
        <CardContent>
          <Box mb={2}>
            <Typography variant="h6" sx={{ fontSize: "15px", fontWeight: 600 }}>Performance tracking</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Track metric scores across eval runs
          </Typography>

          <Box sx={{ position: "relative" }}>
            <Box sx={{
              filter: experiments.length === 0 ? "blur(4px)" : "none",
              pointerEvents: experiments.length === 0 ? "none" : "auto",
            }}>
              <PerformanceChart projectId={projectId} />
            </Box>
            {experiments.length === 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  zIndex: 1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                    textAlign: "center",
                    px: 3,
                  }}
                >
                  You can start tracking metrics once you define your experiments
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Filters + Search + Group directly above the table */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ marginBottom: "18px" }} gap={2}>
        <Stack direction="row" alignItems="center" gap={2}>
          <FilterBy columns={experimentFilterColumns} onFilterChange={handleFilterChange} />
          <GroupBy
            options={[
              { id: "status", label: "Status" },
              { id: "model", label: "Model" },
              { id: "judge", label: "Judge" },
            ]}
            onGroupChange={() => {
              /* Grouping behaviour will be added in a later iteration */
            }}
          />
          <SearchBox
            placeholder="Search experiments..."
            value={searchTerm}
            onChange={setSearchTerm}
            inputProps={{ "aria-label": "Search experiments" }}
            fullWidth={false}
          />
        </Stack>
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
      </Stack>

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
          onRerun={handleRerunExperiment}
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
