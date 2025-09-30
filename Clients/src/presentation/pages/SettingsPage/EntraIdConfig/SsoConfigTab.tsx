import React, { useState, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  useTheme,
  SelectChangeEvent,
} from "@mui/material";
import Field from "../../../components/Inputs/Field";
import Toggle from "../../../components/Toggle";
import Alert from "../../../components/Alert";
import Button from "../../../components/Button";
import Select from "../../../components/Inputs/Select";

// State interface for SSO Configuration
interface SsoConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  cloudEnvironment: string;
  emailClaim: string;
  nameClaim: string;
  adminGroups: string;
  autoCreateUsers: boolean;
  defaultRole: string;
  postLogoutRedirectUri: string;
  oauthScopes: string;
  customClaims: string;
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

// Default role options
const defaultRoles = [
  { _id: "Reviewer", name: "Reviewer" },
  { _id: "Editor", name: "Editor" },
  { _id: "Auditor", name: "Auditor" },
  { _id: "Admin", name: "Admin" }
];

// Token lifetime options for reuse in SecurityControlsTab
export const tokenLifetimes = [
  { _id: "1 Hour", name: "1 Hour" },
  { _id: "8 Hours", name: "8 Hours" },
  { _id: "24 Hours", name: "24 Hours" }
];

const SsoConfigTab: React.FC = () => {
  const [config, setConfig] = useState<SsoConfig>({
    tenantId: "",
    clientId: "",
    clientSecret: "",
    cloudEnvironment: "AzurePublic",
    emailClaim: "",
    nameClaim: "",
    adminGroups: "",
    autoCreateUsers: false,
    defaultRole: "Reviewer",
    postLogoutRedirectUri: "",
    oauthScopes: "",
    customClaims: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const theme = useTheme();

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


  const handleToggleChange = (field: keyof SsoConfig) => (checked: boolean) => {
    setConfig(prev => ({ ...prev, [field]: checked }));
  };

  const handleSelectChange = (field: keyof SsoConfig) => (
    event: SelectChangeEvent<string | number>
  ) => {
    setConfig(prev => ({ ...prev, [field]: event.target.value }));
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionResult(null);

    try {
      // Simulate API call for testing connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock response - replace with actual API call
      const success = Math.random() > 0.3; // 70% success rate for demo

      setConnectionResult({
        success,
        message: success
          ? "Connection successful! Azure AD configuration is valid."
          : "Connection failed. Please verify your credentials and try again."
      });
    } catch (error) {
      setConnectionResult({
        success: false,
        message: "Network error occurred while testing connection."
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate all required fields
      validateField('tenantId', config.tenantId);
      validateField('clientId', config.clientId);
      validateField('clientSecret', config.clientSecret);

      if (Object.keys(errors).length === 0) {
        // Simulate API call for saving configuration
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Success handling would go here
      }
    } catch (error) {
      // Error handling would go here
    } finally {
      setIsSaving(false);
    }
  };

  // Card-like container styles - matching AI Trust Center spacing
  const cardStyles = {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    border: `1.5px solid ${theme.palette.border?.light || theme.palette.divider}`,
    padding: theme.spacing(5, 6), // 40px top/bottom, 48px left/right - same as AI Trust Center
    boxShadow: 'none',
  };

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

      {/* Connection Settings Card */}
      <Box sx={cardStyles}>
        <Typography fontSize={15} fontWeight={700} gutterBottom>
          Connection settings
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

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', marginBottom: '16px' }}>
            <Button
              variant="contained"
              onClick={testConnection}
              disabled={isTestingConnection || !config.tenantId || !config.clientId || !config.clientSecret}
              sx={{ height: '34px', fontSize: 13, fontWeight: 400, textTransform: 'none' }}
            >
              {isTestingConnection ? "Testing connection..." : "Test connection"}
            </Button>
          </Box>

          {connectionResult && (
            <Alert
              variant={connectionResult.success ? "success" : "error"}
              body={connectionResult.message}
              sx={{ position: 'static' }}
              isToast={false}
            />
          )}
        </Stack>
      </Box>

      <Box sx={{ height: '16px' }} />

      {/* User Mapping Card */}
      <Box sx={cardStyles}>
        <Typography fontSize={15} fontWeight={700} gutterBottom>
          User mapping
        </Typography>

        <Stack spacing={0}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ marginBottom: theme.spacing(10) }}>
            <Box sx={{ flex: 1 }}>
              <Field
                label="Email claim"
                placeholder="email"
                value={config.emailClaim}
                onChange={handleFieldChange('emailClaim')}
                sx={{ width: '100%' }}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Field
                label="Name claim"
                placeholder="name"
                value={config.nameClaim}
                onChange={handleFieldChange('nameClaim')}
                sx={{ width: '100%' }}
              />
            </Box>
          </Stack>

          <Box sx={{ marginBottom: theme.spacing(10) }}>
            <Field
              label="Admin groups"
              placeholder="group1,group2,group3"
              value={config.adminGroups}
              onChange={handleFieldChange('adminGroups')}
              sx={{ width: '100%' }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '12px' }}>
              Comma-separated list of Azure AD group names that should have admin access
            </Typography>
          </Box>

          <Box sx={{ marginBottom: theme.spacing(10) }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ marginBottom: theme.spacing(2) }}>
              <Toggle
                checked={config.autoCreateUsers}
                onChange={handleToggleChange('autoCreateUsers')}
              />
              <Typography>Auto-create users</Typography>
            </Stack>
            {config.autoCreateUsers && (
              <Alert
                variant="warning"
                body="Auto-creating users allows anyone who can authenticate to your Entra ID to access VerifyWise. Consider using Entra ID's 'User assignment required' setting to restrict access."
                sx={{ position: 'static' }}
                isToast={false}
              />
            )}
          </Box>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <Box sx={{ flex: 1, maxWidth: { md: '50%' } }}>
              <Select
                id="default-role"
                label="Default role"
                value={config.defaultRole}
                items={defaultRoles}
                onChange={handleSelectChange('defaultRole')}
                getOptionValue={(option) => option._id}
                sx={{ width: '100%' }}
              />
            </Box>
          </Stack>

        </Stack>
      </Box>

      <Box sx={{ height: '16px' }} />

      {/* Advanced Configuration */}
      <Box sx={cardStyles}>
        <Typography fontSize={15} fontWeight={700} gutterBottom>
          Advanced configuration
        </Typography>

        <Stack spacing={0}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ marginBottom: theme.spacing(10) }}>
            <Box sx={{ flex: 1 }}>
              <Field
                label="OAuth scopes"
                placeholder="openid profile email groups"
                value={config.oauthScopes}
                onChange={handleFieldChange('oauthScopes')}
                sx={{ width: '100%' }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '12px' }}>
                Space-separated scopes. 'groups' required for admin groups, 'User.Read' for profile data
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Field
                label="Post logout redirect URI"
                placeholder="https://your-domain.com/logged-out"
                value={config.postLogoutRedirectUri}
                onChange={handleFieldChange('postLogoutRedirectUri')}
                sx={{ width: '100%' }}
              />
            </Box>
          </Stack>

          <Box>
            <Field
              label="Custom claims mapping"
              type="description"
              rows={4}
              placeholder='{"department": "extension_Department", "role": "jobTitle"}'
              value={config.customClaims}
              onChange={handleFieldChange('customClaims')}
              sx={{ width: '100%' }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '12px' }}>
              JSON format mapping of custom claims from Azure AD to VerifyWise user attributes
            </Typography>
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