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
  const [availableDatasets, setAvailableDatasets] = useState<Record<"chatbot" | "rag" | "agent" | "safety", { key: string; name: string; path: string; use_case: "chatbot" | "rag" | "agent" | "safety" }[]>>({
    chatbot: [],
    rag: [],
    agent: [],
    safety: [],
  });
  const [selectedPresetPath, setSelectedPresetPath] = useState<string>("");

  // Configuration state
  const [config, setConfig] = useState({
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
      maxTokens: 500,
    },
    // Step 3: Dataset
    dataset: {
      useBuiltin: true,
      categories: [] as string[],
      limit: 10,
    },
    // Step 4: Metrics
    metrics: {
      answerRelevancy: true,
      bias: true,
      toxicity: true,
      faithfulness: true,
      hallucination: true,
      contextualRelevancy: true,
    },
    thresholds: {
      answerRelevancy: 0.5,
      bias: 0.5,
      toxicity: 0.5,
      faithfulness: 0.5,
      hallucination: 0.5,
      contextualRelevancy: 0.5,
    },
  });

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleLoadBuiltinDataset = useCallback(async () => {
    try {
      // If we already have a selected preset path, load it; otherwise select first by use case
      if (!selectedPresetPath) {
        const list = await deepEvalDatasetsService.list();
        setAvailableDatasets(list);
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
        maxTokens: 500,
      },
      dataset: {
        useBuiltin: true,
        categories: [],
        limit: 10,
      },
      metrics: {
        answerRelevancy: true,
        bias: true,
        toxicity: true,
        faithfulness: true,
        hallucination: true,
        contextualRelevancy: true,
      },
      thresholds: {
        answerRelevancy: 0.5,
        bias: 0.5,
        toxicity: 0.5,
        faithfulness: 0.5,
        hallucination: 0.5,
        contextualRelevancy: 0.5,
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
                    label="Model Name"
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

            {/* Dataset Source Selection - Radio Group */}
            <FormControl component="fieldset">
              <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#424242", mb: 1.5 }}>
                Dataset Source
              </Typography>
              <RadioGroup
                value={config.dataset.useBuiltin ? "default" : "upload"}
                onChange={(e) => {
                  const useBuiltin = e.target.value === "default";
                  setConfig((prev) => ({
                    ...prev,
                    dataset: { ...prev.dataset, useBuiltin },
                  }));
                  if (useBuiltin && !datasetLoaded) {
                    handleLoadBuiltinDataset();
                  }
                }}
              >
                <FormControlLabel
                  value="default"
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#424242" }}>
                        Default dataset
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#6B7280", mt: 0.5 }}>
                        Diverse prompts across multiple categories
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
                    "&:hover": {
                      bgcolor: "#F9FAFB",
                    },
                  }}
                />
                <FormControlLabel
                  value="upload"
                  control={<Radio size="small" />}
                  disabled
                  label={
                    <Box>
                      <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#9CA3AF" }}>
                        Upload custom dataset
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#9CA3AF", mt: 0.5 }}>
                        Coming soon - Upload your own JSON dataset file
                      </Typography>
                    </Box>
                  }
                  sx={{
                    border: "1px solid #E0E0E0",
                    borderRadius: "8px",
                    p: 1.5,
                    m: 0,
                    bgcolor: "#FAFAFA",
                    opacity: 0.6,
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
            {config.dataset.benchmark && (
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Typography sx={{ fontSize: "13px", color: "#374151" }}>Benchmark</Typography>
                <Select
                  size="small"
                  value={config.dataset.benchmark}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      dataset: { ...prev.dataset, benchmark: String(e.target.value) },
                    }))
                  }
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="mt-bench">MT-Bench</MenuItem>
                  <MenuItem value="summeval">SummEval</MenuItem>
                </Select>
              </Box>
            )}

            {/* Built-in preset selector when using default datasets */}
            {config.dataset.useBuiltin && !config.dataset.benchmark && (
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Typography sx={{ fontSize: "13px", color: "#374151" }}>Built-in preset</Typography>
                <Select
                  size="small"
                  value={selectedPresetPath || ""}
                  onOpen={async () => {
                    try {
                      const list = await deepEvalDatasetsService.list();
                      setAvailableDatasets(list);
                      // If selected preset path is empty, pick first
                      if (!selectedPresetPath) {
                        const opts = list[config.taskType] || [];
                        if (opts.length > 0) setSelectedPresetPath(opts[0].path);
                      }
                    } catch {
                      // ignore
                    }
                  }}
                  onChange={async (e) => {
                    const newPath = String(e.target.value);
                    setSelectedPresetPath(newPath);
                    try {
                      const { prompts } = await deepEvalDatasetsService.read(newPath);
                      let filtered = prompts as DatasetPrompt[];
                      if (config.dataset.categories && config.dataset.categories.length > 0) {
                        filtered = filtered.filter((p) => config.dataset.categories.includes(p.category));
                      }
                      if (config.dataset.limit && config.dataset.limit > 0) {
                        filtered = filtered.slice(0, config.dataset.limit);
                      }
                      setDatasetPrompts(filtered as DatasetPrompt[]);
                      setDatasetLoaded(true);
                    } catch (err) {
                      console.error("Failed to read preset dataset:", err);
                    }
                  }}
                  sx={{ minWidth: 260 }}
                >
                  {(availableDatasets[config.taskType] || []).slice(0, 12).map((ds) => (
                    <MenuItem key={ds.key} value={ds.path}>
                      {ds.name}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            )}

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
                            label="Expected Output"
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
                    label="Max Tokens"
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
        title="Create New Eval"
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


