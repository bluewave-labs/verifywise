import { Box, Stack, Typography, useTheme } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import { CustomizableButton } from "../../../components/button/customizable-button";
import Toggle from "../../../components/Inputs/Toggle";
import { Settings } from "lucide-react";
import { useFeatureSettings } from "../../../../application/hooks/useFeatureSettings";

const Features: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { settings, isLoading, update } = useFeatureSettings();

  const handleToggle = async (
    key: "audit_ledger_enabled",
    checked: boolean
  ) => {
    try {
      await update({ [key]: checked });
    } catch {
      // error logged in hook
    }
  };

  return (
    <Stack sx={{ mt: 3, width: "100%" }}>
      <Stack sx={{ pt: theme.spacing(20) }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{ fontSize: 15, fontWeight: 600, color: "#000000" }}
          >
            Features
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#666666", mt: 0.5 }}>
            Configure which features are enabled for your organization
          </Typography>
        </Box>

        <Stack sx={{ gap: "16px" }}>
          {/* Audit Ledger toggle */}
          <Box
            sx={{
              border: `1px solid ${theme.palette.border.light}`,
              borderRadius: "4px",
              p: "16px",
              backgroundColor: theme.palette.background.main,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                Audit ledger
              </Typography>
              <Typography
                sx={{ fontSize: 13, color: theme.palette.text.secondary }}
              >
                Tamper-proof, hash-chained log of all platform changes for
                compliance auditing
              </Typography>
            </Box>
            <Toggle
              checked={settings?.audit_ledger_enabled ?? true}
              onChange={(e) =>
                handleToggle("audit_ledger_enabled", e.target.checked)
              }
              disabled={isLoading}
            />
          </Box>

          {/* Model Lifecycle (plugin-managed) */}
          <Box
            sx={{
              border: `1px solid ${theme.palette.border.light}`,
              borderRadius: "4px",
              p: "16px",
              backgroundColor: theme.palette.background.main,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                Model Lifecycle
              </Typography>
              <Typography
                sx={{ fontSize: 13, color: theme.palette.text.secondary }}
              >
                Model Lifecycle is now managed via the Plugins page. Install or
                uninstall the "Model Lifecycle" plugin to control this feature.
              </Typography>
            </Box>
            <CustomizableButton
              variant="contained"
              text="Manage plugins"
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
                whiteSpace: "nowrap",
              }}
              icon={<Settings size={16} />}
              onClick={() => navigate("/plugins")}
            />
          </Box>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default Features;
