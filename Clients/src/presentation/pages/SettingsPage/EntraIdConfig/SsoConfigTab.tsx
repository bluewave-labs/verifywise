import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  useTheme,
  CircularProgress,
} from "@mui/material";
import Field from "../../../components/Inputs/Field";
import Toggle from "../../../components/Toggle";
import Alert from "../../../components/Alert";
import Button from "../../../components/Button";
import Select from "../../../components/Inputs/Select";
import { useAuth } from "../../../../application/hooks/useAuth";
import { GetSsoConfig, UpdateSsoConfig, ToggleSsoStatus } from "../../../../application/repository/ssoConfig.repository";

// State interface for SSO Configuration (MVP)
interface SsoConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  cloudEnvironment: string;
  isEnabled: boolean;
  authMethodPolicy: 'sso_only' | 'password_only' | 'both';
}

// Validation errors interface
interface ValidationErrors {
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
}

// Cloud environment options
const cloudEnvironments = [
  { _id: "AzurePublic", name: "Azure Public Cloud" },
  { _id: "AzureGovernment", name: "Azure Government" }
];

// Authentication method policy options
const authMethodPolicies = [
  { _id: "both", name: "Allow both SSO and password authentication" },
  { _id: "sso_only", name: "Require SSO authentication only" },
  { _id: "password_only", name: "Allow password authentication only" }
];

