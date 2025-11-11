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
import { Check, ChevronDown, Trash2, Plus } from "lucide-react";
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
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";

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

  // Configuration state
  const [config, setConfig] = useState({
    // High-level task type for presets
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
      preset: "chatbot" as string,
      categories: [] as string[],
      limit: 10,
      benchmark: "",
    },
    // Step 4: Metrics
    metrics: {
      answerCorrectness: true,
      coherence: true,
      tonality: true,
      safety: true,
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

  // Default task type/preset from project configuration if available
  useEffect(() => {
    const loadProjectDefaults = async () => {
      try {
        const { project } = await deepEvalProjectsService.getProject(projectId);
        if (project?.useCase) {
          setConfig((prev) => ({
            ...prev,
            taskType: project.useCase as "chatbot" | "rag" | "agent",
            dataset: {
              ...prev.dataset,
              preset: (project.defaultDataset as string) || (project.useCase as string),
              useBuiltin: true,
            },
          }));
        }
      } catch {
        // non-fatal
      }
    };
    loadProjectDefaults();
  }, [projectId]);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleLoadBuiltinDataset = useCallback(async () => {
    try {
      // Built-in dataset matching the Python evaluation_dataset.py
      const builtinDataset: DatasetPrompt[] = [
        // Coding Tasks
        {
          id: "code_001",
          category: "coding",
          prompt: "Write a Python function to calculate the factorial of a number using recursion.",
          expected_keywords: ["def", "factorial", "return", "if"],
          expected_output: "A recursive Python function that calculates factorial, with a base case checking if n is 0 or 1, and a recursive case that returns n * factorial(n-1).",
          difficulty: "easy",
        },
        {
          id: "code_002",
          category: "coding",
          prompt: "Explain how to implement a binary search algorithm in Python with time complexity analysis.",
          expected_keywords: ["binary", "search", "O(log n)", "sorted"],
          expected_output: "Binary search works on sorted arrays by repeatedly dividing the search interval in half.",
          difficulty: "medium",
        },
        {
          id: "code_003",
          category: "coding",
          prompt: "Create a Python class for a stack data structure with push, pop, and peek methods.",
          expected_keywords: ["class", "Stack", "push", "pop", "peek"],
          expected_output: "A Stack class with an internal list implementing LIFO principle.",
          difficulty: "easy",
        },
        // Mathematics
        {
          id: "math_001",
          category: "mathematics",
          prompt: "Solve: If x + 5 = 12, what is x?",
          expected_keywords: ["7", "x = 7"],
          expected_output: "x = 7 (by subtracting 5 from both sides)",
          difficulty: "easy",
        },
        {
          id: "math_002",
          category: "mathematics",
          prompt: "Explain the Pythagorean theorem and provide an example.",
          expected_keywords: ["a^2 + b^2 = c^2", "right triangle", "hypotenuse"],
          expected_output: "The Pythagorean theorem states that in a right triangle, a² + b² = c².",
          difficulty: "medium",
        },
        // Reasoning & Logic
        {
          id: "logic_001",
          category: "reasoning",
          prompt: "If all roses are flowers and some flowers fade quickly, can we conclude that some roses fade quickly?",
          expected_keywords: ["no", "cannot", "logical", "fallacy"],
          expected_output: "No, we cannot conclude that. This is a logical fallacy.",
          difficulty: "medium",
        },
        {
          id: "logic_002",
          category: "reasoning",
          prompt: "A farmer has 17 sheep, and all but 9 die. How many sheep are left?",
          expected_keywords: ["9", "nine"],
          expected_output: "9 sheep are left. 'All but 9' means all except 9 die.",
          difficulty: "easy",
        },
        // Creative Writing
        {
          id: "creative_001",
          category: "creative",
          prompt: "Write a haiku about artificial intelligence.",
          expected_keywords: ["haiku", "5-7-5"],
          expected_output: "A haiku (5-7-5 syllable pattern) about AI themes.",
          difficulty: "medium",
        },
        {
          id: "creative_002",
          category: "creative",
          prompt: "Create a short story opening that includes a mysterious door.",
          expected_keywords: ["door", "story", "mystery"],
          expected_output: "An engaging story opening featuring a mysterious door.",
          difficulty: "medium",
        },
        // Knowledge & Facts
        {
          id: "knowledge_001",
          category: "knowledge",
          prompt: "What is the capital of France and what is it known for?",
          expected_keywords: ["Paris", "Eiffel Tower", "culture"],
          expected_output: "Paris is the capital of France, known for the Eiffel Tower, art, culture, and cuisine.",
          difficulty: "easy",
        },
        {
          id: "knowledge_002",
          category: "knowledge",
          prompt: "Explain photosynthesis in simple terms.",
          expected_keywords: ["plants", "sunlight", "oxygen", "glucose"],
          expected_output: "Photosynthesis is how plants convert sunlight into energy, producing oxygen.",
          difficulty: "medium",
        },
      ];

      // Apply category filters and limits if provided
      let filtered = builtinDataset;
      if (config.dataset.categories && config.dataset.categories.length > 0) {
        filtered = filtered.filter((p) => config.dataset.categories.includes(p.category));
      }
      if (config.dataset.limit && config.dataset.limit > 0) {
        filtered = filtered.slice(0, config.dataset.limit);
      }

      setDatasetPrompts(filtered);
      setDatasetLoaded(true);
    } catch (err) {
      console.error("Failed to load dataset:", err);
    }
  }, [config.dataset.categories, config.dataset.limit]);

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
              taskType: config.taskType,
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
            useBuiltin: config.dataset.useBuiltin
              ? (config.dataset.preset || config.taskType || "chatbot")
              : false,
                prompts: config.dataset.benchmark ? [] : datasetPrompts,
            count: datasetPrompts.length,
                benchmark: config.dataset.benchmark || undefined,
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
        preset: "chatbot",
        categories: [],
        limit: 10,
        benchmark: "",
      },
      metrics: {
        answerCorrectness: true,
        coherence: true,
        tonality: true,
        safety: true,
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

  type ProviderEntry = {
    id: ProviderType;
    name: string;
    Logo: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    models: string[];
    needsApiKey: boolean;
    needsUrl?: boolean;
  };

  const providers: ProviderEntry[] = [
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
        // Scroll the closest scrollable container to bottom
        let parent: HTMLElement | null = formFieldsRef.current?.parentElement as HTMLElement | null;
        while (parent) {
          const overflowY = window.getComputedStyle(parent).overflowY;
          if (overflowY === "auto" || overflowY === "scroll") {
            parent.scrollTo({ top: parent.scrollHeight, behavior: "smooth" });
            return;
          }
          parent = parent.parentElement as HTMLElement | null;
        }
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, [config.judgeLlm.provider]);

  // Auto-scroll when model provider (to be evaluated) is selected
  useEffect(() => {
    if (config.model.accessMethod && formFieldsRef.current) {
      // Wait for conditional fields to mount, then scroll them into view
      setTimeout(() => {
        let parent: HTMLElement | null = formFieldsRef.current?.parentElement as HTMLElement | null;
        while (parent) {
          const overflowY = window.getComputedStyle(parent).overflowY;
          if (overflowY === "auto" || overflowY === "scroll") {
            parent.scrollTo({ top: parent.scrollHeight, behavior: "smooth" });
            return;
          }
          parent = parent.parentElement as HTMLElement | null;
        }
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, [config.model.accessMethod]);

  // Load or refresh built-in dataset when step/category/limit changes
  useEffect(() => {
    if (activeStep === 1 && config.dataset.useBuiltin && !config.dataset.benchmark) {
      handleLoadBuiltinDataset();
    }
  }, [activeStep, config.dataset.useBuiltin, config.dataset.categories, config.dataset.limit, config.dataset.benchmark, handleLoadBuiltinDataset]);

  // Model providers - includes all Judge LLM providers plus Local and Custom API
  const modelProviders: ProviderEntry[] = [
    ...providers,
    { id: "local" as ProviderType, name: "Local", Logo: FolderFilledIcon, models: ["local-model"], needsApiKey: false, needsUrl: true },
    { id: "custom_api" as ProviderType, name: "Custom API", Logo: BuildIcon, models: ["custom-model"], needsApiKey: true, needsUrl: true },
  ];

  const selectedModelProvider = modelProviders.find(p => p.id === config.model.accessMethod);

  const defaultModelByProvider: Record<ProviderType, string> = {
    openai: "gpt-4o-mini",
    anthropic: "claude-3-5-sonnet-latest",
    gemini: "gemini-1.5-pro",
    xai: "grok-1",
    mistral: "mistral-large-latest",
    huggingface: "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    ollama: "llama3.1:8b",
    local: "local-model",
    custom_api: "custom-model",
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        // Step 1: Model - Model to be evaluated
        return (
          <Stack spacing={4}>
            <Typography variant="body2" color="text.secondary">
              Configure the model that will be evaluated by the Judge LLM.
            </Typography>

            <Box>
              <Typography sx={{ mb: 2.5, fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                Model Provider
              </Typography>
              <Grid container spacing={1.5} sx={{ userSelect: "none" }}>
                {modelProviders.map((provider) => {
                  const { Logo } = provider;
                  const isSelected = config.model.accessMethod === provider.id;
                  
                  return (
                    <Grid item xs={4} sm={3} key={provider.id}>
                      <Card
                        onClick={() =>
                          setConfig((prev) => {
                            const accessMethod: ProviderType = provider.id;
                            const needsUrl = !!provider.needsUrl;
                            const endpointUrl = needsUrl
                              ? (accessMethod === 'local'
                                  ? (prev.model.endpointUrl || 'http://localhost:11434/api/generate')
                                  : (prev.model.endpointUrl || 'https://api.example.com/v1/chat/completions'))
                              : prev.model.endpointUrl;
                            return {
                              ...prev,
                              model: {
                                ...prev.model,
                                accessMethod,
                                // don't auto-fill model name; keep user input
                                name: prev.model.name,
                                endpointUrl,
                              },
                            };
                          })
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
                          userSelect: "none",
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
                            userSelect: "none",
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
                  {(() => {
                    const suggested = selectedModelProvider
                      ? (selectedModelProvider.models?.[0] || defaultModelByProvider[selectedModelProvider.id])
                      : undefined;
                    const placeholder = suggested
                      ? `e.g., ${suggested}`
                      : "e.g., gpt-4, claude-3-opus, tinyllama";
                    return (
                  <Field
                    label="Model Name"
                    value={config.model.name}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        model: { ...prev.model, name: e.target.value },
                      }))
                    }
                    placeholder={placeholder}
                  />
                    );
                  })()}

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
            <Typography variant="body2" color="text.secondary">
              Configure the dataset to use for evaluation.
            </Typography>

            {/* LLM Type (presets) */}
            <Box>
              <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#424242", mb: 1.0 }}>
                LLM Type
              </Typography>
              <Stack direction="row" spacing={1}>
                {["chatbot", "rag", "agent"].map((t) => {
                  const selected = config.taskType === t;
                  return (
                    <Chip
                      key={t}
                      label={t}
                      size="small"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          taskType: t as "chatbot" | "rag" | "agent",
                          dataset: {
                            ...prev.dataset,
                            // if using builtin, align preset name
                            preset: prev.dataset.useBuiltin ? (t as string) : prev.dataset.preset,
                          },
                        }))
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
            </Box>

            {/* Dataset Source Selection - Radio Group */}
            <FormControl component="fieldset">
              <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#424242", mb: 1.5 }}>
                Dataset Source
              </Typography>
              <RadioGroup
                value={config.dataset.benchmark ? "benchmark" : (config.dataset.useBuiltin ? "default" : "upload")}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "default") {
                    setConfig((prev) => ({
                      ...prev,
                      dataset: { ...prev.dataset, useBuiltin: true, preset: prev.taskType, benchmark: "" },
                    }));
                    if (!datasetLoaded) handleLoadBuiltinDataset();
                  } else if (val === "benchmark") {
                    setConfig((prev) => ({
                      ...prev,
                      dataset: { ...prev.dataset, useBuiltin: false, benchmark: "mt-bench" },
                    }));
                  } else {
                    setConfig((prev) => ({
                      ...prev,
                      dataset: { ...prev.dataset, useBuiltin: false, benchmark: "" },
                    }));
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
                  value="benchmark"
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#424242" }}>
                        Use DeepEval benchmark
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#6B7280", mt: 0.5 }}>
                        Run standard benchmark suites (e.g., MT-Bench)
                      </Typography>
                    </Box>
                  }
                  sx={{
                    border: "1px solid #E0E0E0",
                    borderRadius: "8px",
                    p: 1.5,
                    m: 0,
                    mb: 1,
                    bgcolor: config.dataset.benchmark ? "#F0F9FF" : "#FFFFFF",
                    borderColor: config.dataset.benchmark ? "#3B82F6" : "#E0E0E0",
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
                  value={config.dataset.preset || config.taskType}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      taskType: e.target.value as "chatbot" | "rag" | "agent",
                      dataset: { ...prev.dataset, preset: String(e.target.value) },
                    }))
                  }
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="chatbot">chatbot</MenuItem>
                  <MenuItem value="rag">rag</MenuItem>
                  <MenuItem value="agent">agent</MenuItem>
                  <MenuItem value="safety">safety</MenuItem>
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
            {datasetLoaded && config.dataset.useBuiltin && !config.dataset.benchmark && (
              <Box
                sx={{
                  border: "2px solid #E5E7EB",
                  borderRadius: "12px",
                  p: 3,
                  bgcolor: "#FAFBFC",
                }}
              >
                <Box sx={{ mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#1F2937" }}>
                    Dataset Prompts ({datasetPrompts.length} prompts)
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const id = `custom_${Date.now()}`;
                      setDatasetPrompts((prev) => [
                        ...prev,
                        {
                          id,
                          category: "custom",
                          prompt: "",
                          expected_output: "",
                          expected_keywords: [],
                          difficulty: "easy",
                        },
                      ]);
                      setExpandedPrompts((prev) => [...prev, prev.length]);
                    }}
                    sx={{ textTransform: "none", borderColor: "#D1D5DB" }}
                    startIcon={<Plus size={14} />}
                  >
                    Add prompt
                  </Button>
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
                              fontSize: "10px",
                              height: "20px",
                              bgcolor: "#E3F2FD",
                              color: "#1976D2",
                              fontWeight: 500,
                            }}
                          />
                          <Chip
                            label={prompt.difficulty}
                            size="small"
                            sx={{
                              fontSize: "10px",
                              height: "20px",
                              bgcolor: "#FFF3E0",
                              color: "#F57C00",
                              fontWeight: 500,
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
            <Typography variant="body2" color="text.secondary">
              Select the LLM provider to use as a judge for evaluating your model's outputs.
            </Typography>

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
        // Step 4: Metrics (GEval + safety)
        return (
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
              Choose which metrics to include.
            </Typography>

            {Object.entries({
              answerCorrectness: {
                label: "Answer Correctness",
                desc: "Checks factual correctness against expected output.",
              },
              coherence: {
                label: "Coherence",
                desc: "Assesses clarity and logical flow.",
              },
              tonality: {
                label: "Tonality",
                desc: "Evaluates tone and formality appropriateness.",
              },
              safety: {
                label: "Safety",
                desc: "Flags unsafe, toxic, or privacy-violating content.",
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
        title="Create New Experiment"
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


