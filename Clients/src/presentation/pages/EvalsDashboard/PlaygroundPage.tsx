/**
 * PlaygroundPage
 * 
 * A chat interface for testing and interacting with LLM models directly.
 * Supports model selection, system prompts, and parameter tuning.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  Paper,
  Slider,
  Collapse,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Send,
  Settings,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import ModelSelector, { ConfiguredProvider } from "../../components/Inputs/ModelSelector";
import { getLLMKeys } from "../../../application/repository/llmKeys.repository";

// Types
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface PlaygroundSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
}

interface PlaygroundPageProps {
  orgId?: string | null;
}

const DEFAULT_SETTINGS: PlaygroundSettings = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1.0,
  systemPrompt: "You are a helpful AI assistant.",
};

export default function PlaygroundPage({ orgId }: PlaygroundPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Model selection state
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("");
  const [configuredProviders, setConfiguredProviders] = useState<ConfiguredProvider[]>([]);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<PlaygroundSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load configured providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const keys = await getLLMKeys();
        setConfiguredProviders(keys.map((k: { provider: string }) => ({ provider: k.provider })));
      } catch (err) {
        console.error("Failed to load LLM API keys:", err);
      }
    };
    fetchProviders();
  }, []);

  // Handle URL params for pre-selected model
  useEffect(() => {
    const hash = location.hash;
    if (hash.includes("?")) {
      const queryString = hash.split("?")[1];
      const params = new URLSearchParams(queryString);
      const modelParam = params.get("model");
      const providerParam = params.get("provider");
      
      if (providerParam) {
        // Map display provider names to internal IDs
        const providerMap: Record<string, string> = {
          "OpenAI": "openai",
          "Anthropic": "anthropic",
          "Google": "google",
          "Mistral": "mistral",
          "xAI": "xai",
          "DeepSeek": "openrouter",
        };
        setProvider(providerMap[providerParam] || providerParam.toLowerCase());
      }
      if (modelParam) {
        // Try to map model display name to model ID
        setModel(modelParam);
      }
    }
  }, [location.hash]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || !model || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      // Build messages array for API
      const apiMessages = [
        ...(settings.systemPrompt ? [{ role: "system", content: settings.systemPrompt }] : []),
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage.content },
      ];

      // Call playground API
      const response = await fetch("/api/playground/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          provider,
          model,
          messages: apiMessages,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          topP: settings.topP,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: data.content || data.message || "No response",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get response";
      setError(errorMessage);
      
      // Add error message as assistant response
      const errorAssistantMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: `Error: ${errorMessage}. Please check that your API key is configured and the model is available.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, model, isLoading, messages, provider, settings]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Clear conversation
  const handleClear = () => {
    setMessages([]);
    setError(null);
  };

  // Copy message
  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Navigate to settings
  const handleNavigateToSettings = () => {
    navigate("/evals#settings");
  };

  return (
    <Box sx={{ height: "calc(100vh - 180px)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" fontWeight={600} color="#111827">
          Playground
        </Typography>
        <Stack direction="row" alignItems="center" gap={2}>
          {/* Model Selector */}
          <Box sx={{ width: 280 }}>
            <ModelSelector
              provider={provider}
              model={model}
              onProviderChange={setProvider}
              onModelChange={setModel}
              configuredProviders={configuredProviders}
              onNavigateToSettings={handleNavigateToSettings}
              label=""
            />
          </Box>

          {/* Settings Toggle */}
          <Tooltip title="Settings">
            <IconButton
              onClick={() => setSettingsOpen(!settingsOpen)}
              sx={{
                bgcolor: settingsOpen ? "#ecfdf5" : "transparent",
                color: settingsOpen ? "#13715B" : "#6b7280",
                "&:hover": { bgcolor: "#f0fdf4" },
              }}
            >
              <Settings size={20} />
            </IconButton>
          </Tooltip>

          {/* Clear Conversation */}
          <Tooltip title="Clear conversation">
            <IconButton
              onClick={handleClear}
              disabled={messages.length === 0}
              sx={{
                color: "#6b7280",
                "&:hover": { bgcolor: "#fef2f2", color: "#dc2626" },
                "&:disabled": { color: "#d1d5db" },
              }}
            >
              <Trash2 size={20} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Settings Panel */}
      <Collapse in={settingsOpen}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            bgcolor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
          }}
        >
          <Stack direction="row" gap={4} flexWrap="wrap">
            {/* System Prompt */}
            <Box sx={{ flex: "1 1 300px", minWidth: 250 }}>
              <Typography variant="caption" fontWeight={600} color="#374151" sx={{ mb: 0.5, display: "block" }}>
                System Prompt
              </Typography>
              <TextField
                multiline
                rows={3}
                fullWidth
                size="small"
                value={settings.systemPrompt}
                onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                placeholder="You are a helpful assistant..."
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: 13,
                    bgcolor: "#fff",
                  },
                }}
              />
            </Box>

            {/* Parameters */}
            <Stack sx={{ flex: "0 0 200px" }} gap={2}>
              {/* Temperature */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" fontWeight={600} color="#374151">
                    Temperature
                  </Typography>
                  <Typography variant="caption" color="#6b7280">
                    {settings.temperature.toFixed(1)}
                  </Typography>
                </Stack>
                <Slider
                  value={settings.temperature}
                  onChange={(_, v) => setSettings({ ...settings, temperature: v as number })}
                  min={0}
                  max={2}
                  step={0.1}
                  size="small"
                  sx={{ color: "#13715B" }}
                />
              </Box>

              {/* Max Tokens */}
              <Box>
                <Typography variant="caption" fontWeight={600} color="#374151" sx={{ mb: 0.5, display: "block" }}>
                  Max Tokens
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  value={settings.maxTokens}
                  onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) || 1024 })}
                  inputProps={{ min: 1, max: 128000 }}
                  sx={{
                    width: "100%",
                    "& .MuiOutlinedInput-root": { fontSize: 13, bgcolor: "#fff" },
                  }}
                />
              </Box>
            </Stack>

            {/* Top-p */}
            <Stack sx={{ flex: "0 0 150px" }}>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" fontWeight={600} color="#374151">
                    Top-p
                  </Typography>
                  <Typography variant="caption" color="#6b7280">
                    {settings.topP.toFixed(2)}
                  </Typography>
                </Stack>
                <Slider
                  value={settings.topP}
                  onChange={(_, v) => setSettings({ ...settings, topP: v as number })}
                  min={0}
                  max={1}
                  step={0.05}
                  size="small"
                  sx={{ color: "#13715B" }}
                />
              </Box>
            </Stack>
          </Stack>
        </Paper>
      </Collapse>

      {/* Messages Area */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "hidden",
          bgcolor: "#fff",
        }}
      >
        {/* Messages List */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 2,
          }}
        >
          {messages.length === 0 ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
              }}
            >
              <Bot size={48} strokeWidth={1} />
              <Typography variant="body1" sx={{ mt: 2, fontWeight: 500 }}>
                Start a conversation
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {model ? `Selected: ${model}` : "Select a model above to begin"}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {messages.map((msg) => (
                <Box
                  key={msg.id}
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    alignItems: "flex-start",
                  }}
                >
                  {/* Avatar */}
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "8px",
                      bgcolor: msg.role === "user" ? "#eff6ff" : "#f0fdf4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {msg.role === "user" ? (
                      <User size={16} color="#3b82f6" />
                    ) : (
                      <Bot size={16} color="#13715B" />
                    )}
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                      <Typography variant="caption" fontWeight={600} color="#374151">
                        {msg.role === "user" ? "You" : "Assistant"}
                      </Typography>
                      <Typography variant="caption" color="#9ca3af">
                        {msg.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#1f2937",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        lineHeight: 1.6,
                      }}
                    >
                      {msg.content}
                    </Typography>
                  </Box>

                  {/* Copy Button */}
                  <Tooltip title={copiedId === msg.id ? "Copied!" : "Copy"}>
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(msg.content, msg.id)}
                      sx={{
                        opacity: 0.5,
                        "&:hover": { opacity: 1, bgcolor: "#f3f4f6" },
                      }}
                    >
                      {copiedId === msg.id ? (
                        <Check size={14} color="#13715B" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "8px",
                      bgcolor: "#f0fdf4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Bot size={16} color="#13715B" />
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, pt: 1 }}>
                    <CircularProgress size={16} sx={{ color: "#13715B" }} />
                    <Typography variant="body2" color="#6b7280">
                      Thinking...
                    </Typography>
                  </Box>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Stack>
          )}
        </Box>

        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid #e5e7eb",
            bgcolor: "#fafafa",
          }}
        >
          {/* Error Display */}
          {error && (
            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
              <AlertCircle size={14} color="#dc2626" />
              <Typography variant="caption" color="error">
                {error}
              </Typography>
            </Stack>
          )}

          <Stack direction="row" gap={1.5}>
            <TextField
              ref={inputRef}
              fullWidth
              multiline
              maxRows={4}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={model ? "Type your message..." : "Select a model first"}
              disabled={!model || isLoading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontSize: 14,
                  bgcolor: "#fff",
                  borderRadius: "10px",
                },
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!inputValue.trim() || !model || isLoading}
              sx={{
                width: 44,
                height: 44,
                bgcolor: "#13715B",
                color: "#fff",
                borderRadius: "10px",
                "&:hover": { bgcolor: "#0f5c4a" },
                "&:disabled": { bgcolor: "#e5e7eb", color: "#9ca3af" },
              }}
            >
              <Send size={18} />
            </IconButton>
          </Stack>

          {/* Helper text */}
          <Typography variant="caption" color="#9ca3af" sx={{ mt: 1, display: "block" }}>
            Press Enter to send, Shift+Enter for new line
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
