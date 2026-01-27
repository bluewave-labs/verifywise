/**
 * PlaygroundPage
 * 
 * A chat interface for testing and interacting with LLM models directly.
 * Features quick eval with dataset functionality.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Trash2,
  User,
  Bot,
  Copy,
  Check,
  Sparkles,
  FileText,
} from "lucide-react";
import ModelSelector from "../../components/Inputs/ModelSelector";
import PlaygroundInputBar, { AttachedFile } from "../../components/PlaygroundInputBar";
import { 
  getAllLlmApiKeys, 
  type LLMApiKey 
} from "../../../application/repository/deepEval.repository";

// Types
interface MessageAttachment {
  type: "image" | "document";
  name: string;
  url?: string;
  mimeType: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  attachments?: MessageAttachment[];
}

interface PlaygroundPageProps {
  orgId?: string | null;
}

export default function PlaygroundPage({ orgId }: PlaygroundPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
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

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // File attachments
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

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
        // Provider should already be in lowercase format from leaderboard
        setProvider(providerParam.toLowerCase());
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

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle send message
  const handleSend = useCallback(async () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || !model || isLoading) return;

    // Process attachments
    const messageAttachments: MessageAttachment[] = attachedFiles.map((f) => ({
      type: f.type,
      name: f.file.name,
      url: f.preview,
      mimeType: f.file.type,
    }));

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue.trim() || (attachedFiles.length > 0 ? `[Attached ${attachedFiles.length} file(s)]` : ""),
      timestamp: new Date(),
      attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
    };

    // Clear input and attachments immediately
    const filesToSend = [...attachedFiles];
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setAttachedFiles([]);
    setIsLoading(true);
    setError(null);

    try {
      // Convert files to base64 for API
      const fileContents = await Promise.all(
        filesToSend.map(async (f) => ({
          type: f.type,
          name: f.file.name,
          mimeType: f.file.type,
          data: await fileToBase64(f.file),
        }))
      );

      const apiMessages = [
        { role: "system", content: "You are a helpful AI assistant." },
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
          temperature: 0.7,
          maxTokens: 4096,
          attachments: fileContents.length > 0 ? fileContents : undefined,
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
  }, [inputValue, model, isLoading, messages, provider, attachedFiles]);

  // Handle run eval - navigate to experiments with model pre-filled
  const handleRunEval = () => {
    if (!model) return;
    const basePath = projectId ? `/evals/${projectId}` : `/evals`;
    navigate(`${basePath}#experiments`, {
      state: {
        prefillModel: { model, provider },
      },
    });
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
  const canSend = Boolean((inputValue.trim() || attachedFiles.length > 0) && model && !isLoading);

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
                ? "Ask anything or run an evaluation with a dataset."
                : "Select a model from the dropdown above to start."
              }
            </Typography>

            {/* Input Bar */}
            <PlaygroundInputBar
              ref={inputRef}
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              onRunEval={handleRunEval}
              placeholder={model ? "Message..." : "Select a model to start"}
              disabled={!model}
              canSend={canSend}
              isLoading={isLoading}
              showEvalButton={Boolean(model)}
              attachedFiles={attachedFiles}
              onFilesChange={setAttachedFiles}
            />

            {/* Helper */}
            <Typography variant="caption" color="#9ca3af" sx={{ mt: 2 }}>
              Press <strong>Enter</strong> to send · <strong>+</strong> to add files · <strong>flask</strong> to run eval
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
                        
                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
                            {msg.attachments.map((attachment, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  px: 1.5,
                                  py: 1,
                                  bgcolor: "#f3f4f6",
                                  borderRadius: "8px",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                {attachment.type === "image" ? (
                                  <>
                                    {attachment.url && (
                                      <Box
                                        component="img"
                                        src={attachment.url}
                                        alt={attachment.name}
                                        sx={{
                                          width: 40,
                                          height: 40,
                                          borderRadius: "6px",
                                          objectFit: "cover",
                                        }}
                                      />
                                    )}
                                    <Typography variant="caption" color="#374151" sx={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {attachment.name}
                                    </Typography>
                                  </>
                                ) : (
                                  <>
                                    <FileText size={16} color="#7c3aed" />
                                    <Typography variant="caption" color="#374151" sx={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {attachment.name}
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            ))}
                          </Stack>
                        )}

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
              <PlaygroundInputBar
                ref={inputRef}
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSend}
                onRunEval={handleRunEval}
                placeholder="Message..."
                disabled={!model}
                canSend={canSend}
                isLoading={isLoading}
                showEvalButton={true}
                attachedFiles={attachedFiles}
                onFilesChange={setAttachedFiles}
              />
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
