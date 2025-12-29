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
  Card,
  CardContent,
  Chip,
  IconButton,
  CircularProgress,
  TextField,
  Divider,
  LinearProgress,
  alpha,
  Select,
  MenuItem,
  FormControl,
  Popper,
  Paper,
  ClickAwayListener,
  InputAdornment,
} from "@mui/material";
import {
  Trash2,
  Trophy,
  Eye,
  Swords,
  Zap,
  Crown,
  Target,
  Sparkles,
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
} from "lucide-react";
import CustomizableButton from "../../components/Button/CustomizableButton";
import ModalStandard from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import Alert from "../../components/Alert";
import {
  createArenaComparison,
  listArenaComparisons,
  getArenaComparisonResults,
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
                          height: 44,
                          minHeight: 44,
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
                          px: 2,
                          py: 1,
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
                          px: 1.5,
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
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedResults, setSelectedResults] = useState<any>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Datasets
  const [myDatasets, setMyDatasets] = useState<UserDataset[]>([]);
  const [templateDatasets, setTemplateDatasets] = useState<TemplateDataset[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  
  // Configured providers (API keys)
  const [configuredProviders, setConfiguredProviders] = useState<LLMApiKey[]>([]);

  // New comparison form state
  const [newComparison, setNewComparison] = useState({
    name: "",
    metricName: "Quality",
    metricCriteria: "Choose the winner based on which response is more helpful, accurate, and well-written",
    judgeModel: "gpt-4o",
    contestants: [
      { name: "Player 1", hyperparameters: { model: "", provider: "openai" }, datasetPath: "", testCases: [] as { input: string; actualOutput: string }[] },
      { name: "Player 2", hyperparameters: { model: "", provider: "openai" }, datasetPath: "", testCases: [] as { input: string; actualOutput: string }[] },
    ] as (ArenaContestant & { datasetPath?: string; hyperparameters: { model: string; provider?: string } })[],
  });

  // Load comparisons
  const loadComparisons = async () => {
    setLoading(true);
    try {
      const data = await listArenaComparisons(orgId ? { org_id: orgId } : undefined);
      setComparisons(data.comparisons || []);
    } catch (err) {
      console.error("Failed to load arena comparisons:", err);
      setAlert({ variant: "error", body: "Failed to load arena comparisons" });
    } finally {
      setLoading(false);
    }
  };

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
    loadComparisons();
    loadDatasets();
    loadConfiguredProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  // Auto-refresh running comparisons
  useEffect(() => {
    const runningComparisons = comparisons.filter(c => c.status === "running" || c.status === "pending");
    if (runningComparisons.length > 0) {
      const interval = setInterval(loadComparisons, 5000);
      return () => clearInterval(interval);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparisons]);

  const handleCreateComparison = async () => {
    if (!newComparison.name.trim()) return;

    setCreating(true);
    try {
      await createArenaComparison({
        name: newComparison.name,
        orgId: orgId || undefined,
        contestants: newComparison.contestants,
        metric: {
          name: newComparison.metricName,
          criteria: newComparison.metricCriteria,
          evaluationParams: ["input", "actual_output"],
        },
        judgeModel: newComparison.judgeModel,
      });

      setAlert({ variant: "success", body: "Arena battle started! ⚔️" });
      setTimeout(() => setAlert(null), 3000);
      setCreateModalOpen(false);
      resetForm();
      await loadComparisons();
    } catch (err) {
      console.error("Failed to create arena comparison:", err);
      setAlert({ variant: "error", body: "Failed to create arena comparison" });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setCreating(false);
    }
  };

  const handleViewResults = async (comparisonId: string) => {
    setResultsModalOpen(true);
    setResultsLoading(true);

    try {
      const results = await getArenaComparisonResults(comparisonId);
      setSelectedResults(results);
    } catch (err) {
      console.error("Failed to load results:", err);
      setAlert({ variant: "error", body: "Failed to load results" });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleDeleteComparison = async (comparisonId: string) => {
    setDeleting(comparisonId);
    try {
      await deleteArenaComparison(comparisonId);
      setAlert({ variant: "success", body: "Arena comparison deleted" });
      setTimeout(() => setAlert(null), 3000);
      await loadComparisons();
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
      metricName: "Quality",
      metricCriteria: "Choose the winner based on which response is more helpful, accurate, and well-written",
      judgeModel: "gpt-4o",
      contestants: [
        { name: "Player 1", hyperparameters: { model: "", provider: "openai" }, datasetPath: "", testCases: [] },
        { name: "Player 2", hyperparameters: { model: "", provider: "openai" }, datasetPath: "", testCases: [] },
      ],
    });
  };

  const addContestant = () => {
    const newIndex = newComparison.contestants.length + 1;
    setNewComparison({
      ...newComparison,
      contestants: [
        ...newComparison.contestants,
        { name: `Player ${newIndex}`, hyperparameters: { model: "", provider: "openai" }, datasetPath: "", testCases: [] },
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
    } else if (field === "model") {
      updated[index].hyperparameters = { ...updated[index].hyperparameters, model: value };
    } else if (field === "dataset") {
      updated[index].datasetPath = value;
    }
    setNewComparison({ ...newComparison, contestants: updated });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return { bg: "#dcfce7", color: "#166534", gradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" };
      case "running":
        return { bg: "#dbeafe", color: "#1e40af", gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" };
      case "pending":
        return { bg: "#fef3c7", color: "#92400e", gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" };
      case "failed":
        return { bg: "#fee2e2", color: "#991b1b", gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" };
      default:
        return { bg: "#f3f4f6", color: "#374151", gradient: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)" };
    }
  };

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
          <CircularProgress size={32} sx={{ color: "#13715B" }} />
        </Box>
      ) : comparisons.length === 0 ? (
        /* Empty state */
        <Box
          sx={{
            border: "2px dashed #c7d2fe",
            borderRadius: "16px",
            p: 8,
            textAlign: "center",
            backgroundColor: "#E8F5F1",
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
            <Swords size={80} color="#13715B" />
          </Box>
          <Box
            sx={{
              position: "absolute",
              bottom: 20,
              right: 20,
              opacity: 0.1,
            }}
          >
            <Trophy size={80} color="#13715B" />
          </Box>
          
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #13715B 0%, #1a8a6e 100%)",
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
              background: "linear-gradient(135deg, #13715B 0%, #1a8a6e 100%)",
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
        /* Comparisons list */
        <Stack spacing={2}>
          {comparisons.map((comparison) => {
            const statusColors = getStatusColor(comparison.status);
            const isWinner = comparison.winner;
            
            return (
              <Card
                key={comparison.id}
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                {/* Status bar */}
                <Box
                  sx={{
                    height: 4,
                    background: statusColors.gradient,
                  }}
                />
                
                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                        <Typography sx={{ fontSize: 17, fontWeight: 600, color: "#111827" }}>
                          {comparison.name}
                        </Typography>
                        <Chip
                          label={comparison.status.toUpperCase()}
                          size="small"
                          sx={{
                            backgroundColor: statusColors.bg,
                            color: statusColors.color,
                            fontWeight: 700,
                            fontSize: "10px",
                            height: 22,
                            letterSpacing: "0.5px",
                          }}
                        />
                        {isWinner && (
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{
                            background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                            px: 1.5,
                            py: 0.5,
                            borderRadius: "20px",
                          }}>
                            <Crown size={14} color="#b45309" />
                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#b45309" }}>
                              {comparison.winner}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>

                      {/* Contestants visual */}
                      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" gap={1}>
                        {comparison.contestants?.map((name, idx) => {
                          const gradients = [
                            "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                            "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                            "linear-gradient(135deg, #1a8a6e 0%, #7c3aed 100%)",
                            "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
                          ];
                          return (
                            <Stack key={name} direction="row" alignItems="center" spacing={1}>
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "6px",
                                  background: gradients[idx % gradients.length],
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#fff",
                                }}
                              >
                                {name.charAt(0)}
                              </Box>
                              <Typography sx={{ 
                                fontSize: 12, 
                                fontWeight: 600, 
                                color: "#374151",
                              }}>
                                {name}
                              </Typography>
                              {idx < (comparison.contestants?.length || 0) - 1 && (
                                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#d1d5db", ml: 0.5 }}>
                                  •
                                </Typography>
                              )}
                            </Stack>
                          );
                        })}
                      </Stack>

                      {comparison.status === "running" && (
                        <Box sx={{ mt: 2, maxWidth: 300 }}>
                          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                            <Sparkles size={12} color="#13715B" />
                            <Typography sx={{ fontSize: 11, color: "#13715B", fontWeight: 600 }}>
                              Battle in progress...
                            </Typography>
                          </Stack>
                          <LinearProgress
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: "#e5e7eb",
                              "& .MuiLinearProgress-bar": {
                                background: "linear-gradient(90deg, #13715B 0%, #1a8a6e 100%)",
                                borderRadius: 3,
                              },
                            }}
                          />
                        </Box>
                      )}

                      <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: 2 }}>
                        {new Date(comparison.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                      {comparison.status === "completed" && (
                        <IconButton
                          onClick={() => handleViewResults(comparison.id)}
                          sx={{
                            backgroundColor: "#E8F5F1",
                            color: "#13715B",
                            "&:hover": { backgroundColor: "#D1EDE6", color: "#0f5f4c" },
                          }}
                        >
                          <Eye size={18} />
                        </IconButton>
                      )}
                      <IconButton
                        onClick={() => handleDeleteComparison(comparison.id)}
                        disabled={deleting === comparison.id}
                        sx={{
                          backgroundColor: "#fef2f2",
                          color: "#dc2626",
                          "&:hover": { backgroundColor: "#fee2e2", color: "#b91c1c" },
                        }}
                      >
                        {deleting === comparison.id ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
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
        isSubmitting={creating || !newComparison.name.trim()}
      >
        <Stack spacing={4}>
          {/* Modal Header */}
          <Box sx={{ textAlign: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "16px",
                background: "linear-gradient(135deg, #13715B 0%, #1a8a6e 100%)",
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
              p: 3,
              borderRadius: "12px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
              <Target size={16} color="#13715B" />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                Evaluation Settings
              </Typography>
            </Stack>
            
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={2.5}>
                <Box sx={{ flex: 1 }}>
                  <Field
                    label="Metric name"
                    value={newComparison.metricName}
                    onChange={(e) => setNewComparison({ ...newComparison, metricName: e.target.value })}
                    placeholder="e.g., Quality, Helpfulness"
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Field
                    label="Judge model"
                    value={newComparison.judgeModel}
                    onChange={(e) => setNewComparison({ ...newComparison, judgeModel: e.target.value })}
                    placeholder="e.g., gpt-4o"
                  />
                </Box>
              </Stack>
              
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151", mb: 0.5 }}>
                  Evaluation criteria
                </Typography>
                <TextField
                  value={newComparison.metricCriteria}
                  onChange={(e) => setNewComparison({ ...newComparison, metricCriteria: e.target.value })}
                  placeholder="Describe how the judge should pick the winner..."
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      fontSize: 13,
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      "& fieldset": { borderColor: "#e2e8f0" },
                      "&:hover fieldset": { borderColor: "#cbd5e1" },
                      "&.Mui-focused fieldset": { borderColor: "#13715B" },
                    },
                  }}
                />
              </Box>
            </Stack>
          </Box>

          {/* Contestants */}
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Swords size={16} color="#13715B" />
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                  Contestants
                </Typography>
                <Chip
                  label={`${newComparison.contestants.length} players`}
                  size="small"
                  sx={{
                    backgroundColor: "#E8F5F1",
                    color: "#13715B",
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
                icon={<Plus size={14} />}
                onClick={addContestant}
                sx={{
                  background: "linear-gradient(135deg, #13715B 0%, #1a8a6e 100%)",
                  color: "#fff",
                  fontSize: 12,
                  py: 0.75,
                  px: 2.5,
                  ml: 2,
                  boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
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
                  { border: "#1a8a6e", bg: alpha("#1a8a6e", 0.03), gradient: "linear-gradient(135deg, #1a8a6e 0%, #7c3aed 100%)" },
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
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "6px",
                          background: colorScheme.gradient,
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                        }}
                      >
                        PLAYER {index + 1}
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

                    <Stack spacing={2.5}>
                      {/* Name field */}
                      <Field
                        label="Name"
                        value={contestant.name}
                        onChange={(e) => updateContestant(index, "name", e.target.value)}
                        placeholder={`Player ${index + 1}`}
                      />

                      {/* Model selector (Braintrust-style) */}
                      <ModelSelector
                        provider={contestant.hyperparameters?.provider || "openai"}
                        model={contestant.hyperparameters?.model || ""}
                        onProviderChange={(newProvider) => updateContestant(index, "provider", newProvider)}
                        onModelChange={(newModel) => updateContestant(index, "model", newModel)}
                        borderColor={colorScheme.border}
                        configuredProviders={configuredProviders}
                        onNavigateToSettings={() => navigate("/evals#settings")}
                      />

                      {/* Dataset selector */}
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} mb={0.75}>
                          <Database size={12} color="#6b7280" />
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#344054" }}>
                            Dataset
                          </Typography>
                        </Stack>
                        <FormControl fullWidth size="small">
                          <Select
                            value={contestant.datasetPath || ""}
                            onChange={(e) => updateContestant(index, "dataset", e.target.value)}
                            displayEmpty
                            sx={{
                              fontSize: 13,
                              backgroundColor: "#fff",
                              borderRadius: "8px",
                              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb" },
                              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: colorScheme.border },
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
                                  <Database size={12} color="#13715B" />
                                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#13715B", textTransform: "uppercase" }}>
                                    My Datasets
                                  </Typography>
                                </Stack>
                              </MenuItem>
                            )}
                            {myDatasets.map((ds) => (
                              <MenuItem key={`my-${ds.id}`} value={ds.path} sx={{ pl: 3 }}>
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: "100%" }}>
                                  <Database size={14} color="#13715B" />
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
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Stack>
      </ModalStandard>

      {/* Results Modal */}
      <ModalStandard
        isOpen={resultsModalOpen}
        onClose={() => {
          setResultsModalOpen(false);
          setSelectedResults(null);
        }}
        title=""
        description=""
        onSubmit={() => setResultsModalOpen(false)}
        submitButtonText="Close"
      >
        {resultsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={40} sx={{ color: "#13715B" }} />
          </Box>
        ) : selectedResults ? (
          <Stack spacing={3}>
            {/* Results Header */}
            <Box sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  mb: 2,
                  boxShadow: "0 8px 24px rgba(251,191,36,0.4)",
                }}
              >
                <Trophy size={32} color="#1e1b4b" />
              </Box>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
                Battle Results
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#6b7280", mt: 0.5 }}>
                {selectedResults.name}
              </Typography>
            </Box>

            <Divider />

            {/* Winner announcement */}
            {selectedResults.results?.winner && (
              <Box
                sx={{
                  p: 3,
                  background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  borderRadius: "16px",
                  textAlign: "center",
                  border: "2px solid #fbbf24",
                }}
              >
                <Crown size={40} color="#b45309" style={{ marginBottom: 8 }} />
                <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#78350f" }}>
                  {selectedResults.results.winner}
                </Typography>
                <Typography sx={{ fontSize: 14, color: "#92400e", mt: 0.5, fontWeight: 600 }}>
                  🏆 Champion
                </Typography>
              </Box>
            )}

            {/* Win counts */}
            {selectedResults.results?.winCounts && Object.keys(selectedResults.results.winCounts).length > 0 && (
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151", mb: 2 }}>
                  Score Distribution
                </Typography>
                <Stack spacing={2}>
                  {Object.entries(selectedResults.results.winCounts).map(([name, count], idx) => {
                    const maxCount = Math.max(...Object.values(selectedResults.results.winCounts) as number[]);
                    const isWinner = name === selectedResults.results.winner;
                    return (
                      <Box key={name}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "6px",
                                background: idx === 0 
                                  ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                                  : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#fff",
                              }}
                            >
                              {name.charAt(0)}
                            </Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                              {name}
                            </Typography>
                            {isWinner && <Crown size={14} color="#f59e0b" />}
                          </Stack>
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                            {count as number} wins
                          </Typography>
                        </Stack>
                        <Box sx={{ height: 10, backgroundColor: "#e5e7eb", borderRadius: 5, overflow: "hidden" }}>
                          <Box
                            sx={{
                              width: `${((count as number) / maxCount) * 100}%`,
                              height: "100%",
                              background: isWinner 
                                ? "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)"
                                : idx === 0 
                                  ? "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)"
                                  : "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                              borderRadius: 5,
                              transition: "width 0.5s ease",
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* Detailed results */}
            {selectedResults.results?.detailedResults?.length > 0 && (
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151", mb: 2 }}>
                  Round-by-Round Results
                </Typography>
                <Stack spacing={1.5}>
                  {selectedResults.results.detailedResults.map((result: { testCaseIndex: number; input: string; winner: string | null; reason?: string }, index: number) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
                          Round {result.testCaseIndex + 1}
                        </Typography>
                        {result.winner && (
                          <Chip
                            icon={<Trophy size={12} />}
                            label={result.winner}
                            size="small"
                            sx={{
                              backgroundColor: "#fef3c7",
                              color: "#92400e",
                              fontWeight: 600,
                              fontSize: "11px",
                              "& .MuiChip-icon": { color: "#f59e0b" },
                            }}
                          />
                        )}
                      </Stack>
                      <Typography sx={{ fontSize: 13, color: "#374151", mb: 1 }}>
                        <strong>Prompt:</strong> {result.input || "N/A"}
                      </Typography>
                      {result.reason && (
                        <Typography sx={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>
                          💭 {result.reason}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Metadata */}
            <Box sx={{ pt: 2, borderTop: "1px solid #e5e7eb" }}>
              <Stack direction="row" spacing={3} flexWrap="wrap">
                <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>
                  <strong>Judge:</strong> {selectedResults.judgeModel}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>
                  <strong>Created:</strong> {new Date(selectedResults.createdAt).toLocaleString()}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        ) : (
          <Typography sx={{ textAlign: "center", color: "#6b7280", py: 6 }}>
            No results available
          </Typography>
        )}
      </ModalStandard>
    </Box>
  );
}
