import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  Divider,
  IconButton,
  Slider,
  Select as MuiSelect,
  MenuItem,
  TextField,
  useTheme,
  CircularProgress,
  Popper,
  Paper,
  ClickAwayListener,
} from "@mui/material";
import { Plus, Trash2, Settings } from "lucide-react";
import StandardModal from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import Select from "../../components/Inputs/Select";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { PROVIDERS, getModelsForProvider } from "../../utils/providers";
import { evaluationLlmApiKeysService, type LLMApiKey } from "../../../infrastructure/api/evaluationLlmApiKeysService";

interface ChoiceScore {
  label: string;
  score: number;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ModelParams {
  temperature: number;
  maxTokens: number;
  topP: number;
}

export interface ScorerConfig {
  name: string;
  slug: string;
  type: "llm";
  // LLM Judge config
  provider: string;
  model: string;
  modelParams: ModelParams;
  messages: Message[];
  useChainOfThought: boolean;
  choiceScores: ChoiceScore[];
  passThreshold: number;
  // Variables schema
  inputSchema: string;
}

interface CreateScorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: ScorerConfig) => Promise<void>;
  initialConfig?: Partial<ScorerConfig>;
  isEditing?: boolean;
  projectId: string;
}

// Simple score text input (0 to 1)
function ScoreInput({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  const [inputValue, setInputValue] = useState(value.toString());

  // Sync with external value changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow typing any valid decimal pattern, convert comma to dot
    const raw = e.target.value.replace(",", ".");
    // Allow empty, digits, and one decimal point
    if (raw === "" || /^[0-9]*\.?[0-9]*$/.test(raw)) {
      setInputValue(raw);
    }
  };

  const handleBlur = () => {
    // On blur, validate and update parent
    const numVal = parseFloat(inputValue);
    if (inputValue === "" || isNaN(numVal)) {
      setInputValue("0");
      onChange(0);
    } else {
      // Clamp between 0 and 1
      const clamped = Math.min(1, Math.max(0, Math.round(numVal * 100) / 100));
      setInputValue(clamped.toString());
      onChange(clamped);
    }
  };

  return (
    <TextField
      size="small"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      sx={{
        width: 100,
        "& .MuiInputBase-input": {
          fontSize: "13px",
          textAlign: "center",
        },
        "& .MuiOutlinedInput-root": {
          borderRadius: "4px",
        },
      }}
    />
  );
}

const DEFAULT_INPUT_SCHEMA = `{
  "input": "",
  "output": "",
  "expected": "",
  "metadata": {}
}`;

