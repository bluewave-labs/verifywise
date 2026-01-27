/**
 * PlaygroundPage
 * 
 * A chat interface for testing and interacting with LLM models directly.
 * Modern design inspired by ChatGPT/Claude/Perplexity.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  Slider,
  Collapse,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Send,
  Settings2,
  Trash2,
  User,
  Bot,
  Copy,
  Check,
  Sparkles,
  ArrowUp,
} from "lucide-react";
import ModelSelector from "../../components/Inputs/ModelSelector";
import { getAllLlmApiKeys, type LLMApiKey } from "../../../application/repository/deepEval.repository";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Model selection state
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("");
  const [configuredProviders, setConfiguredProviders] = useState<LLMApiKey[]>([]);

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
        const keys = await getAllLlmApiKeys();
        setConfiguredProviders(keys);
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
      const apiMessages = [
        ...(settings.systemPrompt ? [{ role: "system", content: settings.systemPrompt }] : []),
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage.content },
      ];

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

  const hasMessages = messages.length > 0;
  const canSend = inputValue.trim() && model && !isLoading;

  // Input bar component (reused in both states)
  const InputBar = (
    <Box sx={{ position: "relative", width: "100%", maxWidth: 720 }}>
      <TextField
        inputRef={inputRef}
        fullWidth
        multiline
        maxRows={6}
        minRows={1}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder={model ? "Message..." : "Select a model to start"}
        disabled={!model || isLoading}
        sx={{
          "& .MuiOutlinedInput-root": {
            fontSize: 15,
            bgcolor: "#fff",
            borderRadius: "24px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
            pr: 7,
            "& fieldset": { border: "none" },
            "&:hover": { borderColor: "#d1d5db" },
            "&.Mui-focused": { 
              borderColor: "#13715B", 
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08), 0 0 0 2px rgba(19, 113, 91, 0.1)" 
            },
            "&.Mui-disabled": { bgcolor: "#f9fafb", borderColor: "#e5e7eb" },
          },
          "& .MuiOutlinedInput-input": {
            py: 1.75,
            px: 2.5,
            lineHeight: 1.5,
          },
        }}
      />
      {/* Send Button - Separate circular button */}
      <IconButton
        onClick={handleSend}
        disabled={!canSend}
        sx={{
          position: "absolute",
          right: 8,
          bottom: 8,
          width: 36,
          height: 36,
          bgcolor: canSend ? "#13715B" : "#e5e7eb",
          color: canSend ? "#fff" : "#9ca3af",
          borderRadius: "50%",
          transition: "all 0.2s",
          "&:hover": { 
            bgcolor: canSend ? "#0f5c4a" : "#e5e7eb",
            transform: canSend ? "scale(1.05)" : "none",
          },
          "&:disabled": { 
            bgcolor: "#e5e7eb", 
            color: "#9ca3af",
          },
        }}
      >
        <ArrowUp size={18} strokeWidth={2.5} />
      </IconButton>
    </Box>
  );

  return (
    <Box 
      sx={{ 
        height: "calc(100vh - 140px)", 
        display: "flex", 
        flexDirection: "column",
      }}
    >
      {/* Top Bar */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1.5, borderBottom: hasMessages ? "1px solid #f3f4f6" : "none" }}
      >
        {/* Model Selector */}
        <Box sx={{ width: 220 }}>
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

        {/* Action Buttons */}
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Tooltip title="Model settings">
            <IconButton
              onClick={() => setSettingsOpen(!settingsOpen)}
              size="small"
              sx={{
                width: 34,
                height: 34,
                color: settingsOpen ? "#13715B" : "#9ca3af",
                bgcolor: settingsOpen ? "#ecfdf5" : "transparent",
                "&:hover": { bgcolor: "#f3f4f6" },
              }}
            >
              <Settings2 size={18} />
            </IconButton>
          </Tooltip>

          {hasMessages && (
            <Tooltip title="Clear conversation">
              <IconButton
                onClick={handleClear}
                size="small"
                sx={{
                  width: 34,
                  height: 34,
                  color: "#9ca3af",
                  "&:hover": { bgcolor: "#fef2f2", color: "#dc2626" },
                }}
              >
                <Trash2 size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      {/* Settings Panel */}
      <Collapse in={settingsOpen}>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #f3f4f6", bgcolor: "#fafafa" }}>
          <Stack direction="row" gap={4} flexWrap="wrap" sx={{ maxWidth: 800 }}>
            <Box sx={{ flex: "1 1 280px", minWidth: 240 }}>
              <Typography variant="caption" fontWeight={600} color="#374151" sx={{ mb: 0.75, display: "block" }}>
                System Prompt
              </Typography>
              <TextField
                multiline
                rows={2}
                fullWidth
                size="small"
                value={settings.systemPrompt}
                onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                placeholder="You are a helpful assistant..."
                sx={{
                  "& .MuiOutlinedInput-root": { fontSize: 13, bgcolor: "#fff", borderRadius: "8px" },
                }}
              />
            </Box>

            <Stack direction="row" gap={3}>
              <Box sx={{ width: 140 }}>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" fontWeight={600} color="#374151">Temperature</Typography>
                  <Typography variant="caption" color="#13715B" fontWeight={600}>{settings.temperature.toFixed(1)}</Typography>
                </Stack>
                <Slider
                  value={settings.temperature}
                  onChange={(_, v) => setSettings({ ...settings, temperature: v as number })}
                  min={0} max={2} step={0.1} size="small"
                  sx={{ color: "#13715B", "& .MuiSlider-thumb": { width: 12, height: 12 } }}
                />
              </Box>

              <Box sx={{ width: 100 }}>
                <Typography variant="caption" fontWeight={600} color="#374151" sx={{ mb: 0.5, display: "block" }}>
                  Max Tokens
                </Typography>
                <TextField
                  type="number" size="small" value={settings.maxTokens}
                  onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) || 1024 })}
                  inputProps={{ min: 1, max: 128000 }}
                  sx={{ "& .MuiOutlinedInput-root": { fontSize: 12, bgcolor: "#fff", borderRadius: "8px" } }}
                />
              </Box>
            </Stack>
          </Stack>
        </Box>
      </Collapse>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!hasMessages ? (
          /* Empty State - Centered */
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              px: 3,
              pb: 8,
            }}
          >
            {/* Icon */}
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "16px",
                background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 3,
              }}
            >
              <Sparkles size={28} color="#13715B" strokeWidth={1.5} />
            </Box>

            {/* Title */}
            <Typography variant="h5" fontWeight={600} color="#111827" sx={{ mb: 1 }}>
              {model ? `Chat with ${model}` : "Model Playground"}
            </Typography>

            {/* Subtitle */}
            <Typography variant="body2" color="#6b7280" sx={{ mb: 4, textAlign: "center", maxWidth: 400 }}>
              {model 
                ? "Ask anything. Your conversation will appear here."
                : "Select a model from the dropdown above to start a conversation."
              }
            </Typography>

            {/* Input Bar */}
            {InputBar}

            {/* Helper */}
            <Typography variant="caption" color="#9ca3af" sx={{ mt: 2 }}>
              Press <strong>Enter</strong> to send
            </Typography>
          </Box>
        ) : (
          /* Chat Mode */
          <>
            {/* Messages */}
            <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 3 }}>
              <Box sx={{ maxWidth: 720, mx: "auto" }}>
                <Stack spacing={4}>
                  {messages.map((msg) => (
                    <Box key={msg.id} sx={{ display: "flex", gap: 2 }}>
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
                      <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
                        <Typography variant="body2" fontWeight={600} color="#111827" sx={{ mb: 0.5 }}>
                          {msg.role === "user" ? "You" : model || "Assistant"}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#374151",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            lineHeight: 1.7,
                          }}
                        >
                          {msg.content}
                        </Typography>
                      </Box>

                      {/* Copy */}
                      <Tooltip title={copiedId === msg.id ? "Copied!" : "Copy"}>
                        <IconButton
                          size="small"
                          onClick={() => handleCopy(msg.content, msg.id)}
                          sx={{
                            width: 28, height: 28,
                            opacity: 0.3,
                            "&:hover": { opacity: 1, bgcolor: "#f3f4f6" },
                          }}
                        >
                          {copiedId === msg.id ? <Check size={14} color="#13715B" /> : <Copy size={14} />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}

                  {/* Loading */}
                  {isLoading && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box
                        sx={{
                          width: 32, height: 32, borderRadius: "8px", bgcolor: "#f0fdf4",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Bot size={16} color="#13715B" />
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pt: 0.5 }}>
                        <CircularProgress size={14} thickness={5} sx={{ color: "#13715B" }} />
                        <Typography variant="body2" color="#6b7280">Thinking...</Typography>
                      </Box>
                    </Box>
                  )}

                  <div ref={messagesEndRef} />
                </Stack>
              </Box>
            </Box>

            {/* Bottom Input */}
            <Box
              sx={{
                px: 3,
                py: 2,
                borderTop: "1px solid #f3f4f6",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {InputBar}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
