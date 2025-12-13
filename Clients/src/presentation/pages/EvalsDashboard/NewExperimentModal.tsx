import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  Grid,
  Button,
} from "@mui/material";
import { Check, Database, ExternalLink, Upload } from "lucide-react";
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
  // User's saved datasets (for "My datasets" option)
  const [userDatasets, setUserDatasets] = useState<Array<{ id: string; name: string; path: string }>>([]);
  const [selectedUserDataset, setSelectedUserDataset] = useState<{ id: string; name: string; path: string } | null>(null);
  const [loadingUserDatasets, setLoadingUserDatasets] = useState(false);
  const [uploadingDataset, setUploadingDataset] = useState(false);
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
    // Step 4: Metrics - defaults for chatbot (no RAG context metrics)
    metrics: {
      // General metrics (all use cases)
      answerRelevancy: true,
      bias: true,
      toxicity: true,
      // RAG-specific (require retrieval_context) - disabled for chatbot
      faithfulness: false,
      hallucination: false,
      contextualRelevancy: false,
      // Chatbot-specific
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
        }));
        setUserDatasets(datasets);
      } catch { /* ignore */ }
      finally {
        setLoadingUserDatasets(false);
      }
    })();
  }, [activeStep]);
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
    setSelectedUserDataset(null);
    setSelectedPresetPath("");
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
        faithfulness: false,
        hallucination: false,
        contextualRelevancy: false,
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
          <Stack spacing={2}>
            {/* Description */}
            <Typography sx={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.5 }}>
              Choose a dataset containing prompts and expected outputs. Upload your own JSON file, select from saved datasets, or use a template.
              </Typography>

            {/* Upload Section - Compact drop zone */}
            <Box
              component="label"
                  sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                    p: 1.5,
                border: "1px dashed",
                borderColor: uploadingDataset ? "#13715B" : "#D1D5DB",
                borderRadius: "8px",
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
                          const resp = await deepEvalDatasetsService.uploadDataset(file);
                    const newDataset = { id: resp.path, name: file.name.replace(/\.json$/i, ""), path: resp.path };
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

            {/* My Datasets Section */}
            {loadingUserDatasets ? (
              <Box sx={{ py: 2, textAlign: "center" }}>
                <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>Loading your datasets...</Typography>
              </Box>
            ) : userDatasets.length > 0 ? (
                <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Your Datasets
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
                <Stack spacing={0.5}>
                  {userDatasets.slice(0, 4).map((dataset) => {
                    const isSelected = selectedUserDataset?.id === dataset.id && !config.dataset.useBuiltin;
                    return (
                      <Box
                        key={dataset.id}
                        onClick={async () => {
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
                        sx={{
                          p: 1,
                          border: "1px solid",
                          borderColor: isSelected ? "#13715B" : "#E5E7EB",
                          borderRadius: "6px",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#F0FDF4" : "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          transition: "all 0.15s ease",
                          "&:hover": { borderColor: "#13715B", backgroundColor: isSelected ? "#F0FDF4" : "#F9FAFB" },
                        }}
                      >
                        <Database size={14} color={isSelected ? "#13715B" : "#9CA3AF"} />
                        <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151", flex: 1 }}>{dataset.name}</Typography>
                        {isSelected && <Check size={14} color="#13715B" />}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            ) : null}

            {/* Template Datasets Section */}
            <Box>
              <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", mb: 1 }}>
                {config.taskType === "chatbot" ? "Chatbot" : config.taskType === "rag" ? "RAG" : "Agent"} Templates
                  </Typography>
              <Stack spacing={0.5}>
                {[
                  ...(config.taskType === "chatbot" ? [
                    { name: "General Q&A", path: "chatbot/chatbot_singleturn_example.json", desc: "Standard question-answer pairs" },
                    { name: "Conversational", path: "chatbot/chatbot_conversations_example.json", desc: "Multi-turn dialogue samples" },
                    { name: "Knowledge Test", path: "chatbot/chatbot_knowledge_example.json", desc: "Factual knowledge evaluation" },
                  ] : []),
                  ...(config.taskType === "rag" ? [
                    { name: "Document QA", path: "rag/document_qa_example.json", desc: "Questions with retrieval context" },
                    { name: "Technical Docs", path: "rag/technical_docs_example.json", desc: "Technical documentation queries" },
                    { name: "Research Papers", path: "rag/research_papers_example.json", desc: "Academic content retrieval" },
                  ] : []),
                  ...(config.taskType === "agent" ? [
                    { name: "Tool Usage", path: "agent/tool_usage_example.json", desc: "Tasks requiring tool calls" },
                    { name: "Multi-step Tasks", path: "agent/multistep_example.json", desc: "Complex multi-step reasoning" },
                    { name: "API Interactions", path: "agent/api_interactions_example.json", desc: "External API orchestration" },
                  ] : []),
                ].map((template) => {
                  const isSelected = selectedPresetPath === template.path && config.dataset.useBuiltin;
                  return (
                    <Box
                      key={template.path}
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
                              sx={{
                        p: 1,
                        border: "1px solid",
                        borderColor: isSelected ? "#6366F1" : "#E5E7EB",
                        borderRadius: "6px",
                                cursor: "pointer",
                        backgroundColor: isSelected ? "#EEF2FF" : "#FFFFFF",
                                display: "flex",
                                alignItems: "center",
                        gap: 1,
                        transition: "all 0.15s ease",
                        "&:hover": { borderColor: "#6366F1", backgroundColor: isSelected ? "#EEF2FF" : "#F9FAFB" },
                      }}
                    >
                      <Database size={14} color={isSelected ? "#6366F1" : "#9CA3AF"} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>{template.name}</Typography>
                        <Typography sx={{ fontSize: "11px", color: "#9CA3AF" }}>{template.desc}</Typography>
                            </Box>
                      {isSelected && <Check size={14} color="#6366F1" />}
                        </Box>
                  );
                })}
                          </Stack>
            </Box>

            {/* Selected dataset confirmation */}
            {(selectedUserDataset || (config.dataset.useBuiltin && selectedPresetPath)) && datasetPrompts.length > 0 && (
              <Box sx={{ p: 1.5, backgroundColor: "#ECFDF5", borderRadius: "8px", border: "1px solid #A7F3D0" }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Check size={16} color="#059669" />
                  <Typography sx={{ fontSize: "13px", color: "#065F46", fontWeight: 500 }}>
                    {datasetPrompts.length} prompts ready
                  </Typography>
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
        // Step 4: Metrics - organized by use case
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Select metrics for your evaluation. Metrics are organized by use case.
              </Typography>
            </Box>

            {/* General Metrics - All Use Cases */}
            <Box>
              <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#424242", mb: 1.5 }}>
                General Metrics
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Available for all evaluation types
              </Typography>
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

            {/* Chatbot-Specific Metrics */}
            {config.taskType === "chatbot" && (
              <Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#424242", mb: 1.5 }}>
                  Chatbot Metrics
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  Specifically designed for conversational AI evaluation
                </Typography>
                {Object.entries({
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
                    label: "Role Adherence",
                    desc: "Evaluates how well the model follows its assigned role, persona, or instructions.",
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

            {/* RAG-Specific Metrics */}
            {config.taskType === "rag" && (
              <Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#424242", mb: 1.5 }}>
                  RAG Metrics
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  Requires retrieval_context in your dataset
                </Typography>
                {Object.entries({
                  faithfulness: {
                    label: "Faithfulness",
                    desc: "Checks if the answer aligns with provided retrieval context.",
                  },
                  hallucination: {
                    label: "Hallucination Detection",
                    desc: "Identifies unsupported or fabricated statements not in context.",
                  },
                  contextualRelevancy: {
                    label: "Contextual Relevancy",
                    desc: "Measures whether retrieved context is relevant to the query.",
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


