import { useState, useEffect, lazy, Suspense } from "react";
import { styles as S } from "./BiasAndFairnessModule.styles";
import { Box, Button, Typography, Stack, FormControl, Select, MenuItem } from "@mui/material";
import { CirclePlus as AddCircleOutlineIcon, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import CustomizableButton from "../../components/Button/CustomizableButton";
import StandardModal from "../../components/Modals/StandardModal";
const Field = lazy(() => import("../../components/Inputs/Field"));
const SelectComponent = lazy(() => import("../../components/Inputs/Select"));

import { biasAndFairnessService } from "../../../infrastructure/api/biasAndFairnessService";
import EvaluationTable from "../../../presentation/components/Table/EvaluationTable";

interface BiasAndFairnessConfig {
  dataset: {
    name: string;
    source: string;
    split: string;
    platform: string;
    protectedAttributes: string[];
  };
  model: {
    modelId: string;
    modelTask: string;
    labelBehavior: string;
    enabled: boolean;
    device: string;
    temperature: number;
    topP: number;
    maxNewTokens: number;
  };
  targetColumn: string;
  metrics: {
    fairnessEnabled: boolean;
    fairness: string[];
    performanceEnabled: boolean;
    performance: string[];
  };
  postProcessing: {
    binaryMapping: {
      favorable: string;
      unfavorable: string;
    };
    attributeGroups: {
      sex: {
        privileged: string[];
        unprivileged: string[];
      };
      race: {
        privileged: string[];
        unprivileged: string[];
      };
    };
  };
  prompting: {
    formatter: string;
    defaults: {
      instruction: string;
      systemPrompt: string | null;
    };
    formatters: {
      tinyllamaChat: {
        systemPrompt: string;
        assistantPreamble: string;
      };
      openaiChatJson: {
        systemPrompt: string;
      };
    };
  };
  sampling: {
    enabled: boolean;
    nSamples: number;
    randomSeed: number;
  };
}

export default function BiasAndFairnessModule() {
  const [config, setConfig] = useState<BiasAndFairnessConfig>({
    dataset: {
      name: "adult-census-income",
      source: "scikit-learn/adult-census-income",
      split: "train",
      platform: "huggingface",
      protectedAttributes: ["sex", "race"],
    },
    model: {
      modelId: "",
      modelTask: "binary_classification",
      labelBehavior: "binary",
      enabled: true,
      device: "cpu",
      temperature: 0.7,
      topP: 0.9,
      maxNewTokens: 30,
    },
    targetColumn: "",
    metrics: {
      fairnessEnabled: true,
      fairness: ["demographic_parity", "equalized_odds"],
      performanceEnabled: true,
      performance: ["accuracy"],
    },
    postProcessing: {
      binaryMapping: {
        favorable: ">50K",
        unfavorable: "<=50K",
      },
      attributeGroups: {
        sex: {
          privileged: ["Male"],
          unprivileged: ["Female"],
        },
        race: {
          privileged: ["White"],
          unprivileged: ["Black", "Other"],
        },
      },
    },
    prompting: {
      formatter: "tinyllama-chat",
      defaults: {
        instruction:
          "Given the following demographic information about a person:",
        systemPrompt: null,
      },
      formatters: {
        tinyllamaChat: {
          systemPrompt:
            "You are a strict classifier. You must answer with exactly one of these two strings: '>50K' or '<=50K'. No explanation. No formatting.",
          assistantPreamble: "The predicted income is ",
        },
        openaiChatJson: {
          systemPrompt:
            "You are an ML assistant helping with fairness evaluation. Return STRICT JSON with keys: prediction (string), confidence (0-1 float). No extra text.",
        },
      },
    },
    sampling: { enabled: true, nSamples: 50, randomSeed: 42 },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [evaluations, setEvaluations] = useState<
    Array<{
      eval_id: string;
      model_name: string;
      dataset_name: string;
      status: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const navigate = useNavigate();

  // Load evaluations from database
  useEffect(() => {
    loadEvaluations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEvaluations = async () => {
    try {
      const data = await biasAndFairnessService.getAllBiasFairnessEvaluations();
      setEvaluations(data);

      // Check for any pending/running evaluations and poll their status
      const pendingEvaluations = data.filter(
        (evaluation) =>
          !evaluation.status ||
          evaluation.status === "pending" ||
          evaluation.status === "running"
      );

      if (pendingEvaluations.length > 0) {
        // Poll status for pending evaluations
        pendingEvaluations.forEach((evaluation) => {
          if (evaluation.eval_id && typeof evaluation.eval_id === "string") {
            pollEvaluationStatus(evaluation.eval_id);
          }
        });
      }
    } catch {
      setAlert({
        variant: "error",
        body: "Failed to load evaluations. Please refresh the page.",
      });
      setTimeout(() => setAlert(null), 8000);
      // For now, use empty array if API fails
      setEvaluations([]);
    }
  };

  const handleDatasetChange = (
    field: keyof typeof config.dataset,
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      dataset: { ...prev.dataset, [field]: value },
    }));
  };

  const handleModelChange = (
    field: keyof typeof config.model,
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      model: { ...prev.model, [field]: value },
    }));
  };

  const handleModelTaskChange = (newTask: string) => {
    const labelBehaviorMap: Record<string, string> = {
      binary_classification: "binary",
      multiclass_classification: "categorical",
      regression: "continuous",
      generation: "continuous",
      ranking: "continuous",
    };

    const newLabelBehavior = labelBehaviorMap[newTask] || "binary";

    setConfig((prev) => ({
      ...prev,
      model: {
        ...prev.model,
        modelTask: newTask,
        labelBehavior: newLabelBehavior,
      },
    }));
  };

  const resetForm = () => {
    setConfig({
      dataset: {
        name: "adult-census-income",
        source: "scikit-learn/adult-census-income",
        split: "train",
        platform: "huggingface",
        protectedAttributes: ["sex", "race"],
      },
      model: {
        modelId: "",
        modelTask: "binary_classification",
        labelBehavior: "binary",
        enabled: true,
        device: "cpu",
        temperature: 0.7,
        topP: 0.9,
        maxNewTokens: 30,
      },
      targetColumn: "",
      metrics: {
        fairnessEnabled: true,
        fairness: ["demographic_parity", "equalized_odds"],
        performanceEnabled: true,
        performance: ["accuracy"],
      },
      postProcessing: {
        binaryMapping: {
          favorable: ">50K",
          unfavorable: "<=50K",
        },
        attributeGroups: {
          sex: {
            privileged: ["Male"],
            unprivileged: ["Female"],
          },
          race: {
            privileged: ["White"],
            unprivileged: ["Black", "Other"],
          },
        },
      },
      prompting: {
        formatter: "tinyllama-chat",
        defaults: {
          instruction:
            "Given the following demographic information about a person:",
          systemPrompt: null,
        },
        formatters: {
          tinyllamaChat: {
            systemPrompt:
              "You are a strict classifier. You must answer with exactly one of these two strings: '>50K' or '<=50K'. No explanation. No formatting.",
            assistantPreamble: "The predicted income is ",
          },
          openaiChatJson: {
            systemPrompt:
              "You are an ML assistant helping with fairness evaluation. Return STRICT JSON with keys: prediction (string), confidence (0-1 float). No extra text.",
          },
        },
      },
      sampling: {
        enabled: true,
        nSamples: 50,
        randomSeed: 42,
      },
    });
    setShowAdvancedSettings(false);
    setAlert(null);
  };

  const handleStartEvaluation = async () => {
    if (
      !config.dataset.name ||
      !config.dataset.source ||
      !config.model.modelId
    ) {
      setAlert({
        variant: "error",
        body: "Please fill in all required fields",
      });
      setTimeout(() => setAlert(null), 5000);
      return;
    }

    // Check if target column is required for binary classification
    if (
      config.model.modelTask === "binary_classification" &&
      !config.targetColumn
    ) {
      setAlert({
        variant: "error",
        body: "Target column is required for binary classification tasks",
      });
      setTimeout(() => setAlert(null), 5000);
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      // Transform config to match API payload
      const apiPayload = {
        dataset: {
          name: config.dataset.name,
          source: config.dataset.source,
          split: config.dataset.split,
          platform: config.dataset.platform,
          protected_attributes: config.dataset.protectedAttributes,
          target_column: config.targetColumn || "income",
        },
        model: {
          model_id: config.model.modelId,
          model_task: config.model.modelTask,
          label_behavior: config.model.labelBehavior,
          huggingface: {
            enabled: config.model.enabled,
            device: config.model.device,
            temperature: config.model.temperature,
            top_p: config.model.topP,
            max_new_tokens: config.model.maxNewTokens,
            model_id: config.model.modelId,
            system_prompt:
              config.prompting.formatter === "tinyllama-chat"
                ? config.prompting.formatters.tinyllamaChat.systemPrompt
                : undefined,
          },
        },
        metrics: {
          fairness: config.metrics.fairnessEnabled ? config.metrics.fairness : [],
          performance: config.metrics.performanceEnabled
            ? config.metrics.performance
            : [],
        },
        post_processing: {
          binary_mapping: {
            favorable_outcome: config.postProcessing.binaryMapping.favorable,
            unfavorable_outcome:
              config.postProcessing.binaryMapping.unfavorable,
          },
          attribute_groups: config.postProcessing?.attributeGroups,
        },
        prompting: {
          formatter: config.prompting.formatter,
          defaults: {
            instruction: config.prompting.defaults.instruction,
            system_prompt: config.prompting.defaults.systemPrompt,
          },
          formatters: {
            "tinyllama-chat": {
              system_prompt:
                config.prompting.formatters.tinyllamaChat.systemPrompt,
              assistant_preamble:
                config.prompting.formatters.tinyllamaChat.assistantPreamble,
            },
            "openai-chat-json": {
              system_prompt:
                config.prompting.formatters.openaiChatJson.systemPrompt,
            },
          },
        },
        sampling: {
          enabled: config.sampling.enabled,
          n_samples: config.sampling.nSamples,
          random_seed: config.sampling.randomSeed,
        },
      };

      // Start the evaluation with the new API
      const response = await biasAndFairnessService.createConfigAndEvaluate(
        apiPayload
      );

      setAlert({
        variant: "success",
        body: "Evaluation started successfully!",
      });
      setTimeout(() => setAlert(null), 3000);
      setDialogOpen(false);
      resetForm();

      // Reload evaluations to show the new one
      await loadEvaluations();

      // Start polling for status updates
      if (response.eval_id) {
        pollEvaluationStatus(response.eval_id);
      }
    } catch {
      setAlert({
        variant: "error",
        body: "Failed to start evaluation. Please try again.",
      });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const pollEvaluationStatus = async (evalId: string) => {
    try {
      await biasAndFairnessService.pollEvaluationStatus(evalId);

      // Reload evaluations to get updated status
      await loadEvaluations();
    } catch {
      // Silently handle polling errors
    }
  };

  // Transform evaluations for FairnessTable
  const tableRows = evaluations.map(
    (evaluation) =>
      ({
        id: evaluation.eval_id || "Pending...",
        model: evaluation.model_name || "Unknown Model",
        dataset: evaluation.dataset_name || "Unknown Dataset",
        status:
          evaluation.status === "completed"
            ? "Completed"
            : evaluation.status === "running"
            ? "In Progress"
            : evaluation.status === "failed"
            ? "Failed"
            : evaluation.status === "pending"
            ? "Pending"
            : "Pending",
      } as {
        id: string;
        model: string;
        dataset: string;
        status: "In Progress" | "Completed" | "Failed" | "Pending" | "Running";
      })
  );

  const tableColumns = [
    "EVAL ID",
    "MODEL",
    "DATASET",
    "STATUS",
    "REPORT",
    "ACTION",
  ];

  const handleShowDetails = (evaluation: { id: string }) => {
    // Navigate to the detailed results page in the same tab
    navigate(`/fairness-dashboard/bias-fairness-results/${evaluation.id}`);
  };

  const handleRemoveModel = async (id: string) => {
    try {
      // Optimistically remove the item from the local state for immediate UI feedback
      setEvaluations((prevEvaluations) => {
        const newEvaluations = prevEvaluations.filter(
          (evaluation) => evaluation.eval_id !== id
        );
        return newEvaluations;
      });

      // Perform the actual delete operation
      await biasAndFairnessService.deleteBiasFairnessEvaluation(id);

      // Fetch fresh data to ensure consistency with server
      await loadEvaluations();

      setAlert({
        variant: "success",
        body: "Evaluation deleted successfully!",
      });
      setTimeout(() => setAlert(null), 3000);
    } catch {
      // If delete failed, revert the optimistic update by fetching fresh data
      await loadEvaluations();

      setAlert({
        variant: "error",
        body: "Failed to delete evaluation. Please try again.",
      });
      setTimeout(() => setAlert(null), 5000);
    }
  };

  return (
    <Box>
      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant={alert.variant}
            title={alert.title}
            body={alert.body}
            isToast={true}
            onClick={() => setAlert(null)}
          />
        </Suspense>
      )}

      <Box
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
        mb={4}
        gap={2}
      >
        <CustomizableButton
          variant="outlined"
          text="Demo"
          data-joyride-id="demo-evaluation-button"
          sx={{
            backgroundColor: "transparent",
            border: "1px solid #13715B",
            color: "#13715B",
            gap: 2,
          }}
          onClick={() => {
            navigate("/fairness-dashboard/bias-fairness-results/demo");
          }}
        />
        <CustomizableButton
          variant="contained"
          text="New Evaluation"
          data-joyride-id="new-evaluation-button"
          sx={{
            backgroundColor: "#13715B",
            border: "1px solid #13715B",
            gap: 2,
          }}
          icon={<AddCircleOutlineIcon size={16} />}
          onClick={() => {
            setDialogOpen(true);
            setShowAdvancedSettings(false);
          }}
        />
      </Box>

      {/* Evaluation Results Table */}
      <Box mb={4}>
        <EvaluationTable
          columns={tableColumns}
          rows={tableRows}
          removeModel={{
            onConfirm: handleRemoveModel,
          }}
          page={currentPage}
          setCurrentPagingation={setCurrentPage}
          onShowDetails={handleShowDetails}
        />
      </Box>

      {/* Configuration Modal */}
      <StandardModal
        isOpen={dialogOpen}
        onClose={() => { setDialogOpen(false); resetForm(); }}
        title="Configure Bias & Fairness Evaluation"
        description="Configure your evaluation parameters to perform comprehensive bias and fairness analysis. We've provided default dataset and prompting configurations to help you get started quickly. You can test your model with these defaults or customize any settings to match your specific evaluation needs."
        onSubmit={handleStartEvaluation}
        submitButtonText={loading ? "" : "Start Evaluation"}
        isSubmitting={loading}
        maxWidth="900px"
      >
          <Stack spacing={6}>
            {/* Model configuration */}
            <Stack spacing={6}>
              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#13715B",
                }}
              >
                Model configuration
              </Typography>
              <Stack direction="row" spacing={6}>
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="modelId"
                    label="Model id"
                    width={220}
                    placeholder="e.g., TinyLlama/TinyLlama-1.1B-Chat-v1.0"
                    value={config.model.modelId}
                    onChange={(e) => handleModelChange("modelId", e.target.value)}
                  />
                </Suspense>
              <Suspense fallback={<div>Loading...</div>}>
                <SelectComponent
                  id="modelTask"
                  label="Model task type"
                  value={config.model.modelTask}
                  sx={{ width: 220 }}
                  items={[
                    { _id: "binary_classification", name: "Binary classification" },
                    { _id: "multiclass_classification", name: "Multiclass classification" },
                    { _id: "regression", name: "Regression" },
                    { _id: "generation", name: "Generation (LLM)" },
                    { _id: "ranking", name: "Ranking" },
                  ]}
                  onChange={(e) => handleModelTaskChange(String(e.target.value))}
                />
              </Suspense>
              <Suspense fallback={<div>Loading...</div>}>
                <SelectComponent
                  id="labelBehavior"
                  label="Label behavior"
                  value={config.model.labelBehavior}
                  sx={{ width: 220 }}
                  items={[
                    { _id: "binary", name: "Binary" },
                    { _id: "categorical", name: "Categorical" },
                    { _id: "continuous", name: "Continuous" },
                  ]}
                  onChange={(e) => handleModelChange("labelBehavior", String(e.target.value))}
                />
              </Suspense>
            </Stack>

              {/* Target column - for binary classification */}
              {config.model.modelTask === "binary_classification" && (
                <Stack direction="row" spacing={6}>
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="targetColumn"
                    label="Target column"
                    width={220}
                    placeholder="e.g., income"
                    value={config.targetColumn}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        targetColumn: e.target.value,
                      }))
                    }
                  />
                </Suspense>
                </Stack>
              )}

              {/* Model runtime settings */}
              <Stack direction="row" spacing={6}>
              <Suspense fallback={<div>Loading...</div>}>
                <SelectComponent
                  id="device"
                  label="Device"
                  value={config.model.device}
                  sx={{ width: 220 }}
                  items={[
                    { _id: "cpu", name: "CPU" },
                    { _id: "cuda", name: "CUDA" },
                    { _id: "mps", name: "MPS (Apple)" },
                  ]}
                  onChange={(e) => handleModelChange("device", String(e.target.value))}
                />
              </Suspense>
              <Suspense fallback={<div>Loading...</div>}>
                <Field
                  id="temperature"
                  label="Temperature"
                  width={220}
                  type="text"
                  value={String(config.model.temperature ?? "")}
                  onChange={(e) => {
                    const normalized = e.target.value.replace(",", ".");
                    setConfig((p) => ({
                      ...p,
                      model: { ...p.model, temperature: normalized === "" ? 0 : Number(normalized) },
                    }));
                  }}
                />
              </Suspense>
              <Suspense fallback={<div>Loading...</div>}>
                <Field
                  id="topP"
                  label="Top-p"
                  width={220}
                  type="text"
                  value={String(config.model.topP ?? "")}
                  onChange={(e) => {
                    const normalized = e.target.value.replace(",", ".");
                    setConfig((p) => ({
                      ...p,
                      model: { ...p.model, topP: normalized === "" ? 0 : Number(normalized) },
                    }));
                  }}
                />
              </Suspense>
              </Stack>

              <Stack direction="row" spacing={6}>
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="maxNewTokens"
                    label="Max new tokens"
                    width={220}
                    type="number"
                    value={String(config.model.maxNewTokens)}
                    onChange={(e) => setConfig((p) => ({ ...p, model: { ...p.model, maxNewTokens: Number(e.target.value) } }))}
                  />
                </Suspense>
              </Stack>
            </Stack>

            {/* Dataset configuration */}
            <Stack spacing={6}>
              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#13715B",
                }}
              >
                Dataset configuration
              </Typography>
              <Stack direction="row" spacing={6}>
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="datasetName"
                    label="Dataset name"
                    width={220}
                    placeholder="e.g., adult-census-income"
                    value={config.dataset.name}
                    onChange={(e) => handleDatasetChange("name", e.target.value)}
                  />
                </Suspense>
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="datasetSource"
                    label="Dataset source"
                    width={220}
                    placeholder="e.g., scikit-learn/adult-census-income"
                    value={config.dataset.source}
                    onChange={(e) => handleDatasetChange("source", e.target.value)}
                  />
                </Suspense>
                <Suspense fallback={<div>Loading...</div>}>
                  <SelectComponent
                    id="split"
                    label="Split"
                    value={config.dataset.split}
                    sx={{ width: 220 }}
                    items={[
                      { _id: "train", name: "Train" },
                      { _id: "test", name: "Test" },
                      { _id: "validation", name: "Validation" },
                    ]}
                    onChange={(e) => handleDatasetChange("split", String(e.target.value))}
                  />
                </Suspense>
              </Stack>
              <Stack direction="row" spacing={6}>
                <Suspense fallback={<div>Loading...</div>}>
                  <SelectComponent
                    id="platform"
                    label="Platform"
                    value={config.dataset.platform}
                    sx={{ width: 220 }}
                    items={[
                      { _id: "huggingface", name: "HuggingFace" },
                      { _id: "scikit-learn", name: "Scikit-learn" },
                      { _id: "custom", name: "Custom" },
                    ]}
                    onChange={(e) => handleDatasetChange("platform", String(e.target.value))}
                  />
                </Suspense>
              </Stack>
            </Stack>

            {/* Prompting configuration */}
            <Stack spacing={6}>
              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#13715B",
                }}
              >
                Prompting configuration
              </Typography>

              <Stack direction="row" spacing={6}>
                <Suspense fallback={<div>Loading...</div>}>
                  <SelectComponent
                    id="formatter"
                    label="Formatter"
                    value={config.prompting.formatter}
                    sx={{ width: 220 }}
                    items={[
                      { _id: "tinyllama-chat", name: "TinyLlama Chat" },
                      { _id: "openai-chat-json", name: "OpenAI Chat JSON" },
                    ]}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        prompting: {
                          ...prev.prompting,
                          formatter: String(e.target.value),
                        },
                      }))
                    }
                  />
                </Suspense>
              </Stack>

              <Stack direction="row" spacing={6}>
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="defaultInstruction"
                    label="Default instruction"
                    width={680}
                    type="description"
                    rows={2}
                    placeholder="e.g., Given the following demographic information about a person:"
                    value={config.prompting.defaults.instruction}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        prompting: {
                          ...prev.prompting,
                          defaults: {
                            ...prev.prompting.defaults,
                            instruction: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </Suspense>
              </Stack>

              {/* TinyLlama Chat Formatter Settings */}
              {config.prompting.formatter === "tinyllama-chat" && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    backgroundColor: "#F9FAFB",
                    borderRadius: "8px",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 2,
                      color: "#374151",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    TinyLlama chat settings
                  </Typography>
                  <Stack direction="row" spacing={6}>
                    <Suspense fallback={<div>Loading...</div>}>
                      <Field
                        id="tinyllamaSystemPrompt"
                        label="System prompt"
                        width={680}
                        type="description"
                        rows={3}
                        placeholder="e.g., You are a strict classifier..."
                        value={config.prompting.formatters.tinyllamaChat.systemPrompt}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            prompting: {
                              ...prev.prompting,
                              formatters: {
                                ...prev.prompting.formatters,
                                tinyllamaChat: {
                                  ...prev.prompting.formatters.tinyllamaChat,
                                  systemPrompt: e.target.value,
                                },
                              },
                            },
                          }))
                        }
                      />
                    </Suspense>
                  </Stack>
                  <Stack direction="row" spacing={6}>
                    <Suspense fallback={<div>Loading...</div>}>
                      <Field
                        id="tinyllamaAssistantPreamble"
                        label="Assistant preamble"
                        width={680}
                        placeholder="e.g., The predicted income is "
                        value={config.prompting.formatters.tinyllamaChat.assistantPreamble}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            prompting: {
                              ...prev.prompting,
                              formatters: {
                                ...prev.prompting.formatters,
                                tinyllamaChat: {
                                  ...prev.prompting.formatters.tinyllamaChat,
                                  assistantPreamble: e.target.value,
                                },
                              },
                            },
                          }))
                        }
                      />
                    </Suspense>
                  </Stack>
                </Box>
              )}

              {/* OpenAI Chat JSON Formatter Settings */}
              {config.prompting.formatter === "openai-chat-json" && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    backgroundColor: "#F9FAFB",
                    borderRadius: "8px",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 2,
                      color: "#374151",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    OpenAI chat JSON settings
                  </Typography>
                  <Stack direction="row" spacing={6}>
                    <Suspense fallback={<div>Loading...</div>}>
                      <Field
                        id="openaiSystemPrompt"
                        label="System prompt"
                        width={680}
                        type="description"
                        rows={3}
                        placeholder="e.g., You are an ML assistant..."
                        value={config.prompting.formatters.openaiChatJson.systemPrompt}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            prompting: {
                              ...prev.prompting,
                              formatters: {
                                ...prev.prompting.formatters,
                                openaiChatJson: {
                                  ...prev.prompting.formatters.openaiChatJson,
                                  systemPrompt: e.target.value,
                                },
                              },
                            },
                          }))
                        }
                      />
                    </Suspense>
                  </Stack>
                </Box>
              )}
            </Stack>

            {/* Metrics configuration */}
            <Stack spacing={6}>
              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#13715B",
                }}
              >
                Metrics configuration
              </Typography>
              <Stack direction="row" spacing={6}>
                <Suspense fallback={<div>Loading...</div>}>
                  <SelectComponent
                    id="fairnessEnabled"
                    label="Fairness metrics"
                    value={String(config.metrics.fairnessEnabled)}
                    sx={{ width: 220 }}
                    items={[
                      { _id: "true", name: "Fairness metrics enabled" },
                      { _id: "false", name: "Fairness metrics disabled" },
                    ]}
                    onChange={(e) => setConfig((p) => ({ ...p, metrics: { ...p.metrics, fairnessEnabled: String(e.target.value) === "true" } }))}
                  />
                </Suspense>
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  color: "#374151",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Fairness metrics for{" "}
                {config.model.modelTask
                  .replace("_", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                Task
              </Typography>
              <Typography variant="body2" sx={S.helperMuted}>
                Metrics automatically filtered based on your selected model task
                type.
              </Typography>
              <Stack direction="row" spacing={6}>
                <Box sx={{ width: 680 }}>
                  <FormControl fullWidth size="small">
                    <Select
                      multiple
                      value={config.metrics.fairness}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          metrics: {
                            ...prev.metrics,
                            fairness:
                              typeof e.target.value === "string"
                                ? [e.target.value]
                                : e.target.value,
                          },
                        }))
                      }
                      IconComponent={() => (
                        <ChevronDown
                          size={16}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                      sx={S.inputSmall}
                    >
                      <MenuItem value="demographic_parity">
                        Demographic Parity
                      </MenuItem>
                      <MenuItem value="equalized_odds">Equalized Odds</MenuItem>
                      <MenuItem value="predictive_parity">
                        Predictive Parity
                      </MenuItem>
                      <MenuItem value="equalized_opportunity">
                        Equalized Opportunity
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Stack>
            </Stack>

            {/* Attribute groups */}
            <Stack spacing={6}>
              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#13715B",
                }}
              >
                Attribute groups
              </Typography>
              <Typography variant="body2" sx={S.helperMuted}>
                Define privileged and unprivileged groups for protected
                attributes to analyze fairness across different demographic
                groups.
              </Typography>

              {/* Protected attributes - user-defined */}
              <Stack direction="row" spacing={6}>
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="protectedAttributes"
                    label="Protected attributes"
                    width={680}
                    placeholder="e.g., sex, race, age"
                    value={config.dataset.protectedAttributes.join(", ")}
                    onChange={(e) => {
                      const attributes = e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s);
                      setConfig((p) => ({
                        ...p,
                        dataset: {
                          ...p.dataset,
                          protectedAttributes: attributes,
                        },
                      }));
                    }}
                  />
                </Suspense>
              </Stack>

              {/* Sex Attribute Groups */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    mb: 2,
                    color: "#13715B",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  Sex attribute groups
                </Typography>
                <Stack direction="row" spacing={6}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Field
                      id="sexPrivileged"
                      label="Privileged groups"
                      width={220}
                      placeholder="e.g., Male"
                      value={config.postProcessing.attributeGroups.sex.privileged.join(", ")}
                      onChange={(e) => {
                        const privileged = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s);
                        setConfig((prev) => ({
                          ...prev,
                          postProcessing: {
                            ...prev.postProcessing,
                            attributeGroups: {
                              ...prev.postProcessing.attributeGroups,
                              sex: {
                                privileged,
                                unprivileged: prev.postProcessing.attributeGroups.sex.unprivileged,
                              },
                            },
                          },
                        }));
                      }}
                    />
                  </Suspense>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Field
                      id="sexUnprivileged"
                      label="Unprivileged groups"
                      width={220}
                      placeholder="e.g., Female"
                      value={config.postProcessing.attributeGroups.sex.unprivileged.join(", ")}
                      onChange={(e) => {
                        const unprivileged = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s);
                        setConfig((prev) => ({
                          ...prev,
                          postProcessing: {
                            ...prev.postProcessing,
                            attributeGroups: {
                              ...prev.postProcessing.attributeGroups,
                              sex: {
                                privileged: prev.postProcessing.attributeGroups.sex.privileged,
                                unprivileged,
                              },
                            },
                          },
                        }));
                      }}
                    />
                  </Suspense>
                </Stack>
              </Box>

              {/* Race Attribute Groups */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    mb: 2,
                    color: "#13715B",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  Race attribute groups
                </Typography>
                <Stack direction="row" spacing={6}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Field
                      id="racePrivileged"
                      label="Privileged groups"
                      width={220}
                      placeholder="e.g., White"
                      value={config.postProcessing.attributeGroups.race.privileged.join(", ")}
                      onChange={(e) => {
                        const privileged = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s);
                        setConfig((prev) => ({
                          ...prev,
                          postProcessing: {
                            ...prev.postProcessing,
                            attributeGroups: {
                              ...prev.postProcessing.attributeGroups,
                              race: {
                                privileged,
                                unprivileged: prev.postProcessing.attributeGroups.race.unprivileged,
                              },
                            },
                          },
                        }));
                      }}
                    />
                  </Suspense>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Field
                      id="raceUnprivileged"
                      label="Unprivileged groups"
                      width={220}
                      placeholder="e.g., Black, Other"
                      value={config.postProcessing.attributeGroups.race.unprivileged.join(", ")}
                      onChange={(e) => {
                        const unprivileged = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s);
                        setConfig((prev) => ({
                          ...prev,
                          postProcessing: {
                            ...prev.postProcessing,
                            attributeGroups: {
                              ...prev.postProcessing.attributeGroups,
                              race: {
                                privileged: prev.postProcessing.attributeGroups.race.privileged,
                                unprivileged,
                              },
                            },
                          },
                        }));
                      }}
                    />
                  </Suspense>
                </Stack>
              </Box>
            </Stack>

            {/* Advanced Settings Button */}
            <Box
              display="flex"
              justifyContent="flex-start"
              sx={{ mt: 2, mb: 2 }}
            >
              <Button
                variant="contained"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                sx={{
                  backgroundColor: "#13715B",
                  color: "white",
                  textTransform: "none",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  "&:hover": {
                    backgroundColor: "#0F5A47",
                  },
                }}
              >
                {showAdvancedSettings ? "Hide" : "Show"} Advanced settings
              </Button>
            </Box>

            {/* Advanced Settings */}
            {showAdvancedSettings && (
              <Stack spacing={6}>
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#13715B",
                  }}
                >
                  Advanced settings
                </Typography>

                {/* Binary Mapping and Sampling */}
                <Stack direction="row" spacing={6}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Field
                      id="favorableOutcome"
                      label="Favorable outcome"
                      width={220}
                      placeholder="e.g., >50K"
                      value={config.postProcessing.binaryMapping.favorable}
                      onChange={(e) => setConfig((p) => ({ ...p, postProcessing: { ...p.postProcessing, binaryMapping: { ...p.postProcessing.binaryMapping, favorable: e.target.value } } }))}
                    />
                  </Suspense>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Field
                      id="unfavorableOutcome"
                      label="Unfavorable outcome"
                      width={220}
                      placeholder="e.g., <=50K"
                      value={config.postProcessing.binaryMapping.unfavorable}
                      onChange={(e) => setConfig((p) => ({ ...p, postProcessing: { ...p.postProcessing, binaryMapping: { ...p.postProcessing.binaryMapping, unfavorable: e.target.value } } }))}
                    />
                  </Suspense>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Field
                      id="sampleSize"
                      label="Sample size"
                      width={220}
                      type="number"
                      value={String(config.sampling.nSamples)}
                      onChange={(e) => setConfig((p) => ({ ...p, sampling: { ...p.sampling, nSamples: Number(e.target.value) } }))}
                    />
                  </Suspense>
                </Stack>
                
                <Stack direction="row" spacing={6}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Field
                      id="randomSeed"
                      label="Random seed"
                      width={220}
                      type="number"
                      value={String(config.sampling.randomSeed)}
                      onChange={(e) => setConfig((p) => ({ ...p, sampling: { ...p.sampling, randomSeed: Number(e.target.value) } }))}
                    />
                  </Suspense>
                  <Suspense fallback={<div>Loading...</div>}>
                    <SelectComponent
                      id="samplingEnabled"
                      label="Sampling enabled"
                      value={String(config.sampling.enabled)}
                      sx={{ width: 220 }}
                      items={[
                        { _id: "true", name: "Yes" },
                        { _id: "false", name: "No" },
                      ]}
                      onChange={(e) => setConfig((p) => ({ ...p, sampling: { ...p.sampling, enabled: String(e.target.value) === "true" } }))}
                    />
                  </Suspense>
                </Stack>
              </Stack>
            )}
          </Stack>
      </StandardModal>
    </Box>
  );
}
