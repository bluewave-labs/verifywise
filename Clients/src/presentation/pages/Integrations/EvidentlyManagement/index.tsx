import { Box, CircularProgress, Typography, Stack, Button, TextField } from "@mui/material";
import { useState, useCallback } from "react";
import { Workflow, Plug } from "lucide-react";
import PageBreadcrumbs from "../../../components/Breadcrumbs/PageBreadcrumbs";
import Alert from "../../../components/Alert";
import CustomizableButton from "../../../components/Button/CustomizableButton";

/**
 * Helper function to format error messages consistently
 */
const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const EvidentlyManagement = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Form state
  const [evidentlyUrl, setEvidentlyUrl] = useState<string>(
    localStorage.getItem("evidently_url") || "https://app.evidently.cloud"
  );
  const [apiToken, setApiToken] = useState<string>(
    localStorage.getItem("evidently_api_token") || ""
  );

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

  /**
   * Show alert with auto-hide functionality
   */
  const showAlert = useCallback(
    (
      variant: "success" | "info" | "warning" | "error",
      title: string,
      body: string,
    ) => {
      setAlert({
        variant,
        title,
        body,
        isToast: true,
        visible: true,
      });

      setTimeout(() => {
        setAlert((prev) => ({ ...prev, visible: false }));
      }, 3000);
    },
    [],
  );

  /**
   * Test connection to Evidently Cloud
   */
  const handleTestConnection = async () => {
    if (!evidentlyUrl || !apiToken) {
      showAlert("warning", "Validation Error", "Please provide both URL and API token");
      return;
    }

    setIsTesting(true);

    try {
      // TODO: Replace with actual API call to Python service
      // Simulating API call for now
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock success response
      showAlert(
        "success",
        "Connection Successful",
        "Successfully connected to Evidently Cloud!"
      );
    } catch (error) {
      showAlert(
        "error",
        "Connection Failed",
        `Failed to connect to Evidently Cloud: ${formatErrorMessage(error)}`,
      );
    } finally {
      setIsTesting(false);
    }
  };

  /**
   * Save Evidently configuration
   */
  const handleSaveConfiguration = async () => {
    if (!evidentlyUrl || !apiToken) {
      showAlert("warning", "Validation Error", "Please provide both URL and API token");
      return;
    }

    setIsLoading(true);

    try {
      // Save to localStorage (temporary - will be database later)
      localStorage.setItem("evidently_url", evidentlyUrl);
      localStorage.setItem("evidently_api_token", apiToken);
      localStorage.setItem("evidently_configured", "true");

      showAlert(
        "success",
        "Configuration Saved",
        "Evidently configuration saved successfully!"
      );
    } catch (error) {
      showAlert(
        "error",
        "Save Failed",
        `Failed to save configuration: ${formatErrorMessage(error)}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const breadcrumbItems = [
    {
      label: "Integrations",
      path: "/integrations",
      icon: <Plug size={16} />,
    },
    {
      label: "Evidently AI",
      icon: <Workflow size={16} />,
    }
  ];

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <PageBreadcrumbs items={breadcrumbItems} autoGenerate={false} />
        <Box sx={{ mt: 4, display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={24} />
          <Typography>Saving configuration...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageBreadcrumbs items={breadcrumbItems} autoGenerate={false} />

      {/* Header */}
      <Box sx={{ mb: 3, mt: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, fontSize: '15px' }}>
          Evidently AI Integration
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '13px' }} color="text.secondary">
          Configure your Evidently Cloud connection to monitor ML model performance, detect drift, and analyze fairness metrics.
        </Typography>
      </Box>

      {alert.visible && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={alert.isToast}
          onClick={() => setAlert((prev) => ({ ...prev, visible: false }))}
        />
      )}

      {/* Configuration Form */}
      <Box sx={{ mt: 3, maxWidth: '600px' }}>
        <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 600, mb: 3 }}>
          Connection Settings
        </Typography>

        <Stack spacing={3}>
          {/* Evidently URL */}
          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 500, mb: 1 }}>
              Evidently URL
            </Typography>
            <TextField
              fullWidth
              value={evidentlyUrl}
              onChange={(e) => setEvidentlyUrl(e.target.value)}
              placeholder="https://app.evidently.cloud"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '13px',
                }
              }}
            />
            <Typography sx={{ fontSize: '12px', color: '#667085', mt: 0.5 }}>
              Enter your Evidently Cloud URL or self-hosted instance URL
            </Typography>
          </Box>

          {/* API Token */}
          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 500, mb: 1 }}>
              API Token
            </Typography>
            <TextField
              fullWidth
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Enter your Evidently API token"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '13px',
                }
              }}
            />
            <Typography sx={{ fontSize: '12px', color: '#667085', mt: 0.5 }}>
              You can generate an API token from the Evidently Cloud dashboard (Key icon → Token page)
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <CustomizableButton
              variant="outlined"
              text="Test Connection"
              onClick={handleTestConnection}
              isDisabled={isTesting || !evidentlyUrl || !apiToken}
              sx={{
                border: "1px solid #13715B",
                color: "#13715B",
                fontSize: '13px',
                fontWeight: 500,
                textTransform: 'none',
                minWidth: '120px',
                "&:hover": {
                  backgroundColor: "#F0FDF4",
                  border: "1px solid #13715B",
                },
              }}
            />

            <CustomizableButton
              variant="contained"
              text={isLoading ? "Saving..." : "Save Configuration"}
              onClick={handleSaveConfiguration}
              isDisabled={isLoading || !evidentlyUrl || !apiToken}
              sx={{
                backgroundColor: "#13715B",
                color: "white",
                fontSize: '13px',
                fontWeight: 500,
                textTransform: 'none',
                minWidth: '140px',
                "&:hover": {
                  backgroundColor: "#0F5A47",
                },
              }}
            />
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default EvidentlyManagement;
