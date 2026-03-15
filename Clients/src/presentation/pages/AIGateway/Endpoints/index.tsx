import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  IconButton,
} from "@mui/material";
import { CirclePlus, Router, Trash2, Zap, Settings, Shield } from "lucide-react";
import Toggle from "../../../components/Inputs/Toggle";
import { EmptyState } from "../../../components/EmptyState";
import EmptyStateTip from "../../../components/EmptyState/EmptyStateTip";
import { CustomizableButton } from "../../../components/button/customizable-button";
import Field from "../../../components/Inputs/Field";
import Select from "../../../components/Inputs/Select";
import StandardModal from "../../../components/Modals/StandardModal";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import palette from "../../../themes/palette";
import { sectionTitleSx, useCardSx, ProviderIcon, MODEL_SELECT_ITEMS, MODEL_DIVIDERS, slugify } from "../shared";

export default function EndpointsPage() {
  const cardSx = useCardSx();
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [activeGuardrailCount, setActiveGuardrailCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const [form, setForm] = useState({
    display_name: "",
    slug: "",
    provider: "",
    model: "",
    api_key_id: "",
    max_tokens: "",
    temperature: "",
    system_prompt: "",
    rate_limit_rpm: "",
    fallback_endpoint_id: "",
  });

  const loadData = useCallback(async () => {
    try {
      const [endpointsRes, keysRes, grRes] = await Promise.all([
        apiServices.get("/ai-gateway/endpoints"),
        apiServices.get("/ai-gateway/keys"),
        apiServices.get("/ai-gateway/guardrails").catch(() => null),
      ]);
      setEndpoints(endpointsRes?.data?.data || []);
      setApiKeys(keysRes?.data?.data || []);
      const allRules = grRes?.data?.data || [];
      setActiveGuardrailCount(allRules.filter((r: any) => r.is_active).length);
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
    setForm((p) => ({ ...p, display_name: value, slug: slugify(value) }));
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
        rate_limit_rpm: form.rate_limit_rpm ? Number(form.rate_limit_rpm) : null,
        fallback_endpoint_id: form.fallback_endpoint_id ? Number(form.fallback_endpoint_id) : null,
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiServices.delete(`/ai-gateway/endpoints/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadData();
    } catch {
      // Silently handle
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await apiServices.patch(`/ai-gateway/endpoints/${id}`, { is_active: !isActive });
      await loadData();
    } catch {
      // Silently handle
    }
  };

  const resetForm = () => {
    setForm({
      display_name: "", slug: "", provider: "", model: "",
      api_key_id: "", max_tokens: "", temperature: "", system_prompt: "", rate_limit_rpm: "", fallback_endpoint_id: "",
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
      helpArticlePath="ai-gateway/endpoints"
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
                  <Stack direction="row" alignItems="center" gap="10px">
                    <ProviderIcon provider={ep.provider} size={20} />
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                        {ep.display_name}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                        {ep.provider} / {ep.model} &middot; {ep.api_key_name || "No key"}
                      {ep.rate_limit_rpm > 0 && (
                        <span> &middot; {ep.rate_limit_rpm} RPM</span>
                      )}
                      {ep.fallback_endpoint_id && (
                        <span> &middot; has fallback</span>
                      )}
                      {activeGuardrailCount > 0 && (
                        <span> &middot; {activeGuardrailCount} guardrail{activeGuardrailCount !== 1 ? "s" : ""}</span>
                      )}
                    </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" alignItems="center" gap="8px">
                    <Toggle
                      checked={ep.is_active}
                      onChange={() => handleToggleActive(ep.id, ep.is_active)}
                      size="small"
                    />
                    <IconButton
                      size="small"
                      onClick={() => setDeleteTarget({ id: ep.id, name: ep.display_name })}
                      sx={{ p: 0.5 }}
                    >
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

          <Stack direction="row" gap="12px">
            <Box sx={{ flex: 1 }}>
              <Field
                label="Rate limit (RPM)"
                placeholder="e.g., 60"
                value={form.rate_limit_rpm}
                onChange={(e) => setForm((p) => ({ ...p, rate_limit_rpm: e.target.value }))}
                isOptional
              />
            </Box>
          </Stack>

          {endpoints.length > 0 && (
            <Select
              id="fallback"
              label="Fallback endpoint"
              placeholder="None (no fallback)"
              value={form.fallback_endpoint_id}
              items={[
                { _id: "", name: "None" },
                ...endpoints
                  .filter((ep) => ep.slug !== form.slug && ep.is_active)
                  .map((ep) => ({ _id: String(ep.id), name: ep.display_name })),
              ]}
              onChange={(e) => setForm((p) => ({ ...p, fallback_endpoint_id: e.target.value as string }))}
              getOptionValue={(item) => item._id}
              isOptional
            />
          )}

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
      {/* Delete confirmation modal */}
      <StandardModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete endpoint"
        description=""
        onSubmit={handleDelete}
        submitButtonText="Delete"
        maxWidth="400px"
      >
        <Typography sx={{ fontSize: 13, color: palette.text.secondary }}>
          Are you sure you want to delete "{deleteTarget?.name}"? This will permanently remove the endpoint and any requests using its slug will fail.
        </Typography>
      </StandardModal>
    </PageHeaderExtended>
  );
}
