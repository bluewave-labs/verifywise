import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Stack, IconButton, useTheme } from "@mui/material";
import { CirclePlus, Key, Wallet, Trash2, Pencil, Lock, Router } from "lucide-react";
import { EmptyState } from "../../../components/EmptyState";
import EmptyStateTip from "../../../components/EmptyState/EmptyStateTip";
import { CustomizableButton } from "../../../components/button/customizable-button";
import Field from "../../../components/Inputs/Field";
import Select from "../../../components/Inputs/Select";
import StandardModal from "../../../components/Modals/StandardModal";
import Toggle from "../../../components/Inputs/Toggle";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
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

const sectionTitleSx = {
  fontWeight: 600,
  fontSize: 16,
};

function useCardSx() {
  const theme = useTheme();
  return {
    background: theme.palette.background.paper,
    border: `1.5px solid ${theme.palette.border.light}`,
    borderRadius: theme.shape.borderRadius,
    p: theme.spacing(5, 6),
    boxShadow: "none",
  };
}

export default function AIGatewaySettingsPage() {
  const cardSx = useCardSx();
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
    <PageHeaderExtended
      title="Settings"
      description="Manage API keys and budget for the AI Gateway."
      tipBoxEntity="ai-gateway-settings"
    >
      {/* API Keys Section */}
      <Box sx={cardSx}>
        <Stack gap="12px">
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={sectionTitleSx}>API keys</Typography>
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
            <EmptyState
              icon={Key}
              message="No API keys configured. Add a provider API key to start creating endpoints."
              showBorder
            >
              <EmptyStateTip
                icon={Lock}
                title="Keys are encrypted at rest"
                description="Your provider API keys are encrypted using AES-256-CBC before being stored. They are only decrypted when proxying a request and are never exposed in logs."
              />
              <EmptyStateTip
                icon={Router}
                title="Each endpoint references an API key"
                description="After adding a key, create endpoints in the Endpoints tab. Each endpoint uses one API key to authenticate with the LLM provider."
              />
            </EmptyState>
          ) : (
            <Stack gap="8px">
              {apiKeys.map((key) => (
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
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                      {key.key_name}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                      {key.provider} &middot; {key.masked_key}
                    </Typography>
                  </Box>
                  <Stack direction="row" alignItems="center" gap="8px">
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: key.is_active ? palette.status.success.text : palette.text.disabled,
                        fontWeight: 500,
                      }}
                    >
                      {key.is_active ? "Active" : "Inactive"}
                    </Typography>
                    <IconButton size="small" onClick={() => handleDeleteKey(key.id)} sx={{ p: 0.5 }}>
                      <Trash2 size={14} strokeWidth={1.5} color={palette.text.tertiary} />
                    </IconButton>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Budget Section */}
      <Box sx={cardSx}>
        <Stack gap="12px">
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={sectionTitleSx}>Budget</Typography>
            <CustomizableButton
              text={budget ? "Edit budget" : "Set budget"}
              icon={<Pencil size={14} strokeWidth={1.5} />}
              onClick={openBudgetModal}
            />
          </Stack>

          {budget ? (
            <Stack gap="12px">
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: palette.text.tertiary }}>Monthly limit</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                  ${Number(budget.monthly_limit_usd).toFixed(2)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: palette.text.tertiary }}>Current spend</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                  ${Number(budget.current_spend_usd).toFixed(4)}
                </Typography>
              </Stack>
              {Number(budget.monthly_limit_usd) > 0 && (
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
              )}
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: palette.text.tertiary }}>Alert threshold</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                  {budget.alert_threshold_pct}%
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: palette.text.tertiary }}>Hard limit</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                  {budget.is_hard_limit ? "Yes (requests rejected)" : "No (alert only)"}
                </Typography>
              </Stack>
            </Stack>
          ) : (
            <EmptyState
              icon={Wallet}
              message="No budget configured. All requests are allowed without cost limits."
              showBorder
            />
          )}
        </Stack>
      </Box>

      {/* Add API Key Modal */}
      <StandardModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        title="Add API key"
        description="Add a provider API key for your gateway endpoints"
        onSubmit={handleCreateKey}
        submitButtonText="Add key"
        isSubmitting={keySubmitting}
        maxWidth="480px"
      >
        <Stack gap="16px">
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
            autoComplete="off"
            isRequired
          />
          {keyError && (
            <Typography sx={{ fontSize: 12, color: palette.status.error.text }}>
              {keyError}
            </Typography>
          )}
        </Stack>
      </StandardModal>

      {/* Budget Modal */}
      <StandardModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title={budget ? "Edit budget" : "Set budget"}
        description="Configure monthly spending limits for the AI Gateway"
        onSubmit={handleSaveBudget}
        submitButtonText={budget ? "Update budget" : "Set budget"}
        isSubmitting={budgetSubmitting}
        maxWidth="480px"
      >
        <Stack gap="16px">
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
              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
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
    </PageHeaderExtended>
  );
}
