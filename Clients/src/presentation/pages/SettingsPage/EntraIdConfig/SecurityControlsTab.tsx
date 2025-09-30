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

      {/* Session Management Card */}
      <Box sx={cardStyles}>
        <Typography fontSize={15} fontWeight={700} gutterBottom>
          Session management
        </Typography>

        <Stack spacing={0}>
          <Box sx={{ maxWidth: { md: '50%' }, marginBottom: theme.spacing(10) }}>
            <Select
              id="token-lifetime"
              label="Token lifetime"
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

          <Box sx={{ marginBottom: theme.spacing(10) }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Toggle
                checked={config.forceReauthOnRoleChange}
                onChange={handleToggleChange('forceReauthOnRoleChange')}
              />
              <Typography sx={{ fontSize: 13 }}>Force re-authentication on role change</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                - Require users to log in again when their role or permissions change
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ marginBottom: theme.spacing(10) }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Toggle
                checked={config.singleSessionPerUser}
                onChange={handleToggleChange('singleSessionPerUser')}
              />
              <Typography sx={{ fontSize: 13 }}>Single session per user</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                - Limit users to one active session at a time across all devices
              </Typography>
            </Stack>
          </Box>

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
          Audit integration
        </Typography>

        <Stack spacing={0}>
          <Box sx={{ marginBottom: theme.spacing(10) }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Toggle
                checked={config.enableSsoAuditLogging}
                onChange={handleToggleChange('enableSsoAuditLogging')}
              />
              <Typography sx={{ fontSize: 13 }}>Enable SSO audit logging for security monitoring and compliance</Typography>
            </Stack>
          </Box>

          <Alert
            variant="info"
            body="SSO audit logs capture authentication events, login attempts, role assignments, and session activities. These logs are essential for security monitoring, compliance reporting, and incident investigation."
            sx={{ position: 'static' }}
            isToast={false}
          />
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
          {isSaving ? "Saving..." : "Save security settings"}
        </Button>
      </Stack>
    </Box>
  );
};

export default SecurityControlsTab;