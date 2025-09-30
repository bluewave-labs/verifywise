import React, { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import Toggle from "../../../components/Toggle";
import Alert from "../../../components/Alert";
import Button from "../../../components/Button";
import Select from "../../../components/Inputs/Select";
import { tokenLifetimes } from "./SsoConfigTab";

// State interface for Security Configuration
interface SecurityConfig {
  tokenLifetime: string;
  forceReauthOnRoleChange: boolean;
  singleSessionPerUser: boolean;
  enableSsoAuditLogging: boolean;
}

const SecurityControlsTab: React.FC = () => {
  const [config, setConfig] = useState<SecurityConfig>({
    tokenLifetime: "8 Hours",
    forceReauthOnRoleChange: true,
    singleSessionPerUser: false,
    enableSsoAuditLogging: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const theme = useTheme();

  const handleToggleChange = (field: keyof SecurityConfig) => (checked: boolean) => {
    setConfig(prev => ({ ...prev, [field]: checked }));
  };

  const handleSelectChange = (field: keyof SecurityConfig) => (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setConfig(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call for saving security configuration
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Success handling would go here
    } catch (error) {
      // Error handling would go here
    } finally {
      setIsSaving(false);
    }
  };

  // Card-like container styles
  const cardStyles = {
    backgroundColor: theme.palette.background.paper,
    borderRadius: 2,
    border: `1px solid ${theme.palette.divider}`,
    p: 3,
  };

  return (
    <Box>
      <Box sx={{ height: '16px' }} />

      {/* Session Management Card */}
      <Box sx={cardStyles}>
        <Typography fontSize={15} fontWeight={700} gutterBottom>
          Session Management
        </Typography>

        <Stack spacing={3}>
          <Box sx={{ maxWidth: { md: '50%' } }}>
            <Select
              id="token-lifetime"
              label="Token Lifetime"
              value={config.tokenLifetime}
              items={tokenLifetimes}
              onChange={handleSelectChange('tokenLifetime')}
              getOptionValue={(option) => option._id}
              sx={{ width: '100%' }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '12px' }}>
              How long users stay logged in without re-authentication
            </Typography>
          </Box>

          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Toggle
                checked={config.forceReauthOnRoleChange}
                onChange={handleToggleChange('forceReauthOnRoleChange')}
              />
              <Typography>Force re-authentication on role change</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
              Require users to log in again when their role or permissions change
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Toggle
                checked={config.singleSessionPerUser}
                onChange={handleToggleChange('singleSessionPerUser')}
              />
              <Typography>Single session per user</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
              Limit users to one active session at a time across all devices
            </Typography>
          </Stack>

          <Alert
            variant="warning"
            body="Balance security with usability. Stricter settings improve security but may impact user experience. Consider your organization's security requirements and user workflow needs."
            sx={{ position: 'static' }}
            isToast={false}
          />
        </Stack>
      </Box>

      <Box sx={{ height: '16px' }} />

      {/* Audit Integration Card */}
      <Box sx={cardStyles}>
        <Typography fontSize={15} fontWeight={700} gutterBottom>
          Audit Integration
        </Typography>

        <Stack spacing={3}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Toggle
                checked={config.enableSsoAuditLogging}
                onChange={handleToggleChange('enableSsoAuditLogging')}
              />
              <Typography>Enable SSO audit logging</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
              Log all SSO authentication events for security monitoring and compliance
            </Typography>
          </Stack>

          <Alert
            variant="info"
            body="SSO audit logs capture authentication events, login attempts, role assignments, and session activities. These logs are essential for security monitoring, compliance reporting, and incident investigation."
            sx={{ position: 'static' }}
            isToast={false}
          />
        </Stack>
      </Box>

      <Box sx={{ height: '16px' }} />

      {/* Access Control Information */}
      <Box sx={cardStyles}>
        <Typography fontSize={15} fontWeight={700} gutterBottom>
          Access Control Information
        </Typography>

        <Stack spacing={3}>
          <Alert
            variant="info"
            body="User access control is managed through Microsoft Entra ID. To restrict access to your organization's users only, configure the 'User assignment required' setting in your Azure AD application registration. This prevents external users and guests from accessing VerifyWise even if they can authenticate to your tenant."
            sx={{ position: 'static' }}
            isToast={false}
          />

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
              <strong>Key Access Control Features:</strong>
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2, fontSize: '12px', color: 'text.secondary' }}>
              <li>Conditional Access policies through Azure AD</li>
              <li>Multi-factor authentication enforcement</li>
              <li>Device compliance requirements</li>
              <li>IP address restrictions</li>
              <li>Risk-based authentication policies</li>
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
              <strong>Recommended Security Setup:</strong>
            </Typography>
            <Box component="ol" sx={{ mt: 1, pl: 2, fontSize: '12px', color: 'text.secondary' }}>
              <li>Enable "User assignment required" in Azure AD app registration</li>
              <li>Configure Conditional Access policies for VerifyWise</li>
              <li>Require MFA for all VerifyWise access</li>
              <li>Set up device compliance policies</li>
              <li>Monitor sign-in logs and audit activities</li>
            </Box>
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
          disabled={isSaving}
          sx={{ height: '34px', fontSize: 13, fontWeight: 400, textTransform: 'none' }}
        >
          {isSaving ? "Saving..." : "Save Security Settings"}
        </Button>
      </Stack>
    </Box>
  );
};

export default SecurityControlsTab;