const SsoConfigTab: React.FC = () => {
  const { organizationId } = useAuth();
  const [config, setConfig] = useState<SsoConfig>({
    tenantId: "",
    clientId: "",
    clientSecret: "",
    cloudEnvironment: "AzurePublic",
    isEnabled: false,
    authMethodPolicy: "both",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();

  // Fetch SSO config on mount
  useEffect(() => {
    const fetchSsoConfig = async () => {
      if (!organizationId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await GetSsoConfig({
          routeUrl: `ssoConfig?organizationId=${organizationId}&provider=AzureAD`,
        });

        if (response?.data) {
          // Map backend response to frontend state
          setConfig({
            tenantId: response.data.config_data?.tenant_id || "",
            clientId: response.data.config_data?.client_id || "",
            clientSecret: response.data.config_data?.client_secret || "",
            cloudEnvironment: response.data.config_data?.cloud_environment || "AzurePublic",
            isEnabled: response.data.is_enabled || false,
            authMethodPolicy: "both",
          });
        }
        // If error or no config found, keep default empty state
      } catch (error) {
        console.error('Failed to fetch SSO config:', error);
        // Keep default empty state on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchSsoConfig();
  }, [organizationId]);

  // Validation functions
  const validateUUID = (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  };

  const validateField = useCallback((field: keyof ValidationErrors, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'tenantId':
        if (!value) {
          newErrors.tenantId = "Tenant ID is required";
        } else if (!validateUUID(value)) {
          newErrors.tenantId = "Please enter a valid UUID format";
        } else {
          delete newErrors.tenantId;
        }
        break;
      case 'clientId':
        if (!value) {
          newErrors.clientId = "Client ID is required";
        } else if (!validateUUID(value)) {
          newErrors.clientId = "Please enter a valid UUID format";
        } else {
          delete newErrors.clientId;
        }
        break;
      case 'clientSecret':
        if (!value) {
          newErrors.clientSecret = "Client Secret is required";
        } else if (value.length < 10) {
          newErrors.clientSecret = "Client Secret must be at least 10 characters";
        } else {
          delete newErrors.clientSecret;
        }
        break;
    }

    setErrors(newErrors);
  }, [errors]);

  const handleFieldChange = (field: keyof SsoConfig) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setConfig(prev => ({ ...prev, [field]: value }));

    // Real-time validation for specific fields
    if (field === 'tenantId' || field === 'clientId' || field === 'clientSecret') {
      validateField(field, value);
    }
  };


  const handleEnableSSO = async () => {
    setIsEnabling(true);
    try {
      if (Object.keys(errors).length === 0 && organizationId) {
        const endpoint = config.isEnabled ? 'disable' : 'enable';

        await ToggleSsoStatus({
          routeUrl: `ssoConfig/${endpoint}?organizationId=${organizationId}&provider=AzureAD`,
          body: {},
        });

        // Toggle SSO enabled state locally
        setConfig(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
        console.log(`SSO ${endpoint}d successfully`);
      }
    } catch (error) {
      console.error('Error toggling SSO status:', error);
    } finally {
      setIsEnabling(false);
    }
  };


  const handleSelectChange = (field: keyof SsoConfig) => (
    event: any
  ) => {
    setConfig(prev => ({ ...prev, [field]: event.target.value }));
  };


  const handleSave = async () => {
    setIsSaving(true);

    // Validate all required fields first
    validateField('tenantId', config.tenantId);
    validateField('clientId', config.clientId);
    validateField('clientSecret', config.clientSecret);

    // Check if there are any validation errors
    const hasErrors = !config.tenantId || !config.clientId || !config.clientSecret || Object.keys(errors).length > 0;

    if (hasErrors) {
      setIsSaving(false);
      return;
    }

    try {
      if (organizationId) {
        await UpdateSsoConfig({
          routeUrl: `ssoConfig?organizationId=${organizationId}&provider=AzureAD`,
          body: {
            client_id: config.clientId,
            client_secret: config.clientSecret,
            tenant_id: config.tenantId,
            cloud_environment: config.cloudEnvironment,
          },
        });

        // Success - could show a toast notification here
        console.log('SSO configuration saved successfully');
      }
    } catch (error) {
      console.error('Error saving SSO config:', error);
      // Could show error toast here
    } finally {
      setIsSaving(false);
    }
  };

  // Card-like container styles - matching AI Trust Center spacing
  const cardStyles = {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    border: `1.5px solid ${theme.palette.divider}`,
    padding: theme.spacing(5, 6), // 40px top/bottom, 48px left/right - same as AI Trust Center
    boxShadow: 'none',
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ height: '16px' }} />

      {/* Setup Guide Alert */}
      <Alert
        variant="info"
        body="Need help finding these values? Visit Azure Portal → Microsoft Entra ID → App registrations → [Your App]. Ensure your app has the correct redirect URIs configured for VerifyWise."
        sx={{ position: 'static' }}
        isToast={false}
      />

      <Box sx={{ height: '16px' }} />

      {/* Simplified SSO Configuration Card */}
      <Box sx={cardStyles}>
        <Typography fontSize={15} fontWeight={700} gutterBottom>
          AzureAD SSO configuration
        </Typography>

        <Stack spacing={0}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ marginBottom: theme.spacing(10) }}>
            <Box sx={{ flex: 1 }}>
              <Field
                label="Tenant id"
                placeholder="Enter your Azure AD Tenant ID"
                value={config.tenantId}
                onChange={handleFieldChange('tenantId')}
                error={errors.tenantId}
                isRequired
                sx={{ width: '100%' }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '12px' }}>
                Found in Azure Portal &gt; Microsoft Entra ID &gt; Overview &gt; Tenant ID
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Field
                label="Client id"
                placeholder="Enter your Application (client) ID"
                value={config.clientId}
                onChange={handleFieldChange('clientId')}
                error={errors.clientId}
                isRequired
                sx={{ width: '100%' }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '12px' }}>
                Found in Azure Portal &gt; App registrations &gt; [Your App] &gt; Application (client) ID
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ marginBottom: theme.spacing(10) }}>
            <Box sx={{ flex: 1 }}>
              <Field
                label="Client secret"
                type="password"
                placeholder="Enter your client secret"
                value={config.clientSecret}
                onChange={handleFieldChange('clientSecret')}
                error={errors.clientSecret}
                isRequired
                sx={{ width: '100%' }}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Select
                id="cloud-environment"
                label="Cloud environment"
                value={config.cloudEnvironment}
                items={cloudEnvironments}
                onChange={handleSelectChange('cloudEnvironment')}
                getOptionValue={(option) => option._id}
                sx={{ width: '100%' }}
              />
            </Box>
          </Stack>

          {/* <Box sx={{ marginBottom: theme.spacing(10) }}>
            <Select
              id="auth-method-policy"
              label="Authentication method policy"
              value={config.authMethodPolicy}
              items={authMethodPolicies}
              onChange={handleSelectChange('authMethodPolicy')}
              getOptionValue={(option) => option._id}
              sx={{ width: '100%' }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '12px' }}>
              Controls which authentication methods are allowed for users in this organization
            </Typography>
          </Box> */}

        </Stack>

        {/* Save/Cancel Buttons for Configuration */}
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button variant="outlined" disabled={isSaving} sx={{ height: '34px', fontSize: 13, fontWeight: 400, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving || !config.tenantId || !config.clientId || !config.clientSecret || Object.keys(errors).length > 0}
            sx={{ height: '34px', fontSize: 13, fontWeight: 400, textTransform: 'none' }}
          >
            {isSaving ? "Saving..." : "Save configuration"}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ height: '16px' }} />

      {/* Enable SSO Card */}
      <Box sx={cardStyles}>
        <Typography fontSize={15} fontWeight={700} gutterBottom>
          Enable SSO
        </Typography>

        <Box sx={{ marginBottom: theme.spacing(3) }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
            Enable SSO authentication for this organization. Configuration must be saved before enabling.
          </Typography>
        </Box>

        {config.isEnabled && config.authMethodPolicy === 'sso_only' && (
          <Alert
            variant="warning"
            body="SSO-only policy: Users will be required to authenticate through Azure AD. Password authentication will be disabled."
            sx={{ position: 'static', mb: 2 }}
            isToast={false}
          />
        )}
        {config.isEnabled && config.authMethodPolicy === 'both' && (
          <Alert
            variant="info"
            body="Flexible authentication: Users can choose between SSO and password authentication methods."
            sx={{ position: 'static', mb: 2 }}
            isToast={false}
          />
        )}
        {config.authMethodPolicy === 'password_only' && (
          <Alert
            variant="info"
            body="Password-only policy: Users will authenticate using username/password. SSO options will be hidden."
            sx={{ position: 'static', mb: 2 }}
            isToast={false}
          />
        )}

        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant={config.isEnabled ? "outlined" : "contained"}
            onClick={handleEnableSSO}
            disabled={isEnabling || Object.keys(errors).length > 0 || !config.tenantId || !config.clientId || !config.clientSecret}
            sx={{ height: '34px', fontSize: 13, fontWeight: 400, textTransform: 'none' }}
          >
            {isEnabling ? "Processing..." : config.isEnabled ? "Disable SSO" : "Enable SSO"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default SsoConfigTab;
