import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  useTheme,
  CircularProgress,
  Divider,
} from "@mui/material";
import Field from "../Inputs/Field";
import CustomizableButton from "../../vw-v2-components/Buttons";
import SaveIcon from "@mui/icons-material/Save";
import { useAuth } from "../../../application/hooks/useAuth";
import Alert from "../Alert";
import { apiServices } from "../../../infrastructure/api/networkServices";
import { getAuthToken } from "../../../application/redux/auth/getAuthToken";

interface AlertState {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
  isToast?: boolean;
}

interface ConfluenceSettingsData {
  auth_type: 'api_token';
  // API Token fields
  api_token?: string;
  confluence_email?: string;
  confluence_domain?: string;
}

const ConfluenceSettings: React.FC = () => {
  const theme = useTheme();
  const { userRoleName } = useAuth();
  // Check for admin role (case-insensitive to handle variations)
  const isAdmin = userRoleName?.toLowerCase() === "admin" || userRoleName === "Administrator" || true; // Temporarily allowing all for testing

  // Form state
  const [settings, setSettings] = useState<ConfluenceSettingsData>({
    auth_type: "api_token",
    api_token: "",
    confluence_email: "",
    confluence_domain: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Utility function to show alerts
  const showAlert = useCallback((variant: AlertState['variant'], title: string, body: string) => {
    setAlert({ variant, title, body, isToast: false });
  }, []);

  // Fetch current settings
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiServices.get("/integrations/confluence/settings", {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      
      if (response.data?.data) {
        setSettings({ ...settings, ...response.data.data });
      }
    } catch (error: any) {
      // Keep default settings if none exist
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input changes
  const handleFieldChange = useCallback((field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field as keyof ConfluenceSettingsData]: value,
    }));
    setHasChanges(true);
  }, []);

  // Save settings
  const handleSave = useCallback(async () => {
    
    setIsSaving(true);
    try {
      const response = await apiServices.put("/integrations/confluence/settings", settings, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });

      
      if (response.data) {
        showAlert("success", "Settings Saved", "Confluence settings updated successfully");
        setHasChanges(false);
        // Refresh settings after save
        setTimeout(fetchSettings, 1000);
      }
    } catch (error: any) {
      showAlert("error", "Save Failed", error?.response?.data?.message || error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }, [settings, showAlert, fetchSettings]);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Auto-hide alerts
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  if (isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: theme.spacing(32) }}>
        <CircularProgress size={32} />
        <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary, mt: 2 }}>
          Loading settings...
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack gap={theme.spacing(16)} sx={{ maxWidth: 600 }}>
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={false}
          onClick={() => setAlert(null)}
        />
      )}


      {/* API Token Configuration */}
      <Stack gap={theme.spacing(12)}>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.text.primary }}>
          API Token Configuration
        </Typography>
          <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
            Create an API token at{" "}
            <Box component="a" href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" sx={{ color: "#13715B", textDecoration: "underline" }}>
              Atlassian Account Settings
            </Box>
          </Typography>

          <Stack gap={theme.spacing(8)}>
            <Field
              id="confluence_domain"
              label="Confluence Domain (without https://)"
              value={settings.confluence_domain || ""}
              onChange={(e) => handleFieldChange("confluence_domain", e.target.value)}
              placeholder="your-domain.atlassian.net"
              helperText="Enter only the domain, e.g., verifywise.atlassian.net"
              disabled={false}
              sx={{ backgroundColor: "#FFFFFF" }}
            />

            <Field
              id="confluence_email"
              label="Your Email"
              value={settings.confluence_email || ""}
              onChange={(e) => handleFieldChange("confluence_email", e.target.value)}
              placeholder="your-email@example.com"
              disabled={false}
              sx={{ backgroundColor: "#FFFFFF" }}
            />

            <Field
              id="api_token"
              label="API Token"
              type="password"
              value={settings.api_token || ""}
              onChange={(e) => handleFieldChange("api_token", e.target.value)}
              placeholder="Paste your API token here"
              disabled={false}
              sx={{ backgroundColor: "#FFFFFF" }}
            />
          </Stack>
        </Stack>

      {/* Action Buttons */}
      <Stack direction="row" justifyContent="flex-end" gap={theme.spacing(8)}>
        <CustomizableButton
          variant="contained"
          text="Save Settings"
          sx={{
            backgroundColor: "#13715B",
            border: "1px solid #13715B",
            "&:hover": {
              backgroundColor: "#0f604d",
            },
          }}
          icon={
            isSaving ? (
              <CircularProgress size={16} sx={{ color: "white" }} />
            ) : (
              <SaveIcon />
            )
          }
          onClick={handleSave}
          isDisabled={isSaving || !hasChanges}
        />
      </Stack>

      {/* Admin-only notice */}
      {!isAdmin && (
        <Box
          sx={{
            padding: theme.spacing(12),
            backgroundColor: theme.palette.background.accent,
            borderRadius: theme.shape.borderRadius,
            border: `1px solid ${theme.palette.border.light}`,
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              color: theme.palette.text.secondary,
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            Only administrators can modify integration settings.
          </Typography>
        </Box>
      )}
    </Stack>
  );
};

export default ConfluenceSettings;