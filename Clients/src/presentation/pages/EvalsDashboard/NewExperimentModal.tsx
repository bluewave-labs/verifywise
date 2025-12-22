import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { Check, Database, ExternalLink, Upload, Sparkles, Settings, Plus, Layers, ChevronDown } from "lucide-react";
import StepperModal from "../../components/Modals/StepperModal";
import SelectableCard from "../../components/SelectableCard";
import Field from "../../components/Inputs/Field";
import Checkbox from "../../components/Inputs/Checkbox";
import Alert from "../../components/Alert";
import Chip from "../../components/Chip";

// Import provider logos
import { ReactComponent as OpenAILogo } from "../../assets/icons/openai_logo.svg";
import { ReactComponent as AnthropicLogo } from "../../assets/icons/anthropic_logo.svg";
import { ReactComponent as HuggingFaceLogo } from "../../assets/icons/huggingface_logo.svg";
import { ReactComponent as OllamaLogo } from "../../assets/icons/ollama_logo.svg";
import { ReactComponent as GeminiLogo } from "../../assets/icons/gemini_logo.svg";
import { ReactComponent as MistralLogo } from "../../assets/icons/mistral_logo.svg";
import { ReactComponent as XAILogo } from "../../assets/icons/xai_logo.svg";
import { ReactComponent as OpenRouterLogo } from "../../assets/icons/openrouter_logo.svg";
import { ReactComponent as FolderFilledIcon } from "../../assets/icons/folder_filled.svg";
import { ReactComponent as BuildIcon } from "../../assets/icons/build.svg";
import { experimentsService } from "../../../infrastructure/api/evaluationLogsService";
import { deepEvalDatasetsService } from "../../../infrastructure/api/deepEvalDatasetsService";
import { deepEvalScorersService, type DeepEvalScorer } from "../../../infrastructure/api/deepEvalScorersService";
import { evaluationLlmApiKeysService, type LLMApiKey, type LLMProvider } from "../../../infrastructure/api/evaluationLlmApiKeysService";
import { PROVIDERS, type ModelInfo } from "../../utils/providers";

interface NewExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
  onStarted?: (exp: { id: string; config: Record<string, unknown>; status: string; created_at?: string }) => void;
}

const steps = ["Model", "Dataset", "Scorer / Judge", "Metrics"];

