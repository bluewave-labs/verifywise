import { Box, Stack, Typography, useTheme } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import Alert from "../../../components/Alert";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { SaveIcon } from "lucide-react";
import Toggle from "../../../components/Inputs/Toggle";
import { useFeatureSettings } from "../../../../application/hooks/useFeatureSettings";

interface AlertState {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
  isToast?: boolean;
}

const Features: React.FC = () => {
  const theme = useTheme();
  const { featureSettings, loading, updateSettings } = useFeatureSettings();
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [lifecycleEnabled, setLifecycleEnabled] = useState(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  useEffect(() => {
    if (featureSettings) {
      setLifecycleEnabled(featureSettings.lifecycle_enabled);
      setIsSaveDisabled(true);
    }
  }, [featureSettings]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [alert]);

  const handleToggleChange = useCallback(
    (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setLifecycleEnabled(checked);
      setIsSaveDisabled(checked === featureSettings?.lifecycle_enabled);
    },
    [featureSettings?.lifecycle_enabled],
  );

  const handleSave = useCallback(async () => {
    try {
      await updateSettings({ lifecycle_enabled: lifecycleEnabled });
      setAlert({
        variant: "success",
        title: "Success",
        body: "Feature settings updated successfully.",
      });
      setIsSaveDisabled(true);
    } catch (error: any) {
      setAlert({
        variant: "error",
        title: "Error",
        body:
          error.message ||
          "Failed to update feature settings. Please try again.",
      });
    }
  }, [lifecycleEnabled, updateSettings]);

  if (loading) return null;

  return (
    <Stack sx={{ mt: 3, width: "100%" }}>
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={false}
          onClick={() => setAlert(null)}
        />
      )}

      <Stack sx={{ pt: theme.spacing(20) }}>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#000000" }}>
            Features
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#666666", mt: 0.5 }}>
            Configure which features are enabled for your organization
          </Typography>
        </Box>

        <Box
          sx={{
            border: `1px solid ${theme.palette.border.light}`,
            borderRadius: "4px",
            p: "16px",
            backgroundColor: theme.palette.background.main,
          }}
        >
          <Box
            sx={{
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
                Enable lifecycle phase tracking for model inventory items. When
                disabled, lifecycle data is preserved but hidden from the UI.
              </Typography>
            </Box>
            <Toggle
              checked={lifecycleEnabled}
              onChange={handleToggleChange}
            />
          </Box>
        </Box>

        <Stack
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            mt: theme.spacing(6),
          }}
        >
          <CustomizableButton
            variant="contained"
            text="Save"
            sx={{
              backgroundColor: "#13715B",
              border: isSaveDisabled
                ? "1px solid rgba(0, 0, 0, 0.26)"
                : "1px solid #13715B",
              gap: 2,
            }}
            icon={<SaveIcon size={16} />}
            onClick={handleSave}
            isDisabled={isSaveDisabled}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default Features;
