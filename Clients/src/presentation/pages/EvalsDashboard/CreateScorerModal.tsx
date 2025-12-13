import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Divider,
  Switch,
  FormControlLabel,
  IconButton,
  Slider,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  useTheme,
} from "@mui/material";
import { Plus, Trash2, Code, Bot, FileCode } from "lucide-react";
import StandardModal from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import CustomizableButton from "../../components/Button/CustomizableButton";

interface ChoiceScore {
  label: string;
  score: number;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ScorerConfig {
  name: string;
  slug: string;
  type: "llm" | "typescript" | "python";
  // LLM Judge config
  model: string;
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
}

const MODEL_OPTIONS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o mini" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku" },
];

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
  isEditing = false,
}: CreateScorerModalProps) {
  const theme = useTheme();

  const [config, setConfig] = useState<ScorerConfig>({
    name: initialConfig?.name || "",
    slug: initialConfig?.slug || "",
    type: initialConfig?.type || "llm",
    model: initialConfig?.model || "gpt-4o-mini",
    messages: initialConfig?.messages || [
      { role: "system", content: "You are a helpful assistant" },
    ],
    useChainOfThought: initialConfig?.useChainOfThought ?? true,
    choiceScores: initialConfig?.choiceScores || [{ label: "", score: 0 }],
    passThreshold: initialConfig?.passThreshold ?? 0.5,
    inputSchema: initialConfig?.inputSchema || DEFAULT_INPUT_SCHEMA,
  });

  const [variablesTab, setVariablesTab] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = useCallback((name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    setConfig((prev) => ({ ...prev, name, slug }));
  }, []);

  // Add a new message
  const handleAddMessage = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      messages: [...prev.messages, { role: "user", content: "" }],
    }));
  }, []);

  // Update a message
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

  // Remove a message
  const handleRemoveMessage = useCallback((index: number) => {
    setConfig((prev) => ({
      ...prev,
      messages: prev.messages.filter((_, i) => i !== index),
    }));
  }, []);

  // Add a choice score
  const handleAddChoiceScore = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      choiceScores: [...prev.choiceScores, { label: "", score: 0 }],
    }));
  }, []);

  // Update a choice score
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

  // Remove a choice score
  const handleRemoveChoiceScore = useCallback((index: number) => {
    setConfig((prev) => ({
      ...prev,
      choiceScores: prev.choiceScores.filter((_, i) => i !== index),
    }));
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(config);
      onClose();
    } catch (err) {
      console.error("Failed to save scorer", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    config.name.trim() &&
    config.slug.trim() &&
    (config.type !== "llm" ||
      (config.messages.length > 0 && config.choiceScores.some((cs) => cs.label.trim())));

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit scorer" : "Create scorer"}
      description={
        isEditing
          ? "Update the scorer configuration"
          : "Create a new scorer to evaluate model outputs"
      }
      onSubmit={handleSubmit}
      submitButtonText={isEditing ? "Save changes" : "Save as custom scorer"}
      isSubmitting={isSubmitting}
      maxWidth="1100px"
    >
      <Stack direction="row" spacing={3} sx={{ minHeight: "500px" }}>
        {/* Left Panel - Scorer Configuration */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
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

            {/* Type Selector */}
            <Box>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: theme.palette.text.secondary,
                  mb: 1,
                }}
              >
                Type
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  icon={<Bot size={14} />}
                  label="LLM judge"
                  onClick={() => setConfig((prev) => ({ ...prev, type: "llm" }))}
                  sx={{
                    height: 32,
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    backgroundColor:
                      config.type === "llm" ? "#FEF3C7" : "#F3F4F6",
                    color: config.type === "llm" ? "#92400E" : "#6B7280",
                    border:
                      config.type === "llm"
                        ? "1px solid #F59E0B"
                        : "1px solid transparent",
                    "& .MuiChip-icon": {
                      color: config.type === "llm" ? "#92400E" : "#6B7280",
                    },
                    "&:hover": { backgroundColor: "#FEF3C7" },
                  }}
                />
                <Chip
                  icon={<FileCode size={14} />}
                  label="TypeScript"
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, type: "typescript" }))
                  }
                  sx={{
                    height: 32,
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    backgroundColor:
                      config.type === "typescript" ? "#DBEAFE" : "#F3F4F6",
                    color: config.type === "typescript" ? "#1E40AF" : "#6B7280",
                    border:
                      config.type === "typescript"
                        ? "1px solid #3B82F6"
                        : "1px solid transparent",
                    "& .MuiChip-icon": {
                      color:
                        config.type === "typescript" ? "#1E40AF" : "#6B7280",
                    },
                    "&:hover": { backgroundColor: "#DBEAFE" },
                  }}
                />
                <Chip
                  icon={<Code size={14} />}
                  label="Python"
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, type: "python" }))
                  }
                  sx={{
                    height: 32,
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    backgroundColor:
                      config.type === "python" ? "#E0E7FF" : "#F3F4F6",
                    color: config.type === "python" ? "#3730A3" : "#6B7280",
                    border:
                      config.type === "python"
                        ? "1px solid #6366F1"
                        : "1px solid transparent",
                    "& .MuiChip-icon": {
                      color: config.type === "python" ? "#3730A3" : "#6B7280",
                    },
                    "&:hover": { backgroundColor: "#E0E7FF" },
                  }}
                />
              </Stack>
            </Box>

            {/* LLM Judge Configuration */}
            {config.type === "llm" && (
              <>
                {/* Prompt Section */}
                <Box>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: theme.palette.text.secondary,
                      mb: 1,
                    }}
                  >
                    Prompt
                  </Typography>

                  {/* Model Selector */}
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Select
                      size="small"
                      value={config.model}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          model: e.target.value,
                        }))
                      }
                      sx={{
                        minWidth: 180,
                        fontSize: "13px",
                        "& .MuiSelect-select": { py: 1 },
                      }}
                    >
                      {MODEL_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Bot size={14} color="#6B7280" />
                            <Typography sx={{ fontSize: "13px" }}>
                              {opt.label}
                            </Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </Stack>

                  {/* Messages */}
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
                          <Select
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
                          </Select>
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
                              ? "You are a helpful assistant"
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
                      text="Message"
                      icon={<Plus size={14} />}
                      onClick={handleAddMessage}
                      sx={{
                        alignSelf: "flex-start",
                        color: "#6B7280",
                        fontSize: "13px",
                        textTransform: "none",
                        "&:hover": { backgroundColor: "#F3F4F6" },
                      }}
                    />
                  </Stack>

                  {/* Chain of Thought */}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.useChainOfThought}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            useChainOfThought: e.target.checked,
                          }))
                        }
                        size="small"
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "#13715B",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                            backgroundColor: "#13715B",
                          },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: "13px", color: "#374151" }}>
                        Use chain of thought (CoT)
                      </Typography>
                    }
                    sx={{ mt: 2 }}
                  />
                </Box>

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
                        sx={{ width: 100, fontSize: "12px", color: "#6B7280" }}
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
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0, max: 1, step: 0.1 }}
                          value={cs.score}
                          onChange={(e) =>
                            handleUpdateChoiceScore(
                              index,
                              "score",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          sx={{
                            width: 100,
                            "& .MuiInputBase-input": { fontSize: "13px" },
                          }}
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
                      onClick={handleAddChoiceScore}
                      sx={{
                        alignSelf: "flex-start",
                        color: "#6B7280",
                        fontSize: "12px",
                        textTransform: "none",
                        "&:hover": { backgroundColor: "#F3F4F6" },
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
              </>
            )}

            {/* TypeScript/Python placeholder */}
            {config.type !== "llm" && (
              <Box
                sx={{
                  p: 3,
                  backgroundColor: "#F9FAFB",
                  borderRadius: "8px",
                  border: "1px dashed #E5E7EB",
                  textAlign: "center",
                }}
              >
                <Code size={32} color="#9CA3AF" />
                <Typography
                  sx={{ mt: 1, fontSize: "14px", color: "#6B7280" }}
                >
                  {config.type === "typescript" ? "TypeScript" : "Python"} scorer
                  configuration coming soon
                </Typography>
                <Typography sx={{ fontSize: "12px", color: "#9CA3AF", mt: 0.5 }}>
                  Use LLM judge for now to create custom scorers
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Divider */}
        <Divider orientation="vertical" flexItem />

        {/* Right Panel - Variables Source */}
        <Box sx={{ width: 320, flexShrink: 0 }}>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: theme.palette.text.primary,
              mb: 1.5,
            }}
          >
            Variables source
          </Typography>

          <Tabs
            value={variablesTab}
            onChange={(_, v) => setVariablesTab(v)}
            sx={{
              minHeight: 32,
              mb: 2,
              "& .MuiTabs-indicator": { backgroundColor: "#13715B" },
              "& .MuiTab-root": {
                minHeight: 32,
                py: 0.5,
                px: 2,
                fontSize: "12px",
                textTransform: "none",
                color: "#6B7280",
                "&.Mui-selected": { color: "#13715B" },
              },
            }}
          >
            <Tab label="Editor" />
            <Tab label="Dataset" />
            <Tab label="Logs" />
          </Tabs>

          {variablesTab === 0 && (
            <Stack spacing={2}>
              <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                Enter input object
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                The assumed input schema for scorers is{" "}
                <code
                  style={{
                    backgroundColor: "#F3F4F6",
                    padding: "2px 4px",
                    borderRadius: 4,
                    fontSize: "11px",
                  }}
                >
                  {"{input, expected, metadata, output}"}
                </code>
                . Learn more
              </Typography>

              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                    JSON
                  </Typography>
                </Stack>
                <TextField
                  multiline
                  minRows={10}
                  maxRows={14}
                  fullWidth
                  value={config.inputSchema}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      inputSchema: e.target.value,
                    }))
                  }
                  sx={{
                    fontFamily: "monospace",
                    "& .MuiInputBase-input": {
                      fontSize: "12px",
                      fontFamily: "monospace",
                    },
                    backgroundColor: "#F9FAFB",
                    borderRadius: "8px",
                  }}
                />
              </Box>

              <Stack direction="row" spacing={1}>
                <CustomizableButton
                  variant="outlined"
                  text="Generate"
                  sx={{
                    flex: 1,
                    fontSize: "12px",
                    textTransform: "none",
                    borderColor: "#E5E7EB",
                    color: "#374151",
                  }}
                />
                <CustomizableButton
                  variant="contained"
                  text="Test"
                  sx={{
                    flex: 1,
                    fontSize: "12px",
                    textTransform: "none",
                    backgroundColor: "#13715B",
                    "&:hover": { backgroundColor: "#0F5E4B" },
                  }}
                />
              </Stack>
            </Stack>
          )}

          {variablesTab === 1 && (
            <Box
              sx={{
                p: 3,
                textAlign: "center",
                color: "#9CA3AF",
                backgroundColor: "#F9FAFB",
                borderRadius: "8px",
              }}
            >
              <Typography sx={{ fontSize: "13px" }}>
                Select a dataset to use as variables source
              </Typography>
            </Box>
          )}

          {variablesTab === 2 && (
            <Box
              sx={{
                p: 3,
                textAlign: "center",
                color: "#9CA3AF",
                backgroundColor: "#F9FAFB",
                borderRadius: "8px",
              }}
            >
              <Typography sx={{ fontSize: "13px" }}>
                View logs to debug scorer execution
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>
    </StandardModal>
  );
}

