/**
 * PlaygroundPage
 * 
 * A chat interface for testing and interacting with LLM models directly.
 * Features:
 * - Streaming responses
 * - Markdown rendering with syntax highlighting
 * - File attachments
 * - Quick eval with dataset functionality
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  IconButton,
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
  RefreshCw,
  StopCircle,
} from "lucide-react";
import ModelSelector from "../../components/Inputs/ModelSelector";
import PlaygroundInputBar, { AttachedFile } from "../../components/PlaygroundInputBar";
import MarkdownRenderer from "../../components/MarkdownRenderer";
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // File attachments
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  // Abort controller for streaming
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // Stop streaming
  const handleStopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsLoading(false);
  }, []);

  // Handle send message with streaming support
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
    setIsStreaming(true);
    setError(null);

    // Create assistant message placeholder for streaming
    const assistantMessageId = `msg-${Date.now()}-assistant`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

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
        { role: "system", content: "You are a helpful AI assistant. Format your responses using markdown when appropriate - use code blocks with language tags for code, bullet points for lists, **bold** for emphasis, etc." },
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
          stream: true,
          attachments: fileContents.length > 0 ? fileContents : undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      // Check if response is streaming (SSE) or regular JSON
      const contentType = response.headers.get("content-type") || "";
      
      if (contentType.includes("text/event-stream") || contentType.includes("text/plain")) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || 
                                  parsed.content || 
                                  parsed.delta?.content ||
                                  parsed.text ||
                                  "";
                  
                  if (content) {
                    accumulatedContent += content;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, content: accumulatedContent }
                          : m
                      )
                    );
                  }
                } catch {
                  // If not JSON, treat as plain text
                  if (data.trim()) {
                    accumulatedContent += data;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, content: accumulatedContent }
                          : m
                      )
                    );
                  }
                }
              } else if (line.trim() && !line.startsWith(":")) {
                // Handle non-SSE streaming (plain chunks)
                accumulatedContent += line;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: accumulatedContent }
                      : m
                  )
                );
              }
            }
          }
        }

        // If no content was streamed, show error
        if (!accumulatedContent) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: "No response received from the model." }
                : m
            )
          );
        }
      } else {
        // Handle regular JSON response (fallback for non-streaming)
        const data = await response.json();
        const content = data.content || data.message || data.choices?.[0]?.message?.content || "No response";
        
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content }
              : m
          )
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled - keep partial response
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : "Failed to get response";
      setError(errorMessage);
      
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: `Error: ${errorMessage}. Please check that your API key is configured and the model is available.` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
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

  // Regenerate last response
  const handleRegenerate = useCallback(() => {
    if (messages.length < 2) return;
    
    // Remove the last assistant message and resend the last user message
    const lastUserMessageIndex = messages.map(m => m.role).lastIndexOf("user");
    if (lastUserMessageIndex === -1) return;
    
    const lastUserMessage = messages[lastUserMessageIndex];
    
    // Remove messages after and including last assistant response
    setMessages(messages.slice(0, lastUserMessageIndex));
    
    // Set input to resend
    setInputValue(lastUserMessage.content);
    
    // Trigger send after a brief delay to let state update
    setTimeout(() => {
      handleSend();
    }, 100);
  }, [messages, handleSend]);

  // Clear conversation
  const handleClear = () => {
    handleStopStreaming();
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

                        {/* Render content - markdown for assistant, plain text for user */}
                        {msg.role === "assistant" ? (
                          <Box sx={{ "& > *:first-of-type": { mt: 0 } }}>
                            <MarkdownRenderer content={msg.content} />
                            {/* Streaming cursor */}
                            {isStreaming && msg === messages[messages.length - 1] && (
                              <Box
                                component="span"
                                sx={{
                                  display: "inline-block",
                                  width: 2,
                                  height: 16,
                                  bgcolor: "#13715B",
                                  ml: 0.5,
                                  animation: "blink 1s infinite",
                                  "@keyframes blink": {
                                    "0%, 50%": { opacity: 1 },
                                    "51%, 100%": { opacity: 0 },
                                  },
                                }}
                              />
                            )}
                          </Box>
                        ) : (
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
                        )}
                      </Box>

                      {/* Action buttons */}
                      <Stack direction="row" gap={0.5} sx={{ flexShrink: 0 }}>
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
                        {msg.role === "assistant" && msg === messages[messages.length - 1] && !isLoading && (
                          <Tooltip title="Regenerate response">
                            <IconButton
                              size="small"
                              onClick={handleRegenerate}
                              sx={{
                                width: 28, height: 28,
                                opacity: 0.3,
                                "&:hover": { opacity: 1, bgcolor: "#f3f4f6" },
                              }}
                            >
                              <RefreshCw size={14} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Box>
                  ))}

                  {/* Streaming indicator with stop button */}
                  {isStreaming && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                      <Tooltip title="Stop generating">
                        <IconButton
                          onClick={handleStopStreaming}
                          size="small"
                          sx={{
                            px: 2,
                            py: 0.75,
                            borderRadius: "20px",
                            bgcolor: "#f3f4f6",
                            color: "#6b7280",
                            fontSize: 13,
                            gap: 1,
                            "&:hover": { bgcolor: "#e5e7eb", color: "#374151" },
                          }}
                        >
                          <StopCircle size={16} />
                          <Typography variant="body2" sx={{ fontSize: 13 }}>
                            Stop generating
                          </Typography>
                        </IconButton>
                      </Tooltip>
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
