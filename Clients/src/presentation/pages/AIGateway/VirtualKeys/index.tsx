import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Stack, IconButton } from "@mui/material";
import { CirclePlus, KeyRound, Trash2, Ban, Copy, Check, Server } from "lucide-react";
import { EmptyState } from "../../../components/EmptyState";
import EmptyStateTip from "../../../components/EmptyState/EmptyStateTip";
import { CustomizableButton } from "../../../components/button/customizable-button";
import Field from "../../../components/Inputs/Field";
import DatePicker from "../../../components/Inputs/Datepicker";
import Chip from "../../../components/Chip";
import StandardModal from "../../../components/Modals/StandardModal";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import palette from "../../../themes/palette";
import { sectionTitleSx, useCardSx } from "../shared";
import dayjs from "dayjs";

interface VirtualKey {
  id: number;
  key_prefix: string;
  name: string;
  allowed_endpoint_ids: number[];
  max_budget_usd: number | null;
  current_spend_usd: number;
  rate_limit_rpm: number | null;
  metadata: Record<string, string>;
  expires_at: string | null;
  is_active: boolean;
  revoked_at: string | null;
  created_by_name: string;
  created_at: string;
}

export default function AIGatewayVirtualKeysPage() {
  const cardSx = useCardSx();
  const [keys, setKeys] = useState<VirtualKey[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    max_budget_usd: "",
    rate_limit_rpm: "",
    expires_at: "",
  });
  const [createError, setCreateError] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Key display modal (shown once after creation)
  const [isKeyDisplayOpen, setIsKeyDisplayOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [copied, setCopied] = useState(false);

  // Revoke confirmation modal
  const [revokeTarget, setRevokeTarget] = useState<VirtualKey | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await apiServices.get("/ai-gateway/virtual-keys");
      setKeys(res?.data?.data || []);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      setCreateError("Name is required");
      return;
    }
    setCreateSubmitting(true);
    setCreateError("");
    try {
      const payload: Record<string, any> = { name: createForm.name.trim() };
      if (createForm.max_budget_usd) payload.max_budget_usd = Number(createForm.max_budget_usd);
      if (createForm.rate_limit_rpm) payload.rate_limit_rpm = Number(createForm.rate_limit_rpm);
      if (createForm.expires_at) payload.expires_at = new Date(createForm.expires_at).toISOString();

      const res = await apiServices.post("/ai-gateway/virtual-keys", payload);
      const created = res?.data?.data;
      setIsCreateOpen(false);
      setCreateForm({ name: "", max_budget_usd: "", rate_limit_rpm: "", expires_at: "" });

      if (created?.key) {
        setNewKey(created.key);
        setIsKeyDisplayOpen(true);
      }

      await loadData();
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || "Failed to create virtual key");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await apiServices.post(`/ai-gateway/virtual-keys/${revokeTarget.id}/revoke`);
      setRevokeTarget(null);
      await loadData();
    } catch {
      // Silently handle
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiServices.delete(`/ai-gateway/virtual-keys/${id}`);
      await loadData();
    } catch {
      // Silently handle
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusLabel = (key: VirtualKey): string => {
    if (key.revoked_at) return "Revoked";
    if (key.expires_at && new Date(key.expires_at) < new Date()) return "Expired";
    if (key.is_active) return "Active";
    return "Inactive";
  };

  const gatewayUrl = window.location.origin.replace(/:\d+$/, ":3000");

  return (
    <PageHeaderExtended
      title="Virtual keys"
      description="Generate API keys for developers to use the gateway from their code."
      tipBoxEntity="ai-gateway-virtual-keys"
      helpArticlePath="ai-gateway/virtual-keys"
      actionButton={
        <CustomizableButton
          text="Create key"
          icon={<CirclePlus size={14} strokeWidth={1.5} />}
          onClick={() => {
            setCreateForm({ name: "", max_budget_usd: "", rate_limit_rpm: "", expires_at: "" });
            setCreateError("");
            setIsCreateOpen(true);
          }}
        />
      }
    >
      <Box sx={cardSx}>
        <Stack gap="12px">
          <Typography sx={sectionTitleSx}>Virtual keys</Typography>

          {loading ? null : keys.length === 0 ? (
            <EmptyState
              icon={KeyRound}
              message="No virtual keys created. Generate a key to let developers use the gateway with the OpenAI SDK."
              showBorder
            >
              <EmptyStateTip
                icon={Server}
                title="Server-to-server only"
                description="Virtual keys are designed for backend services. CORS is disabled on /v1/* routes, so browser-based requests will fail."
              />
              <EmptyStateTip
                icon={KeyRound}
                title="Keys are shown once"
                description="When you create a key, the full key is displayed once. Copy it immediately — only the hash is stored, so the plaintext cannot be recovered."
              />
            </EmptyState>
          ) : (
            <Stack gap="8px">
              {keys.map((key) => {
                const status = getStatusLabel(key);
                const budgetPct =
                  key.max_budget_usd && Number(key.max_budget_usd) > 0
                    ? (Number(key.current_spend_usd) / Number(key.max_budget_usd)) * 100
                    : null;

                return (
                  <Stack
                    key={key.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      p: "12px 16px",
                      border: `1px solid ${palette.border.dark}`,
                      borderRadius: "4px",
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap="12px" flex={1}>
                      <KeyRound size={16} strokeWidth={1.5} color={palette.text.tertiary} />
                      <Box flex={1}>
                        <Stack direction="row" alignItems="center" gap="8px">
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                            {key.name}
                          </Typography>
                          <Chip label={status} size="small" uppercase={false} />
                        </Stack>
                        <Stack direction="row" gap="12px" alignItems="center" mt="2px">
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: palette.text.tertiary,
                              fontFamily: "monospace",
                            }}
                          >
                            {key.key_prefix}
                          </Typography>
                          {key.max_budget_usd !== null && (
                            <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                              ${Number(key.current_spend_usd).toFixed(4)} / ${Number(key.max_budget_usd).toFixed(2)}
                            </Typography>
                          )}
                          {key.rate_limit_rpm && (
                            <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                              {key.rate_limit_rpm} RPM
                            </Typography>
                          )}
                          <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                            by {key.created_by_name}
                          </Typography>
                        </Stack>
                        {budgetPct !== null && (
                          <Box
                            sx={{
                              mt: "6px",
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: palette.border.light,
                              overflow: "hidden",
                              maxWidth: 200,
                            }}
                          >
                            <Box
                              sx={{
                                height: "100%",
                                width: `${Math.min(100, budgetPct)}%`,
                                backgroundColor:
                                  budgetPct >= 100
                                    ? palette.status.error.text
                                    : budgetPct >= 80
                                      ? palette.status.warning?.text || "#F79009"
                                      : palette.brand.primary,
                                borderRadius: 2,
                                transition: "width 0.3s",
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Stack>

                    <Stack direction="row" alignItems="center" gap="4px">
                      {key.is_active && !key.revoked_at && (
                        <IconButton
                          size="small"
                          onClick={() => setRevokeTarget(key)}
                          sx={{ p: 0.5 }}
                          title="Revoke"
                        >
                          <Ban size={14} strokeWidth={1.5} color={palette.text.tertiary} />
                        </IconButton>
                      )}
                      {!key.is_active && (
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(key.id)}
                          sx={{ p: 0.5 }}
                          title="Delete"
                        >
                          <Trash2 size={14} strokeWidth={1.5} color={palette.text.tertiary} />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Create Virtual Key Modal */}
      <StandardModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create virtual key"
        description="Generate an API key for developers to use the gateway with the OpenAI SDK."
        onSubmit={handleCreate}
        submitButtonText="Create key"
        isSubmitting={createSubmitting}
        maxWidth="480px"
      >
        <Stack gap="16px">
          <Field
            label="Name"
            placeholder="e.g., Backend production key"
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            isRequired
          />
          <Field
            label="Monthly budget (USD)"
            placeholder="e.g., 50.00 (leave empty for no limit)"
            value={createForm.max_budget_usd}
            onChange={(e) => setCreateForm((p) => ({ ...p, max_budget_usd: e.target.value }))}
          />
          <Field
            label="Rate limit (requests per minute)"
            placeholder="e.g., 60 (leave empty for no limit)"
            value={createForm.rate_limit_rpm}
            onChange={(e) => setCreateForm((p) => ({ ...p, rate_limit_rpm: e.target.value }))}
          />
          <DatePicker
            label="Expiry date"
            date={createForm.expires_at ? dayjs(createForm.expires_at) : null}
            handleDateChange={(value) =>
              setCreateForm((p) => ({ ...p, expires_at: value ? value.format("YYYY-MM-DD") : "" }))
            }
          />
          {createError && (
            <Typography sx={{ fontSize: 12, color: palette.status.error.text }}>
              {createError}
            </Typography>
          )}
        </Stack>
      </StandardModal>

      {/* Key Display Modal (shown once after creation) */}
      <StandardModal
        isOpen={isKeyDisplayOpen}
        onClose={() => {
          setIsKeyDisplayOpen(false);
          setNewKey("");
          setCopied(false);
        }}
        title="Virtual key created"
        description="Copy the key below. It will not be shown again."
        maxWidth="560px"
        hideSubmitButton
      >
        <Stack gap="16px">
          <Box
            sx={{
              p: "12px 16px",
              backgroundColor: "#F9FAFB",
              border: `1px solid ${palette.border.dark}`,
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: 13,
              wordBreak: "break-all",
              position: "relative",
            }}
          >
            {newKey}
            <IconButton
              size="small"
              onClick={copyToClipboard}
              sx={{ position: "absolute", top: 8, right: 8, p: 0.5 }}
              title="Copy"
            >
              {copied ? (
                <Check size={14} strokeWidth={1.5} color={palette.status.success.text} />
              ) : (
                <Copy size={14} strokeWidth={1.5} color={palette.text.tertiary} />
              )}
            </IconButton>
          </Box>

          <Box
            sx={{
              p: "12px 16px",
              backgroundColor: "#FFFAEB",
              border: "1px solid #FEDF89",
              borderRadius: "4px",
            }}
          >
            <Typography sx={{ fontSize: 12, color: "#B54708", fontWeight: 500 }}>
              This key will not be shown again. Store it securely.
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 500, mb: 1 }}>Usage example</Typography>
            <Box
              sx={{
                p: "12px 16px",
                backgroundColor: "#1E1E1E",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: 12,
                color: "#D4D4D4",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                overflow: "auto",
              }}
            >
{`from openai import OpenAI

client = OpenAI(
    base_url="${gatewayUrl}/v1",
    api_key="${newKey}"
)

response = client.chat.completions.create(
    model="your-endpoint-slug",
    messages=[{"role": "user", "content": "Hello"}]
)`}
            </Box>
          </Box>

          <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
            CORS is disabled on gateway routes. Use virtual keys from backend services only.
          </Typography>
        </Stack>
      </StandardModal>

      {/* Revoke Confirmation Modal */}
      <StandardModal
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title="Revoke virtual key"
        description={`Are you sure you want to revoke "${revokeTarget?.name}"? All requests using this key will be rejected immediately.`}
        onSubmit={handleRevoke}
        submitButtonText="Revoke key"
        maxWidth="440px"
      />
    </PageHeaderExtended>
  );
}
