import { useState, useEffect } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { CirclePlus, Key, Wallet } from "lucide-react";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import palette from "../../../themes/palette";

export default function AIGatewaySettingsPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
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
    };
    load();
  }, []);

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
                <Typography
                  sx={{
                    fontSize: 11,
                    color: key.is_active ? palette.status.success.text : palette.text.disabled,
                    fontWeight: 500,
                  }}
                >
                  {key.is_active ? "Active" : "Inactive"}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Budget Section */}
      <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: palette.text.primary, mb: 2 }}>
          Budget
        </Typography>

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
                <Typography sx={{ fontSize: 13, color: palette.text.tertiary }}>
                  Monthly limit
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: palette.text.primary }}>
                  ${Number(budget.monthly_limit_usd).toFixed(2)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: palette.text.tertiary }}>
                  Current spend
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: palette.text.primary }}>
                  ${Number(budget.current_spend_usd).toFixed(4)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: palette.text.tertiary }}>
                  Alert threshold
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: palette.text.primary }}>
                  {budget.alert_threshold_pct}%
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: palette.text.tertiary }}>
                  Hard limit
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: palette.text.primary }}>
                  {budget.is_hard_limit ? "Yes (requests rejected when exceeded)" : "No (alert only)"}
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
    </Box>
  );
}
