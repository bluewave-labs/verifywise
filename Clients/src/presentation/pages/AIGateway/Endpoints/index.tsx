import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  IconButton,
} from "@mui/material";
import { CirclePlus, Router, Trash2, Zap, Settings, Shield } from "lucide-react";
import { EmptyState } from "../../../components/EmptyState";
import EmptyStateTip from "../../../components/EmptyState/EmptyStateTip";
import { CustomizableButton } from "../../../components/button/customizable-button";
import Field from "../../../components/Inputs/Field";
import Select from "../../../components/Inputs/Select";
import StandardModal from "../../../components/Modals/StandardModal";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import palette from "../../../themes/palette";
import { sectionTitleSx, useCardSx } from "../shared";

interface ModelOption {
  id: string;
  provider: string;
  mode: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  { id: "openai/gpt-4o", provider: "openai", mode: "chat" },
  { id: "openai/gpt-4o-mini", provider: "openai", mode: "chat" },
  { id: "openai/gpt-4.1", provider: "openai", mode: "chat" },
  { id: "openai/gpt-4.1-mini", provider: "openai", mode: "chat" },
  { id: "openai/gpt-4.1-nano", provider: "openai", mode: "chat" },
  { id: "openai/o3", provider: "openai", mode: "chat" },
  { id: "openai/o3-mini", provider: "openai", mode: "chat" },
  { id: "openai/o4-mini", provider: "openai", mode: "chat" },
  { id: "anthropic/claude-opus-4-20250514", provider: "anthropic", mode: "chat" },
  { id: "anthropic/claude-sonnet-4-20250514", provider: "anthropic", mode: "chat" },
  { id: "anthropic/claude-haiku-4-20250414", provider: "anthropic", mode: "chat" },
  { id: "anthropic/claude-3.5-sonnet-20240620", provider: "anthropic", mode: "chat" },
  { id: "gemini/gemini-2.5-pro-preview-06-05", provider: "gemini", mode: "chat" },
  { id: "gemini/gemini-2.5-flash-preview-05-20", provider: "gemini", mode: "chat" },
  { id: "gemini/gemini-2.0-flash", provider: "gemini", mode: "chat" },
  { id: "mistral/mistral-large-latest", provider: "mistral", mode: "chat" },
  { id: "mistral/mistral-medium-latest", provider: "mistral", mode: "chat" },
  { id: "mistral/mistral-small-latest", provider: "mistral", mode: "chat" },
  { id: "xai/grok-3", provider: "xai", mode: "chat" },
  { id: "xai/grok-3-mini", provider: "xai", mode: "chat" },
  { id: "bedrock/anthropic.claude-sonnet-4-20250514-v1:0", provider: "bedrock", mode: "chat" },
  { id: "bedrock/anthropic.claude-3-5-sonnet-20240620-v1:0", provider: "bedrock", mode: "chat" },
  { id: "bedrock/amazon.nova-pro-v1:0", provider: "bedrock", mode: "chat" },
  { id: "together_ai/meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", provider: "together_ai", mode: "chat" },
  { id: "together_ai/meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", provider: "together_ai", mode: "chat" },
  { id: "openrouter/openai/gpt-4o", provider: "openrouter", mode: "chat" },
  { id: "openrouter/anthropic/claude-sonnet-4", provider: "openrouter", mode: "chat" },
].sort((a, b) => a.provider.localeCompare(b.provider));  // toSorted not available pre-ES2023

/** Build Select-compatible items with divider indices between provider groups */
const MODEL_SELECT_ITEMS = MODEL_OPTIONS.map((m) => ({
  _id: m.id,
  name: m.id,
}));

const MODEL_DIVIDERS: { index: number; label: string }[] = [];
let prevProvider = "";
MODEL_OPTIONS.forEach((m, i) => {
  if (m.provider !== prevProvider && i > 0) {
    MODEL_DIVIDERS.push({ index: i, label: m.provider.toUpperCase() });
  }
  prevProvider = m.provider;
});

