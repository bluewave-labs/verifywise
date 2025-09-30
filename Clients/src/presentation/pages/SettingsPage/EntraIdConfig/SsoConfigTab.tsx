import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import Field from "../../../components/Inputs/Field";
import Toggle from "../../../components/Toggle";
import Alert from "../../../components/Alert";
import Button from "../../../components/Button";
import Select from "../../../components/Inputs/Select";
import { useAuth } from "../../../../application/hooks/useAuth";
import {
  ssoConfigurationService,
  CreateUpdateSSOConfigurationPayload
} from "../../../../infrastructure/api/ssoConfigurationService";

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
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const theme = useTheme();

  // Validation functions
  const validateUUID = (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  };

  const validateField = useCallback((field: keyof ValidationErrors, value: string, currentErrors?: ValidationErrors) => {
    const errorsToUse = currentErrors || errors;
    const newErrors = { ...errorsToUse };

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
    return newErrors;
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


  const handleToggleChange = (field: keyof SsoConfig) => (checked: boolean) => {
    setConfig(prev => ({ ...prev, [field]: checked }));
  };


  const handleSelectChange = (field: keyof SsoConfig) => (
    event: any
  ) => {
    setConfig(prev => ({ ...prev, [field]: event.target.value }));
  };

  // Load existing SSO configuration on component mount
  useEffect(() => {
    const loadSSOConfiguration = async () => {
      if (!organizationId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await ssoConfigurationService.getSSOConfiguration(organizationId.toString());

        if (response.success && response.data.exists) {
          setConfig({
            tenantId: response.data.azure_tenant_id || "",
            clientId: response.data.azure_client_id || "",
            clientSecret: "", // Never populate client secret from API
            cloudEnvironment: response.data.cloud_environment || "AzurePublic",
            isEnabled: response.data.is_enabled || false,
            authMethodPolicy: response.data.auth_method_policy || "both",
          });
        }
      } catch (error) {
        console.error('Failed to load SSO configuration:', error);
        setSaveError('Failed to load existing SSO configuration. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSSOConfiguration();
  }, [organizationId]);


  const handleSave = async () => {
    if (!organizationId) {
      setSaveError('Organization ID not found. Please refresh the page and try again.');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      // Validate all required fields and collect errors synchronously
      let currentErrors = {};
      currentErrors = validateField('tenantId', config.tenantId, currentErrors);
      currentErrors = validateField('clientId', config.clientId, currentErrors);
      currentErrors = validateField('clientSecret', config.clientSecret, currentErrors);

      if (Object.keys(currentErrors).length > 0) {
        setSaveError('Please fix the validation errors before saving.');
        return;
      }

      // Prepare payload for API
      const payload: CreateUpdateSSOConfigurationPayload = {
        azure_tenant_id: config.tenantId,
        azure_client_id: config.clientId,
        azure_client_secret: config.clientSecret,
        cloud_environment: config.cloudEnvironment as 'AzurePublic' | 'AzureGovernment',
        auth_method_policy: config.authMethodPolicy as 'sso_only' | 'password_only' | 'both'
      };

      // Call API to save configuration
      const response = await ssoConfigurationService.createOrUpdateSSOConfiguration(
        organizationId.toString(),
        payload
      );

      if (response.success) {
        setSaveSuccess(true);
        // Update local state with response data
        setConfig(prev => ({
          ...prev,
          isEnabled: response.data.is_enabled,
          clientSecret: "", // Clear client secret after successful save
        }));

        // Auto-hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError('Failed to save SSO configuration. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to save SSO configuration:', error);
      setSaveError(error.message || 'Failed to save SSO configuration. Please try again.');
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
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading SSO configuration...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ height: '16px' }} />

      {/* Success/Error Messages */}
      {saveSuccess && (
        <Alert
          variant="success"
          body="SSO configuration saved successfully!"
          sx={{ position: 'static', mb: 2 }}
          isToast={false}
        />
      )}

      {saveError && (
        <Alert
          variant="error"
          body={saveError}
          sx={{ position: 'static', mb: 2 }}
          isToast={false}
        />
      )}

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
          SSO configuration
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

          <Box sx={{ marginBottom: theme.spacing(10) }}>
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
          </Box>

          <Box sx={{ marginBottom: theme.spacing(10) }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Toggle
                checked={config.isEnabled}
                onChange={handleToggleChange('isEnabled')}
              />
              <Typography sx={{ fontSize: 13 }}>Enable SSO authentication for this organization</Typography>
            </Stack>
            {config.isEnabled && config.authMethodPolicy === 'sso_only' && (
              <Alert
                variant="warning"
                body="SSO-only policy: Users will be required to authenticate through Azure AD. Password authentication will be disabled."
                sx={{ position: 'static', mt: 2 }}
                isToast={false}
              />
            )}
            {config.isEnabled && config.authMethodPolicy === 'both' && (
              <Alert
                variant="info"
                body="Flexible authentication: Users can choose between SSO and password authentication methods."
                sx={{ position: 'static', mt: 2 }}
                isToast={false}
              />
            )}
            {config.authMethodPolicy === 'password_only' && (
              <Alert
                variant="info"
                body="Password-only policy: Users will authenticate using username/password. SSO options will be hidden."
                sx={{ position: 'static', mt: 2 }}
                isToast={false}
              />
            )}
          </Box>
        </Stack>
      </Box>

      <Box sx={{ height: '16px' }} />

      {/* Save/Cancel Buttons */}
      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        <Button variant="outlined" disabled={isSaving} sx={{ height: '34px', fontSize: 13, fontWeight: 400, textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || Object.keys(errors).length > 0}
          sx={{ height: '34px', fontSize: 13, fontWeight: 400, textTransform: 'none' }}
        >
          {isSaving ? "Saving..." : "Save configuration"}
        </Button>
      </Stack>
    </Box>
  );
};

export default SsoConfigTab;