import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Button,
  Select,
  MenuItem,
} from "@mui/material";
import { Check, ChevronDown, Trash2 } from "lucide-react";
import StepperModal from "../../components/Modals/StepperModal";
import Field from "../../components/Inputs/Field";
import Checkbox from "../../components/Inputs/Checkbox";
import Alert from "../../components/Alert";

// Import provider logos
import { ReactComponent as OpenAILogo } from "../../assets/icons/openai_logo.svg";
import { ReactComponent as AnthropicLogo } from "../../assets/icons/anthropic_logo.svg";
import { ReactComponent as HuggingFaceLogo } from "../../assets/icons/huggingface_logo.svg";
import { ReactComponent as OllamaLogo } from "../../assets/icons/ollama_logo.svg";
import { ReactComponent as GeminiLogo } from "../../assets/icons/gemini_logo.svg";
import { ReactComponent as MistralLogo } from "../../assets/icons/mistral_logo.svg";
import { ReactComponent as XAILogo } from "../../assets/icons/xai_logo.svg";
import { ReactComponent as FolderFilledIcon } from "../../assets/icons/folder_filled.svg";
import { ReactComponent as BuildIcon } from "../../assets/icons/build.svg";
import { experimentsService } from "../../../infrastructure/api/evaluationLogsService";
import { deepEvalDatasetsService } from "../../../infrastructure/api/deepEvalDatasetsService";

interface NewExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
  onStarted?: (exp: { id: string; config: Record<string, unknown>; status: string; created_at?: string }) => void;
}