export default function EndpointsPage() {
  const cardSx = useCardSx();
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    display_name: "",
    slug: "",
    provider: "",
    model: "",
    api_key_id: "",
    max_tokens: "",
    temperature: "",
    system_prompt: "",
  });

  const loadData = useCallback(async () => {
    try {
      const [endpointsRes, keysRes] = await Promise.all([
        apiServices.get("/ai-gateway/endpoints"),
        apiServices.get("/ai-gateway/keys"),
      ]);
      setEndpoints(endpointsRes?.data?.data || []);
      setApiKeys(keysRes?.data?.data || []);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNameChange = (value: string) => {
    setForm((p) => ({
      ...p,
      display_name: value,
      slug: value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    }));
  };

  const handleModelSelect = (model: string) => {
    const provider = model.includes("/") ? model.split("/")[0] : "";
    setForm((p) => ({ ...p, model, provider }));
  };

  const handleCreate = async () => {
    if (!form.display_name || !form.slug || !form.model || !form.api_key_id) {
      setFormError("Name, model, and API key are required");
      return;
    }
    setIsSubmitting(true);
    setFormError("");
    try {
      await apiServices.post("/ai-gateway/endpoints", {
        display_name: form.display_name,
        slug: form.slug,
        provider: form.provider,
        model: form.model,
        api_key_id: Number(form.api_key_id),
        max_tokens: form.max_tokens ? Number(form.max_tokens) : null,
        temperature: form.temperature ? Number(form.temperature) : null,
        system_prompt: form.system_prompt || null,
      });
      setIsCreateOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Failed to create endpoint");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiServices.delete(`/ai-gateway/endpoints/${id}`);
      await loadData();
    } catch {
      // Silently handle
    }
  };

  const resetForm = () => {
    setForm({
      display_name: "", slug: "", provider: "", model: "",
      api_key_id: "", max_tokens: "", temperature: "", system_prompt: "",
    });
    setFormError("");
  };

  const apiKeyItems = apiKeys
    .filter((k) => k.is_active)
    .map((k) => ({ _id: String(k.id), name: `${k.key_name} (${k.provider})` }));

  return (
    <PageHeaderExtended
      title="Endpoints"
      description="Configure LLM provider endpoints for your organization."
      tipBoxEntity="ai-gateway-endpoints"
      actionButton={
        <CustomizableButton
          text="Add endpoint"
          icon={<CirclePlus size={14} strokeWidth={1.5} />}
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
        />
      }
    >
      <Box sx={cardSx}>
        <Stack gap="12px">
          {loading ? (
            <Typography sx={{ fontSize: 13, color: palette.text.tertiary }}>Loading endpoints...</Typography>
          ) : endpoints.length === 0 ? (
            <EmptyState
              icon={Router}
              message="No endpoints configured yet. Add your first LLM endpoint to start routing requests through the gateway."
              showBorder
            >
              <EmptyStateTip
                icon={Zap}
                title="Route requests through a unified gateway"
                description="Each endpoint maps to a specific provider and model. Your applications reference endpoints by slug, so you can swap models without changing application code."
              />
              <EmptyStateTip
                icon={Settings}
                title="Configure API keys first"
                description="Go to Settings to add your provider API keys (OpenAI, Anthropic, etc.). Then create endpoints that reference those keys."
              />
              <EmptyStateTip
                icon={Shield}
                title="Monitor costs and enforce budgets"
                description="Every request through the gateway is logged with cost, tokens, and latency. Set a monthly budget to prevent unexpected cost overruns."
              />
            </EmptyState>
          ) : (
            <Stack gap="8px">
              {endpoints.map((ep) => (
                <Stack
                  key={ep.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    p: "12px 16px",
                    border: `1px solid ${palette.border.dark}`,
                    borderRadius: "4px",
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                      {ep.display_name}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                      {ep.provider} / {ep.model} &middot; {ep.api_key_name || "No key"}
                    </Typography>
                  </Box>
                  <Stack direction="row" alignItems="center" gap="8px">
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: ep.is_active ? palette.status.success.text : palette.text.disabled,
                        fontWeight: 500,
                      }}
                    >
                      {ep.is_active ? "Active" : "Inactive"}
                    </Typography>
                    <IconButton size="small" onClick={() => handleDelete(ep.id)} sx={{ p: 0.5 }}>
                      <Trash2 size={14} strokeWidth={1.5} color={palette.text.tertiary} />
                    </IconButton>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Create Endpoint Modal */}
      <StandardModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add endpoint"
        description="Configure a new LLM provider endpoint"
        onSubmit={handleCreate}
        submitButtonText="Create endpoint"
        isSubmitting={isSubmitting}
        maxWidth="480px"
      >
        <Stack gap="16px">
          <Field
            label="Endpoint name"
            placeholder="e.g., Production GPT-4o"
            value={form.display_name}
            onChange={(e) => handleNameChange(e.target.value)}
            isRequired
          />

          <Select
            id="model"
            label="Model"
            placeholder="Select a model"
            value={form.model}
            items={MODEL_SELECT_ITEMS}
            onChange={(e) => handleModelSelect(e.target.value as string)}
            getOptionValue={(item) => item._id}
            dividers={MODEL_DIVIDERS}
            isRequired
          />

          {apiKeyItems.length > 0 ? (
            <Select
              id="api_key_id"
              label="API key"
              placeholder="Select an API key"
              value={form.api_key_id}
              items={apiKeyItems}
              onChange={(e) => setForm((p) => ({ ...p, api_key_id: e.target.value as string }))}
              getOptionValue={(item) => item._id}
            />
          ) : (
            <Stack
              direction="row"
              alignItems="flex-start"
              gap="6px"
              sx={{
                p: "8px 12px",
                bgcolor: palette.background.accent,
                borderRadius: "4px",
                border: `1px solid ${palette.border.light}`,
              }}
            >
              <Typography sx={{ fontSize: 12, lineHeight: 1.5, color: palette.text.tertiary }}>
                No API keys available. Go to Settings to add one first.
              </Typography>
            </Stack>
          )}

          <Stack direction="row" gap="12px">
            <Box sx={{ flex: 1 }}>
              <Field
                label="Max tokens"
                placeholder="4096"
                value={form.max_tokens}
                onChange={(e) => setForm((p) => ({ ...p, max_tokens: e.target.value }))}
                isOptional
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Field
                label="Temperature"
                placeholder="0.7"
                value={form.temperature}
                onChange={(e) => setForm((p) => ({ ...p, temperature: e.target.value }))}
                isOptional
              />
            </Box>
          </Stack>

          <Field
            label="System prompt"
            placeholder="Optional system prompt prepended to all requests"
            value={form.system_prompt}
            onChange={(e) => setForm((p) => ({ ...p, system_prompt: e.target.value }))}
            isOptional
          />

          {form.slug && (
            <Typography sx={{ fontSize: 11, color: palette.text.tertiary }}>
              Endpoint slug: <strong>{form.slug}</strong>
            </Typography>
          )}

          {formError && (
            <Typography sx={{ fontSize: 12, color: palette.status.error.text }}>
              {formError}
            </Typography>
          )}
        </Stack>
      </StandardModal>
    </PageHeaderExtended>
  );
}
