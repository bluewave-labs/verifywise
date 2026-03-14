import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Autocomplete,
  TextField,
  ListSubheader,
} from "@mui/material";
import { CirclePlus, Router, Trash2, Pencil, Check, X } from "lucide-react";
import { CustomizableButton } from "../../../components/button/customizable-button";
import Field from "../../../components/Inputs/Field";
import Select from "../../../components/Inputs/Select";
import StandardModal from "../../../components/Modals/StandardModal";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import palette from "../../../themes/palette";
import { getInputStyles } from "../../../utils/inputStyles";
import { useTheme } from "@mui/material/styles";

interface ModelOption {
  id: string;
  provider: string;
  mode: string;
}

export default function EndpointsPage() {
  const theme = useTheme();
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Model autocomplete
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [modelValidation, setModelValidation] = useState<{ valid: boolean; info?: any } | null>(null);

  // Form state
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

  // Load model options from AIGateway FastAPI
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Call our Express backend which will proxy to FastAPI
        // For now, use a static list of popular models grouped by provider
        const popularModels: ModelOption[] = [
          // OpenAI
          { id: "openai/gpt-4o", provider: "openai", mode: "chat" },
          { id: "openai/gpt-4o-mini", provider: "openai", mode: "chat" },
          { id: "openai/gpt-4.1", provider: "openai", mode: "chat" },
          { id: "openai/gpt-4.1-mini", provider: "openai", mode: "chat" },
          { id: "openai/gpt-4.1-nano", provider: "openai", mode: "chat" },
          { id: "openai/o3", provider: "openai", mode: "chat" },
          { id: "openai/o3-mini", provider: "openai", mode: "chat" },
          { id: "openai/o4-mini", provider: "openai", mode: "chat" },
          // Anthropic
          { id: "anthropic/claude-opus-4-20250514", provider: "anthropic", mode: "chat" },
          { id: "anthropic/claude-sonnet-4-20250514", provider: "anthropic", mode: "chat" },
          { id: "anthropic/claude-haiku-4-20250414", provider: "anthropic", mode: "chat" },
          { id: "anthropic/claude-3.5-sonnet-20240620", provider: "anthropic", mode: "chat" },
          // Google
          { id: "gemini/gemini-2.5-pro-preview-06-05", provider: "gemini", mode: "chat" },
          { id: "gemini/gemini-2.5-flash-preview-05-20", provider: "gemini", mode: "chat" },
          { id: "gemini/gemini-2.0-flash", provider: "gemini", mode: "chat" },
          // Mistral
          { id: "mistral/mistral-large-latest", provider: "mistral", mode: "chat" },
          { id: "mistral/mistral-medium-latest", provider: "mistral", mode: "chat" },
          { id: "mistral/mistral-small-latest", provider: "mistral", mode: "chat" },
          // xAI
          { id: "xai/grok-3", provider: "xai", mode: "chat" },
          { id: "xai/grok-3-mini", provider: "xai", mode: "chat" },
          // AWS Bedrock
          { id: "bedrock/anthropic.claude-sonnet-4-20250514-v1:0", provider: "bedrock", mode: "chat" },
          { id: "bedrock/anthropic.claude-3-5-sonnet-20240620-v1:0", provider: "bedrock", mode: "chat" },
          { id: "bedrock/amazon.nova-pro-v1:0", provider: "bedrock", mode: "chat" },
          // Together AI
          { id: "together_ai/meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", provider: "together_ai", mode: "chat" },
          { id: "together_ai/meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", provider: "together_ai", mode: "chat" },
          // OpenRouter
          { id: "openrouter/openai/gpt-4o", provider: "openrouter", mode: "chat" },
          { id: "openrouter/anthropic/claude-sonnet-4", provider: "openrouter", mode: "chat" },
        ];
        setModelOptions(popularModels);
      } catch {
        // Fall through — user can still type manually
      }
    };
    loadModels();
  }, []);

  // Auto-generate slug from display name
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

  // Auto-detect provider from model string
  const handleModelSelect = (model: string) => {
    const provider = model.includes("/") ? model.split("/")[0] : "";
    setForm((p) => ({ ...p, model, provider }));
    setModelValidation(null);
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
      display_name: "",
      slug: "",
      provider: "",
      model: "",
      api_key_id: "",
      max_tokens: "",
      temperature: "",
      system_prompt: "",
    });
    setFormError("");
    setModelValidation(null);
  };

  // Group models by provider for autocomplete
  const groupedOptions = modelOptions.sort((a, b) => a.provider.localeCompare(b.provider));

  const apiKeyItems = apiKeys
    .filter((k) => k.is_active)
    .map((k) => ({ _id: String(k.id), name: `${k.key_name} (${k.provider})` }));

  const inputStyles = getInputStyles(theme);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: palette.text.primary }}>
            Endpoints
          </Typography>
          <Typography sx={{ fontSize: 13, color: palette.text.tertiary, mt: 0.5 }}>
            Configure LLM provider endpoints for your organization
          </Typography>
        </Box>
        <CustomizableButton
          text="Add endpoint"
          icon={<CirclePlus size={14} strokeWidth={1.5} />}
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
        />
      </Stack>

      {loading ? (
        <Typography sx={{ fontSize: 13, color: palette.text.tertiary }}>Loading endpoints...</Typography>
      ) : endpoints.length === 0 ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            py: 8,
            border: `1px solid ${palette.border.dark}`,
            borderRadius: "4px",
            backgroundColor: palette.background.alt,
          }}
        >
          <Router size={32} color={palette.text.disabled} strokeWidth={1.5} />
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: palette.text.primary, mt: 2 }}>
            No endpoints configured
          </Typography>
          <Typography sx={{ fontSize: 13, color: palette.text.tertiary, mt: 0.5 }}>
            Add your first LLM endpoint to get started
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={1}>
          {endpoints.map((ep) => (
            <Box
              key={ep.id}
              sx={{
                p: 2,
                border: `1px solid ${palette.border.dark}`,
                borderRadius: "4px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: palette.text.primary }}>
                  {ep.display_name}
                </Typography>
                <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                  {ep.provider} / {ep.model} &middot; {ep.api_key_name || "No key"}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography
                  sx={{
                    fontSize: 11,
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
            </Box>
          ))}
        </Stack>
      )}

      {/* ─── Create Endpoint Modal ────────────────────────────────────────── */}
      <StandardModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add endpoint"
        description="Configure a new LLM provider endpoint"
        onSubmit={handleCreate}
        submitButtonText="Create endpoint"
        isSubmitting={isSubmitting}
        maxWidth="600px"
      >
        <Stack spacing={6}>
          <Field
            label="Endpoint name"
            placeholder="e.g., Production GPT-4o"
            value={form.display_name}
            onChange={(e) => handleNameChange(e.target.value)}
            isRequired
          />

          <Box>
            <Typography
              sx={{ fontSize: 11, fontWeight: 500, color: palette.text.primary, mb: 0.5 }}
            >
              Model <span style={{ color: palette.status.error.text }}>*</span>
            </Typography>
            <Autocomplete
              freeSolo
              options={groupedOptions}
              groupBy={(option) =>
                typeof option === "string" ? "" : option.provider.toUpperCase()
              }
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.id
              }
              inputValue={form.model}
              onInputChange={(_, value) => handleModelSelect(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search models (e.g., openai/gpt-4o)"
                  size="small"
                  sx={inputStyles}
                />
              )}
              renderGroup={(params) => (
                <li key={params.key}>
                  <ListSubheader
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: palette.text.tertiary,
                      backgroundColor: palette.background.alt,
                      lineHeight: "28px",
                    }}
                  >
                    {params.group}
                  </ListSubheader>
                  <ul style={{ padding: 0 }}>{params.children}</ul>
                </li>
              )}
              slotProps={{
                paper: {
                  sx: {
                    fontSize: 13,
                    border: `1px solid ${palette.border.dark}`,
                    borderRadius: "4px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  },
                },
                listbox: {
                  sx: { maxHeight: 300 },
                },
              }}
            />
          </Box>

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
            <Box
              sx={{
                p: 1.5,
                border: `1px solid ${palette.border.dark}`,
                borderRadius: "4px",
                backgroundColor: palette.background.alt,
              }}
            >
              <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                No API keys available. Go to Settings to add one first.
              </Typography>
            </Box>
          )}

          <Stack direction="row" spacing={3}>
            <Box flex={1}>
              <Field
                label="Max tokens"
                placeholder="4096"
                value={form.max_tokens}
                onChange={(e) => setForm((p) => ({ ...p, max_tokens: e.target.value }))}
                isOptional
              />
            </Box>
            <Box flex={1}>
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
    </Box>
  );
}
