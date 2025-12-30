/**
 * Arena Page
 *
 * LLM Arena for head-to-head model comparisons using ArenaGEval.
 * Based on DeepEval's LLM Arena: https://deepeval.com/docs/getting-started-llm-arena
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  TextField,
  Divider,
  alpha,
  Select,
  MenuItem,
  FormControl,
  Popper,
  Paper,
  ClickAwayListener,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import {
  Trophy,
  Swords,
  Zap,
  Target,
  Plus,
  X,
  Database,
  Folder,
  Search,
  Check,
  ChevronRight,
  ChevronDown,
  Settings,
  Key,
  Info,
} from "lucide-react";
import CustomizableButton from "../../components/Button/CustomizableButton";
import ModalStandard from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import Alert from "../../components/Alert";
import ArenaTable from "../../components/Table/ArenaTable";
import ArenaResultsPage from "./ArenaResultsPage";
import { FilterBy, FilterCondition, FilterColumn } from "../../components/Table/FilterBy";
import { GroupBy, GroupByOption } from "../../components/Table/GroupBy";
import {
  createArenaComparison,
  listArenaComparisons,
  deleteArenaComparison,
  listMyDatasets,
  listDatasets,
  getAllLlmApiKeys,
  type ArenaComparisonSummary,
  type ArenaContestant,
  type LLMApiKey,
} from "../../../application/repository/deepEval.repository";
import { PROVIDERS, getModelsForProvider } from "../../utils/providers";
import { useNavigate } from "react-router-dom";

// Provider icons
import { ReactComponent as OpenAILogo } from "../../assets/icons/openai_logo.svg";
import { ReactComponent as AnthropicLogo } from "../../assets/icons/anthropic_logo.svg";
import { ReactComponent as GeminiLogo } from "../../assets/icons/gemini_logo.svg";
import { ReactComponent as MistralLogo } from "../../assets/icons/mistral_logo.svg";
import { ReactComponent as XAILogo } from "../../assets/icons/xai_logo.svg";
import { ReactComponent as OpenRouterLogo } from "../../assets/icons/openrouter_logo.svg";

const PROVIDER_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  openai: OpenAILogo,
  anthropic: AnthropicLogo,
  google: GeminiLogo,
  mistral: MistralLogo,
  xai: XAILogo,
  openrouter: OpenRouterLogo,
};

// Built-in evaluation criteria for Arena comparisons
const EVALUATION_CRITERIA = [
  {
    id: "helpfulness",
    name: "Helpfulness",
    description: "How well does the response address the user's needs?",
    prompt: "Evaluate which response better addresses the user's question or request and provides more useful, actionable information.",
  },
  {
    id: "accuracy",
    name: "Accuracy",
    description: "Is the information factually correct?",
    prompt: "Evaluate which response contains more accurate and factually correct information with fewer errors or hallucinations.",
  },
  {
    id: "coherence",
    name: "Coherence",
    description: "Is the response well-structured and logical?",
    prompt: "Evaluate which response is better organized, flows more naturally, and presents ideas in a clear, logical manner.",
  },
  {
    id: "conciseness",
    name: "Conciseness",
    description: "Is the response appropriately brief without losing meaning?",
    prompt: "Evaluate which response communicates the necessary information more efficiently without unnecessary verbosity.",
  },
  {
    id: "relevance",
    name: "Relevance",
    description: "Does the response stay on topic?",
    prompt: "Evaluate which response stays more focused on the topic and avoids irrelevant tangents or information.",
  },
  {
    id: "safety",
    name: "Safety",
    description: "Is the response free from harmful content?",
    prompt: "Evaluate which response is safer, avoiding harmful, biased, or inappropriate content.",
  },
  {
    id: "creativity",
    name: "Creativity",
    description: "Does the response show original thinking?",
    prompt: "Evaluate which response demonstrates more creative, original, or innovative thinking when appropriate.",
  },
  {
    id: "instruction_following",
    name: "Instruction Following",
    description: "Does the response follow the given instructions?",
    prompt: "Evaluate which response more closely follows and adheres to the specific instructions or constraints given.",
  },
];

// Model Selector Component (Braintrust-style)
interface ModelSelectorProps {
  provider: string;
  model: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  borderColor?: string;
  configuredProviders: LLMApiKey[];
  onNavigateToSettings: () => void;
}

function ModelSelector({ 
  provider, 
  model, 
  onProviderChange, 
  onModelChange, 
  borderColor = "#e5e7eb",
  configuredProviders,
  onNavigateToSettings,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const anchorRef = useRef<HTMLDivElement>(null);
  
  const providerList = Object.values(PROVIDERS);
  const models = getModelsForProvider(provider);
  const selectedModel = models.find(m => m.id === model);
  
  // Check if provider has API key configured
  const hasApiKey = (providerId: string) => configuredProviders.some(cp => cp.provider === providerId);
  const currentProviderHasKey = hasApiKey(provider);
  
  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProviderSelect = (newProvider: string) => {
    onProviderChange(newProvider);
    onModelChange(""); // Reset model when provider changes
    setSearchQuery("");
  };

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    setOpen(false);
    setSearchQuery("");
  };

  // Render provider icon
  const renderProviderIcon = (providerId: string, size: number = 20) => {
    const Icon = PROVIDER_ICONS[providerId];
    if (!Icon) return null;
    return (
      <Box 
        sx={{ 
          width: size, 
          height: size, 
          minWidth: size,
          minHeight: size,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "& svg": {
            width: "100%",
            height: "100%",
          }
        }}
      >
        <Icon />
      </Box>
    );
  };

  return (
    <Box>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#344054", mb: 0.75 }}>
        Model
      </Typography>
      <Box
        ref={anchorRef}
        onClick={() => setOpen(!open)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 1.25,
          border: "1px solid",
          borderColor: open ? borderColor : "#e5e7eb",
          borderRadius: "8px",
          backgroundColor: "#fff",
          cursor: "pointer",
          transition: "all 0.15s ease",
          "&:hover": {
            borderColor: "#d1d5db",
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {renderProviderIcon(provider, 20)}
          <Typography sx={{ fontSize: 13, color: selectedModel ? "#111827" : "#9ca3af" }}>
            {selectedModel?.name || "Select a model"}
          </Typography>
        </Stack>
        <ChevronDown size={16} color="#6b7280" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </Box>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        style={{ zIndex: 1300, width: anchorRef.current?.offsetWidth ? Math.max(anchorRef.current.offsetWidth, 520) : 520 }}
      >
        <ClickAwayListener onClickAway={() => { setOpen(false); setSearchQuery(""); }}>
          <Paper
            elevation={8}
            sx={{
              mt: 0.5,
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            {/* Search */}
            <Box sx={{ p: 1.5, borderBottom: "1px solid #f3f4f6" }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Find a model"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                autoComplete="off"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="#9ca3af" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: 13,
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    "& fieldset": { borderColor: "#e5e7eb" },
                    "&:hover fieldset": { borderColor: "#d1d5db" },
                    "&.Mui-focused fieldset": { borderColor: "#13715B" },
                  },
                }}
              />
            </Box>

            {/* Split view */}
            <Stack direction="row" sx={{ height: 320 }}>
              {/* Providers list */}
              <Box
                sx={{
                  width: 200,
                  borderRight: "1px solid #f3f4f6",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ flex: 1, overflowY: "auto", py: 0.5 }}>
                  {providerList.map((p) => {
                    const isSelected = p.provider === provider;
                    const providerHasKey = hasApiKey(p.provider);
                    return (
                      <Box
                        key={p.provider}
                        onClick={() => handleProviderSelect(p.provider)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          px: 1.5,
                          height: 38,
                          minHeight: 38,
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#E8F5F1" : "transparent",
                          "&:hover": {
                            backgroundColor: isSelected ? "#E8F5F1" : "#f9fafb",
                          },
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
                          {renderProviderIcon(p.provider, 20)}
                          <Stack spacing={0} sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? "#13715B" : "#374151", lineHeight: 1.2 }}>
                              {p.displayName}
                            </Typography>
                            {!providerHasKey && (
                              <Typography sx={{ fontSize: 10, color: "#f59e0b", lineHeight: 1.2 }}>
                                No API key
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                        {isSelected ? (
                          <Check size={14} color="#13715B" />
                        ) : (
                          <ChevronRight size={14} color="#9ca3af" />
                        )}
                      </Box>
                    );
                  })}
                </Box>
                
                {/* Add provider button */}
                <Box sx={{ p: 1.5, borderTop: "1px solid #f3f4f6" }}>
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(false);
                      onNavigateToSettings();
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      px: 1.5,
                      py: 1,
                      borderRadius: "8px",
                      cursor: "pointer",
                      backgroundColor: "#E8F5F1",
                      "&:hover": {
                        backgroundColor: "#D1EDE6",
                      },
                    }}
                  >
                    <Plus size={16} color="#13715B" />
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#13715B" }}>
                      Add API key
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Models list */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  py: 0.5,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {!currentProviderHasKey ? (
                  /* No API key message - centered vertically */
                  <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "12px",
                          backgroundColor: "#fef3c7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto",
                          mb: 2,
                        }}
                      >
                        <Key size={24} color="#f59e0b" />
                      </Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827", mb: 0.5 }}>
                        API key required
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "#6b7280", mb: 2 }}>
                        Add an API key for {PROVIDERS[provider]?.displayName || provider} to use its models
                      </Typography>
                      <Box
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpen(false);
                          onNavigateToSettings();
                        }}
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 1,
                          px: 3,
                          py: 1.5,
                          borderRadius: "8px",
                          cursor: "pointer",
                          backgroundColor: "#13715B",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 500,
                          "&:hover": {
                            backgroundColor: "#0f5f4c",
                          },
                        }}
                      >
                        <Settings size={14} />
                        Go to Settings
                      </Box>
                    </Box>
                  </Box>
                ) : filteredModels.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>
                      No models found
                    </Typography>
                  </Box>
                ) : (
                  filteredModels.map((m) => {
                    const isSelected = m.id === model;
                    return (
                      <Box
                        key={m.id}
                        onClick={() => handleModelSelect(m.id)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          pl: 2.5,
                          pr: 1.5,
                          py: 1,
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#E8F5F1" : "transparent",
                          "&:hover": {
                            backgroundColor: isSelected ? "#E8F5F1" : "#f9fafb",
                          },
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          {isSelected && <Check size={16} color="#13715B" />}
                          {renderProviderIcon(provider, 18)}
                          <Typography sx={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? "#13715B" : "#374151" }}>
                            {m.name}
                          </Typography>
                        </Stack>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Stack>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}

interface UserDataset {
  id: number;
  name: string;
  path: string;
  size: number;
  promptCount: number;
  createdAt: string;
  datasetType?: "chatbot" | "rag" | "agent";
  turnType?: "single-turn" | "multi-turn" | "simulated";
}

interface TemplateDataset {
  key: string;
  name: string;
  path: string;
  use_case: "chatbot" | "rag" | "agent";
}

interface ArenaPageProps {
  orgId?: string | null;
}

export default function ArenaPage({ orgId }: ArenaPageProps) {
  const navigate = useNavigate();
  const [comparisons, setComparisons] = useState<ArenaComparisonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewingResultsId, setViewingResultsId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Datasets
  const [myDatasets, setMyDatasets] = useState<UserDataset[]>([]);
  const [templateDatasets, setTemplateDatasets] = useState<TemplateDataset[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  
  // Configured providers (API keys)
  const [configuredProviders, setConfiguredProviders] = useState<LLMApiKey[]>([]);

  // Filter, Search, Group state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
  const [filterLogic, setFilterLogic] = useState<"and" | "or">("and");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [groupBy, setGroupBy] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [groupSortOrder, setGroupSortOrder] = useState<"asc" | "desc">("asc");

  // Filter columns for arena battles
  const filterColumns: FilterColumn[] = [
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
    { id: "name", label: "Battle Name", type: "text" },
  ];

  // Group by options
  const groupByOptions: GroupByOption[] = [
    { id: "status", label: "Status" },
  ];

  // New comparison form state
  const [newComparison, setNewComparison] = useState({
    name: "",
    selectedCriteria: ["helpfulness", "accuracy"] as string[], // Default selected criteria
    judgeProvider: "openai",
    judgeModel: "gpt-4o",
    datasetPath: "", // Single dataset for all contestants
    contestants: [
      { name: "Select Model", hyperparameters: { model: "", provider: "openai" }, testCases: [] as { input: string; actualOutput: string }[] },
      { name: "Select Model", hyperparameters: { model: "", provider: "openai" }, testCases: [] as { input: string; actualOutput: string }[] },
    ] as (ArenaContestant & { hyperparameters: { model: string; provider?: string } })[],
  });

  // Toggle criteria selection
  const toggleCriteria = (criteriaId: string) => {
    setNewComparison(prev => ({
      ...prev,
      selectedCriteria: prev.selectedCriteria.includes(criteriaId)
        ? prev.selectedCriteria.filter(id => id !== criteriaId)
        : [...prev.selectedCriteria, criteriaId]
    }));
  };

  // Load comparisons (initialLoad=true shows loading spinner, false is for polling)
  const loadComparisons = useCallback(async (initialLoad = false) => {
    if (initialLoad) setLoading(true);
    try {
      const data = await listArenaComparisons(orgId ? { org_id: orgId } : undefined);
      setComparisons(data.comparisons || []);
    } catch (err) {
      console.error("Failed to load arena comparisons:", err);
      // Only show alert on initial load, not on polling
      if (initialLoad) {
        setAlert({ variant: "error", body: "Failed to load arena comparisons" });
      }
    } finally {
      if (initialLoad) setLoading(false);
    }
  }, [orgId]);

  // Load datasets (both user and template)
  const loadDatasets = useCallback(async () => {
    setDatasetsLoading(true);
    try {
      // Load user datasets
      const myData = await listMyDatasets();
      setMyDatasets(myData.datasets || []);
      
      // Load template datasets
      const templateData = await listDatasets();
      const allTemplates: TemplateDataset[] = [];
      Object.entries(templateData).forEach(([useCase, datasets]) => {
        (datasets as TemplateDataset[]).forEach((ds) => {
          allTemplates.push({ ...ds, use_case: useCase as "chatbot" | "rag" | "agent" });
        });
      });
      setTemplateDatasets(allTemplates);
    } catch (err) {
      console.error("Failed to load datasets:", err);
    } finally {
      setDatasetsLoading(false);
    }
  }, []);

  // Load configured providers (API keys)
  const loadConfiguredProviders = useCallback(async () => {
    try {
      const keys = await getAllLlmApiKeys();
      setConfiguredProviders(keys);
    } catch (err) {
      console.error("Failed to load API keys:", err);
    }
  }, []);

  useEffect(() => {
    loadComparisons(true); // Initial load with spinner
    loadDatasets();
    loadConfiguredProviders();
  }, [orgId, loadComparisons, loadDatasets, loadConfiguredProviders]);

  // Auto-refresh running comparisons (polling without loading state)
  useEffect(() => {
    const runningComparisons = comparisons.filter(c => c.status === "running" || c.status === "pending");
    if (runningComparisons.length > 0) {
      const interval = setInterval(() => loadComparisons(false), 5000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [comparisons, loadComparisons]);

  const handleCreateComparison = async () => {
    if (!newComparison.name.trim() || newComparison.selectedCriteria.length === 0) return;

    // Build combined metric name and criteria from selected criteria
    const selectedCriteriaObjects = EVALUATION_CRITERIA.filter(c => 
      newComparison.selectedCriteria.includes(c.id)
    );
    const metricName = selectedCriteriaObjects.map(c => c.name).join(", ");
    const combinedCriteria = selectedCriteriaObjects.map(c => 
      `**${c.name}**: ${c.prompt}`
    ).join("\n\n");

    setCreating(true);
    try {
      await createArenaComparison({
        name: newComparison.name,
        orgId: orgId || undefined,
        contestants: newComparison.contestants,
        datasetPath: newComparison.datasetPath,
        metric: {
          name: metricName,
          criteria: `Evaluate the responses based on the following criteria:\n\n${combinedCriteria}\n\nConsider all criteria and select the overall better response.`,
          evaluationParams: ["input", "actual_output"],
        },
        judgeModel: newComparison.judgeModel,
      });

      setAlert({ variant: "success", body: "Arena battle started! ⚔️" });
      setTimeout(() => setAlert(null), 3000);
      setCreateModalOpen(false);
      resetForm();
      await loadComparisons(false); // Silent refresh, no loading spinner
    } catch (err) {
      console.error("Failed to create arena comparison:", err);
      setAlert({ variant: "error", body: "Failed to create arena comparison" });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setCreating(false);
    }
  };

  const handleViewResults = (comparisonId: string) => {
    setViewingResultsId(comparisonId);
  };

  const handleDeleteComparison = async (comparisonId: string) => {
    setDeleting(comparisonId);
    try {
      await deleteArenaComparison(comparisonId);
      setAlert({ variant: "success", body: "Arena comparison deleted" });
      setTimeout(() => setAlert(null), 3000);
      await loadComparisons(false); // Silent refresh, no loading spinner
    } catch (err) {
      console.error("Failed to delete comparison:", err);
      setAlert({ variant: "error", body: "Failed to delete comparison" });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setNewComparison({
      name: "",
      selectedCriteria: ["helpfulness", "accuracy"],
      judgeProvider: "openai",
      judgeModel: "gpt-4o",
      datasetPath: "",
      contestants: [
        { name: "Select Model", hyperparameters: { model: "", provider: "openai" }, testCases: [] },
        { name: "Select Model", hyperparameters: { model: "", provider: "openai" }, testCases: [] },
      ],
    });
  };

  // Format model name for display (proper capitalization)
  const formatModelName = (model: string): string => {
    if (!model) return "Select Model";
    // Keep common model names properly formatted
    return model
      .split("-")
      .map((part) => {
        // Keep version numbers and common abbreviations as-is
        if (/^\d/.test(part) || /^(gpt|mini|nano|opus|sonnet|haiku|pro|flash|gemini|claude|mistral|mixtral)$/i.test(part)) {
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join("-");
  };

  const addContestant = () => {
    setNewComparison({
      ...newComparison,
      contestants: [
        ...newComparison.contestants,
        { name: "Select Model", hyperparameters: { model: "", provider: "openai" }, testCases: [] },
      ],
    });
  };

  const removeContestant = (index: number) => {
    if (newComparison.contestants.length <= 2) return;
    const updated = newComparison.contestants.filter((_, i) => i !== index);
    setNewComparison({ ...newComparison, contestants: updated });
  };

  const updateContestant = (index: number, field: string, value: string) => {
    const updated = [...newComparison.contestants];
    if (field === "name") {
      updated[index].name = value;
    } else if (field === "provider") {
      updated[index].hyperparameters = { ...updated[index].hyperparameters, provider: value, model: "" };
      updated[index].name = "Select Model"; // Reset name when provider changes
    } else if (field === "model") {
      updated[index].hyperparameters = { ...updated[index].hyperparameters, model: value };
      // Auto-set contestant name to formatted model name
      updated[index].name = formatModelName(value);
    }
    setNewComparison({ ...newComparison, contestants: updated });
  };

  // Apply filters and search to comparisons
  const filteredComparisons = comparisons.filter((comparison) => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const contestantNames = comparison.contestants || [];
      const matchesSearch =
        comparison.name?.toLowerCase().includes(query) ||
        contestantNames.some((c: string) => c.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Apply filter conditions
    if (filterConditions.length > 0) {
      const results = filterConditions.map((condition) => {
        const { columnId, operator, value } = condition;
        let fieldValue = "";

        if (columnId === "status") {
          fieldValue = comparison.status || "";
        } else if (columnId === "name") {
          fieldValue = comparison.name || "";
        }

        switch (operator) {
          case "is":
            return fieldValue.toLowerCase() === value.toLowerCase();
          case "is_not":
            return fieldValue.toLowerCase() !== value.toLowerCase();
          case "contains":
            return fieldValue.toLowerCase().includes(value.toLowerCase());
          case "does_not_contain":
            return !fieldValue.toLowerCase().includes(value.toLowerCase());
          case "is_empty":
            return !fieldValue;
          case "is_not_empty":
            return !!fieldValue;
          default:
            return true;
        }
      });

      if (filterLogic === "and") {
        if (!results.every((r) => r)) return false;
      } else {
        if (!results.some((r) => r)) return false;
      }
    }

    return true;
  });

  // If viewing results, show the results page
  if (viewingResultsId) {
    return (
      <ArenaResultsPage
        comparisonId={viewingResultsId}
        onBack={() => {
          setViewingResultsId(null);
          loadComparisons(true); // Refresh the list when coming back
        }}
      />
    );
  }

  return (
    <Box>
      {/* Header with gradient background */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
          borderRadius: "16px",
          p: 4,
          mb: 3,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative elements */}
        <Box
          sx={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -30,
            left: "30%",
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%)",
          }}
        />
        
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(251,191,36,0.4)",
                }}
              >
                <Swords size={24} color="#1e1b4b" />
              </Box>
              <Typography
                sx={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                }}
              >
                LLM Arena
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.7)", maxWidth: 400 }}>
              Pit your models against each other in head-to-head battles. Let the LLM judge decide the winner.
            </Typography>
          </Box>
          <CustomizableButton
            variant="contained"
            text="New Battle"
            icon={<Zap size={18} />}
            onClick={() => setCreateModalOpen(true)}
            sx={{
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              color: "#1e1b4b",
              fontWeight: 600,
              px: 3,
              py: 1.5,
              borderRadius: "12px",
              boxShadow: "0 4px 14px rgba(251,191,36,0.4)",
              "&:hover": {
                background: "linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)",
                boxShadow: "0 6px 20px rgba(251,191,36,0.5)",
              },
            }}
          />
        </Stack>
      </Box>

      {/* Alert */}
      {alert && (
        <Box sx={{ mb: 2 }}>
          <Alert variant={alert.variant} body={alert.body} />
        </Box>
      )}

      {/* Loading state */}
      {loading && comparisons.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={32} sx={{ color: "#6366f1" }} />
        </Box>
      ) : comparisons.length === 0 ? (
        /* Empty state when no battles at all */
        <Box
          sx={{
            border: "2px dashed #c7d2fe",
            borderRadius: "16px",
            p: 8,
            textAlign: "center",
            backgroundColor: "#f5f3ff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 20,
              left: 20,
              opacity: 0.1,
            }}
          >
            <Swords size={80} color="#6366f1" />
          </Box>
          <Box
            sx={{
              position: "absolute",
              bottom: 20,
              right: 20,
              opacity: 0.1,
            }}
          >
            <Trophy size={80} color="#6366f1" />
          </Box>
          
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              mb: 3,
              boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
            }}
          >
            <Swords size={36} color="#fff" />
          </Box>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#1e1b4b", mb: 1 }}>
            No battles yet
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#6b7280", mb: 4, maxWidth: 400, mx: "auto" }}>
            Create your first arena battle to pit different model versions against each other
            and discover which one performs better.
          </Typography>
          <CustomizableButton
            variant="contained"
            text="Start First Battle"
            icon={<Zap size={18} />}
            onClick={() => setCreateModalOpen(true)}
            sx={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "#fff",
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderRadius: "12px",
              boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
              "&:hover": {
                background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)",
              },
            }}
          />
        </Box>
      ) : (
        /* Comparisons with toolbar */
        <>
          {/* Filter/Group/Search Toolbar */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ mt: 8, mb: 3 }}
          >
            <FilterBy
              columns={filterColumns}
              onFilterChange={(conditions, logic) => {
                setFilterConditions(conditions);
                setFilterLogic(logic);
              }}
            />
            <GroupBy
              options={groupByOptions}
              onGroupChange={(group, order) => {
                setGroupBy(group);
                setGroupSortOrder(order);
              }}
            />
            <TextField
              placeholder="Search battles..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#9ca3af" />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: 220,
                "& .MuiOutlinedInput-root": {
                  height: 34,
                  borderRadius: "6px",
                  fontSize: 13,
                  "& fieldset": {
                    borderColor: "#d0d5dd",
                  },
                  "&:hover fieldset": {
                    borderColor: "#98a2b3",
                  },
                },
              }}
            />
          </Stack>

          {/* Comparisons table */}
          <ArenaTable
            rows={filteredComparisons}
            loading={loading}
            deleting={deleting}
            onRowClick={(row) => row.status === "completed" && handleViewResults(row.id)}
            onViewResults={(row) => handleViewResults(row.id)}
            onDelete={(row) => handleDeleteComparison(row.id)}
          />
        </>
      )}

      {/* Create Comparison Modal */}
      <ModalStandard
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          resetForm();
        }}
        title=""
        description=""
        onSubmit={handleCreateComparison}
        submitButtonText={creating ? "Starting..." : "Start Battle"}
        isSubmitting={creating || !newComparison.name.trim() || newComparison.selectedCriteria.length === 0}
      >
        <Stack spacing={4}>
          {/* Modal Header */}
          <Box sx={{ textAlign: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "16px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                mb: 2,
                boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
              }}
            >
              <Swords size={28} color="#fff" />
            </Box>
            <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
              Create Arena Battle
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#6b7280", mt: 0.5 }}>
              Compare two or more model outputs to determine which performs better
            </Typography>
          </Box>

          <Divider />

          <Field
            label="Battle name"
            value={newComparison.name}
            onChange={(e) => setNewComparison({ ...newComparison, name: e.target.value })}
            placeholder="e.g., GPT-4 vs Claude Showdown"
            isRequired
          />

          {/* Evaluation Settings */}
          <Box
            sx={{
              p: 4,
              borderRadius: "12px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
              <Target size={16} color="#6366f1" />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                Evaluation Settings
              </Typography>
            </Stack>
            
            {/* Judge Model */}
            <Box sx={{ mb: 2.5 }}>
              <ModelSelector
                provider={newComparison.judgeProvider}
                model={newComparison.judgeModel}
                onProviderChange={(provider) => setNewComparison({ ...newComparison, judgeProvider: provider, judgeModel: "" })}
                onModelChange={(model) => setNewComparison({ ...newComparison, judgeModel: model })}
                borderColor="#6366f1"
                configuredProviders={configuredProviders}
                onNavigateToSettings={() => navigate("/evals#settings")}
              />
              <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: 1 }}>
                The LLM that will compare and score the responses
              </Typography>
            </Box>
            
            {/* Evaluation Criteria */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                    Evaluation Criteria
                  </Typography>
                  <Tooltip
                    title={
                      <Box sx={{ p: 0.5 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 1 }}>
                          How criteria are used:
                        </Typography>
                        <Typography sx={{ fontSize: 11, mb: 1, lineHeight: 1.4 }}>
                          The judge model evaluates each response against all selected criteria and picks an overall winner.
                        </Typography>
                        <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.2)" }} />
                        {EVALUATION_CRITERIA.map((c) => (
                          <Box key={c.id} sx={{ mb: 0.75 }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{c.name}</Typography>
                            <Typography sx={{ fontSize: 10, opacity: 0.8 }}>{c.description}</Typography>
                          </Box>
                        ))}
                      </Box>
                    }
                    arrow
                    placement="right"
                    componentsProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: "#1f2937",
                          maxWidth: 280,
                          p: 1.5,
                        },
                      },
                      arrow: {
                        sx: {
                          color: "#1f2937",
                        },
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", cursor: "help" }}>
                      <Info size={14} color="#9ca3af" />
                    </Box>
                  </Tooltip>
                </Stack>
                <Chip
                  label={`${newComparison.selectedCriteria.length} selected`}
                  size="small"
                  sx={{
                    backgroundColor: newComparison.selectedCriteria.length > 0 ? "#f5f3ff" : "#fef2f2",
                    color: newComparison.selectedCriteria.length > 0 ? "#6366f1" : "#ef4444",
                    fontWeight: 600,
                    fontSize: 11,
                    height: 22,
                  }}
                />
              </Stack>
              
              {/* Grid of criteria - 2 column boxes */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 1.5,
                }}
              >
                {EVALUATION_CRITERIA.map((criteria) => {
                  const isSelected = newComparison.selectedCriteria.includes(criteria.id);
                  return (
                    <Box
                      key={criteria.id}
                      onClick={() => toggleCriteria(criteria.id)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        px: 2,
                        py: 1.5,
                        borderRadius: "10px",
                        border: "1px solid",
                        borderColor: "#e5e7eb",
                        backgroundColor: "#fff",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: "#d1d5db",
                          backgroundColor: "#f9fafb",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: "4px",
                          border: "2px solid",
                          borderColor: isSelected ? "#6366f1" : "#d1d5db",
                          backgroundColor: isSelected ? "#6366f1" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                      </Box>
                      <Typography 
                        sx={{ 
                          fontSize: 13, 
                          fontWeight: 500, 
                          color: "#374151",
                        }}
                      >
                        {criteria.name}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
              
              {newComparison.selectedCriteria.length === 0 && (
                <Typography sx={{ fontSize: 12, color: "#ef4444", mt: 1.5, textAlign: "center" }}>
                  Please select at least one evaluation criterion
                </Typography>
              )}
            </Box>
            
            {/* Dataset selector - shared across all contestants */}
            <Box sx={{ mt: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={0.75}>
                <Database size={14} color="#6366f1" />
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#344054" }}>
                  Dataset
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: 11, color: "#9ca3af", mb: 1 }}>
                All contestants will be evaluated using this dataset
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={newComparison.datasetPath || ""}
                  onChange={(e) => setNewComparison({ ...newComparison, datasetPath: e.target.value })}
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 280,
                        overflowY: "auto",
                      },
                    },
                  }}
                  sx={{
                    fontSize: 13,
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6366f1" },
                  }}
                >
                  <MenuItem value="" disabled>
                    <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>
                      {datasetsLoading ? "Loading datasets..." : "Select a dataset"}
                    </Typography>
                  </MenuItem>
                  
                  {/* My Datasets section */}
                  {myDatasets.length > 0 && (
                    <MenuItem disabled sx={{ opacity: 1, py: 0.5 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Database size={12} color="#6366f1" />
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase" }}>
                          My Datasets
                        </Typography>
                      </Stack>
                    </MenuItem>
                  )}
                  {myDatasets.map((ds) => (
                    <MenuItem key={`my-${ds.id}`} value={ds.path} sx={{ pl: 3 }}>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: "100%" }}>
                        <Database size={14} color="#6366f1" />
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{ds.name}</Typography>
                          <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>
                            {ds.promptCount} prompts • {ds.datasetType || "chatbot"}
                          </Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  ))}
                  
                  {/* Template Datasets section */}
                  {templateDatasets.length > 0 && (
                    <MenuItem disabled sx={{ opacity: 1, py: 0.5, mt: myDatasets.length > 0 ? 1 : 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Folder size={12} color="#10b981" />
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase" }}>
                          Template Datasets
                        </Typography>
                      </Stack>
                    </MenuItem>
                  )}
                  {templateDatasets.map((ds) => (
                    <MenuItem key={`template-${ds.key}`} value={ds.path} sx={{ pl: 3 }}>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: "100%" }}>
                        <Folder size={14} color="#10b981" />
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{ds.name}</Typography>
                          <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>
                            {ds.use_case}
                          </Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  ))}
                  
                  {myDatasets.length === 0 && templateDatasets.length === 0 && !datasetsLoading && (
                    <MenuItem disabled>
                      <Typography sx={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
                        No datasets found. Upload one in the Datasets tab.
                      </Typography>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Spacer between Evaluation Settings and Contestants */}
          <Box sx={{ height: 6 }} />

          {/* Contestants */}
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Swords size={16} color="#6366f1" />
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                  Contestants
                </Typography>
                <Chip
                  label={`${newComparison.contestants.length} players`}
                  size="small"
                  sx={{
                    backgroundColor: "#f5f3ff",
                    color: "#6366f1",
                    fontWeight: 600,
                    fontSize: "11px",
                    height: 22,
                    ml: 0.5,
                  }}
                />
              </Stack>
              <CustomizableButton
                variant="contained"
                text="Add Player"
                icon={<Box sx={{ display: "flex" }}><Plus size={14} /></Box>}
                onClick={addContestant}
                sx={{
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  color: "#fff",
                  fontSize: 12,
                  py: 0.75,
                  pl: 2,
                  pr: 2.5,
                  ml: 2,
                  boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
                  "& .MuiButton-startIcon": {
                    marginLeft: 0,
                    marginRight: "6px",
                  },
                  "&:hover": {
                    background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)",
                    boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
                  },
                }}
              />
            </Stack>
            
            <Stack spacing={4}>
              {newComparison.contestants.map((contestant, index) => {
                // Cycle through colors for multiple contestants
                const colors = [
                  { border: "#3b82f6", bg: alpha("#3b82f6", 0.03), gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
                  { border: "#ef4444", bg: alpha("#ef4444", 0.03), gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" },
                  { border: "#10b981", bg: alpha("#10b981", 0.03), gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
                  { border: "#f59e0b", bg: alpha("#f59e0b", 0.03), gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
                  { border: "#8b5cf6", bg: alpha("#8b5cf6", 0.03), gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" },
                  { border: "#ec4899", bg: alpha("#ec4899", 0.03), gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)" },
                ];
                const colorScheme = colors[index % colors.length];
                const hasRemoveButton = newComparison.contestants.length > 2;
                
                return (
                  <Box
                    key={index}
                    sx={{
                      p: 3,
                      pt: 3,
                      borderRadius: "12px",
                      border: "2px solid",
                      borderColor: colorScheme.border,
                      backgroundColor: colorScheme.bg,
                      position: "relative",
                    }}
                  >
                    {/* Header with badge and remove button */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                      <Box
                        sx={{
                          px: 2,
                          py: 0.75,
                          borderRadius: "8px",
                          background: colorScheme.gradient,
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: "0.3px",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Target size={14} />
                        {contestant.hyperparameters?.model 
                          ? contestant.name 
                          : `Contestant ${index + 1}`}
                      </Box>
                      {hasRemoveButton && (
                        <IconButton
                          onClick={() => removeContestant(index)}
                          size="small"
                          sx={{
                            width: 28,
                            height: 28,
                            backgroundColor: "#fef2f2",
                            color: "#dc2626",
                            "&:hover": { backgroundColor: "#fee2e2" },
                          }}
                        >
                          <X size={14} />
                        </IconButton>
                      )}
                    </Stack>

                    <Stack spacing={2.5} sx={{ pb: 2 }}>
                      {/* Model selector (Braintrust-style) */}
                      <Box sx={{ pb: 1 }}>
                        <ModelSelector
                          provider={contestant.hyperparameters?.provider || "openai"}
                          model={contestant.hyperparameters?.model || ""}
                          onProviderChange={(newProvider) => updateContestant(index, "provider", newProvider)}
                          onModelChange={(newModel) => updateContestant(index, "model", newModel)}
                          borderColor={colorScheme.border}
                          configuredProviders={configuredProviders}
                          onNavigateToSettings={() => navigate("/evals#settings")}
                        />
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Stack>
      </ModalStandard>

    </Box>
  );
}
