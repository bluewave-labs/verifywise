import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Typography, Stack, IconButton } from "@mui/material";
import { CirclePlus, Key, Wallet, Trash2, Pencil } from "lucide-react";
import { CustomizableButton } from "../../../components/button/customizable-button";
import Field from "../../../components/Inputs/Field";
import Select from "../../../components/Inputs/Select";
import StandardModal from "../../../components/Modals/StandardModal";
import Toggle from "../../../components/Inputs/Toggle";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import palette from "../../../themes/palette";

const PROVIDERS = [
  { _id: "openai", name: "OpenAI" },
  { _id: "anthropic", name: "Anthropic" },
  { _id: "google", name: "Google" },
  { _id: "mistral", name: "Mistral" },
  { _id: "xai", name: "xAI" },
  { _id: "openrouter", name: "OpenRouter" },
  { _id: "bedrock", name: "AWS Bedrock" },
  { _id: "azure", name: "Azure OpenAI" },
  { _id: "together_ai", name: "Together AI" },
  { _id: "cohere", name: "Cohere" },
];

export default function AIGatewaySettingsPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // API Key modal state
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyForm, setKeyForm] = useState({ key_name: "", provider: "", api_key: "" });
  const [keyError, setKeyError] = useState("");
  const [keySubmitting, setKeySubmitting] = useState(false);

  // Budget modal state
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    monthly_limit_usd: "",
    alert_threshold_pct: "80",
    is_hard_limit: false,
  });
  const [budgetSubmitting, setBudgetSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [keysRes, budgetRes] = await Promise.all([
        apiServices.get("/ai-gateway/keys"),
        apiServices.get("/ai-gateway/budget"),
      ]);
      setApiKeys(keysRes?.data?.data || []);
      setBudget(budgetRes?.data?.data || null);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── API Key Handlers ──────────────────────────────────────────────────────

  const handleCreateKey = async () => {
    if (!keyForm.key_name || !keyForm.provider || !keyForm.api_key) {
      setKeyError("All fields are required");
      return;
    }
    setKeySubmitting(true);
    setKeyError("");
    try {
      await apiServices.post("/ai-gateway/keys", keyForm);
      setIsKeyModalOpen(false);
      setKeyForm({ key_name: "", provider: "", api_key: "" });
      await loadData();
    } catch (err: any) {
      setKeyError(err?.response?.data?.message || "Failed to create API key");
    } finally {
      setKeySubmitting(false);
    }
  };

  const handleDeleteKey = async (id: number) => {
    try {
      await apiServices.delete(`/ai-gateway/keys/${id}`);
      await loadData();
    } catch {
      // Silently handle
    }
  };

  // ─── Budget Handlers ───────────────────────────────────────────────────────

  const handleSaveBudget = async () => {
    setBudgetSubmitting(true);
    try {
      await apiServices.put("/ai-gateway/budget", {
        monthly_limit_usd: Number(budgetForm.monthly_limit_usd),
        alert_threshold_pct: Number(budgetForm.alert_threshold_pct),
        is_hard_limit: budgetForm.is_hard_limit,
      });
      setIsBudgetModalOpen(false);
      await loadData();
    } catch {
      // Silently handle
    } finally {
      setBudgetSubmitting(false);
    }
  };

  const openBudgetModal = () => {
    if (budget) {
      setBudgetForm({
        monthly_limit_usd: String(budget.monthly_limit_usd || ""),
        alert_threshold_pct: String(budget.alert_threshold_pct || "80"),
        is_hard_limit: budget.is_hard_limit || false,
      });
    } else {
      setBudgetForm({ monthly_limit_usd: "", alert_threshold_pct: "80", is_hard_limit: false });
    }
    setIsBudgetModalOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box mb={3}>
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: palette.text.primary }}>
          Settings
        </Typography>
        <Typography sx={{ fontSize: 13, color: palette.text.tertiary, mt: 0.5 }}>
          Manage API keys and budget for the AI Gateway
        </Typography>
      </Box>

      {/* API Keys Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: palette.text.primary }}>
            API keys
          </Typography>
          <CustomizableButton
            text="Add key"
            icon={<CirclePlus size={14} strokeWidth={1.5} />}
            onClick={() => {
              setKeyForm({ key_name: "", provider: "", api_key: "" });
              setKeyError("");
              setIsKeyModalOpen(true);
            }}
          />
        </Stack>

        {apiKeys.length === 0 ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              py: 4,
              border: `1px solid ${palette.border.dark}`,
              borderRadius: "4px",
              backgroundColor: palette.background.alt,
            }}
          >
            <Key size={24} color={palette.text.disabled} strokeWidth={1.5} />
            <Typography sx={{ fontSize: 13, color: palette.text.tertiary, mt: 1 }}>
              No API keys configured. Add a provider API key to create endpoints.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={1}>
            {apiKeys.map((key) => (
              <Box
                key={key.id}
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
                    {key.key_name}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                    {key.provider} &middot; {key.masked_key}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: key.is_active ? palette.status.success.text : palette.text.disabled,
                      fontWeight: 500,
                    }}
                  >
                    {key.is_active ? "Active" : "Inactive"}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteKey(key.id)}
                    sx={{ p: 0.5 }}
                  >
                    <Trash2 size={14} strokeWidth={1.5} color={palette.text.tertiary} />
                  </IconButton>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Budget Section */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: palette.text.primary }}>
            Budget
          </Typography>
          <CustomizableButton
            text={budget ? "Edit budget" : "Set budget"}
            icon={<Pencil size={14} strokeWidth={1.5} />}
            onClick={openBudgetModal}
          />
        </Stack>

        <Box
          sx={{
            p: 2,
            border: `1px solid ${palette.border.dark}`,
            borderRadius: "4px",
          }}
        >
          {budget ? (
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: palette.text.tertiary }}>Monthly limit</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: palette.text.primary }}>
                  ${Number(budget.monthly_limit_usd).toFixed(2)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: palette.text.tertiary }}>Current spend</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: palette.text.primary }}>
                  ${Number(budget.current_spend_usd).toFixed(4)}
                </Typography>
              </Stack>
              {Number(budget.monthly_limit_usd) > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Box
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: palette.border.light,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        width: `${Math.min(100, (Number(budget.current_spend_usd) / Number(budget.monthly_limit_usd)) * 100)}%`,
                        backgroundColor:
                          (Number(budget.current_spend_usd) / Number(budget.monthly_limit_usd)) * 100 >= budget.alert_threshold_pct
                            ? palette.status.error.text
                            : palette.brand.primary,
                        borderRadius: 3,
                        transition: "width 0.3s",
                      }}
                    />
                  </Box>
                </Box>
              )}
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: palette.text.tertiary }}>Alert threshold</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: palette.text.primary }}>
                  {budget.alert_threshold_pct}%
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: palette.text.tertiary }}>Hard limit</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: palette.text.primary }}>
                  {budget.is_hard_limit ? "Yes (requests rejected)" : "No (alert only)"}
                </Typography>
              </Stack>
            </Stack>
          ) : (
            <Stack alignItems="center" py={2}>
              <Wallet size={24} color={palette.text.disabled} strokeWidth={1.5} />
              <Typography sx={{ fontSize: 13, color: palette.text.tertiary, mt: 1 }}>
                No budget configured. All requests are allowed without cost limits.
              </Typography>
            </Stack>
          )}
        </Box>
      </Box>

      {/* ─── Add API Key Modal ──────────────────────────────────────────────── */}
      <StandardModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        title="Add API key"
        description="Add a provider API key for your gateway endpoints"
        onSubmit={handleCreateKey}
        submitButtonText="Add key"
        isSubmitting={keySubmitting}
      >
        <Stack spacing={6}>
          <Field
            label="Key name"
            placeholder="e.g., Production OpenAI key"
            value={keyForm.key_name}
            onChange={(e) => setKeyForm((p) => ({ ...p, key_name: e.target.value }))}
            isRequired
          />
          <Select
            id="provider"
            label="Provider"
            placeholder="Select provider"
            value={keyForm.provider}
            items={PROVIDERS}
            onChange={(e) => setKeyForm((p) => ({ ...p, provider: e.target.value as string }))}
            getOptionValue={(item) => item._id}
          />
          <Field
            label="API key"
            placeholder="sk-..."
            value={keyForm.api_key}
            onChange={(e) => setKeyForm((p) => ({ ...p, api_key: e.target.value }))}
            type="password"
            isRequired
          />
          {keyError && (
            <Typography sx={{ fontSize: 12, color: palette.status.error.text }}>
              {keyError}
            </Typography>
          )}
        </Stack>
      </StandardModal>

      {/* ─── Budget Modal ───────────────────────────────────────────────────── */}
      <StandardModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title={budget ? "Edit budget" : "Set budget"}
        description="Configure monthly spending limits for the AI Gateway"
        onSubmit={handleSaveBudget}
        submitButtonText={budget ? "Update budget" : "Set budget"}
        isSubmitting={budgetSubmitting}
      >
        <Stack spacing={6}>
          <Field
            label="Monthly limit (USD)"
            placeholder="e.g., 100.00"
            value={budgetForm.monthly_limit_usd}
            onChange={(e) => setBudgetForm((p) => ({ ...p, monthly_limit_usd: e.target.value }))}
            isRequired
          />
          <Field
            label="Alert threshold (%)"
            placeholder="80"
            value={budgetForm.alert_threshold_pct}
            onChange={(e) => setBudgetForm((p) => ({ ...p, alert_threshold_pct: e.target.value }))}
          />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: palette.text.primary }}>
                Hard limit
              </Typography>
              <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                Reject requests when budget is exceeded
              </Typography>
            </Box>
            <Toggle
              checked={budgetForm.is_hard_limit}
              onChange={() => setBudgetForm((p) => ({ ...p, is_hard_limit: !p.is_hard_limit }))}
            />
          </Stack>
        </Stack>
      </StandardModal>
    </Box>
  );
}
