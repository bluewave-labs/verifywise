import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  CircularProgress,
  Slider,
} from "@mui/material";
import { Send, Trash2, Router, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Select from "../../../components/Inputs/Select";
import Field from "../../../components/Inputs/Field";
import { useSelector } from "react-redux";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import { RootState } from "../../../../application/redux/store";
import { ENV_VARs } from "../../../../../env.vars";
import palette from "../../../themes/palette";

interface Message {
  role: "user" | "assistant";
  content: string;
  costUsd?: number;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export default function PlaygroundPage() {
  const authToken = useSelector((state: RootState) => state.auth.authToken);
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiServices.get("/ai-gateway/endpoints");
        const eps = (res?.data?.data || []).filter((e: any) => e.is_active);
        setEndpoints(eps);
        if (eps.length > 0 && !selectedEndpoint) {
          setSelectedEndpoint(eps[0].slug);
        }
      } catch {
        // Silently handle
      }
    };
    load();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !selectedEndpoint || isStreaming) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Add empty assistant message for streaming
    const assistantIdx = newMessages.length;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = authToken;
      const response = await fetch(`${ENV_VARs.URL}/api/ai-gateway/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint_slug: selectedEndpoint,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIdx] = {
            role: "assistant",
            content: `Error: ${response.status} — ${errorText}`,
          };
          return updated;
        });
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setIsStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = "";
      let finalCost = 0;
      let finalUsage: Message["usage"] | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;

          try {
            const parsed = JSON.parse(line.slice(6));

            // Cost/usage metadata (final SSE event from FastAPI)
            if (parsed.cost_usd !== undefined && !parsed.choices) {
              finalCost = parsed.cost_usd;
              finalUsage = parsed.usage;
              continue;
            }

            // Content delta
            if (parsed.choices?.[0]?.delta?.content) {
              accumulated += parsed.choices[0].delta.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIdx] = {
                  role: "assistant",
                  content: accumulated,
                  costUsd: finalCost,
                  usage: finalUsage,
                };
                return updated;
              });
            }
          } catch {
            // Ignore malformed SSE chunks
          }
        }
      }

      // Final update with cost
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantIdx] = {
          ...updated[assistantIdx],
          costUsd: finalCost,
          usage: finalUsage,
        };
        return updated;
      });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIdx] = {
            role: "assistant",
            content: `Error: ${err.message}`,
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, selectedEndpoint, messages, isStreaming, temperature, maxTokens]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
  };

  const endpointItems = endpoints.map((ep) => ({
    _id: ep.slug,
    name: `${ep.display_name} (${ep.provider}/${ep.model})`,
  }));

  const totalCost = messages
    .filter((m) => m.role === "assistant" && m.costUsd)
    .reduce((sum, m) => sum + (m.costUsd || 0), 0);

  return (
    <Box sx={{ p: 3, height: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: palette.text.primary }}>
            Playground
          </Typography>
          <Typography sx={{ fontSize: 13, color: palette.text.tertiary, mt: 0.5 }}>
            Test your configured endpoints with an interactive chat interface
          </Typography>
        </Box>
        {totalCost > 0 && (
          <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
            Session cost: <strong>${totalCost.toFixed(6)}</strong>
          </Typography>
        )}
      </Stack>

      {/* Controls */}
      <Stack direction="row" spacing={2} mb={2} alignItems="flex-end">
        <Box flex={1}>
          <Select
            id="endpoint"
            label="Endpoint"
            placeholder="Select endpoint"
            value={selectedEndpoint}
            items={endpointItems}
            onChange={(e) => setSelectedEndpoint(e.target.value as string)}
            getOptionValue={(item) => item._id}
          />
        </Box>
        <Box sx={{ width: 140 }}>
          <Typography sx={{ fontSize: 11, color: palette.text.tertiary, mb: 0.5 }}>
            Temperature: {temperature}
          </Typography>
          <Slider
            value={temperature}
            onChange={(_, v) => setTemperature(v as number)}
            min={0}
            max={2}
            step={0.1}
            size="small"
            sx={{ color: palette.brand.primary }}
          />
        </Box>
        <Box sx={{ width: 100 }}>
          <Field
            label="Max tokens"
            value={String(maxTokens)}
            onChange={(e) => setMaxTokens(Number(e.target.value) || 4096)}
          />
        </Box>
        <IconButton onClick={handleClear} sx={{ p: 1, mb: 0.5 }}>
          <Trash2 size={16} strokeWidth={1.5} color={palette.text.tertiary} />
        </IconButton>
      </Stack>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          border: `1px solid ${palette.border.dark}`,
          borderRadius: "4px",
          overflow: "auto",
          mb: 2,
          backgroundColor: palette.background.alt,
        }}
      >
        {messages.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
            <Router size={32} color={palette.text.disabled} strokeWidth={1.5} />
            <Typography sx={{ fontSize: 13, color: palette.text.tertiary, mt: 1 }}>
              Send a message to start testing your endpoint
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={0} sx={{ p: 2 }}>
            {messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  py: 1.5,
                  borderBottom: idx < messages.length - 1 ? `1px solid ${palette.border.light}` : "none",
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: msg.role === "user" ? palette.brand.primary : palette.background.hover,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  {msg.role === "user" ? (
                    <User size={14} color={palette.background.main} strokeWidth={1.5} />
                  ) : (
                    <Bot size={14} color={palette.text.tertiary} strokeWidth={1.5} />
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      fontSize: 13,
                      color: palette.text.primary,
                      lineHeight: 1.6,
                      "& p": { margin: 0, mb: 1 },
                      "& p:last-child": { mb: 0 },
                      "& code": {
                        backgroundColor: palette.background.hover,
                        px: 0.5,
                        borderRadius: "3px",
                        fontSize: 12,
                      },
                      "& pre": {
                        backgroundColor: palette.background.hover,
                        p: 1.5,
                        borderRadius: "4px",
                        overflow: "auto",
                        fontSize: 12,
                      },
                    }}
                  >
                    {msg.role === "assistant" ? (
                      <ReactMarkdown>{msg.content || (isStreaming && idx === messages.length - 1 ? "..." : "")}</ReactMarkdown>
                    ) : (
                      <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{msg.content}</Typography>
                    )}
                  </Box>
                  {msg.role === "assistant" && msg.costUsd !== undefined && msg.costUsd > 0 && (
                    <Typography sx={{ fontSize: 11, color: palette.text.disabled, mt: 0.5 }}>
                      ${msg.costUsd.toFixed(6)}
                      {msg.usage && ` · ${msg.usage.total_tokens} tokens`}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
            {isStreaming && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, pt: 1 }}>
                <CircularProgress size={14} sx={{ color: palette.brand.primary }} />
                <Typography sx={{ fontSize: 11, color: palette.text.tertiary }}>
                  Streaming...
                </Typography>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Stack>
        )}
      </Box>

      {/* Input Area */}
      <Stack direction="row" spacing={1} alignItems="flex-end">
        <Box
          sx={{
            flex: 1,
            border: `1px solid ${palette.border.dark}`,
            borderRadius: "4px",
            p: 1,
            backgroundColor: palette.background.main,
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedEndpoint ? "Type a message... (Enter to send, Shift+Enter for new line)" : "Select an endpoint first"}
            disabled={!selectedEndpoint || isStreaming}
            rows={2}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: 13,
              fontFamily: "inherit",
              lineHeight: 1.5,
              backgroundColor: "transparent",
              color: palette.text.primary,
            }}
          />
        </Box>
        <IconButton
          onClick={handleSend}
          disabled={!input.trim() || !selectedEndpoint || isStreaming}
          sx={{
            backgroundColor: palette.brand.primary,
            color: palette.background.main,
            width: 36,
            height: 36,
            borderRadius: "4px",
            "&:hover": { backgroundColor: palette.brand.hover },
            "&:disabled": { backgroundColor: palette.border.light, color: palette.text.disabled },
          }}
        >
          <Send size={16} strokeWidth={1.5} />
        </IconButton>
      </Stack>
    </Box>
  );
}
