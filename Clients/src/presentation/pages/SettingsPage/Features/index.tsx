import { Box, FormControlLabel, Stack, Typography, useTheme } from "@mui/material";
import React, { useEffect, useState } from "react";
import CustomizableSkeleton from "../../../components/Skeletons";
import Alert from "../../../components/Alert";
import CustomizableToast from "../../../components/Toast";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { SaveIcon } from "lucide-react";
import Toggle from "../../../components/Inputs/Toggle";
import { useFeatureSettings } from "../../../../application/hooks/useFeatureSettings";

const Features: React.FC = () => {
  const theme = useTheme();
  const { featureSettings, loading, updateSettings } = useFeatureSettings();
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [lifecycleEnabled, setLifecycleEnabled] = useState(true);

  const [showToast, setShowToast] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title: string;
    body: string;
    isToast: boolean;
    visible: boolean;
  }>({
    variant: "info",
    title: "",
    body: "",
    isToast: true,
    visible: false,
  });

  useEffect(() => {
    if (featureSettings) {
      setLifecycleEnabled(featureSettings.lifecycle_enabled);
      setIsSaveDisabled(true);
    }
  }, [featureSettings]);

  const handleToggleChange = (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setLifecycleEnabled(checked);
    setIsSaveDisabled(checked === featureSettings?.lifecycle_enabled);
  };

  const handleSave = async () => {
    setShowToast(true);
    try {
      await updateSettings({ lifecycle_enabled: lifecycleEnabled });
      setAlert({
        variant: "success",
        title: "Success",
        body: "Feature settings updated successfully.",
        isToast: true,
        visible: true,
      });
      setIsSaveDisabled(true);
    } catch (error: any) {
      setAlert({
        variant: "error",
        title: "Error",
        body: error.message || "Failed to update feature settings. Please try again.",
        isToast: true,
        visible: true,
      });
    } finally {
      setShowToast(false);
      setTimeout(() => {
        setShowToast(false);
      }, 1000);
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, 3000);
    }
  };

  return (
    <Box sx={{ mt: 3, width: { xs: "90%", md: "70%" }, position: "relative" }}>
      {loading && (
        <CustomizableSkeleton
          variant="rectangular"
          width="100%"
          height="300px"
          minWidth={"100%"}
          minHeight={300}
          sx={{ borderRadius: 2 }}
        />
      )}
      {alert.visible && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={alert.isToast}
          onClick={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}
      {showToast && <CustomizableToast />}
      {!loading && (
        <Box sx={{ width: "100%", maxWidth: 600 }}>
          <Stack sx={{ marginTop: theme.spacing(20) }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: 16 }}>
              Feature Configuration
            </Typography>
            <FormControlLabel
              control={
                <Toggle
                  checked={lifecycleEnabled}
                  onChange={handleToggleChange}
                />
              }
              label={
                <Box sx={{ ml: 1 }}>
                  <Typography sx={{ fontWeight: 500, fontSize: 14 }}>
                    Model Lifecycle
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
                    Enable lifecycle phase tracking for model inventory items. When disabled, lifecycle data is preserved but hidden from the UI.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: "flex-start", mb: 2 }}
            />
            <Stack
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
                paddingTop: theme.spacing(5),
                marginTop: theme.spacing(10),
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
        </Box>
      )}
    </Box>
  );
};

export default Features;
