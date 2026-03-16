import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Drawer,
  TextareaAutosize,
  Slider,
} from "@mui/material";
import {
  Plus,
  Trash2,
  History,
  Send,
  GripVertical,
  Settings2,
  Upload,
  X,
} from "lucide-react";
import { CustomizableButton } from "../../../components/button/customizable-button";
import Chip from "../../../components/Chip";
import Field from "../../../components/Inputs/Field";
import Select from "../../../components/Inputs/Select";
import StandardModal from "../../../components/Modals/StandardModal";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import { displayFormattedDate } from "../../../tools/isoDateToString";
import palette from "../../../themes/palette";
import { useCardSx, MODEL_SELECT_ITEMS, ProviderIcon, GATEWAY_URL } from "../shared";

/** Extract {{varName}} tokens from message content. */
function extractVars(messages: Array<{ content: string }>): string[] {
  const vars = new Set<string>();
  const re = /\{\{(\w+)\}\}/g;
  for (const msg of messages) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(msg.content)) !== null) vars.add(m[1]);
    re.lastIndex = 0; // reset for next message
  }
  return Array.from(vars);
}

interface Message { role: string; content: string }

interface Version {
  id: number;
  version: number;
  content: Message[];
  variables: string[] | null;
  model: string | null;
  config: Record<string, any> | null;
  status: "draft" | "published";
  published_at: string | null;
  published_by_name: string | null;
  created_by_name: string | null;
  created_at: string;
}

interface PromptData {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  published_version: number | null;
}

interface ChatMessage { role: "user" | "assistant"; content: string }