export default function CreateScorerModal({
  isOpen,
  onClose,
  onSubmit,
  initialConfig,
  isEditing: _isEditing = false,
  projectId,
}: CreateScorerModalProps) {
  void _isEditing; // Reserved for future use
  const theme = useTheme();
  const navigate = useNavigate();

  const [config, setConfig] = useState<ScorerConfig>({
    name: initialConfig?.name || "",
    slug: initialConfig?.slug || "",
    type: "llm",
    provider: initialConfig?.provider || "",
    model: initialConfig?.model || "",
    modelParams: initialConfig?.modelParams || {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1,
    },
    messages: initialConfig?.messages || [
      { role: "system", content: "You are a helpful assistant" },
    ],
    useChainOfThought: initialConfig?.useChainOfThought ?? true,
    choiceScores: initialConfig?.choiceScores || [{ label: "", score: 0 }],
    passThreshold: initialConfig?.passThreshold ?? 0.5,
    inputSchema: initialConfig?.inputSchema || DEFAULT_INPUT_SCHEMA,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [configuredProviders, setConfiguredProviders] = useState<LLMApiKey[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  // Model params popover state
  const [paramsPopoverOpen, setParamsPopoverOpen] = useState(false);
  const paramsButtonRef = useRef<HTMLButtonElement>(null);

  // Update config when initialConfig changes (for editing)
  useEffect(() => {
    if (initialConfig) {
      setConfig({
        name: initialConfig.name || "",
        slug: initialConfig.slug || "",
        type: "llm",
        provider: initialConfig.provider || "",
        model: initialConfig.model || "",
        modelParams: initialConfig.modelParams || {
          temperature: 0.7,
          maxTokens: 2048,
          topP: 1,
        },
        messages: initialConfig.messages || [
          { role: "system", content: "You are a helpful assistant" },
        ],
        useChainOfThought: initialConfig.useChainOfThought ?? true,
        choiceScores: initialConfig.choiceScores || [{ label: "", score: 0 }],
        passThreshold: initialConfig.passThreshold ?? 0.5,
        inputSchema: initialConfig.inputSchema || DEFAULT_INPUT_SCHEMA,
      });
    } else {
      // Reset to defaults when creating new
      setConfig({
        name: "",
        slug: "",
        type: "llm",
        provider: "",
        model: "",
        modelParams: {
          temperature: 0.7,
          maxTokens: 2048,
          topP: 1,
        },
        messages: [
          { role: "system", content: "You are a helpful assistant" },
        ],
        useChainOfThought: true,
        choiceScores: [{ label: "", score: 0 }],
        passThreshold: 0.5,
        inputSchema: DEFAULT_INPUT_SCHEMA,
      });
    }
  }, [initialConfig, isOpen]);

  // Fetch configured providers on mount
  useEffect(() => {
    if (isOpen) {
      setLoadingProviders(true);
      evaluationLlmApiKeysService.getAllKeys()
        .then((keys) => {
          setConfiguredProviders(keys);
          // Set default provider to first configured one (only if not already set and not editing)
          setConfig((prev) => {
            if (keys.length > 0 && !prev.provider && !initialConfig) {
              const firstProvider = keys[0].provider;
              const models = getModelsForProvider(firstProvider);
              return {
                ...prev,
                provider: firstProvider,
                model: models.length > 0 ? models[0].id : "",
              };
            }
            return prev;
          });
        })
        .catch((err) => {
          console.error("Failed to fetch configured providers:", err);
        })
        .finally(() => {
          setLoadingProviders(false);
        });
    }
  }, [isOpen, initialConfig]);

  // Get current provider's models
  const availableModels = getModelsForProvider(config.provider);

  // Filter PROVIDERS to only show configured ones
  const availableProviders = Object.values(PROVIDERS).filter((p) =>
    configuredProviders.some((cp) => cp.provider === p.provider)
  );

  // Auto-generate slug from name
  const handleNameChange = useCallback((name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    setConfig((prev) => ({ ...prev, name, slug }));
  }, []);

  // Handle provider change - reset model when provider changes
  const handleProviderChange = useCallback((providerId: string) => {
    const models = getModelsForProvider(providerId);
    setConfig((prev) => ({
      ...prev,
      provider: providerId,
      model: models.length > 0 ? models[0].id : "",
    }));
  }, []);

  // Handle model change
  const handleModelChange = useCallback((modelId: string) => {
    setConfig((prev) => ({
      ...prev,
      model: modelId,
    }));
  }, []);

  const handleAddMessage = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      messages: [...prev.messages, { role: "user", content: "" }],
    }));
  }, []);

  const handleRemoveMessage = useCallback((index: number) => {
    setConfig((prev) => ({
      ...prev,
      messages: prev.messages.filter((_, i) => i !== index),
    }));
  }, []);

  const handleUpdateMessage = useCallback(
    (index: number, field: "role" | "content", value: string) => {
      setConfig((prev) => ({
        ...prev,
        messages: prev.messages.map((msg, i) =>
          i === index
            ? { ...msg, [field]: field === "role" ? (value as Message["role"]) : value }
            : msg
        ),
      }));
    },
    []
  );

  const handleAddChoiceScore = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      choiceScores: [...prev.choiceScores, { label: "", score: 0 }],
    }));
  }, []);

  const handleRemoveChoiceScore = useCallback((index: number) => {
    setConfig((prev) => ({
      ...prev,
      choiceScores: prev.choiceScores.filter((_, i) => i !== index),
    }));
  }, []);

  const handleUpdateChoiceScore = useCallback(
    (index: number, field: "label" | "score", value: string | number) => {
      setConfig((prev) => ({
        ...prev,
        choiceScores: prev.choiceScores.map((cs, i) =>
          i === index ? { ...cs, [field]: value } : cs
        ),
      }));
    },
    []
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(config);
      onClose();
    } catch (error) {
      console.error("Failed to save scorer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation
  const isValid =
    config.name.trim() &&
    config.slug.trim() &&
    config.messages.length > 0 &&
    config.choiceScores.some((cs) => cs.label.trim());

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialConfig?.name ? "Edit scorer" : "Create scorer"}
      description={initialConfig?.name ? "Update your scorer configuration" : "Create a new scorer to evaluate model outputs"}
      onSubmit={handleSubmit}
      submitButtonText={initialConfig?.name ? "Save changes" : "Save as custom scorer"}
      isSubmitting={isSubmitting || !isValid}
      maxWidth="md"
    >
      <Box sx={{ minHeight: "500px" }}>
        <Stack spacing={3}>
          {/* Name and Slug */}
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Field
                label="Name"
                placeholder="Enter name"
                value={config.name}
                onChange={(e) => handleNameChange(e.target.value)}
                isRequired
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Field
                label="Slug"
                placeholder="Enter slug"
                value={config.slug}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, slug: e.target.value }))
                }
                isRequired
              />
            </Box>
          </Stack>

          {/* Model Section */}
          <Box>
            {loadingProviders ? (
              <Box sx={{ display: "flex", alignItems: "center", height: 40 }}>
                <CircularProgress size={20} />
                <Typography sx={{ ml: 1, fontSize: "13px", color: "#6B7280" }}>
                  Loading providers...
                </Typography>
              </Box>
            ) : availableProviders.length === 0 ? (
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "#FEF3C7",
                  borderRadius: "4px",
                  border: "1px solid #F59E0B",
                }}
              >
                <Typography sx={{ fontSize: "13px", color: "#92400E", mb: 1 }}>
                  No API keys configured
                </Typography>
                <CustomizableButton
                  variant="text"
                  text="Add API key in Configuration"
                  icon={<Settings size={14} />}
                  onClick={() => {
                    onClose();
                    navigate(`/evals/${projectId}#configuration`)
                  }}
                  sx={{
                    color: "#92400E",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "none",
                    p: 0,
                    "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
                  }}
                />
              </Box>
            ) : (
              <>
                {/* Provider and Model Selects with Params Button */}
                <Stack direction="row" spacing={2} alignItems="flex-end">
                  <Box sx={{ flex: 1 }}>
                    <Select
                      id="scorer-provider-select"
                      label="Provider"
                      placeholder="Select provider"
                      value={config.provider}
                      onChange={(e) => handleProviderChange(e.target.value as string)}
                      items={availableProviders.map((p) => ({
                        _id: p.provider,
                        name: p.displayName,
                      }))}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Select
                      id="scorer-model-select"
                      label="Model"
                      placeholder="Select model"
                      value={config.model}
                      onChange={(e) => handleModelChange(e.target.value as string)}
                      items={availableModels.map((m) => ({
                        _id: m.id,
                        name: m.name,
                      }))}
                      disabled={!config.provider}
                    />
                  </Box>
                  <Box
                    component="button"
                    ref={paramsButtonRef}
                    onClick={() => setParamsPopoverOpen(!paramsPopoverOpen)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      px: 1.5,
                      height: 34,
                      border: "1px solid #d0d5dd",
                      borderRadius: "4px",
                      cursor: "pointer",
                      backgroundColor: paramsPopoverOpen ? "#F3F4F6" : "#fff",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: "#9CA3AF",
                        backgroundColor: "#FAFAFA",
                      },
                    }}
                  >
                    <Settings size={14} color="#6B7280" />
                    <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>
                      Params
                    </Typography>
                  </Box>
                </Stack>

                {/* Params Popover */}
                <Popper
                  open={paramsPopoverOpen}
                  anchorEl={paramsButtonRef.current}
                  placement="bottom-end"
                  style={{ zIndex: 1400 }}
                >
                  <ClickAwayListener onClickAway={() => setParamsPopoverOpen(false)}>
                    <Paper
                      sx={{
                        mt: 0.5,
                        p: 2,
                        width: 280,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)",
                        borderRadius: "4px",
                        border: "1px solid #d0d5dd",
                      }}
                    >
                      <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#374151", mb: 2 }}>
                        Model parameters
                      </Typography>
                      <Stack spacing={2.5}>
                        {/* Temperature */}
                        <Box>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                            <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                              Temperature
                            </Typography>
                            <Typography sx={{ fontSize: "12px", fontWeight: 500, color: "#374151" }}>
                              {config.modelParams.temperature.toFixed(1)}
                            </Typography>
                          </Stack>
                          <Slider
                            size="small"
                            value={config.modelParams.temperature}
                            onChange={(_, value) =>
                              setConfig((prev) => ({
                                ...prev,
                                modelParams: { ...prev.modelParams, temperature: value as number },
                              }))
                            }
                            min={0}
                            max={2}
                            step={0.1}
                            sx={{
                              color: "#13715B",
                              height: 4,
                              "& .MuiSlider-thumb": {
                                width: 14,
                                height: 14,
                                backgroundColor: "#fff",
                                border: "2px solid #13715B",
                              },
                              "& .MuiSlider-track": { border: "none" },
                            }}
                          />
                        </Box>

                        {/* Max Tokens */}
                        <Box>
                          <Typography sx={{ fontSize: "12px", color: "#6B7280", mb: 0.75 }}>
                            Max tokens
                          </Typography>
                          <TextField
                            size="small"
                            type="number"
                            value={config.modelParams.maxTokens}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                modelParams: { ...prev.modelParams, maxTokens: parseInt(e.target.value) || 0 },
                              }))
                            }
                            inputProps={{ min: 1, max: 4096 }}
                            fullWidth
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                fontSize: "13px",
                                height: 36,
                                "& fieldset": { borderColor: "#d0d5dd" },
                                "&:hover fieldset": { borderColor: "#D1D5DB" },
                                "&.Mui-focused fieldset": { borderColor: "#13715B" },
                              },
                            }}
                          />
                        </Box>

                        {/* Top P */}
                        <Box>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                            <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                              Top P
                            </Typography>
                            <Typography sx={{ fontSize: "12px", fontWeight: 500, color: "#374151" }}>
                              {config.modelParams.topP.toFixed(2)}
                            </Typography>
                          </Stack>
                          <Slider
                            size="small"
                            value={config.modelParams.topP}
                            onChange={(_, value) =>
                              setConfig((prev) => ({
                                ...prev,
                                modelParams: { ...prev.modelParams, topP: value as number },
                              }))
                            }
                            min={0}
                            max={1}
                            step={0.05}
                            sx={{
                              color: "#13715B",
                              height: 4,
                              "& .MuiSlider-thumb": {
                                width: 14,
                                height: 14,
                                backgroundColor: "#fff",
                                border: "2px solid #13715B",
                              },
                              "& .MuiSlider-track": { border: "none" },
                            }}
                          />
                        </Box>
                      </Stack>
                    </Paper>
                  </ClickAwayListener>
                </Popper>
              </>
            )}
          </Box>

          {/* Prompt Messages */}
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 500,
              color: theme.palette.text.secondary,
              mb: 1,
              mt: 2,
            }}
          >
            Prompt
          </Typography>
          <Stack spacing={2}>
            {config.messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    backgroundColor: "#F9FAFB",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  <MuiSelect
                    size="small"
                    value={msg.role}
                    onChange={(e) =>
                      handleUpdateMessage(index, "role", e.target.value)
                    }
                    variant="standard"
                    disableUnderline
                    sx={{
                      fontSize: "12px",
                      fontWeight: 500,
                      minWidth: 80,
                      "& .MuiSelect-select": { py: 0 },
                    }}
                  >
                    <MenuItem value="system">System</MenuItem>
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="assistant">Assistant</MenuItem>
                  </MuiSelect>
                  {config.messages.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveMessage(index)}
                      sx={{ p: 0.5 }}
                    >
                      <Trash2 size={14} color="#9CA3AF" />
                    </IconButton>
                  )}
                </Stack>
                <TextField
                  multiline
                  minRows={2}
                  maxRows={6}
                  fullWidth
                  placeholder={
                    msg.role === "system"
                      ? "You are a helpful assistant that evaluates..."
                      : "Enter message content..."
                  }
                  value={msg.content}
                  onChange={(e) =>
                    handleUpdateMessage(index, "content", e.target.value)
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      border: "none",
                      "& fieldset": { border: "none" },
                    },
                    "& .MuiInputBase-input": {
                      fontSize: "13px",
                      p: 1.5,
                    },
                  }}
                />
              </Box>
            ))}

            <CustomizableButton
              variant="text"
              text="Add message"
              icon={<Plus size={14} />}
              onClick={handleAddMessage}
              sx={{
                alignSelf: "flex-start",
                color: "#13715B",
                fontSize: "13px",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { backgroundColor: "#E8F5F1" },
              }}
            />
          </Stack>

          <Divider />

          {/* Choice Scores */}
          <Box>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              Choice scores
            </Typography>
            <Typography
              sx={{ fontSize: "12px", color: "#6B7280", mb: 2 }}
            >
              Choice scores are required when using LLM judge scorers. The
              model will be forced to choose one of the choices using a tool
              schema. All choices and scores must be unique.
            </Typography>

            <Stack spacing={1.5}>
              {/* Header */}
              <Stack direction="row" spacing={2}>
                <Typography
                  sx={{ flex: 1, fontSize: "12px", color: "#6B7280" }}
                >
                  Choice
                </Typography>
                <Typography
                  sx={{ width: 100, fontSize: "12px", color: "#6B7280", textAlign: "center" }}
                >
                  Score (0 to 1)
                </Typography>
                <Box sx={{ width: 32 }} />
              </Stack>

              {/* Choice rows */}
              {config.choiceScores.map((cs, index) => (
                <Stack key={index} direction="row" spacing={2} alignItems="center">
                  <TextField
                    size="small"
                    placeholder="Enter choice label"
                    value={cs.label}
                    onChange={(e) =>
                      handleUpdateChoiceScore(index, "label", e.target.value)
                    }
                    sx={{
                      flex: 1,
                      "& .MuiInputBase-input": { fontSize: "13px" },
                    }}
                  />
                  <ScoreInput
                    value={cs.score}
                    onChange={(newScore) => handleUpdateChoiceScore(index, "score", newScore)}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveChoiceScore(index)}
                    disabled={config.choiceScores.length === 1}
                    sx={{ p: 0.5 }}
                  >
                    <Trash2
                      size={16}
                      color={
                        config.choiceScores.length === 1
                          ? "#D1D5DB"
                          : "#9CA3AF"
                      }
                    />
                  </IconButton>
                </Stack>
              ))}

              <CustomizableButton
                variant="text"
                text="Add choice score"
                icon={<Plus size={14} />}
                onClick={handleAddChoiceScore}
                sx={{
                  alignSelf: "flex-start",
                  color: "#13715B",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#E8F5F1" },
                }}
              />
            </Stack>
          </Box>

          <Divider />

          {/* Pass Threshold */}
          <Box>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              Pass threshold
            </Typography>
            <Typography sx={{ fontSize: "12px", color: "#6B7280", mb: 2 }}>
              Optionally set a score threshold for passing (0 to 1)
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Slider
                value={config.passThreshold}
                onChange={(_, value) =>
                  setConfig((prev) => ({
                    ...prev,
                    passThreshold: value as number,
                  }))
                }
                min={0}
                max={1}
                step={0.05}
                valueLabelDisplay="auto"
                sx={{
                  flex: 1,
                  color: "#13715B",
                  "& .MuiSlider-thumb": {
                    backgroundColor: "#fff",
                    border: "2px solid #13715B",
                  },
                }}
              />
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 500,
                  minWidth: 40,
                  textAlign: "right",
                }}
              >
                {config.passThreshold.toFixed(2)}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </StandardModal>
  );
}
