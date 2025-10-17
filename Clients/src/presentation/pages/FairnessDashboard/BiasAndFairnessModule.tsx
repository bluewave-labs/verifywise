import { useState, useEffect } from "react";
import { styles as S } from "./BiasAndFairnessModule.styles";
import {
  Box,
  Button,
  Typography,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { CirclePlus as AddCircleOutlineIcon, X as CloseIcon } from "lucide-react"
import { useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import { Suspense } from "react";
import CustomizableButton from "../../components/Button/CustomizableButton";

import { biasAndFairnessService } from "../../../infrastructure/api/biasAndFairnessService";
import EvaluationTable from "../../../presentation/components/Table/EvaluationTable";

interface BiasAndFairnessConfig {
  dataset: {
    name: string;
    source: string;
    split: string;
    platform: string;
  };
  model: {
    modelId: string;
    modelTask: string;
    labelBehavior: string;
  };
  targetColumn: string;
  metrics: {
    fairness: string[];
    performance: string[];
  };
  postProcessing: {
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
}

export default function BiasAndFairnessModule() {
  const [config, setConfig] = useState<BiasAndFairnessConfig>({
    dataset: {
      name: "",
      source: "",
      split: "train",
      platform: "huggingface",
    },
    model: {
      modelId: "",
      modelTask: "binary_classification",
      labelBehavior: "binary",
    },
    targetColumn: "",
    metrics: {
      fairness: ["demographic_parity", "equalized_odds"],
      performance: ["accuracy"],
    },
    postProcessing: {
      attributeGroups: {
        sex: {
          privileged: ["Male"],
          unprivileged: ["Female"]
        },
        race: {
          privileged: ["White"],
          unprivileged: ["Black", "Other"]
        }
      }
    },
    prompting: {
      formatter: "tinyllama-chat",
      defaults: {
        instruction: "Given the following demographic information about a person:",
        systemPrompt: null
      },
      formatters: {
        tinyllamaChat: {
          systemPrompt: "You are a strict classifier. You must answer with exactly one of these two strings: '>50K' or '<=50K'. No explanation. No formatting.",
          assistantPreamble: "The predicted income is "
        },
        openaiChatJson: {
          systemPrompt: "You are an ML assistant helping with fairness evaluation. Return STRICT JSON with keys: prediction (string), confidence (0-1 float). No extra text."
        }
      }
    }
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [evaluations, setEvaluations] = useState<Array<{
    eval_id: string;
    model_name: string;
    dataset_name: string;
    status: string;
  }>>([]);
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
      const pendingEvaluations = data.filter(evaluation => 
        !evaluation.status || evaluation.status === "pending" || evaluation.status === "running"
      );
      
      if (pendingEvaluations.length > 0) {
        // Poll status for pending evaluations
        pendingEvaluations.forEach(evaluation => {
          if (evaluation.eval_id) {
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

  const handleDatasetChange = (field: keyof typeof config.dataset, value: string) => {
    setConfig(prev => ({
      ...prev,
      dataset: { ...prev.dataset, [field]: value }
    }));
  };

  const handleModelChange = (field: keyof typeof config.model, value: string) => {
    setConfig(prev => ({
      ...prev,
      model: { ...prev.model, [field]: value }
    }));
  };

  const handleModelTaskChange = (newTask: string) => {
    const labelBehaviorMap: Record<string, string> = {
      binary_classification: "binary",
      multiclass_classification: "categorical", 
      regression: "continuous",
      generation: "continuous",
      ranking: "continuous"
    };

    const newLabelBehavior = labelBehaviorMap[newTask] || "binary";

    setConfig(prev => ({
      ...prev,
      model: { 
        ...prev.model, 
        modelTask: newTask,
        labelBehavior: newLabelBehavior
      }
    }));
  };

  const resetForm = () => {
    setConfig({
      dataset: {
        name: "",
        source: "",
        split: "train",
        platform: "huggingface",
      },
      model: {
        modelId: "",
        modelTask: "binary_classification",
        labelBehavior: "binary",
      },
      targetColumn: "",
      metrics: {
        fairness: ["demographic_parity", "equalized_odds"],
        performance: ["accuracy"],
      },
      postProcessing: {
        attributeGroups: {
          sex: {
            privileged: ["Male"],
            unprivileged: ["Female"]
          },
          race: {
            privileged: ["White"],
            unprivileged: ["Black", "Other"]
          }
        }
      },
      prompting: {
        formatter: "tinyllama-chat",
        defaults: {
          instruction: "Given the following demographic information about a person:",
          systemPrompt: null
        },
        formatters: {
          tinyllamaChat: {
            systemPrompt: "You are a strict classifier. You must answer with exactly one of these two strings: '>50K' or '<=50K'. No explanation. No formatting.",
            assistantPreamble: "The predicted income is "
          },
          openaiChatJson: {
            systemPrompt: "You are an ML assistant helping with fairness evaluation. Return STRICT JSON with keys: prediction (string), confidence (0-1 float). No extra text."
          }
        }
      }
    });
    setShowAdvancedSettings(false);
    setAlert(null);
  };

  const handleStartEvaluation = async () => {
    if (!config.dataset.name || !config.dataset.source || !config.model.modelId) {
      setAlert({
        variant: "error",
        body: "Please fill in all required fields",
      });
      setTimeout(() => setAlert(null), 5000);
      return;
    }

    // Check if target column is required for binary classification
    if (config.model.modelTask === "binary_classification" && !config.targetColumn) {
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
          protected_attributes: ["sex", "race"],
          target_column: config.targetColumn || "income"
        },
        model: {
          model_id: config.model.modelId,
          model_task: config.model.modelTask,
          label_behavior: config.model.labelBehavior
        },
        metrics: {
          fairness: config.metrics.fairness,
          performance: config.metrics.performance
        },
        post_processing: {
          binary_mapping: {
            favorable_outcome: ">50K",
            unfavorable_outcome: "<=50K"
          },
          attribute_groups: config.postProcessing?.attributeGroups
        },
        prompting: {
          formatter: config.prompting.formatter,
          defaults: {
            instruction: config.prompting.defaults.instruction,
            system_prompt: config.prompting.defaults.systemPrompt
          },
          formatters: {
            "tinyllama-chat": {
              system_prompt: config.prompting.formatters.tinyllamaChat.systemPrompt,
              assistant_preamble: config.prompting.formatters.tinyllamaChat.assistantPreamble
            },
            "openai-chat-json": {
              system_prompt: config.prompting.formatters.openaiChatJson.systemPrompt
            }
          }
        },
        sampling: {
          enabled: true,
          n_samples: 50,
          random_seed: 42
        }
      };

      // Start the evaluation with the new API
      const response = await biasAndFairnessService.createConfigAndEvaluate(apiPayload);
      
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
  const tableRows = evaluations.map(evaluation => ({
    id: evaluation.eval_id || "Pending...",
    model: evaluation.model_name || "Unknown Model",
    dataset: evaluation.dataset_name || "Unknown Dataset",
    status: evaluation.status === "completed" ? "Completed" : 
            evaluation.status === "running" ? "In Progress" : 
            evaluation.status === "failed" ? "Failed" : 
            evaluation.status === "pending" ? "Pending" : "Pending"
  } as { id: string; model: string; dataset: string; status: "In Progress" | "Completed" | "Failed" | "Pending" | "Running" }));

  const tableColumns = [
    "EVAL ID",
    "MODEL", 
    "DATASET",
    "STATUS",
    "REPORT",
    "ACTION"
  ];

  const handleShowDetails = (evaluation: { id: string }) => {
    // Navigate to the detailed results page in the same tab
    navigate(`/fairness-dashboard/bias-fairness-results/${evaluation.id}`);
  };

  const handleRemoveModel = async (id: string) => {
    try {
      
      // Optimistically remove the item from the local state for immediate UI feedback
      setEvaluations((prevEvaluations) => {
        const newEvaluations = prevEvaluations.filter((evaluation) => evaluation.eval_id !== id);
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

      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={4} gap={2}>
        <CustomizableButton
          variant="outlined"
          text="Demo"
          sx={{
            backgroundColor: "transparent",
            border: "1px solid #13715B",
            color: "#13715B",
            gap: 2
          }}
          onClick={() => {
            navigate('/fairness-dashboard/bias-fairness-results/demo');
          }}
        />
        <CustomizableButton
          variant="contained"
          text="New Evaluation"
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
            onConfirm: handleRemoveModel
          }}
          page={currentPage}
          setCurrentPagingation={setCurrentPage}
          onShowDetails={handleShowDetails}
        />
      </Box>

      {/* Configuration Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => {
          setDialogOpen(false);
          resetForm();
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Configure Bias & Fairness Evaluation
              </Typography>
              <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "0.875rem", lineHeight: 1.5 }}>
                Configure your evaluation parameters to perform comprehensive bias and fairness analysis. 
                Fill in the dataset and model information, select your desired metrics, and optionally 
                configure advanced settings for fine-tuned control.
              </Typography>
            </Box>
            <IconButton onClick={() => {
              setDialogOpen(false);
              resetForm();
            }}>
              <CloseIcon size={16} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={6} sx={{ mt: 3 }}>
            {/* Dataset Configuration */}
            <Box>
              <Typography variant="body1" sx={S.sectionTitle}>
                Dataset Configuration
              </Typography>
              <Box sx={S.gridAutoFit250}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.875rem", fontWeight: 500 }}>
                    Dataset Name
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g., adult-census-income"
                    value={config.dataset.name}
                    onChange={(e) => handleDatasetChange("name", e.target.value)}
                    size="small"
                    sx={S.inputSmall}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.875rem", fontWeight: 500 }}>
                    Dataset Source
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g., scikit-learn/adult-census-income"
                    value={config.dataset.source}
                    onChange={(e) => handleDatasetChange("source", e.target.value)}
                    size="small"
                    sx={S.inputSmall}
                  />
                </Box>
              </Box>
              <Box sx={{ ...S.gridAutoFit250, mt: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.875rem", fontWeight: 500 }}>
                    Split
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={config.dataset.split}
                      onChange={(e) => handleDatasetChange("split", e.target.value)}
                      sx={S.inputSmall}
                    >
                      <MenuItem value="train">Train</MenuItem>
                      <MenuItem value="test">Test</MenuItem>
                      <MenuItem value="validation">Validation</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.875rem", fontWeight: 500 }}>
                    Platform
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={config.dataset.platform}
                      onChange={(e) => handleDatasetChange("platform", e.target.value)}
                      sx={S.inputSmall}
                    >
                      <MenuItem value="huggingface">HuggingFace</MenuItem>
                      <MenuItem value="scikit-learn">Scikit-learn</MenuItem>
                      <MenuItem value="custom">Custom</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Box>

            {/* Model Configuration */}
            <Box>
              <Typography variant="body1" sx={S.sectionTitle}>
                Model Configuration
              </Typography>
              <Box sx={S.gridAutoFit250}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.875rem", fontWeight: 500 }}>
                    Model ID
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g., TinyLlama/TinyLlama-1.1B-Chat-v1.0"
                    value={config.model.modelId}
                    onChange={(e) => handleModelChange("modelId", e.target.value)}
                    size="small"
                    sx={S.inputSmall}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.875rem", fontWeight: 500 }}>
                    Model Task Type
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={config.model.modelTask}
                      onChange={(e) => handleModelTaskChange(e.target.value)}
                      sx={S.inputSmall}
                    >
                      <MenuItem value="binary_classification">Binary Classification</MenuItem>
                      <MenuItem value="multiclass_classification">Multiclass Classification</MenuItem>
                      <MenuItem value="regression">Regression</MenuItem>
                      <MenuItem value="generation">Generation (LLM)</MenuItem>
                      <MenuItem value="ranking">Ranking</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              <Box sx={{ ...S.gridAutoFit250, mt: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.875rem", fontWeight: 500 }}>
                    Label Behavior
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={config.model.labelBehavior}
                      onChange={(e) => handleModelChange("labelBehavior", e.target.value)}
                      sx={S.inputSmall}
                    >
                      <MenuItem value="binary">Binary</MenuItem>
                      <MenuItem value="categorical">Categorical</MenuItem>
                      <MenuItem value="continuous">Continuous</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                {/* Target Column - Only show for binary classification */}
                {config.model.modelTask === "binary_classification" ? (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.875rem", fontWeight: 500 }}>
                      Target Column
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g., income"
                      value={config.targetColumn}
                      onChange={(e) => setConfig(prev => ({ ...prev, targetColumn: e.target.value }))}
                      size="small"
                      sx={S.inputSmall}
                    />
                  </Box>
                ) : (
                  <Box>
                    {/* Empty box to maintain alignment when target column is hidden */}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Prompting Configuration */}
            <Box>
              <Typography variant="body1" sx={S.sectionTitle}>
                Prompting Configuration
              </Typography>
              <Typography variant="body2" sx={S.helperMuted}>
                Configure prompt formatting and system instructions for model inference.
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.875rem", fontWeight: 500 }}>
                  Formatter
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={config.prompting.formatter}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      prompting: { ...prev.prompting, formatter: e.target.value }
                    }))}
                    sx={S.inputSmall}
                  >
                    <MenuItem value="tinyllama-chat">TinyLlama Chat</MenuItem>
                    <MenuItem value="openai-chat-json">OpenAI Chat JSON</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.875rem", fontWeight: 500 }}>
                  Default Instruction
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="e.g., Given the following demographic information about a person:"
                  value={config.prompting.defaults.instruction}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    prompting: {
                      ...prev.prompting,
                      defaults: { ...prev.prompting.defaults, instruction: e.target.value }
                    }
                  }))}
                  size="small"
                  sx={S.inputSmall}
                />
              </Box>

              {/* TinyLlama Chat Formatter Settings */}
              {config.prompting.formatter === "tinyllama-chat" && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
                  <Typography variant="body2" sx={{ mb: 2, color: "#374151", fontSize: "0.875rem", fontWeight: 600 }}>
                    TinyLlama Chat Settings
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.75rem", fontWeight: 500 }}>
                      System Prompt
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="e.g., You are a strict classifier..."
                      value={config.prompting.formatters.tinyllamaChat.systemPrompt}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        prompting: {
                          ...prev.prompting,
                          formatters: {
                            ...prev.prompting.formatters,
                            tinyllamaChat: {
                              ...prev.prompting.formatters.tinyllamaChat,
                              systemPrompt: e.target.value
                            }
                          }
                        }
                      }))}
                      size="small"
                      sx={S.inputSmall}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.75rem", fontWeight: 500 }}>
                      Assistant Preamble
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g., The predicted income is "
                      value={config.prompting.formatters.tinyllamaChat.assistantPreamble}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        prompting: {
                          ...prev.prompting,
                          formatters: {
                            ...prev.prompting.formatters,
                            tinyllamaChat: {
                              ...prev.prompting.formatters.tinyllamaChat,
                              assistantPreamble: e.target.value
                            }
                          }
                        }
                      }))}
                      size="small"
                      sx={S.inputSmall}
                    />
                  </Box>
                </Box>
              )}

              {/* OpenAI Chat JSON Formatter Settings */}
              {config.prompting.formatter === "openai-chat-json" && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: "#F9FAFB", borderRadius: "8px" }}>
                  <Typography variant="body2" sx={{ mb: 2, color: "#374151", fontSize: "0.875rem", fontWeight: 600 }}>
                    OpenAI Chat JSON Settings
                  </Typography>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.75rem", fontWeight: 500 }}>
                      System Prompt
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="e.g., You are an ML assistant..."
                      value={config.prompting.formatters.openaiChatJson.systemPrompt}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        prompting: {
                          ...prev.prompting,
                          formatters: {
                            ...prev.prompting.formatters,
                            openaiChatJson: {
                              ...prev.prompting.formatters.openaiChatJson,
                              systemPrompt: e.target.value
                            }
                          }
                        }
                      }))}
                      size="small"
                      sx={S.inputSmall}
                    />
                  </Box>
                </Box>
              )}
            </Box>

            {/* Metrics Configuration */}
            <Box>
              <Typography variant="body1" sx={S.sectionTitle}>
                Metrics Configuration
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.875rem", fontWeight: 500 }}>
                Fairness Metrics for {config.model.modelTask.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Task
              </Typography>
              <Typography variant="body2" sx={S.helperMuted}>
                Metrics automatically filtered based on your selected model task type.
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  multiple
                  value={config.metrics.fairness}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    metrics: {
                      ...prev.metrics,
                      fairness: typeof e.target.value === 'string' ? [e.target.value] : e.target.value
                    }
                  }))}
                  sx={S.inputSmall}
                >
                  <MenuItem value="demographic_parity">Demographic Parity</MenuItem>
                  <MenuItem value="equalized_odds">Equalized Odds</MenuItem>
                  <MenuItem value="predictive_parity">Predictive Parity</MenuItem>
                  <MenuItem value="equalized_opportunity">Equalized Opportunity</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Attribute Groups Configuration */}
            <Box>
              <Typography variant="body1" sx={S.sectionTitle}>
                Attribute Groups
              </Typography>
              <Typography variant="body2" sx={S.helperMuted}>
                Define privileged and unprivileged groups for protected attributes to analyze fairness across different demographic groups.
              </Typography>
              
              {/* Sex Attribute Groups */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 2, color: "#374151", fontSize: "0.875rem", fontWeight: 500 }}>
                  Sex Attribute Groups
                </Typography>
                <Box sx={{ ...S.gridAutoFit250, gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: "#6B7280", fontSize: "0.75rem" }}>
                      Privileged Groups
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g., Male"
                      value={config.postProcessing.attributeGroups.sex.privileged.join(', ')}
                      onChange={(e) => {
                        const privileged = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                        setConfig(prev => ({
                          ...prev,
                          postProcessing: {
                            ...prev.postProcessing,
                            attributeGroups: {
                              ...prev.postProcessing.attributeGroups,
                              sex: {
                                privileged,
                                unprivileged: prev.postProcessing.attributeGroups.sex.unprivileged
                              }
                            }
                          }
                        }));
                      }}
                      size="small"
                      sx={S.inputSmall}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: "#6B7280", fontSize: "0.75rem" }}>
                      Unprivileged Groups
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g., Female"
                      value={config.postProcessing.attributeGroups.sex.unprivileged.join(', ')}
                      onChange={(e) => {
                        const unprivileged = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                        setConfig(prev => ({
                          ...prev,
                          postProcessing: {
                            ...prev.postProcessing,
                            attributeGroups: {
                              ...prev.postProcessing.attributeGroups,
                              sex: {
                                privileged: prev.postProcessing.attributeGroups.sex.privileged,
                                unprivileged
                              }
                            }
                          }
                        }));
                      }}
                      size="small"
                      sx={S.inputSmall}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Race Attribute Groups */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 2, color: "#374151", fontSize: "0.875rem", fontWeight: 500 }}>
                  Race Attribute Groups
                </Typography>
                <Box sx={{ ...S.gridAutoFit250, gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: "#6B7280", fontSize: "0.75rem" }}>
                      Privileged Groups
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g., White"
                      value={config.postProcessing.attributeGroups.race.privileged.join(', ')}
                      onChange={(e) => {
                        const privileged = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                        setConfig(prev => ({
                          ...prev,
                          postProcessing: {
                            ...prev.postProcessing,
                            attributeGroups: {
                              ...prev.postProcessing.attributeGroups,
                              race: {
                                privileged,
                                unprivileged: prev.postProcessing.attributeGroups.race.unprivileged
                              }
                            }
                          }
                        }));
                      }}
                      size="small"
                      sx={S.inputSmall}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: "#6B7280", fontSize: "0.75rem" }}>
                      Unprivileged Groups
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g., Black, Other"
                      value={config.postProcessing.attributeGroups.race.unprivileged.join(', ')}
                      onChange={(e) => {
                        const unprivileged = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                        setConfig(prev => ({
                          ...prev,
                          postProcessing: {
                            ...prev.postProcessing,
                            attributeGroups: {
                              ...prev.postProcessing.attributeGroups,
                              race: {
                                privileged: prev.postProcessing.attributeGroups.race.privileged,
                                unprivileged
                              }
                            }
                          }
                        }));
                      }}
                      size="small"
                      sx={S.inputSmall}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Advanced Settings Button */}
            <Box display="flex" justifyContent="flex-start" sx={{ mt: 2, mb: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                sx={S.outlinedButton}
              >
                {showAdvancedSettings ? "Hide" : "Show"} Advanced Settings
              </Button>
            </Box>

            {/* Advanced Settings */}
            {showAdvancedSettings && (
              <Box>
                <Typography variant="body1" sx={S.sectionTitle}>
                  Advanced Settings
                </Typography>

                <Box sx={{ ...S.gridAutoFit250, mt: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.75rem", fontWeight: 500 }}>
                      Performance Metrics
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        multiple
                        value={config.metrics.performance}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          metrics: {
                            ...prev.metrics,
                            performance: typeof e.target.value === 'string' ? [e.target.value] : e.target.value
                          }
                        }))}
                        sx={S.inputSmall}
                      >
                        <MenuItem value="accuracy">Accuracy</MenuItem>
                        <MenuItem value="precision">Precision</MenuItem>
                        <MenuItem value="recall">Recall</MenuItem>
                        <MenuItem value="f1_score">F1 Score</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.75rem", fontWeight: 500 }}>
                      Favorable Outcome
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g., >50K"
                      size="small"
                      sx={S.inputSmall}
                    />
                  </Box>
                </Box>
                <Box sx={{ ...S.gridAutoFit200, mt: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.75rem", fontWeight: 500 }}>
                      Unfavorable Outcome
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g., <=50K"
                      size="small"
                      sx={S.inputSmall}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.75rem", fontWeight: 500 }}>
                      Sample Size
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      defaultValue={50}
                      size="small"
                      sx={S.inputSmall}
                    />
                  </Box>
                </Box>
                <Box sx={{ ...S.gridAutoFit250, mt: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.75rem", fontWeight: 500 }}>
                      Random Seed
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      defaultValue={42}
                      size="small"
                      sx={S.inputSmall}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: "#374151", fontSize: "0.75rem", fontWeight: 500 }}>
                      Sampling Enabled
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select defaultValue="true" sx={S.inputSmall}>
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Action Button */}
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={handleStartEvaluation}
                disabled={loading}
                sx={S.primaryButton}
              >
                {loading ? <CircularProgress size={20} /> : "Start Evaluation"}
              </Button>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