const steps = ["Model", "Dataset", "Judge LLM", "Metrics"];

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
  const [expandedPrompts, setExpandedPrompts] = useState<number[]>([]); // Track which prompts are expanded
  const [customDatasetFile, setCustomDatasetFile] = useState<File | null>(null);
  const [customDatasetPath, setCustomDatasetPath] = useState<string>("");
  const [uploadingDataset, setUploadingDataset] = useState(false);
  // No local cache needed; we fetch on demand when picking defaults
  // Dataset mode for chatbot: single-turn vs conversational (multi-turn).
  // Backend auto-detects shape; this toggle guides preset selection and UX copy.
  const [datasetMode, setDatasetMode] = useState<"single" | "conversational">("single");

  // Helper: auto-pick a default preset for the current taskType and datasetMode
  const pickDefaultPresetForMode = async (mode: "single" | "conversational") => {
    try {
      const list = await deepEvalDatasetsService.list();
      let opts = list[config.taskType] || [];
      if (config.taskType === "chatbot") {
        const isConv = (s: string) => /conversation|conversational|multi/.test(s);
        const isSingle = (s: string) => /singleturn|single|st_/.test(s);
        const filtered = opts.filter(ds => {
          const s = (ds.name + ds.path).toLowerCase();
          return mode === "conversational" ? isConv(s) : isSingle(s);
        });
        if (filtered.length > 0) opts = filtered;
      }
      if (opts.length > 0) {
        setSelectedPresetPath(opts[0].path);
        try {
          const { prompts } = await deepEvalDatasetsService.read(opts[0].path);
          let filtered = prompts as Array<{ category?: string }>;
          if (config.dataset.categories && config.dataset.categories.length > 0) {
            filtered = filtered.filter((p) => !!p && config.dataset.categories.includes(p.category || ""));
          }
          if (config.dataset.limit && config.dataset.limit > 0) {
            filtered = filtered.slice(0, config.dataset.limit);
          }
          setDatasetPrompts(filtered as DatasetPrompt[]);
          setDatasetLoaded(true);
        } catch {
          /* ignore read errors */
        }
      } else {
        // Fallback to known example presets if filtering didn’t find any
        if (config.taskType === "chatbot") {
          const fallbackPath =
            mode === "conversational"
              ? "chatbot/chatbot_conversations_example.json"
              : "chatbot/chatbot_singleturn_example.json";
          try {
            setSelectedPresetPath(fallbackPath);
            const { prompts } = await deepEvalDatasetsService.read(fallbackPath);
            setDatasetPrompts((prompts || []) as DatasetPrompt[]);
            setDatasetLoaded(true);
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      /* ignore */
    }
  };
  const [selectedPresetPath, setSelectedPresetPath] = useState<string>("");

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
    },
    // Step 4: Metrics (default: enable all supported chatbot metrics)
    metrics: {
      answerRelevancy: true,
      bias: true,
      toxicity: true,
      faithfulness: true,
      hallucination: true,
      contextualRelevancy: true,
      knowledgeRetention: true,
      conversationRelevancy: true,
      conversationCompleteness: true,
      roleAdherence: true,
    },
    thresholds: {
      answerRelevancy: 0.5,
      bias: 0.5,
      toxicity: 0.5,
      faithfulness: 0.5,
      hallucination: 0.5,
      contextualRelevancy: 0.5,
      knowledgeRetention: 0.5,
      conversationRelevancy: 0.5,
      conversationCompleteness: 0.5,
      roleAdherence: 0.5,
    },
  });

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  // Auto-select recommended mode + default preset when entering dataset step
  useEffect(() => {
    if (activeStep !== 1) return;
    if (!config.dataset.useBuiltin) return;
    if (config.taskType !== "chatbot") return;
    const recommended: "single" | "conversational" = "conversational";
    // If user hasn't interacted yet, align selection and preview.
    if (datasetMode !== recommended) {
      setDatasetMode(recommended);
    }
    void pickDefaultPresetForMode(recommended);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, config.taskType, config.dataset.useBuiltin]);

  // When dataset mode changes (user click), refresh preview from corresponding preset
  useEffect(() => {
    if (activeStep !== 1) return;
    if (!config.dataset.useBuiltin) return;
    if (config.taskType !== "chatbot") return;
    void pickDefaultPresetForMode(datasetMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetMode]);
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

  const handleRemovePrompt = (id: string) => {
    setDatasetPrompts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Prepare experiment configuration
      const experimentConfig = {
        project_id: projectId,
        name: `${config.model.name} - ${new Date().toLocaleDateString()}`,
        description: `Evaluating ${config.model.name} with ${datasetPrompts.length} prompts`,
        config: {
          project_id: projectId,  // Include in config for runner
          model: {
            name: config.model.name,
            accessMethod: config.model.accessMethod,
            endpointUrl: config.model.endpointUrl,
            apiKey: config.model.apiKey || undefined, // Send actual key to runner, backend won't store it
            modelPath: config.model.modelPath,
          },
          judgeLlm: {
            provider: config.judgeLlm.provider,
            model: config.judgeLlm.model,
            apiKey: config.judgeLlm.apiKey || undefined, // Send actual key to runner, backend won't store it
            temperature: config.judgeLlm.temperature,
            maxTokens: config.judgeLlm.maxTokens,
          },
          dataset: {
            useBuiltin: config.dataset.useBuiltin,
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
        title: "Eval Creation Failed",
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
    setExpandedPrompts([]);
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
      },
      metrics: {
        answerRelevancy: true,
        bias: true,
        toxicity: true,
        faithfulness: true,
        hallucination: true,
        contextualRelevancy: true,
        knowledgeRetention: true,
        conversationRelevancy: true,
        conversationCompleteness: true,
        roleAdherence: true,
      },
      thresholds: {
        answerRelevancy: 0.5,
        bias: 0.5,
        toxicity: 0.5,
        faithfulness: 0.5,
        hallucination: 0.5,
        contextualRelevancy: 0.5,
        knowledgeRetention: 0.5,
        conversationRelevancy: 0.5,
        conversationCompleteness: 0.5,
        roleAdherence: 0.5,
      },
    });
  };

  type ProviderType = "openai" | "anthropic" | "gemini" | "xai" | "huggingface" | "mistral" | "ollama" | "local" | "custom_api";

  const providers = [
    { id: "openai" as ProviderType, name: "OpenAI", Logo: OpenAILogo, models: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"], needsApiKey: true },
    { id: "anthropic" as ProviderType, name: "Anthropic", Logo: AnthropicLogo, models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"], needsApiKey: true },
    { id: "gemini" as ProviderType, name: "Gemini", Logo: GeminiLogo, models: ["gemini-pro", "gemini-ultra"], needsApiKey: true },
    { id: "xai" as ProviderType, name: "xAI", Logo: XAILogo, models: ["grok-1"], needsApiKey: true },
    { id: "mistral" as ProviderType, name: "Mistral", Logo: MistralLogo, models: ["mistral-large", "mistral-medium"], needsApiKey: true },
    { id: "huggingface" as ProviderType, name: "HuggingFace", Logo: HuggingFaceLogo, models: ["TinyLlama/TinyLlama-1.1B-Chat-v1.0"], needsApiKey: false },
    { id: "ollama" as ProviderType, name: "Ollama", Logo: OllamaLogo, models: ["llama2", "mistral", "codellama"], needsApiKey: false },
  ];

  const selectedProvider = providers.find(p => p.id === config.judgeLlm.provider);

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

  // Model providers - includes all Judge LLM providers plus Local and Custom API
  const modelProviders = [
    ...providers,
    { id: "local" as ProviderType, name: "Local", Logo: FolderFilledIcon, models: ["local-model"], needsApiKey: false, needsUrl: true },
    { id: "custom_api" as ProviderType, name: "Custom API", Logo: BuildIcon, models: ["custom-model"], needsApiKey: true, needsUrl: true },
  ];

  const selectedModelProvider = modelProviders.find(p => p.id === config.model.accessMethod);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        // Step 1: Model - Model to be evaluated
        return (
          <Stack spacing={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Configure the model that will be evaluated by the Judge LLM.
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ mb: 2.5, fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                Model Provider
              </Typography>
              <Grid container spacing={1.5}>
                {modelProviders.map((provider) => {
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
                              name: provider.name,
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

            {/* Conditional Fields Based on Provider */}
            {config.model.accessMethod && (
              <Box ref={formFieldsRef}>
                <Stack spacing={3}>
                  <Field
                    label="Model name"
                    value={config.model.name}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        model: { ...prev.model, name: e.target.value },
                      }))
                    }
                    placeholder="e.g., gpt-4, claude-3-opus, tinyllama"
                  />

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

                  {/* API Key field for providers that need it */}
                  {selectedModelProvider?.needsApiKey && (
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
                      placeholder="Enter your API key"
                      autoComplete="off"
                    />
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        );

      case 1:
        // Step 2: Dataset
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Configure the dataset to use for evaluation.
              </Typography>
            </Box>

            {/* Dataset form (mode) - rendered first */}
            {config.taskType === "chatbot" && (
              <Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#424242", mb: 1 }}>
                  Dataset form
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Chip
                    label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <span>Single‑turn</span>
                        {("single" === (config.taskType === "chatbot" ? "conversational" : "single") ? null : null)}
                      </Box>
                    }
                    color={datasetMode === "single" ? "success" : "default"}
                    onClick={async () => {
                      setDatasetMode("single");
                      if (config.dataset.useBuiltin) await pickDefaultPresetForMode("single");
                    }}
                    sx={{ height: 26, fontSize: "12px", cursor: "pointer" }}
                  />
                  <Chip
                    label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <span>Conversational (multi‑turn)</span>
                        {config.taskType === "chatbot" && (
                          <Chip label="Recommended" size="small" color="primary" sx={{ height: 16, fontSize: "10px" }} />
                        )}
                      </Box>
                    }
                    color={datasetMode === "conversational" ? "success" : "default"}
                    onClick={async () => {
                      setDatasetMode("conversational");
                      if (config.dataset.useBuiltin) await pickDefaultPresetForMode("conversational");
                    }}
                    sx={{ height: 26, fontSize: "12px", cursor: "pointer" }}
                  />
                </Stack>
                <Typography variant="body2" sx={{ fontSize: "12px", color: "#6B7280" }}>
                  Single‑turn evaluates isolated prompts. Conversational evaluates assistant turns within a chat history (multi‑turn).
                </Typography>
              </Box>
            )}

            {/* Dataset Source Selection - Radio Group */}
            <FormControl component="fieldset">
              <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#424242", mb: 1.5 }}>
                Dataset Source
              </Typography>
              <RadioGroup
                value={
                  config.dataset.useBuiltin
                    ? "builtin"
                    : customDatasetPath
                    ? "upload"
                    : "my"
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "builtin") {
                    setConfig((prev) => ({ ...prev, dataset: { ...prev.dataset, useBuiltin: true } }));
                    void handleLoadBuiltinDataset();
                  } else if (val === "my") {
                    setConfig((prev) => ({ ...prev, dataset: { ...prev.dataset, useBuiltin: false } }));
                    // Auto-select last uploaded from DB
                    (async () => {
                      try {
                        const res = await deepEvalDatasetsService.listMy();
                        const last = (res.datasets || [])[0];
                        if (last) {
                          setCustomDatasetPath(last.path);
                          const { prompts } = await deepEvalDatasetsService.read(last.path);
                          setDatasetPrompts((prompts || []) as DatasetPrompt[]);
                          setDatasetLoaded(true);
                        }
                      } catch { /* ignore */ }
                    })();
                  } else {
                    // upload now - set to custom flow (no path yet)
                    setConfig((prev) => ({ ...prev, dataset: { ...prev.dataset, useBuiltin: false } }));
                    setCustomDatasetFile(null);
                    setCustomDatasetPath("");
                  }
                }}
              >
                <FormControlLabel
                  value="my"
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#424242" }}>
                        My datasets
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#6B7280", mt: 0.5 }}>
                        Use one of your uploaded datasets (stored in Datasets tab)
                      </Typography>
                    </Box>
                  }
                  sx={{
                    border: "1px solid #E0E0E0",
                    borderRadius: "8px",
                    p: 1.5,
                    m: 0,
                    mb: 1,
                    bgcolor: !config.dataset.useBuiltin && customDatasetPath ? "#F0F9FF" : "#FFFFFF",
                    borderColor: !config.dataset.useBuiltin && customDatasetPath ? "#3B82F6" : "#E0E0E0",
                    "&:hover": {
                      bgcolor: "#F9FAFB",
                    },
                  }}
                />
                <FormControlLabel
                  value="builtin"
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#424242" }}>
                        Built‑in dataset
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#6B7280", mt: 0.5 }}>
                        Curated presets maintained by VerifyWise
                      </Typography>
                    </Box>
                  }
                  sx={{
                    border: "1px solid #E0E0E0",
                    borderRadius: "8px",
                    p: 1.5,
                    m: 0,
                    mb: 1,
                    bgcolor: config.dataset.useBuiltin ? "#F0F9FF" : "#FFFFFF",
                    borderColor: config.dataset.useBuiltin ? "#3B82F6" : "#E0E0E0",
                  }}
                />
                <FormControlLabel
                  value="upload"
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#424242" }}>
                        Upload now
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#6B7280", mt: 0.5 }}>
                        Upload a JSON dataset file and use it immediately
                      </Typography>
                    </Box>
                  }
                  sx={{
                    border: "1px solid #E0E0E0",
                    borderRadius: "8px",
                    p: 1.5,
                    m: 0,
                    bgcolor: !config.dataset.useBuiltin ? "#F0FDF4" : "#FFFFFF",
                    borderColor: !config.dataset.useBuiltin ? "#10B981" : "#E0E0E0",
                  }}
                />
              </RadioGroup>
            </FormControl>

            {/* Upload custom dataset controls */}
            {!config.dataset.useBuiltin && !config.dataset.benchmark && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, ml: 4 }}>
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  sx={{ textTransform: "none" }}
                >
                  {customDatasetFile ? "Choose another file" : "Choose JSON file"}
                  <input
                    type="file"
                    accept="application/json"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0] || null;
                      setCustomDatasetFile(file);
                      setCustomDatasetPath("");
                      if (file) {
                        try {
                          setUploadingDataset(true);
                          const resp = await deepEvalDatasetsService.uploadDataset(file);
                          setCustomDatasetPath(resp.path);
                          // Load prompts from uploaded dataset for preview
                          try {
                            const { prompts } = await deepEvalDatasetsService.read(resp.path);
                            setDatasetPrompts((prompts || []) as DatasetPrompt[]);
                            setDatasetLoaded(true);
                          } catch {
                            // ignore preview load errors
                          }
                          setAlert({
                            show: true,
                            variant: "success",
                            title: "Dataset uploaded",
                            body: `${resp.filename} uploaded (${resp.size} bytes)`,
                          });
                        } catch (err) {
                          setAlert({
                            show: true,
                            variant: "error",
                            title: "Upload failed",
                            body: err instanceof Error ? err.message : "Failed to upload dataset",
                          });
                        } finally {
                          setUploadingDataset(false);
                        }
                      }
                    }}
                  />
                </Button>
                <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                  {uploadingDataset
                    ? "Uploading..."
                    : customDatasetPath
                      ? `Ready: ${customDatasetFile?.name}`
                      : customDatasetFile
                        ? `Selected: ${customDatasetFile.name}`
                        : "No file selected"}
                </Typography>
              </Box>
            )}

            {/* Benchmark selector */}
            <FormControlLabel
              value="benchmark"
              control={<Radio size="small" />}
              checked={!!config.dataset.benchmark}
              onClick={() => {
                if (!config.dataset.benchmark) {
                  setConfig((prev) => ({
                    ...prev,
                    dataset: { ...prev.dataset, useBuiltin: false, benchmark: "mmlu" },
                  }));
                  setDatasetLoaded(true);
                  setDatasetPrompts([]);
                }
              }}
              label={
                <Box>
                  <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#424242" }}>
                    Standard Benchmark
                  </Typography>
                  <Typography sx={{ fontSize: "12px", color: "#6B7280", mt: 0.5 }}>
                    Run industry-standard LLM benchmarks (MMLU, HellaSwag, etc.)
                  </Typography>
                </Box>
              }
              sx={{
                border: "1px solid #E0E0E0",
                borderRadius: "8px",
                p: 1.5,
                m: 0,
                mb: 1,
                bgcolor: config.dataset.benchmark ? "#FEF3C7" : "#FFFFFF",
                borderColor: config.dataset.benchmark ? "#F59E0B" : "#E0E0E0",
                "&:hover": {
                  bgcolor: "#FFFBEB",
                },
              }}
            />
            
            {config.dataset.benchmark && (
              <Box sx={{ ml: 4, mt: -0.5 }}>
                <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#424242", mb: 1 }}>
                  Select Benchmark
                </Typography>
                <Select
                  size="small"
                  value={config.dataset.benchmark}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      dataset: { ...prev.dataset, benchmark: String(e.target.value) },
                    }))
                  }
                  sx={{ minWidth: 280 }}
                >
                  <MenuItem value="mmlu">
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: "13px" }}>MMLU</Typography>
                      <Typography sx={{ fontSize: "11px", color: "#6B7280" }}>57 subjects, 14k samples</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="hellaswag">
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: "13px" }}>HellaSwag</Typography>
                      <Typography sx={{ fontSize: "11px", color: "#6B7280" }}>Common-sense reasoning, 10k samples</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="big_bench_hard">
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: "13px" }}>Big-Bench Hard</Typography>
                      <Typography sx={{ fontSize: "11px", color: "#6B7280" }}>23 challenging tasks, 6.5k samples</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="truthfulqa">
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: "13px" }}>TruthfulQA</Typography>
                      <Typography sx={{ fontSize: "11px", color: "#6B7280" }}>Truthfulness evaluation, 817 samples</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="drop">
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: "13px" }}>DROP</Typography>
                      <Typography sx={{ fontSize: "11px", color: "#6B7280" }}>Reading + numerical reasoning, 9.5k samples</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="humaneval">
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: "13px" }}>HumanEval</Typography>
                      <Typography sx={{ fontSize: "11px", color: "#6B7280" }}>Code generation, 164 problems</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="gsm8k">
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: "13px" }}>GSM8K</Typography>
                      <Typography sx={{ fontSize: "11px", color: "#6B7280" }}>Grade school math, 8.5k problems</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="arc">
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: "13px" }}>ARC</Typography>
                      <Typography sx={{ fontSize: "11px", color: "#6B7280" }}>Science reasoning, 7.8k questions</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="winogrande">
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: "13px" }}>WinoGrande</Typography>
                      <Typography sx={{ fontSize: "11px", color: "#6B7280" }}>Commonsense reasoning, 44k samples</Typography>
                    </Box>
                  </MenuItem>
                </Select>
                <Typography sx={{ fontSize: "11px", color: "#6B7280", mt: 1 }}>
                  Benchmarks use DeepEval's standardized test sets and scoring.
                </Typography>
              </Box>
            )}

            {/* Built-in preset selector removed; we auto-pick based on dataset mode */}

            {/* Dataset Category Selection and Limit */}
            {config.dataset.useBuiltin && (
              <Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#424242", mb: 1.0 }}>
                  Dataset categories
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  {["coding", "mathematics", "reasoning", "creative", "knowledge"].map((cat) => {
                    const selected = config.dataset.categories.includes(cat);
                    return (
                      <Chip
                        key={cat}
                        label={cat}
                        size="small"
                        onClick={() =>
                          setConfig((prev) => {
                            const has = prev.dataset.categories.includes(cat);
                            const categories = has
                              ? prev.dataset.categories.filter((c) => c !== cat)
                              : [...prev.dataset.categories, cat];
                            return { ...prev, dataset: { ...prev.dataset, categories } };
                          })
                        }
                        sx={{
                          textTransform: "capitalize",
                          fontSize: "12px",
                          height: 24,
                          bgcolor: selected ? "#E3F2FD" : "#F3F4F6",
                          color: selected ? "#1976D2" : "#374151",
                          border: selected ? "1px solid #90CAF9" : "1px solid #E5E7EB",
                          cursor: "pointer",
                        }}
                      />
                    );
                  })}
                </Stack>

                <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: "center" }}>
                  <Field
                    label="Limit prompts"
                    type="number"
                    value={String(config.dataset.limit)}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        dataset: { ...prev.dataset, limit: Math.max(1, parseInt(e.target.value) || 1) },
                      }))
                    }
                    sx={{ maxWidth: 160 }}
                  />
                </Stack>
              </Box>
            )}

            {/* Dataset Prompts Display (Editable) - With Border */}
            {datasetLoaded && config.dataset.useBuiltin && (
              <Box
                sx={{
                  border: "2px solid #E5E7EB",
                  borderRadius: "12px",
                  p: 3,
                  bgcolor: "#FAFBFC",
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#1F2937" }}>
                    Dataset Prompts ({datasetPrompts.length} prompts)
                  </Typography>
                </Box>

                {/* Prompts list */}
                <Stack spacing={0}>
                  {datasetPrompts.map((prompt, index) => (
                    <Accordion
                      key={prompt.id}
                      expanded={expandedPrompts.includes(index)}
                      onChange={() => {
                        setExpandedPrompts((prev) =>
                          prev.includes(index)
                            ? prev.filter((i) => i !== index)
                            : [...prev, index]
                        );
                      }}
                      sx={{
                        boxShadow: "none",
                        "&:before": {
                          display: "none",
                        },
                        border: "1px solid #E0E0E0",
                        borderRadius: "8px !important",
                        mb: 1,
                        bgcolor: "#FFFFFF",
                        "&:last-child": {
                          mb: 0,
                        },
                      }}
                    >
                      <AccordionSummary expandIcon={<ChevronDown size={18} />}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                          <Chip
                            label={prompt.category}
                            size="small"
                            sx={{
                              backgroundColor: "#bbdefb",
                              color: "#1976d2",
                              fontWeight: 500,
                              fontSize: "11px",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              borderRadius: "4px",
                              "& .MuiChip-label": {
                                padding: "4px 8px",
                              },
                            }}
                          />
                          <Chip
                            label={prompt.difficulty}
                            size="small"
                            sx={{
                              backgroundColor: "#fff3e0",
                              color: "#ef6c00",
                              fontWeight: 500,
                              fontSize: "11px",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              borderRadius: "4px",
                              "& .MuiChip-label": {
                                padding: "4px 8px",
                              },
                            }}
                          />
                          <Typography sx={{ fontSize: "13px", flex: 1, color: "#424242" }}>
                            {index + 1}. {prompt.prompt.substring(0, 50)}...
                          </Typography>
                          <Tooltip title="Remove prompt">
                            <Box
                              component="span"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePrompt(prompt.id);
                              }}
                              sx={{
                                ml: 1,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "4px",
                                borderRadius: "4px",
                                "&:hover": {
                                  backgroundColor: "#FFEBEE",
                                },
                              }}
                            >
                              <Trash2 size={16} color="#D32F2F" />
                            </Box>
                          </Tooltip>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ bgcolor: "#FAFAFA", pt: 2 }}>
                        <Stack spacing={2}>
                          {/* Editable Prompt */}
                          <Field
                            type="description"
                            label="Prompt"
                            value={prompt.prompt}
                            onChange={(e) => {
                              setDatasetPrompts((prev) =>
                                prev.map((p) =>
                                  p.id === prompt.id ? { ...p, prompt: e.target.value } : p
                                )
                              );
                            }}
                            rows={3}
                          />

                          {/* Editable Expected Output */}
                          <Field
                            type="description"
                            label="Expected output"
                            value={prompt.expected_output}
                            onChange={(e) => {
                              setDatasetPrompts((prev) =>
                                prev.map((p) =>
                                  p.id === prompt.id
                                    ? { ...p, expected_output: e.target.value }
                                    : p
                                )
                              );
                            }}
                            rows={2}
                          />

                          {/* Metadata Row */}
                          <Stack direction="row" spacing={2}>
                            <Field
                              label="Category"
                              value={prompt.category}
                              onChange={(e) => {
                                setDatasetPrompts((prev) =>
                                  prev.map((p) =>
                                    p.id === prompt.id ? { ...p, category: e.target.value } : p
                                  )
                                );
                              }}
                              sx={{ flex: 1 }}
                            />
                            <Field
                              label="Difficulty"
                              value={prompt.difficulty}
                              onChange={(e) => {
                                setDatasetPrompts((prev) =>
                                  prev.map((p) =>
                                    p.id === prompt.id ? { ...p, difficulty: e.target.value } : p
                                  )
                                );
                              }}
                              sx={{ flex: 1 }}
                            />
                          </Stack>

                          {/* Keywords (comma-separated) */}
                          <Field
                            label="Expected Keywords (comma-separated)"
                            value={prompt.expected_keywords.join(", ")}
                            onChange={(e) => {
                              setDatasetPrompts((prev) =>
                                prev.map((p) =>
                                  p.id === prompt.id
                                    ? {
                                        ...p,
                                        expected_keywords: e.target.value
                                          .split(",")
                                          .map((k) => k.trim())
                                          .filter((k) => k),
                                      }
                                    : p
                                )
                              );
                            }}
                          />
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        );

      case 2:
        // Step 3: Judge LLM - Provider Selection Grid
        return (
          <Stack spacing={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Select the LLM provider to use as a judge for evaluating your model's outputs.
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ mb: 2.5, fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                Providers and frameworks
              </Typography>
              <Grid container spacing={1.5}>
                {providers.map((provider) => {
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
                              model: provider.models[0],
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
                          
                          {/* Provider Logo - Properly sized and centered */}
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
                {selectedProvider?.needsApiKey && (
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
                  />
                )}

                <Field
                  label="Model Name"
                  value={config.judgeLlm.model}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      judgeLlm: { ...prev.judgeLlm, model: e.target.value },
                    }))
                  }
                  placeholder="e.g., gpt-4, claude-3-opus, tinyllama"
                />

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
              </Box>
            )}
          </Stack>
        );

      case 3:
        // Step 4: Metrics (all enabled by default, no thresholds UI)
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Choose which metrics to include. All are enabled by default.
              </Typography>
            </Box>

            {Object.entries({
              answerRelevancy: {
                label: "Answer Relevancy",
                desc: "Measures how relevant the model's answer is to the input.",
              },
              bias: {
                label: "Bias Detection",
                desc: "Detects biased or discriminatory content in responses.",
              },
              toxicity: {
                label: "Toxicity Detection",
                desc: "Flags toxic or harmful language in outputs.",
              },
              faithfulness: {
                label: "Faithfulness",
                desc: "Checks if the answer aligns with provided context.",
              },
              hallucination: {
                label: "Hallucination Detection",
                desc: "Identifies unsupported or fabricated statements.",
              },
              contextualRelevancy: {
                label: "Contextual Relevancy",
                desc: "Measures whether retrieved/used context is relevant.",
              },
              knowledgeRetention: {
                label: "Knowledge Retention",
                desc: "Evaluates how well the model remembers and reuses information across the conversation.",
              },
              conversationRelevancy: {
                label: "Conversation Relevancy",
                desc: "Measures whether each turn stays focused on the ongoing conversation and user goal.",
              },
              conversationCompleteness: {
                label: "Conversation Completeness",
                desc: "Checks if the model fully answers the user's question and covers all requested details.",
              },
              roleAdherence: {
                label: "Code / role adherence",
                desc: "Evaluates how well the model follows its assigned role, persona, or coding instructions.",
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
      if (selectedModelProvider?.needsApiKey && !config.model.apiKey) return false;
      
      return true;
    }
    
    if (activeStep === 2) {
      // Step 3: Judge LLM validation  
      return !!(
        config.judgeLlm.provider &&
        config.judgeLlm.model &&
        (selectedProvider?.needsApiKey ? config.judgeLlm.apiKey : true)
      );
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