export default function PromptEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cardSx = useCardSx();

  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(true);

  // Editor state
  const [messages, setMessages] = useState<Message[]>([{ role: "system", content: "" }]);
  const [model, setModel] = useState("");
  const [config, setConfig] = useState<Record<string, any>>({});
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [currentStatus, setCurrentStatus] = useState<"draft" | "published">("draft");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Config modal
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<Record<string, any>>({});

  // Version history drawer
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);

  // Test panel state
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastMetrics, setLastMetrics] = useState<{ latency?: number; tokens?: number; cost?: number } | null>(null);
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const detectedVars = useMemo(() => extractVars(messages), [messages]);

  const loadVersionIntoEditor = (v: Version) => {
    setMessages(v.content?.length ? v.content : [{ role: "system", content: "" }]);
    setModel(v.model || "");
    setConfig(v.config || {});
    setCurrentVersion(v.version);
    setCurrentStatus(v.status);
  };

  const loadPrompt = useCallback(async () => {
    if (!id) return;
    try {
      const [promptRes, versionsRes, endpointsRes] = await Promise.all([
        apiServices.get(`/ai-gateway/prompts/${id}`),
        apiServices.get(`/ai-gateway/prompts/${id}/versions`),
        apiServices.get("/ai-gateway/endpoints"),
      ]);
      setPrompt(promptRes?.data?.data);
      const vers: Version[] = versionsRes?.data?.data || [];
      setVersions(vers);
      setEndpoints((endpointsRes?.data?.data || []).filter((e: any) => e.is_active));
      if (vers.length > 0) loadVersionIntoEditor(vers[0]);
    } catch { /* silently handle */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadPrompt(); }, [loadPrompt]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // ─── Editor actions ─────────────────────────────────────────────────

  const addMessage = () => setMessages((p) => [...p, { role: "user", content: "" }]);

  const updateMessage = (index: number, field: "role" | "content", value: string) => {
    setMessages((p) => p.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const removeMessage = (index: number) => setMessages((p) => p.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!id || messages.length === 0) return;
    setIsSaving(true);
    try {
      const res = await apiServices.post(`/ai-gateway/prompts/${id}/versions`, {
        content: messages,
        model: model || null,
        config: Object.keys(config).length > 0 ? config : null,
      });
      const newVer = res?.data?.data;
      if (newVer) {
        setCurrentVersion(newVer.version);
        setCurrentStatus("draft");
        setVersions((prev) => [newVer, ...prev]);
      }
    } catch { /* silently handle */ }
    finally { setIsSaving(false); }
  };

  const handlePublish = async () => {
    if (!id || !currentVersion) return;
    setIsPublishing(true);
    try {
      const res = await apiServices.post(`/ai-gateway/prompts/${id}/versions/${currentVersion}/publish`);
      const published = res?.data?.data;
      setCurrentStatus("published");
      if (published) {
        // Update versions in-place: mark all as draft, then mark published one
        setVersions((prev) =>
          prev.map((v) =>
            v.version === published.version
              ? { ...v, status: "published", published_at: published.published_at }
              : { ...v, status: "draft", published_at: null }
          )
        );
        setPrompt((p) => p ? { ...p, published_version: published.version } : p);
      }
    } catch { /* silently handle */ }
    finally { setIsPublishing(false); }
  };

  const handlePublishVersion = async (versionNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await apiServices.post(`/ai-gateway/prompts/${id}/versions/${versionNumber}/publish`);
      const published = res?.data?.data;
      if (published) {
        setVersions((prev) =>
          prev.map((v) =>
            v.version === published.version
              ? { ...v, status: "published", published_at: published.published_at }
              : { ...v, status: "draft", published_at: null }
          )
        );
        setPrompt((p) => p ? { ...p, published_version: published.version } : p);
        if (versionNumber === currentVersion) setCurrentStatus("published");
      }
    } catch { /* silently handle */ }
  };

  // ─── Test panel ─────────────────────────────────────────────────────

  const handleSendTest = async () => {
    if (!selectedEndpoint) return;

    const varRe = /\{\{(\w+)\}\}/g;
    const resolvedMessages = messages.map((m) => ({
      ...m,
      content: m.content.replace(varRe, (_, name) => variableValues[name] ?? `{{${name}}}`),
    }));

    const testMessages: Message[] = [
      ...resolvedMessages,
      ...chatMessages.map((cm) => ({ role: cm.role, content: cm.content })),
    ];
    if (chatInput.trim()) {
      testMessages.push({ role: "user", content: chatInput.trim() });
      setChatMessages((prev) => [...prev, { role: "user", content: chatInput.trim() }]);
      setChatInput("");
    }

    setIsSending(true);
    setLastMetrics(null);
    const startTime = Date.now();

    try {
      const apiUrl = GATEWAY_URL + "/api";
      const response = await fetch(`${apiUrl}/ai-gateway/prompts/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          content: testMessages,
          variables: variableValues,
          config,
          endpoint_slug: selectedEndpoint,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        setChatMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err}` }]);
        setIsSending(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let assistantContent = "";
      let totalTokens = 0;
      let costUsd = 0;

      setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const chunk = JSON.parse(line.slice(6));
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setChatMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                  return updated;
                });
              }
              if (chunk.usage) totalTokens = chunk.usage.total_tokens || totalTokens;
              if (chunk.cost_usd) costUsd = chunk.cost_usd;
            } catch { /* skip unparseable */ }
          }
        }
      }

      setLastMetrics({ latency: Date.now() - startTime, tokens: totalTokens, cost: costUsd });
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message || "Connection failed"}` }]);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return null;
  if (!prompt) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Prompt not found.</Typography>
        <CustomizableButton text="Back to prompts" onClick={() => navigate("/ai-gateway/prompts")} />
      </Box>
    );
  }

  return (
    <PageHeaderExtended
      title={prompt.name}
      description={prompt.description || "Edit prompt messages, test with variables, and publish versions."}
      tipBoxEntity="ai-gateway-prompts"
      actionButton={
        <Stack direction="row" alignItems="center" spacing={1}>
          {currentVersion && <Chip label={`v${currentVersion}`} variant="info" />}
          <Chip label={currentStatus === "published" ? "Published" : "Draft"} />
          <CustomizableButton text="Save draft" onClick={handleSave} isDisabled={isSaving} variant="outlined" sx={{ height: 34 }} />
          <CustomizableButton text="Publish" icon={<Upload size={14} strokeWidth={1.5} />} onClick={handlePublish} isDisabled={isPublishing || !currentVersion} sx={{ height: 34 }} />
          <IconButton size="small" onClick={() => setIsHistoryOpen(true)}>
            <History size={16} strokeWidth={1.5} />
          </IconButton>
        </Stack>
      }
    >
      {/* ─── Split panel ───────────────────────────────────────────── */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden", border: `1px solid ${palette.border.light}`, borderRadius: 1 }}>
        {/* ─── LEFT: Editor ──────────────────────────────────────── */}
        <Box sx={{ width: "50%", borderRight: `1px solid ${palette.border.light}`, overflow: "auto", p: 2 }}>
          {/* Model + config */}
          <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "flex-end" }}>
            <Select
              label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value as string)}
              items={MODEL_SELECT_ITEMS}
              placeholder="Select model"
              sx={{ flex: 1 }}
            />
            <IconButton
              size="small"
              onClick={() => { setTempConfig({ ...config }); setIsConfigOpen(true); }}
              sx={{ mb: 0.5 }}
            >
              <Settings2 size={16} strokeWidth={1.5} />
            </IconButton>
          </Box>

          {/* Message blocks */}
          <Stack spacing={2}>
            {messages.map((msg, idx) => (
              <Box key={idx} sx={{ ...cardSx, p: 0, overflow: "hidden" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderBottom: `1px solid ${palette.border.light}`,
                    bgcolor: "#F9FAFB",
                  }}
                >
                  <GripVertical size={14} strokeWidth={1.5} color={palette.border.dark} />
                  <select
                    value={msg.role}
                    onChange={(e) => updateMessage(idx, "role", e.target.value)}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: 13,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: "#344054",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="system">SYSTEM</option>
                    <option value="user">USER</option>
                    <option value="assistant">ASSISTANT</option>
                  </select>
                  <Box sx={{ flex: 1 }} />
                  {messages.length > 1 && (
                    <IconButton size="small" onClick={() => removeMessage(idx)}>
                      <Trash2 size={13} strokeWidth={1.5} />
                    </IconButton>
                  )}
                </Box>
                <TextareaAutosize
                  value={msg.content}
                  onChange={(e) => updateMessage(idx, "content", e.target.value)}
                  minRows={3}
                  placeholder={`Enter ${msg.role} message...`}
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    resize: "vertical",
                    padding: 16,
                    fontSize: 13,
                    fontFamily: "inherit",
                    lineHeight: 1.6,
                    boxSizing: "border-box",
                  }}
                />
              </Box>
            ))}
          </Stack>

          {/* Add message */}
          <Box
            onClick={addMessage}
            sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1, cursor: "pointer", color: "primary.main", "&:hover": { textDecoration: "underline" } }}
          >
            <Plus size={14} strokeWidth={1.5} />
            <Typography fontSize={13} fontWeight={500}>Add message</Typography>
          </Box>

          {/* Detected variables */}
          {detectedVars.length > 0 && (
            <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography fontSize={12} color="text.secondary" fontWeight={500}>Detected:</Typography>
              {detectedVars.map((v) => (
                <Chip key={v} label={`{{${v}}}`} variant="info" />
              ))}
            </Box>
          )}
        </Box>

        {/* ─── RIGHT: Test panel ─────────────────────────────────── */}
        <Box sx={{ width: "50%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Endpoint selector + variables */}
          <Box sx={{ p: 2, borderBottom: `1px solid ${palette.border.light}`, flexShrink: 0 }}>
            <Select
              label="Test endpoint"
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value as string)}
              items={endpoints.map((e: any) => ({ _id: e.slug, name: `${e.display_name} (${e.slug})` }))}
              placeholder="Select endpoint"
              sx={{ mb: detectedVars.length > 0 ? 2 : 0, width: "100%" }}
            />
            {detectedVars.length > 0 && (
              <Stack spacing={1}>
                <Typography fontSize={12} fontWeight={600} color="text.secondary">Variables</Typography>
                {detectedVars.map((v) => (
                  <Field
                    key={v}
                    label={v}
                    value={variableValues[v] || ""}
                    onChange={(e) => setVariableValues((prev) => ({ ...prev, [v]: e.target.value }))}
                    placeholder={`Value for {{${v}}}`}
                  />
                ))}
              </Stack>
            )}
          </Box>

          {/* Chat area */}
          <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
            {chatMessages.length === 0 && (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography fontSize={13} color="text.secondary">Send a message to test this prompt</Typography>
              </Box>
            )}
            <Stack spacing={1}>
              {chatMessages.map((cm, idx) => (
                <Box key={idx} sx={{ display: "flex", justifyContent: cm.role === "user" ? "flex-end" : "flex-start" }}>
                  <Box
                    sx={{
                      maxWidth: "85%",
                      px: 2,
                      py: 1.5,
                      borderRadius: 1,
                      fontSize: 13,
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      bgcolor: cm.role === "user" ? "#EEF4FF" : "#F9FAFB",
                      color: "#344054",
                    }}
                  >
                    {cm.content || (isSending && idx === chatMessages.length - 1 ? "..." : "")}
                  </Box>
                </Box>
              ))}
              <div ref={chatEndRef} />
            </Stack>
          </Box>

          {/* Metrics */}
          {lastMetrics && (
            <Box sx={{ px: 2, py: 1, borderTop: `1px solid ${palette.border.light}`, display: "flex", gap: 2, flexShrink: 0 }}>
              {lastMetrics.latency != null && <Typography fontSize={11} color="text.secondary">{lastMetrics.latency}ms</Typography>}
              {(lastMetrics.tokens ?? 0) > 0 && <Typography fontSize={11} color="text.secondary">{lastMetrics.tokens} tokens</Typography>}
              {(lastMetrics.cost ?? 0) > 0 && <Typography fontSize={11} color="text.secondary">${lastMetrics.cost!.toFixed(4)}</Typography>}
            </Box>
          )}

          {/* Chat input */}
          <Box sx={{ display: "flex", gap: 1, p: 2, borderTop: `1px solid ${palette.border.light}`, bgcolor: "background.paper", flexShrink: 0 }}>
            <TextareaAutosize
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendTest(); } }}
              placeholder="Type a message..."
              minRows={1}
              maxRows={4}
              style={{
                flex: 1,
                border: `1px solid ${palette.border.light}`,
                borderRadius: 4,
                padding: "8px 16px",
                fontSize: 13,
                fontFamily: "inherit",
                resize: "none",
                outline: "none",
              }}
            />
            <IconButton
              onClick={handleSendTest}
              disabled={isSending || !selectedEndpoint}
              sx={{
                bgcolor: "#13715B",
                color: "#fff",
                width: 34,
                height: 34,
                alignSelf: "flex-end",
                "&:hover": { bgcolor: "#0F5A47" },
                "&:disabled": { bgcolor: "#E4E7EC", color: "#98A2B3" },
              }}
            >
              <Send size={14} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* ─── Config modal ──────────────────────────────────────────── */}
      <StandardModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="Model parameters"
        description="Fine-tune how the model generates responses."
        onSubmit={() => { setConfig(tempConfig); setIsConfigOpen(false); }}
        submitButtonText="Apply"
      >
        <Stack spacing={6}>
          <Box>
            <Typography fontSize={13} fontWeight={500} mb={0.5}>Temperature: {tempConfig.temperature ?? 1.0}</Typography>
            <Typography fontSize={12} color="text.secondary" mb={1}>
              Controls randomness. Lower values (0.0) make responses more focused and deterministic. Higher values (2.0) make output more random and creative.
            </Typography>
            <Slider
              value={tempConfig.temperature ?? 1.0}
              onChange={(_, val) => setTempConfig((p) => ({ ...p, temperature: val as number }))}
              min={0}
              max={2}
              step={0.1}
              valueLabelDisplay="auto"
              sx={{ color: "#13715B" }}
            />
          </Box>
          <Box>
            <Field
              label="Max tokens"
              value={String(tempConfig.max_tokens ?? "")}
              onChange={(e) => setTempConfig((p) => ({ ...p, max_tokens: e.target.value ? parseInt(e.target.value) : undefined }))}
              placeholder="e.g. 4096"
              type="number"
            />
            <Typography fontSize={12} color="text.secondary" mt={0.5}>
              Maximum number of tokens to generate in the response. Higher values allow longer outputs but increase cost and latency.
            </Typography>
          </Box>
          <Box>
            <Field
              label="Top P"
              value={String(tempConfig.top_p ?? "")}
              onChange={(e) => setTempConfig((p) => ({ ...p, top_p: e.target.value ? parseFloat(e.target.value) : undefined }))}
              placeholder="0.0 - 1.0"
              type="number"
            />
            <Typography fontSize={12} color="text.secondary" mt={0.5}>
              Nucleus sampling. The model considers tokens with top_p cumulative probability. Lower values (e.g. 0.1) make output more focused. Use either temperature or top P, not both.
            </Typography>
          </Box>
        </Stack>
      </StandardModal>

      {/* ─── Version history drawer ────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        PaperProps={{ sx: { width: 380 } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography fontSize={15} fontWeight={600}>Version history</Typography>
            <IconButton size="small" onClick={() => setIsHistoryOpen(false)}>
              <X size={16} strokeWidth={1.5} />
            </IconButton>
          </Box>
          <Stack spacing={2}>
            {versions.map((v) => (
              <Box
                key={v.id}
                onClick={() => { loadVersionIntoEditor(v); setIsHistoryOpen(false); }}
                sx={{
                  ...cardSx,
                  p: 2,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                  border: v.version === currentVersion ? "1.5px solid #13715B" : `1.5px solid ${palette.border.light}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Chip label={`v${v.version}`} variant="info" />
                  <Chip label={v.status === "published" ? "Published" : "Draft"} />
                  <Box sx={{ flex: 1 }} />
                  {v.status !== "published" && (
                    <CustomizableButton
                      text="Publish"
                      variant="text"
                      onClick={(e) => handlePublishVersion(v.version, e)}
                      sx={{ height: 24, fontSize: 12, minWidth: "auto", px: 1 }}
                    />
                  )}
                </Box>
                <Typography fontSize={12} color="text.secondary">
                  {v.created_by_name || "Unknown"} &middot; {displayFormattedDate(v.created_at)}
                </Typography>
                {v.model && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                    <ProviderIcon provider={v.model.split("/")[0] || ""} size={12} />
                    <Typography fontSize={11} color="text.secondary">{v.model}</Typography>
                  </Box>
                )}
              </Box>
            ))}
            {versions.length === 0 && (
              <Typography fontSize={13} color="text.secondary" textAlign="center" py={4}>
                No versions yet. Save a draft to create the first version.
              </Typography>
            )}
          </Stack>
        </Box>
      </Drawer>
    </PageHeaderExtended>
  );
}