export default function NewExperimentModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
  onStarted,
}: NewExperimentModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const formFieldsRef = useRef<HTMLDivElement>(null);
  
  // Alert state for showing success/error messages
  const [alert, setAlert] = useState<{
    show: boolean;
    variant: "success" | "error" | "info" | "warning";
    title: string;
    body: string;
  } | null>(null);

  // Dataset prompts state
  interface DatasetPrompt {
    id: string;
    category: string;
    prompt: string;
    expected_output: string;
    expected_keywords: string[];
    difficulty: string;
  }
  const [datasetPrompts, setDatasetPrompts] = useState<DatasetPrompt[]>([]);
  const [datasetLoaded, setDatasetLoaded] = useState(false);
  // User's saved datasets (for "My datasets" option)
  const [userDatasets, setUserDatasets] = useState<Array<{ id: string; name: string; path: string; promptCount: number; turnType?: "single-turn" | "multi-turn" | "simulated" }>>([]);
  const [selectedUserDataset, setSelectedUserDataset] = useState<{ id: string; name: string; path: string; promptCount: number; turnType?: "single-turn" | "multi-turn" | "simulated" } | null>(null);
  const [loadingUserDatasets, setLoadingUserDatasets] = useState(false);
  const [uploadingDataset, setUploadingDataset] = useState(false);
  const [selectedPresetPath, setSelectedPresetPath] = useState<string>("");


  // Scorer / Judge mode state: scorer = custom only, standard = judge only, both = run both
  const [judgeMode, setJudgeMode] = useState<"scorer" | "standard" | "both">("standard");
  const [userScorers, setUserScorers] = useState<DeepEvalScorer[]>([]);
  const [selectedScorer, setSelectedScorer] = useState<DeepEvalScorer | null>(null);
  const [loadingScorers, setLoadingScorers] = useState(false);
  
  // Configured API keys state
  const [configuredApiKeys, setConfiguredApiKeys] = useState<LLMApiKey[]>([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(true);
  

  // Configuration state
  const [config, setConfig] = useState({
    // High-level task type for builtin dataset presets
    taskType: "chatbot" as "chatbot" | "rag" | "agent",
    // Step 1: Model to be evaluated
    model: {
      name: "",
      accessMethod: "" as ProviderType | "",
      endpointUrl: "",
      apiKey: "",
      modelPath: "",
    },
    // Step 2: Judge LLM
    judgeLlm: {
      provider: "" as ProviderType | "",
      model: "",
      apiKey: "",
      temperature: 0.7,
      maxTokens: 2048,
    },
    // Step 3: Dataset
    dataset: {
      useBuiltin: true,
      categories: [] as string[],
      limit: 10,
      benchmark: "",
      // Simulated mode: when true, uses ConversationSimulator to generate turns
      simulatedMode: false,
      // Scenarios for simulated mode (optional - can be loaded from dataset)
      scenarios: [] as Array<{ scenario: string; expected_outcome: string; user_description?: string; max_turns?: number }>,
      // Max turns for simulated conversations
      maxTurns: 6,
    },
    // Step 4: Metrics - Universal core for all, plus use-case specific
    metrics: {
      // Universal Core (always runs for every use case - single-turn)
      answerRelevancy: true,
      correctness: true,
      completeness: true,
      hallucination: true,
      instructionFollowing: true,
      toxicity: true,
      bias: true,
      // RAG-specific (requires retrieval_context)
      contextRelevancy: false,
      contextPrecision: false,
      contextRecall: false,
      faithfulness: false,
      // Agent-specific (requires tools)
      toolSelection: false,
      toolCorrectness: false,
      actionRelevance: false,
      planningQuality: false,
      // Conversational metrics (multi-turn datasets)
      turnRelevancy: true,
      knowledgeRetention: true,
      conversationCoherence: true,
      conversationHelpfulness: true,
      taskCompletion: true,
      conversationSafety: true,
    },
    thresholds: {
      answerRelevancy: 0.5,
      correctness: 0.5,
      completeness: 0.5,
      hallucination: 0.5,
      instructionFollowing: 0.5,
      toxicity: 0.5,
      bias: 0.5,
      contextRelevancy: 0.5,
      contextPrecision: 0.5,
      contextRecall: 0.5,
      faithfulness: 0.5,
      toolSelection: 0.5,
      toolCorrectness: 0.5,
      actionRelevance: 0.5,
      planningQuality: 0.5,
      turnRelevancy: 0.5,
      knowledgeRetention: 0.5,
      conversationCoherence: 0.5,
      conversationHelpfulness: 0.5,
      taskCompletion: 0.5,
      conversationSafety: 0.5,
    },
  });
  
  // Track if selected dataset is multi-turn
  const isMultiTurnDataset = selectedUserDataset?.turnType === "multi-turn" || 
    (selectedPresetPath && selectedPresetPath.includes("multiturn"));

  // Update metric defaults when task type changes
  useEffect(() => {
    setConfig((prev) => {
      // Universal Core - always runs for every use case (single-turn)
      const universalCore = {
        answerRelevancy: true,
        correctness: true,
        completeness: true,
        hallucination: true,
        instructionFollowing: true,
        toxicity: true,
        bias: true,
      };

      // RAG-specific metrics (disabled by default)
      const ragMetrics = {
        contextRelevancy: false,
        contextPrecision: false,
        contextRecall: false,
        faithfulness: false,
      };

      // Agent-specific metrics (disabled by default)
      const agentMetrics = {
        toolSelection: false,
        toolCorrectness: false,
        actionRelevance: false,
        planningQuality: false,
      };
      
      // Conversational metrics (for multi-turn - enabled by default)
      const conversationalMetrics = {
        turnRelevancy: true,
        knowledgeRetention: true,
        conversationCoherence: true,
        conversationHelpfulness: true,
        taskCompletion: true,
        conversationSafety: true,
      };

      if (prev.taskType === "rag") {
        return {
          ...prev,
          metrics: {
            ...universalCore,
            ...ragMetrics,
            ...agentMetrics,
            ...conversationalMetrics,
            // Enable RAG metrics
            contextRelevancy: true,
            contextPrecision: true,
            contextRecall: true,
            faithfulness: true,
          },
        };
      } else if (prev.taskType === "agent") {
        return {
          ...prev,
          metrics: {
            ...universalCore,
            ...ragMetrics,
            ...agentMetrics,
            ...conversationalMetrics,
            // Enable Agent metrics
            toolSelection: true,
            toolCorrectness: true,
            actionRelevance: true,
            planningQuality: true,
          },
        };
      } else {
        // chatbot - Universal core only (no extra metrics)
        return {
          ...prev,
          metrics: {
            ...universalCore,
            ...ragMetrics,
            ...agentMetrics,
            ...conversationalMetrics,
          },
        };
      }
    });
  }, [config.taskType]);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  // Load configured API keys when modal opens
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        setLoadingApiKeys(true);
        const keys = await evaluationLlmApiKeysService.getAllKeys();
        setConfiguredApiKeys(keys);
      } catch {
        /* ignore */
      } finally {
        setLoadingApiKeys(false);
      }
    })();
  }, [isOpen]);

  // Load user datasets when entering the dataset step
  useEffect(() => {
    if (activeStep !== 1) return;
    // Load user datasets
    (async () => {
      try {
        setLoadingUserDatasets(true);
        const res = await deepEvalDatasetsService.listMy();
        const datasets = (res.datasets || []).map((d) => ({
          id: String(d.id),
          name: d.name,
          path: d.path,
          promptCount: d.promptCount ?? 0,
          turnType: d.turnType,
        }));
        setUserDatasets(datasets);
      } catch { /* ignore */ }
      finally {
        setLoadingUserDatasets(false);
      }
    })();
  }, [activeStep]);

  // Load user scorers when entering the scorer/judge step
  useEffect(() => {
    if (activeStep !== 2) return;
    (async () => {
      try {
        setLoadingScorers(true);
        const res = await deepEvalScorersService.list({ project_id: projectId });
        const enabledScorers = (res.scorers || []).filter((s) => s.enabled);
        setUserScorers(enabledScorers);
        // If user has scorers, default to scorer mode
        if (enabledScorers.length > 0) {
          setJudgeMode("scorer");
        }
      } catch {
        /* ignore */
      } finally {
        setLoadingScorers(false);
      }
    })();
  }, [activeStep, projectId]);

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleLoadBuiltinDataset = useCallback(async () => {
    try {
      // If we already have a selected preset path, load it; otherwise select first by use case
      if (!selectedPresetPath) {
        const list = await deepEvalDatasetsService.list();
        const options = list[config.taskType] || [];
        if (options.length > 0) {
          setSelectedPresetPath(options[0].path);
        }
      }
      const pathToLoad = selectedPresetPath;
      if (pathToLoad) {
        const { prompts } = await deepEvalDatasetsService.read(pathToLoad);
        // Apply category filters and limits if provided
        let filtered = prompts as DatasetPrompt[];
        if (config.dataset.categories && config.dataset.categories.length > 0) {
          filtered = filtered.filter((p) => config.dataset.categories.includes(p.category));
        }
        if (config.dataset.limit && config.dataset.limit > 0) {
          filtered = filtered.slice(0, config.dataset.limit);
        }
        setDatasetPrompts(filtered as DatasetPrompt[]);
        setDatasetLoaded(true);
      }
    } catch (err) {
      console.error("Failed to load dataset:", err);
    }
  }, [config.dataset.categories, config.dataset.limit, config.taskType, selectedPresetPath]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Auto-save any new API keys entered
      const saveApiKeyPromises: Promise<void>[] = [];
      
      // Save model provider API key if entered (only for cloud providers with saved model lists)
      const modelProvider = config.model.accessMethod;
      if (config.model.apiKey && modelProvider && PROVIDERS[modelProvider] && !hasApiKey(modelProvider)) {
        saveApiKeyPromises.push(
          evaluationLlmApiKeysService.addKey({
            provider: modelProvider as LLMProvider,
            apiKey: config.model.apiKey,
          }).then((newKey) => {
            // Update local state so we know it's configured now
            setConfiguredApiKeys((prev) => [...prev, newKey]);
          }).catch((err) => {
            console.warn("Failed to save model API key:", err);
          })
        );
      }
      
      // Save judge provider API key if entered
      const judgeProvider = config.judgeLlm.provider;
      if (config.judgeLlm.apiKey && judgeProvider && PROVIDERS[judgeProvider] && !hasApiKey(judgeProvider)) {
        saveApiKeyPromises.push(
          evaluationLlmApiKeysService.addKey({
            provider: judgeProvider as LLMProvider,
            apiKey: config.judgeLlm.apiKey,
          }).then((newKey) => {
            setConfiguredApiKeys((prev) => [...prev, newKey]);
          }).catch((err) => {
            console.warn("Failed to save judge API key:", err);
          })
        );
      }
      
      // Wait for API keys to be saved (don't block if they fail)
      await Promise.allSettled(saveApiKeyPromises);
      
      // Prepare experiment configuration
      // Create experiment name with model name + date/time
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const dateTimeStr = `${dateStr}, ${timeStr}`;
      const modelName = config.model.name || "Unknown Model";
      
      const experimentConfig = {
        project_id: projectId,
        name: `${modelName} - ${dateTimeStr}`,
        description: `Evaluating ${modelName} with ${datasetPrompts.length} prompts`,
        config: {
          project_id: projectId,  // Include in config for runner
          model: {
            name: config.model.name,
            accessMethod: config.model.accessMethod,
            endpointUrl: config.model.endpointUrl,
            apiKey: config.model.apiKey || undefined, // Send actual key to runner, backend won't store it
            modelPath: config.model.modelPath,
          },
          // Include scorer info if using custom scorer mode or both
          ...((judgeMode === "scorer" || judgeMode === "both") && selectedScorer ? {
            useCustomScorer: true,
            scorerId: selectedScorer.id,
            scorerName: selectedScorer.name,
            scorerMetricKey: selectedScorer.metricKey,
            // Tell backend which providers the custom scorer needs (for API key injection)
            scorerProviders: (() => {
              const providers: string[] = [];
              const judgeModel = selectedScorer.config?.judgeModel;
              if (typeof judgeModel === 'object' && judgeModel?.provider) {
                providers.push(judgeModel.provider.toLowerCase());
              } else if (typeof judgeModel === 'string') {
                // Legacy format - infer provider from model name
                const modelLower = judgeModel.toLowerCase();
                if (modelLower.includes('gpt') || modelLower.includes('o1') || modelLower.includes('o3')) {
                  providers.push('openai');
                } else if (modelLower.includes('claude')) {
                  providers.push('anthropic');
                } else if (modelLower.includes('gemini')) {
                  providers.push('google');
                } else if (modelLower.includes('mistral') || modelLower.includes('magistral')) {
                  providers.push('mistral');
                } else if (modelLower.includes('grok')) {
                  providers.push('xai');
                }
              }
              return providers.length > 0 ? providers : ['openai']; // Default to OpenAI
            })(),
            // API key is automatically injected by the backend from organization settings
          } : {}),
          // Include judge LLM config if using standard mode or both
          judgeLlm: (judgeMode === "standard" || judgeMode === "both") ? {
            provider: config.judgeLlm.provider,
            model: config.judgeLlm.model,
            apiKey: config.judgeLlm.apiKey || undefined, // Send actual key to runner, backend won't store it
            temperature: config.judgeLlm.temperature,
            maxTokens: config.judgeLlm.maxTokens,
          } : undefined,
          // Include evaluation mode for the runner
          evaluationMode: judgeMode,
          dataset: {
            useBuiltin: config.dataset.useBuiltin,
            // Include dataset name and path for display in experiments table
            name: selectedUserDataset?.name || (selectedPresetPath ? selectedPresetPath.split("/").pop()?.replace(/\.json$/i, "").split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : undefined),
            path: selectedUserDataset?.path || selectedPresetPath || undefined,
            datasetId: selectedUserDataset?.id || undefined,
            prompts: datasetPrompts,
            count: datasetPrompts.length,
          },
          metrics: config.metrics,
          thresholds: config.thresholds,
        },
      };

      console.log("Creating experiment:", experimentConfig);

      // Create experiment via API
      const response = await experimentsService.createExperiment(experimentConfig);
      console.log("Experiment created:", response);

      // Optimistically notify parent so the table shows a pending row immediately
      if (onStarted && response?.experiment?.id) {
        onStarted({
          id: response.experiment.id,
          config: experimentConfig.config,
          status: "running",
          created_at: new Date().toISOString(),
        });
      }

      // Show success message
      setAlert({
        show: true,
        variant: "success",
        title: "Eval Created!",
        body: `Your evaluation has been created and is now running. Eval ID: ${response.experiment?.id || "N/A"}`,
      });
      
      // Close modal after a short delay to let user see the success message
      setTimeout(() => {
        onSuccess();
        onClose();
        resetForm();
        setAlert(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to create experiment:", err);
      
      // Extract error message
      let errorMessage = "Failed to create eval. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        errorMessage = axiosError.response?.data?.detail || errorMessage;
      }
      
      setAlert({
        show: true,
        variant: "error",
        title: "Experiment Creation Failed",
        body: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setActiveStep(0);
    setDatasetPrompts([]);
    setDatasetLoaded(false);
    setSelectedUserDataset(null);
    setSelectedPresetPath("");
    // Reset scorer state
    setJudgeMode("standard");
    setSelectedScorer(null);
    setConfig({
      taskType: "chatbot",
      model: {
        name: "",
        accessMethod: "",
        endpointUrl: "",
        apiKey: "",
        modelPath: "",
      },
      judgeLlm: {
        provider: "",
        model: "",
        apiKey: "",
        temperature: 0.7,
        maxTokens: 2048,
      },
      dataset: {
        useBuiltin: true,
        categories: [],
        limit: 10,
        benchmark: "",
        simulatedMode: false,
        scenarios: [],
        maxTurns: 6,
      },
      metrics: {
        // Universal Core (runs for every use case)
        answerRelevancy: true,
        correctness: true,
        completeness: true,
        hallucination: true,
        instructionFollowing: true,
        toxicity: true,
        bias: true,
        // RAG-specific
        contextRelevancy: false,
        contextPrecision: false,
        contextRecall: false,
        faithfulness: false,
        // Agent-specific
        toolSelection: false,
        toolCorrectness: false,
        actionRelevance: false,
        planningQuality: false,
        // Conversational metrics (multi-turn)
        turnRelevancy: true,
        knowledgeRetention: true,
        conversationCoherence: true,
        conversationHelpfulness: true,
        taskCompletion: true,
        conversationSafety: true,
      },
      thresholds: {
        answerRelevancy: 0.5,
        correctness: 0.5,
        completeness: 0.5,
        hallucination: 0.5,
        instructionFollowing: 0.5,
        toxicity: 0.5,
        bias: 0.5,
        contextRelevancy: 0.5,
        contextPrecision: 0.5,
        contextRecall: 0.5,
        faithfulness: 0.5,
        toolSelection: 0.5,
        toolCorrectness: 0.5,
        actionRelevance: 0.5,
        planningQuality: 0.5,
        turnRelevancy: 0.5,
        knowledgeRetention: 0.5,
        conversationCoherence: 0.5,
        conversationHelpfulness: 0.5,
        taskCompletion: 0.5,
        conversationSafety: 0.5,
      },
    });
  };

  type ProviderType = "openai" | "anthropic" | "google" | "xai" | "huggingface" | "mistral" | "ollama" | "local" | "custom_api" | "openrouter";

  // Check if a provider has a configured API key
  const hasApiKey = (providerId: string): boolean => {
    return configuredApiKeys.some((k) => k.provider === providerId);
  };

  // All cloud providers that need API keys (using the saved models)
  const cloudProviders = [
    { id: "openrouter" as ProviderType, name: "OpenRouter", Logo: OpenRouterLogo, needsApiKey: true },
    { id: "openai" as ProviderType, name: "OpenAI", Logo: OpenAILogo, needsApiKey: true },
    { id: "anthropic" as ProviderType, name: "Anthropic", Logo: AnthropicLogo, needsApiKey: true },
    { id: "google" as ProviderType, name: "Gemini", Logo: GeminiLogo, needsApiKey: true },
    { id: "xai" as ProviderType, name: "xAI", Logo: XAILogo, needsApiKey: true },
    { id: "mistral" as ProviderType, name: "Mistral", Logo: MistralLogo, needsApiKey: true },
  ];

  // Local providers that don't need API keys
  const localProviders = [
    { id: "huggingface" as ProviderType, name: "HuggingFace", Logo: HuggingFaceLogo, needsApiKey: false },
    { id: "ollama" as ProviderType, name: "Ollama", Logo: OllamaLogo, needsApiKey: false },
  ];

  // All available providers for judge selection (all cloud + local)
  const availableJudgeProviders = [...cloudProviders, ...localProviders];

  const selectedProvider = availableJudgeProviders.find(p => p.id === config.judgeLlm.provider);
  
  // Get models for selected provider
  const getProviderModels = (providerId: string): ModelInfo[] => {
    // For cloud providers, use the saved model lists
    if (PROVIDERS[providerId]) {
      return PROVIDERS[providerId].models;
    }
    // For local providers, return empty (user types model name)
    return [];
  };

  // Auto-scroll when provider is selected
  useEffect(() => {
    if (config.judgeLlm.provider && formFieldsRef.current) {
      setTimeout(() => {
        formFieldsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }, [config.judgeLlm.provider]);

  // Auto-load default dataset when reaching step 2 (Dataset)
  useEffect(() => {
    if (activeStep === 1 && config.dataset.useBuiltin && !datasetLoaded) {
      handleLoadBuiltinDataset();
    }
  }, [activeStep, config.dataset.useBuiltin, datasetLoaded, handleLoadBuiltinDataset]);

  // Model providers - show ALL providers (cloud + local)
  const allModelProviders = [
    ...cloudProviders.map(p => ({ ...p, needsUrl: false })),
    ...localProviders.map(p => ({ ...p, needsUrl: false })),
    { id: "local" as ProviderType, name: "Local", Logo: FolderFilledIcon, needsApiKey: false, needsUrl: true },
    { id: "custom_api" as ProviderType, name: "Custom API", Logo: BuildIcon, needsApiKey: true, needsUrl: true },
  ];
  
  // Show all providers - we'll handle missing API keys with a message
  const availableModelProviders = allModelProviders;

  const selectedModelProvider = availableModelProviders.find(p => p.id === config.model.accessMethod);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        // Step 1: Model - Model to be evaluated
        return (
          <Stack spacing={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Select the model you want to evaluate.
              </Typography>
            </Box>

            {loadingApiKeys ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <CircularProgress size={24} />
                <Typography sx={{ mt: 1, fontSize: "13px", color: "#6B7280" }}>
                  Loading providers...
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography sx={{ mb: 2.5, fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                  Model provider
                </Typography>
                <Grid container spacing={1.5}>
                  {/* Show all providers */}
                  {availableModelProviders.map((provider) => {
                    const { Logo } = provider;
                    const isSelected = config.model.accessMethod === provider.id;
                    
                    return (
                      <Grid item xs={4} sm={3} key={provider.id}>
                        <Card
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              model: {
                                ...prev.model,
                                accessMethod: provider.id as typeof config.model.accessMethod,
                                name: "", // Reset model name when changing provider
                              },
                            }))
                          }
                          sx={{
                            cursor: "pointer",
                            border: "1px solid",
                            borderColor: isSelected ? "#13715B" : "#E5E7EB",
                            backgroundColor: "#FFFFFF",
                            boxShadow: "none",
                            transition: "all 0.2s ease",
                            position: "relative",
                            height: "100%",
                            "&:hover": {
                              borderColor: "#13715B",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                            },
                          }}
                        >
                          <CardContent
                            sx={{
                              textAlign: "center",
                              py: 3,
                              px: 2,
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              "&:last-child": { pb: 3 },
                            }}
                          >
                            {isSelected && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  backgroundColor: "#13715B",
                                  borderRadius: "50%",
                                  width: 20,
                                  height: 20,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Check size={12} color="#FFFFFF" strokeWidth={3} />
                              </Box>
                            )}
                            
                            {/* Provider Logo */}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100%",
                                height: provider.id === "huggingface" || provider.id === "xai" ? 56 : 48,
                                mb: 1.5,
                                "& svg": {
                                  maxWidth: provider.id === "huggingface" || provider.id === "xai" ? "100%" : "90%",
                                  maxHeight: "100%",
                                  width: "auto",
                                  height: "auto",
                                  objectFit: "contain",
                                },
                              }}
                            >
                              <Logo />
                            </Box>
                            
                            {/* Provider Name */}
                            <Typography
                              sx={{
                                fontSize: "12px",
                                fontWeight: isSelected ? 600 : 500,
                                color: isSelected ? "#13715B" : "#374151",
                                textAlign: "center",
                              }}
                            >
                              {provider.name}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {/* Conditional Fields Based on Provider */}
            {config.model.accessMethod && (
              <Box ref={formFieldsRef}>
                <Stack spacing={3}>
                  {/* Model Selection - Dropdown for cloud providers, text input for local */}
                  {PROVIDERS[config.model.accessMethod] ? (
                    <Box>
                      <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151", mb: 1 }}>
                        Model
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={config.model.name}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              model: { ...prev.model, name: e.target.value as string },
                            }))
                          }
                          displayEmpty
                          sx={{
                            fontSize: "13px",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#E5E7EB",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#D1D5DB",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#13715B",
                            },
                          }}
                        >
                          <MenuItem value="" disabled>
                            <Typography sx={{ color: "#9CA3AF", fontSize: "13px" }}>
                              Select a model
                            </Typography>
                          </MenuItem>
                          {getProviderModels(config.model.accessMethod).map((model) => (
                            <MenuItem key={model.id} value={model.id}>
                              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: "100%" }}>
                                <Typography sx={{ fontSize: "13px" }}>{model.name}</Typography>
                                {model.inputCost !== undefined && (
                                  <Typography sx={{ fontSize: "11px", color: "#9CA3AF" }}>
                                    ${model.inputCost}/1M in • ${model.outputCost}/1M out
                                  </Typography>
                                )}
                              </Stack>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  ) : (
                    <Field
                      label="Model name"
                      value={config.model.name}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          model: { ...prev.model, name: e.target.value },
                        }))
                      }
                      placeholder={
                        config.model.accessMethod === "ollama" 
                          ? "e.g., llama2, mistral, codellama" 
                          : config.model.accessMethod === "huggingface"
                          ? "e.g., TinyLlama/TinyLlama-1.1B-Chat-v1.0"
                          : "e.g., gpt-4, claude-3-opus"
                      }
                    />
                  )}

                  {/* URL field for Local and Custom API */}
                  {(selectedModelProvider && 'needsUrl' in selectedModelProvider && selectedModelProvider.needsUrl) && (
                    <Field
                      label="Endpoint URL"
                      value={config.model.endpointUrl}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          model: { ...prev.model, endpointUrl: e.target.value },
                        }))
                      }
                      placeholder={config.model.accessMethod === "local" 
                        ? "http://localhost:11434/api/generate" 
                        : "https://api.example.com/v1/chat/completions"
                      }
                    />
                  )}

                  {/* API Key - show configured status OR input field */}
                  {selectedModelProvider?.needsApiKey && (
                    hasApiKey(config.model.accessMethod) ? (
                      <Box sx={{ p: 1.5, backgroundColor: "#F0FDF4", borderRadius: "8px", border: "1px solid #D1FAE5" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Check size={16} color="#059669" />
                          <Typography sx={{ fontSize: "12px", color: "#065F46" }}>
                            API key configured — will be saved for future experiments
                          </Typography>
                        </Stack>
                      </Box>
                    ) : (
                      <Field
                        label="API Key"
                        type="password"
                        value={config.model.apiKey}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            model: { ...prev.model, apiKey: e.target.value },
                          }))
                        }
                        placeholder={`Enter your ${selectedModelProvider.name} API key`}
                        autoComplete="off"
                        helperText="Your key will be saved securely for future experiments"
                      />
                    )
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        );

      case 1:
        // Step 2: Dataset
        return (
          <Stack spacing="16px">
            {/* Description */}
            <Typography sx={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.5 }}>
              Choose a dataset containing prompts and expected outputs. Upload your own JSON file, select from saved datasets, or use a template.
              </Typography>

            {/* Option 1: Custom dataset */}
            <Box>
              <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", mb: "8px" }}>
                Option 1: Use custom dataset
              </Typography>
              {/* Upload Section - Compact drop zone */}
              <Box
              component="label"
                  sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                    p: "8px",
                border: "1px dashed",
                borderColor: uploadingDataset ? "#13715B" : "#D1D5DB",
                borderRadius: "4px",
                backgroundColor: "#FAFAFA",
                cursor: uploadingDataset ? "wait" : "pointer",
                transition: "all 0.15s ease",
                "&:hover": { borderColor: "#13715B", backgroundColor: "#F0FDF4" },
              }}
            >
              <Box
                  sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "6px",
                  backgroundColor: "#13715B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Upload size={16} color="#FFFFFF" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
                  {uploadingDataset ? "Uploading..." : "Upload dataset"}
                      </Typography>
                <Typography sx={{ fontSize: "11px", color: "#9CA3AF" }}>
                  JSON file with prompts and expected outputs
                      </Typography>
                    </Box>
                  <input
                    type="file"
                    accept="application/json"
                    hidden
                disabled={uploadingDataset}
                    onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                        try {
                          setUploadingDataset(true);
                          // Validate file content before uploading
                          const fileContent = await file.text();
                          let parsedData: unknown[];
                          try {
                            parsedData = JSON.parse(fileContent);
                          } catch {
                            setAlert({ show: true, variant: "error", title: "Invalid JSON", body: "The file does not contain valid JSON" });
                            return;
                          }
                          if (!Array.isArray(parsedData) || parsedData.length === 0) {
                            setAlert({ show: true, variant: "error", title: "Empty dataset", body: "Cannot use an empty dataset. Please upload a file with at least one prompt." });
                            return;
                          }
                          // Count only prompts with actual content
                          const validPromptCount = parsedData.filter((item) => {
                            if (typeof item !== "object" || item === null) return false;
                            const obj = item as Record<string, unknown>;
                            // Single-turn: check if prompt field has content
                            if (obj.prompt && typeof obj.prompt === "string" && obj.prompt.trim()) return true;
                            // Multi-turn: check if turns array has at least one turn with content
                            if (Array.isArray(obj.turns) && obj.turns.length > 0) {
                              return obj.turns.some((turn) => {
                                if (typeof turn !== "object" || turn === null) return false;
                                const t = turn as Record<string, unknown>;
                                return t.content && typeof t.content === "string" && t.content.trim();
                              });
                            }
                            return false;
                          }).length;
                          if (validPromptCount === 0) {
                            setAlert({ show: true, variant: "error", title: "Empty dataset", body: "Cannot use an empty dataset. Please upload a file with prompts that have actual content." });
                            return;
                          }
                          const resp = await deepEvalDatasetsService.uploadDataset(file);
                    const newDataset = { id: resp.path, name: file.name.replace(/\.json$/i, ""), path: resp.path, promptCount: validPromptCount };
                    setUserDatasets((prev) => [newDataset, ...prev]);
                    setSelectedUserDataset(newDataset);
                    setConfig((prev) => ({ ...prev, dataset: { ...prev.dataset, useBuiltin: false } }));
                          try {
                            const { prompts } = await deepEvalDatasetsService.read(resp.path);
                            setDatasetPrompts((prompts || []) as DatasetPrompt[]);
                            setDatasetLoaded(true);
                          } catch {
                      setDatasetPrompts([]);
                    }
                    setAlert({ show: true, variant: "success", title: "Uploaded!", body: `${file.name} is ready to use` });
                        } catch (err) {
                    setAlert({ show: true, variant: "error", title: "Upload failed", body: err instanceof Error ? err.message : "Failed to upload" });
                        } finally {
                          setUploadingDataset(false);
                    e.target.value = "";
                      }
                    }}
                  />
              </Box>
            </Box>

            {/* My Datasets Section */}
            {loadingUserDatasets ? (
              <Box sx={{ py: 2, textAlign: "center" }}>
                <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>Loading your datasets...</Typography>
              </Box>
            ) : userDatasets.length > 0 ? (
                <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Option 2: Your datasets
                  </Typography>
                  <Button
                  size="small"
                    variant="text"
                    startIcon={<ExternalLink size={12} />}
                    onClick={() => window.open(`/evals/${projectId}#datasets`, "_blank")}
                    sx={{ textTransform: "none", fontSize: "11px", color: "#6B7280", p: 0.5, minWidth: "auto", "&:hover": { color: "#13715B" } }}
                  >
                    Manage
                  </Button>
                </Stack>
                <Stack spacing="8px">
                  {userDatasets.slice(0, 4).map((dataset) => {
                    const isSelected = selectedUserDataset?.id === dataset.id && !config.dataset.useBuiltin;
                    const isMultiTurn = dataset.turnType === "multi-turn";
                    const isSimulated = dataset.turnType === "simulated";
                    const isEmpty = dataset.promptCount === 0;
                    const typeChip = isEmpty ? (
                      <Chip label="Empty" backgroundColor="#FEE2E2" textColor="#DC2626" uppercase={false} />
                    ) : isMultiTurn ? (
                      <Chip label={isSelected && datasetPrompts.length > 0 ? `${datasetPrompts.length} prompts` : "Multi-Turn"} backgroundColor="#E3F2FD" textColor="#1565C0" uppercase={false} />
                    ) : isSimulated ? (
                      <Chip label={isSelected && datasetPrompts.length > 0 ? `${datasetPrompts.length} prompts` : "Simulated"} backgroundColor="#F3E8FF" textColor="#7C3AED" uppercase={false} />
                    ) : (
                      <Chip label={isSelected && datasetPrompts.length > 0 ? `${datasetPrompts.length} prompts` : "Single-Turn"} backgroundColor="#FEF3C7" textColor="#92400E" uppercase={false} />
                    );
                    return (
                      <SelectableCard
                        key={dataset.id}
                        isSelected={isSelected}
                        disabled={isEmpty}
                        onClick={async () => {
                          if (isEmpty) return;
                          setConfig((prev) => ({ ...prev, dataset: { ...prev.dataset, useBuiltin: false } }));
                          setSelectedUserDataset(dataset);
                          setSelectedPresetPath("");
                          try {
                            const { prompts } = await deepEvalDatasetsService.read(dataset.path);
                            setDatasetPrompts((prompts || []) as DatasetPrompt[]);
                            setDatasetLoaded(true);
                          } catch {
                            setDatasetPrompts([]);
                          }
                        }}
                        icon={<Database size={14} color={isEmpty ? "#DC2626" : isSelected ? "#13715B" : "#9CA3AF"} />}
                        title={dataset.name}
                        description={isEmpty ? "Cannot use empty dataset" : "Custom uploaded dataset"}
                        chip={typeChip}
                      />
                    );
                  })}
                </Stack>
              </Box>
            ) : null}

            {/* Template Datasets Section */}
            <Box>
              <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", mb: 1 }}>
                Option 3: {config.taskType === "chatbot" ? "Chatbot" : config.taskType === "rag" ? "RAG" : "Agent"} templates
                  </Typography>
              <Stack spacing="8px">
                {[
                  ...(config.taskType === "chatbot" ? [
                    // Single-turn chatbot templates
                    { name: "Basic Chatbot", path: "chatbot/chatbot_basic.json", desc: "Standard question-answer pairs", type: "single-turn" as const },
                    { name: "Coding Helper", path: "chatbot/chatbot_coding_helper.json", desc: "Code assistance scenarios", type: "single-turn" as const },
                    { name: "Customer Support (Single-Turn)", path: "chatbot/chatbot_customer_support.json", desc: "Support Q&A pairs", type: "single-turn" as const },
                    // Multi-turn chatbot templates
                    { name: "General Assistant Multi-Turn", path: "chatbot/chatbot_general_assistant_multiturn.json", desc: "Multi-turn conversations", type: "multi-turn" as const },
                    { name: "Customer Support Multi-Turn", path: "chatbot/chatbot_customer_support_multiturn.json", desc: "Support conversations", type: "multi-turn" as const },
                    { name: "Tech Support Multi-Turn", path: "chatbot/chatbot_tech_support_multiturn.json", desc: "Technical help conversations", type: "multi-turn" as const },
                  ] : []),
                  ...(config.taskType === "rag" ? [
                    { name: "Product Docs", path: "rag/rag_product_docs.json", desc: "Product documentation queries", type: "single-turn" as const },
                    { name: "Wikipedia QA", path: "rag/rag_wikipedia_small.json", desc: "Wikipedia-based questions", type: "single-turn" as const },
                    { name: "Research Papers", path: "rag/rag_research_papers.json", desc: "Academic content retrieval", type: "single-turn" as const },
                    { name: "Document Q&A Multi-Turn", path: "rag/rag_document_qa_multiturn.json", desc: "Multi-turn document conversations", type: "multi-turn" as const },
                  ] : []),
                  ...(config.taskType === "agent" ? [
                    { name: "Agent Planning", path: "agent/agent_planning_multiturn.json", desc: "Multi-step planning scenarios", type: "multi-turn" as const },
                    { name: "Agent Task Execution", path: "agent/agent_task_execution_multiturn.json", desc: "Tool usage and task completion", type: "multi-turn" as const },
                    { name: "Agent Workflow Automation", path: "agent/agent_workflow_automation_multiturn.json", desc: "Automated workflow tasks", type: "multi-turn" as const },
                  ] : []),
                ].map((template) => {
                  const isSelected = selectedPresetPath === template.path && config.dataset.useBuiltin;
                  const chipLabel = isSelected && datasetPrompts.length > 0 ? `${datasetPrompts.length} prompts` : (template.type === "multi-turn" ? "Multi-Turn" : "Single-Turn");
                  const typeChip = template.type === "multi-turn" ? (
                    <Chip label={chipLabel} backgroundColor="#E3F2FD" textColor="#1565C0" uppercase={false} />
                  ) : (
                    <Chip label={chipLabel} backgroundColor="#FEF3C7" textColor="#92400E" uppercase={false} />
                  );
                  return (
                    <SelectableCard
                      key={template.path}
                      isSelected={isSelected}
                      onClick={async () => {
                        setConfig((prev) => ({ ...prev, dataset: { ...prev.dataset, useBuiltin: true } }));
                        setSelectedUserDataset(null);
                        setSelectedPresetPath(template.path);
                        try {
                          const { prompts } = await deepEvalDatasetsService.read(template.path);
                          setDatasetPrompts((prompts || []) as DatasetPrompt[]);
                          setDatasetLoaded(true);
                        } catch {
                          setDatasetPrompts([]);
                        }
                      }}
                      icon={<Database size={14} color={isSelected ? "#6366F1" : "#9CA3AF"} />}
                      title={template.name}
                      description={template.desc}
                      accentColor="#6366F1"
                      chip={typeChip}
                    />
                  );
                })}
              </Stack>
            </Box>
          </Stack>
        );

      case 2:
        // Step 3: Scorer / Judge - Choose evaluation method
        return (
          <Stack spacing="16px">
            {/* Mode Toggle - 3 Options */}
            <Stack spacing="8px">
              <SelectableCard
                isSelected={judgeMode === "scorer"}
                onClick={() => {
                  setJudgeMode("scorer");
                  setConfig((prev) => ({ ...prev, judgeLlm: { ...prev.judgeLlm, provider: "" } }));
                }}
                icon={<Sparkles size={14} color={judgeMode === "scorer" ? "#13715B" : "#9CA3AF"} />}
                title="Custom scorer only"
                description="Use your own prompts for domain-specific evaluation"
              />
              <SelectableCard
                isSelected={judgeMode === "standard"}
                onClick={() => {
                  setJudgeMode("standard");
                  setSelectedScorer(null);
                }}
                icon={<Settings size={14} color={judgeMode === "standard" ? "#13715B" : "#9CA3AF"} />}
                title="Standard judge only"
                description="Use built-in metrics with fixed evaluation criteria"
              />
              <SelectableCard
                isSelected={judgeMode === "both"}
                onClick={() => setJudgeMode("both")}
                icon={<Layers size={14} color={judgeMode === "both" ? "#13715B" : "#9CA3AF"} />}
                title="Judge + scorer"
                description="Use both built-in metrics and your custom scorers"
              />
            </Stack>

            {/* Custom Scorers Section - shown for "scorer" and "both" modes */}
            {(judgeMode === "scorer" || judgeMode === "both") && (
              <Box>
                {loadingScorers ? (
                  <Box sx={{ py: 3, textAlign: "center" }}>
                    <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>Loading your scorers...</Typography>
                  </Box>
                ) : userScorers.length > 0 ? (
                  <Box>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                      <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Your Scorers
                      </Typography>
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<ExternalLink size={12} />}
                        onClick={() => window.open(`/evals/${projectId}#scorers`, "_blank")}
                        sx={{ textTransform: "none", fontSize: "11px", color: "#6B7280", p: 0.5, minWidth: "auto", "&:hover": { color: "#13715B" } }}
                      >
                        Manage
                      </Button>
                    </Stack>
                    <Stack spacing="8px">
                      {userScorers.map((scorer) => {
                        const isSelected = selectedScorer?.id === scorer.id;
                        const modelName = typeof scorer.config?.judgeModel === 'string'
                          ? scorer.config.judgeModel
                          : scorer.config?.judgeModel?.name || scorer.config?.model || "LLM Judge";
                        return (
                          <SelectableCard
                            key={scorer.id}
                            isSelected={isSelected}
                            onClick={() => setSelectedScorer(scorer)}
                            icon={<Sparkles size={14} color={isSelected ? "#13715B" : "#9CA3AF"} />}
                            title={scorer.name}
                            description={`${modelName} • ${scorer.metricKey}`}
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                ) : (
                  <Box sx={{ py: 4, textAlign: "center", border: "1px dashed #E5E7EB", borderRadius: "8px" }}>
                    <Sparkles size={32} color="#D1D5DB" style={{ marginBottom: 8 }} />
                    <Typography sx={{ fontSize: "14px", color: "#6B7280", mb: 1 }}>
                      No custom scorers yet
                    </Typography>
                    <Typography sx={{ fontSize: "12px", color: "#9CA3AF", mb: 2 }}>
                      Create a scorer to use custom evaluation criteria
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Plus size={14} />}
                      onClick={() => window.open(`/evals/${projectId}#scorers`, "_blank")}
                      sx={{
                        textTransform: "none",
                        fontSize: "12px",
                        color: "#13715B",
                        borderColor: "#13715B",
                        "&:hover": { borderColor: "#0F5E4B", backgroundColor: "#F0FDF4" },
                      }}
                    >
                      Create Scorer
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {/* Divider between sections when in "both" mode */}
            {judgeMode === "both" && (
              <Box sx={{ pt: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", mb: 1 }}>
                  Standard Judge Configuration
                </Typography>
              </Box>
            )}

            {/* Standard Judge Section - shown for "standard" and "both" modes */}
            {(judgeMode === "standard" || judgeMode === "both") && (
              <>
                {judgeMode === "standard" && (
                  <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", mb: 1 }}>
                    Select a Provider
                  </Typography>
                )}
                <Box>
                  <Grid container spacing="8px">
                    {availableJudgeProviders.map((provider) => {
                      const { Logo } = provider;
                      const isSelected = config.judgeLlm.provider === provider.id;
                      
                      return (
                        <Grid item xs={4} sm={3} key={provider.id}>
                          <Card
                            onClick={() =>
                              setConfig((prev) => ({
                                ...prev,
                                judgeLlm: {
                                  ...prev.judgeLlm,
                                  provider: provider.id,
                                  model: "", // Reset model when changing provider
                                },
                              }))
                            }
                            sx={{
                              cursor: "pointer",
                              border: "1px solid",
                              borderColor: isSelected ? "#13715B" : "#E5E7EB",
                              backgroundColor: "#FFFFFF",
                              boxShadow: "none",
                              transition: "all 0.2s ease",
                              position: "relative",
                              height: "100%",
                              "&:hover": {
                                borderColor: "#13715B",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                              },
                            }}
                          >
                            <CardContent
                              sx={{
                                textAlign: "center",
                                py: 3,
                                px: 2,
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                "&:last-child": { pb: 3 },
                              }}
                            >
                              {isSelected && (
                                <Box
                                  sx={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    backgroundColor: "#13715B",
                                    borderRadius: "50%",
                                    width: 20,
                                    height: 20,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Check size={12} color="#FFFFFF" strokeWidth={3} />
                                </Box>
                              )}
                              
                              {/* Provider Logo */}
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "100%",
                                  height: provider.id === "huggingface" || provider.id === "xai" ? 56 : 48,
                                  mb: 1.5,
                                  "& svg": {
                                    maxWidth: provider.id === "huggingface" || provider.id === "xai" ? "100%" : "90%",
                                    maxHeight: "100%",
                                    width: "auto",
                                    height: "auto",
                                    objectFit: "contain",
                                  },
                                }}
                              >
                                <Logo />
                              </Box>
                              
                              {/* Provider Name */}
                              <Typography
                                sx={{
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  color: "#374151",
                                  lineHeight: 1.3,
                                  mt: "auto",
                                }}
                              >
                                {provider.name}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>

                {config.judgeLlm.provider && (
                  <Box ref={formFieldsRef}>
                    <Stack spacing={3}>
                      {/* Model Selection - Dropdown for cloud providers, text input for local */}
                      {PROVIDERS[config.judgeLlm.provider] ? (
                        <Box>
                          <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151", mb: 1 }}>
                            Model
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={config.judgeLlm.model}
                              onChange={(e) =>
                                setConfig((prev) => ({
                                  ...prev,
                                  judgeLlm: { ...prev.judgeLlm, model: e.target.value as string },
                                }))
                              }
                              displayEmpty
                              sx={{
                                fontSize: "13px",
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "#E5E7EB",
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "#D1D5DB",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "#13715B",
                                },
                              }}
                            >
                              <MenuItem value="" disabled>
                                <Typography sx={{ color: "#9CA3AF", fontSize: "13px" }}>
                                  Select a model
                                </Typography>
                              </MenuItem>
                              {getProviderModels(config.judgeLlm.provider).map((model) => (
                                <MenuItem key={model.id} value={model.id}>
                                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: "100%" }}>
                                    <Typography sx={{ fontSize: "13px" }}>{model.name}</Typography>
                                    {model.inputCost !== undefined && (
                                      <Typography sx={{ fontSize: "11px", color: "#9CA3AF" }}>
                                        ${model.inputCost}/1M in
                                      </Typography>
                                    )}
                                  </Stack>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      ) : (
                        <Field
                          label="Model Name"
                          value={config.judgeLlm.model}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              judgeLlm: { ...prev.judgeLlm, model: e.target.value },
                            }))
                          }
                          placeholder={
                            config.judgeLlm.provider === "ollama"
                              ? "e.g., llama2, mistral, codellama"
                              : "e.g., gpt-4, claude-3-opus"
                          }
                        />
                      )}

                      {/* API Key - show configured status OR input field */}
                      {selectedProvider?.needsApiKey && (
                        hasApiKey(config.judgeLlm.provider) ? (
                          <Box sx={{ p: 1.5, backgroundColor: "#F0FDF4", borderRadius: "8px", border: "1px solid #D1FAE5" }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Check size={16} color="#059669" />
                              <Typography sx={{ fontSize: "12px", color: "#065F46" }}>
                                API key configured — will be saved for future experiments
                              </Typography>
                            </Stack>
                          </Box>
                        ) : (
                          <Field
                            label="API Key"
                            type="password"
                            value={config.judgeLlm.apiKey}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                judgeLlm: { ...prev.judgeLlm, apiKey: e.target.value },
                              }))
                            }
                            placeholder={`Enter your ${selectedProvider.name} API key`}
                            autoComplete="off"
                            helperText="Your key will be saved securely for future experiments"
                          />
                        )
                      )}

                      <Stack direction="row" spacing={3}>
                        <Field
                          label="Temperature"
                          type="number"
                          value={String(config.judgeLlm.temperature)}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              judgeLlm: { ...prev.judgeLlm, temperature: parseFloat(e.target.value) || 0 },
                            }))
                          }
                        />
                        <Field
                          label="Max tokens"
                          type="number"
                          value={String(config.judgeLlm.maxTokens)}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              judgeLlm: { ...prev.judgeLlm, maxTokens: parseInt(e.target.value) || 0 },
                            }))
                          }
                        />
                      </Stack>
                    </Stack>
                  </Box>
                )}
              </>
            )}
          </Stack>
        );

      case 3:
        // Step 4: Metrics - organized by use case
        // If using scorer-only mode, don't show metrics selection
        if (judgeMode === "scorer") {
          return (
            <Stack spacing={3}>
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  backgroundColor: "#F9FAFB",
                }}
              >
                <Typography sx={{ fontSize: "15px", fontWeight: 600, color: "#374151", mb: 1 }}>
                  No metrics available
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: "auto" }}>
                  Standard metrics require a Judge LLM. 
                  <br /> Your custom scorer will be used instead.
                </Typography>
              </Box>
            </Stack>
          );
        }

        return (
          <Stack spacing="16px">
            <Box>
              <Typography variant="body2" color="text.secondary">
                {isMultiTurnDataset 
                  ? "Select metrics for your multi-turn conversation evaluation."
                  : "Select metrics for your evaluation. Universal core metrics run for all use cases."}
              </Typography>
              {isMultiTurnDataset && (
                <Box sx={{ mt: 1.5, mb: 3 }}>
                  <Chip 
                    label="Multi-turn dataset detected" 
                    size="small" 
                    backgroundColor="#DBEAFE"
                    textColor="#1E40AF"
                  />
                </Box>
              )}
            </Box>

            {/* Conversational Metrics - For Multi-turn Datasets */}
            {isMultiTurnDataset && (
              <Accordion
                defaultExpanded
                disableGutters
                elevation={0}
                sx={{
                  border: "1px solid #DBEAFE",
                  borderRadius: "4px !important",
                  backgroundColor: "#F0F9FF",
                  "&:before": { display: "none" },
                  "&.Mui-expanded": { margin: 0 },
                }}
              >
                <AccordionSummary
                  expandIcon={<ChevronDown size={18} color="#1E40AF" />}
                  sx={{
                    minHeight: 48,
                    px: "8px",
                    "&.Mui-expanded": { minHeight: 48 },
                    "& .MuiAccordionSummary-content": { my: "8px" },
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#1E40AF" }}>
                      Conversational Metrics
                    </Typography>
                    <Typography variant="caption" sx={{ mt: 0.5, display: "block", color: "#3B82F6" }}>
                      Designed for multi-turn conversation evaluation
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: "12px", pt: "12px", pb: "16px" }}>
                  <Stack spacing={2.5}>
                    {Object.entries({
                      turnRelevancy: {
                        label: "Turn Relevancy",
                        desc: "Evaluates if each assistant response is relevant to the user's input in that turn.",
                      },
                      knowledgeRetention: {
                        label: "Knowledge Retention",
                        desc: "Checks if the model retains context and information across conversation turns.",
                      },
                      conversationCoherence: {
                        label: "Conversation Coherence",
                        desc: "Evaluates overall coherence, correctness, and logical consistency across turns.",
                      },
                      conversationHelpfulness: {
                        label: "Conversation Helpfulness",
                        desc: "Measures how helpful the assistant is in addressing the user's needs throughout.",
                      },
                      taskCompletion: {
                        label: "Task Completion",
                        desc: "Evaluates if the conversation successfully achieved the expected outcome.",
                      },
                      conversationSafety: {
                        label: "Conversation Safety",
                        desc: "Checks for toxic, biased, or harmful content across all conversation turns.",
                      },
                    }).map(([key, meta]) => (
                      <Box key={key}>
                        <Checkbox
                          id={`metric-${key}`}
                          label={(meta as { label: string }).label}
                          size="small"
                          value={key}
                          isChecked={config.metrics[key as keyof typeof config.metrics]}
                          onChange={() =>
                            setConfig((prev) => ({
                              ...prev,
                              metrics: {
                                ...prev.metrics,
                                [key]: !prev.metrics[key as keyof typeof prev.metrics],
                              },
                            }))
                          }
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: 3.5, mt: 0.5, pr: 2, display: "block", fontSize: "12px", lineHeight: 1.4 }}
                        >
                          {(meta as { desc: string }).desc}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Per-Turn Safety Metrics (for multi-turn) */}
            {isMultiTurnDataset && (
              <Box sx={{ p: 2.5, border: "1px solid #FED7AA", borderRadius: "4px", backgroundColor: "#FFF7ED" }}>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#C2410C", mb: 0.5 }}>
                  Per-Turn Safety Metrics
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mb: 2, color: "#EA580C" }}>
                  Bias and Toxicity will be evaluated on each assistant turn and aggregated
                </Typography>
                <Stack direction="row" spacing={4}>
                  <Checkbox
                    id="metric-toxicity-perturn"
                    label="Toxicity (per-turn)"
                    size="small"
                    value="toxicity"
                    isChecked={config.metrics.toxicity}
                    onChange={() =>
                      setConfig((prev) => ({
                        ...prev,
                        metrics: { ...prev.metrics, toxicity: !prev.metrics.toxicity },
                      }))
                    }
                  />
                  <Checkbox
                    id="metric-bias-perturn"
                    label="Bias (per-turn)"
                    size="small"
                    value="bias"
                    isChecked={config.metrics.bias}
                    onChange={() =>
                      setConfig((prev) => ({
                        ...prev,
                        metrics: { ...prev.metrics, bias: !prev.metrics.bias },
                      }))
                    }
                  />
                </Stack>
              </Box>
            )}

            {/* Universal Core Metrics - For Single-turn Datasets */}
            {!isMultiTurnDataset && (
              <Accordion
                defaultExpanded
                disableGutters
                elevation={0}
                sx={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "4px !important",
                  "&:before": { display: "none" },
                  "&.Mui-expanded": { margin: 0 },
                }}
              >
                <AccordionSummary
                  expandIcon={<ChevronDown size={18} color="#6B7280" />}
                  sx={{
                    minHeight: 48,
                    px: "8px",
                    "&.Mui-expanded": { minHeight: 48 },
                    "& .MuiAccordionSummary-content": { my: "8px" },
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#424242" }}>
                      Universal Core Metrics
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                      Runs for every use case (Chatbot, RAG, Agent)
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: "12px", pt: "12px", pb: "16px" }}>
                  <Stack spacing={2.5}>
                    {Object.entries({
                      answerRelevancy: {
                        label: "Answer Relevancy",
                        desc: "Measures how relevant the model's answer is to the input (GEval).",
                      },
                      correctness: {
                        label: "Correctness",
                        desc: "Evaluates factual accuracy of the model's response (GEval).",
                      },
                      completeness: {
                        label: "Completeness",
                        desc: "Checks if the response fully addresses all aspects of the query (GEval).",
                      },
                      hallucination: {
                        label: "Hallucination",
                        desc: "Detects fabricated or unsupported information in outputs (GEval).",
                      },
                      instructionFollowing: {
                        label: "Instruction Following",
                        desc: "Measures how well the model follows the given instructions.",
                      },
                      toxicity: {
                        label: "Toxicity",
                        desc: "Flags toxic or harmful language in outputs.",
                      },
                      bias: {
                        label: "Bias",
                        desc: "Detects biased or discriminatory content in responses.",
                      },
                    }).map(([key, meta]) => (
                      <Box key={key}>
                        <Checkbox
                          id={`metric-${key}`}
                          label={(meta as { label: string }).label}
                          size="small"
                          value={key}
                          isChecked={config.metrics[key as keyof typeof config.metrics]}
                          onChange={() =>
                            setConfig((prev) => ({
                              ...prev,
                              metrics: {
                                ...prev.metrics,
                                [key]: !prev.metrics[key as keyof typeof prev.metrics],
                              },
                            }))
                          }
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: 3.5, mt: 0.5, pr: 2, display: "block", fontSize: "12px", lineHeight: 1.4 }}
                        >
                          {(meta as { desc: string }).desc}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
                </Accordion>
            )}

            {/* RAG-Specific Metrics (single-turn only) */}
            {config.taskType === "rag" && !isMultiTurnDataset && (
              <Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#424242", mb: 1.5 }}>
                  RAG Metrics
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  Requires retrieval_context in your dataset
                </Typography>
                {Object.entries({
                  contextRelevancy: {
                    label: "Context Relevancy",
                    desc: "Measures whether retrieved context is relevant to the query.",
                  },
                  contextPrecision: {
                    label: "Context Precision",
                    desc: "Evaluates if the retrieved context contains only relevant information.",
                  },
                  contextRecall: {
                    label: "Context Recall",
                    desc: "Checks if all relevant information needed for the answer was retrieved.",
                  },
                  faithfulness: {
                    label: "Faithfulness",
                    desc: "Checks if the answer is grounded in the provided retrieval context.",
                  },
                }).map(([key, meta]) => (
                  <Box key={key} sx={{ mb: 1.5 }}>
                    <Stack spacing={0.5}>
                      <Checkbox
                        id={`metric-${key}`}
                        label={(meta as { label: string }).label}
                        size="small"
                        value={key}
                        isChecked={config.metrics[key as keyof typeof config.metrics]}
                        onChange={() =>
                          setConfig((prev) => ({
                            ...prev,
                            metrics: {
                              ...prev.metrics,
                              [key]: !prev.metrics[key as keyof typeof prev.metrics],
                            },
                          }))
                        }
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 4, pr: 2, display: "block", fontSize: "12px" }}
                      >
                        {(meta as { desc: string }).desc}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Box>
            )}

            {/* Agent-Specific Metrics (single-turn only) */}
            {config.taskType === "agent" && !isMultiTurnDataset && (
              <Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#424242", mb: 1.5 }}>
                  Agent Metrics
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  Specifically designed for evaluating AI agents with tool usage
                </Typography>
                {Object.entries({
                  toolSelection: {
                    label: "Tool Selection",
                    desc: "Evaluates whether the agent selected the appropriate tool for the task.",
                  },
                  toolCorrectness: {
                    label: "Tool Correctness",
                    desc: "Measures whether the agent used tools with correct parameters.",
                  },
                  actionRelevance: {
                    label: "Action Relevance",
                    desc: "Checks if the agent's actions are relevant to achieving the goal.",
                  },
                  planningQuality: {
                    label: "Planning Quality",
                    desc: "Evaluates the quality and efficiency of the agent's multi-step plan.",
                  },
                }).map(([key, meta]) => (
                  <Box key={key} sx={{ mb: 1.5 }}>
                    <Stack spacing={0.5}>
                      <Checkbox
                        id={`metric-${key}`}
                        label={(meta as { label: string }).label}
                        size="small"
                        value={key}
                        isChecked={config.metrics[key as keyof typeof config.metrics]}
                        onChange={() =>
                          setConfig((prev) => ({
                            ...prev,
                            metrics: {
                              ...prev.metrics,
                              [key]: !prev.metrics[key as keyof typeof prev.metrics],
                            },
                          }))
                        }
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 4, pr: 2, display: "block", fontSize: "12px" }}
                      >
                        {(meta as { desc: string }).desc}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Box>
            )}
          </Stack>
        );

      default:
        return null;
    }
  };

  const canProceed = (() => {
    if (activeStep === 0) {
      // Step 1: Model validation
      const hasName = !!config.model.name;
      const hasAccessMethod = !!config.model.accessMethod;
      
      if (!hasName || !hasAccessMethod) return false;
      
      // Check conditional fields based on access method
      if (selectedModelProvider && 'needsUrl' in selectedModelProvider && selectedModelProvider.needsUrl && !config.model.endpointUrl) return false;
      
      // Providers that don't need API keys
      const noApiKeyNeeded = ["ollama", "local"];
      
      // For all cloud providers (including custom_api), require either a saved API key OR an entered API key
      if (!noApiKeyNeeded.includes(config.model.accessMethod)) {
        // Map custom_api to "custom" for checking saved keys
        const providerForKeyCheck = config.model.accessMethod === "custom_api" ? "custom" : config.model.accessMethod;
        const hasSavedKey = hasApiKey(providerForKeyCheck);
        const hasEnteredKey = !!config.model.apiKey;
        if (!hasSavedKey && !hasEnteredKey) return false;
      }
      
      return true;
    }

    if (activeStep === 1) {
      // Step 2: Dataset validation - must have loaded prompts
      return datasetPrompts.length > 0;
    }
    
    if (activeStep === 2) {
      // Step 3: Scorer / Judge validation
      if (judgeMode === "scorer") {
        // Custom scorer only - must have a scorer selected
        return !!selectedScorer;
      } else if (judgeMode === "standard") {
        // Standard judge only - must have provider and model (API key is from saved settings)
        return !!(
          config.judgeLlm.provider &&
          config.judgeLlm.model
        );
      } else {
        // Both mode - must have scorer selected AND standard judge configured
        const hasScorer = !!selectedScorer;
        const hasJudge = !!(
          config.judgeLlm.provider &&
          config.judgeLlm.model
        );
        return hasScorer && hasJudge;
      }
    }
    
    return true;
  })();

  return (
    <>
      <StepperModal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          resetForm();
          setAlert(null);
        }}
        title="Create new eval"
        steps={steps}
        activeStep={activeStep}
        onNext={handleNext}
        onBack={handleBack}
        onSubmit={handleSubmit}
        isSubmitting={loading}
        canProceed={canProceed}
        submitButtonText="Start Eval"
        maxWidth="700px"
      >
        {renderStepContent()}
      </StepperModal>
      
      {/* Alert toast for success/error messages */}
      {alert?.show && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast
          onClick={() => setAlert(null)}
        />
      )}
    </>
  );
}



