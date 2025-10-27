import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import {
  Eye as VisibilityIcon,
  EyeOff as EyeOffIcon,
  CheckCircle,
  Activity,
  Clock4,
  CalendarClock,
} from 'lucide-react';
import Alert from '../../../components/Alert';
import CustomizableButton from '../../../components/Button/CustomizableButton';
import Field from '../../../components/Inputs/Field';
import Select from '../../../components/Inputs/Select';
import PageBreadcrumbs from '../../../components/Breadcrumbs/PageBreadcrumbs';
import HeaderCard from '../../../components/Cards/DashboardHeaderCard';
import Chip from '@mui/material/Chip';
import useTheme from '@mui/material/styles/useTheme';
import { apiServices } from '../../../../infrastructure/api/networkServices';

type AuthMethod = 'none' | 'basic' | 'token';

type MLFlowActionResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

interface MLFlowFormState {
  trackingServerUrl: string;
  authMethod: AuthMethod;
  username: string;
  password: string;
  apiToken: string;
  timeout: number;
  verifySsl: boolean;
}

const initialFormState: MLFlowFormState = {
  trackingServerUrl: '',
  authMethod: 'none',
  username: '',
  password: '',
  apiToken: '',
  timeout: 30,
  verifySsl: true,
};

interface ConfigMeta {
  hasStoredUsername: boolean;
  hasStoredPassword: boolean;
  hasStoredApiToken: boolean;
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'error';
  lastTestMessage?: string;
  lastSyncedAt?: string | null;
  lastSyncStatus?: 'success' | 'partial' | 'error' | null;
  lastSyncMessage?: string | null;
  lastSuccessfulTestAt?: string | null;
  lastFailedTestAt?: string | null;
  lastFailedTestMessage?: string | null;
}

const MLFlowManagement: React.FC = () => {
  const theme = useTheme();
  const fieldWidth = 520;
  const [isLoadingSyncStatus, setIsLoadingSyncStatus] = useState(true);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [toast, setToast] = useState<{
    variant: 'success' | 'info' | 'warning' | 'error';
    title?: string;
    body: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiToken, setShowApiToken] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isFetchingConfig, setIsFetchingConfig] = useState(true);
  const [configMeta, setConfigMeta] = useState<ConfigMeta | null>(null);
  const [formData, setFormData] = useState<MLFlowFormState>(initialFormState);
  const [isResyncing, setIsResyncing] = useState(false);

  const handleInputChange = useCallback((field: keyof MLFlowFormState, value: string | number | boolean) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };

      if (field === 'authMethod') {
        if (value !== 'basic') {
          next.username = '';
          next.password = '';
        }
        if (value !== 'token') {
          next.apiToken = '';
        }
      }

      return next;
    });
  }, []);

  const buildPayload = useCallback(() => {
    const payload: Record<string, string | number | boolean | undefined> = {
      trackingServerUrl: formData.trackingServerUrl.trim(),
      authMethod: formData.authMethod,
      timeout: formData.timeout,
      verifySsl: formData.verifySsl,
    };

    if (formData.authMethod === 'basic') {
      payload.username = formData.username;
      payload.password = formData.password;
    }

    if (formData.authMethod === 'token') {
      payload.apiToken = formData.apiToken;
    }

    return payload;
  }, [formData]);

  const handleToast = (variant: 'success' | 'info' | 'warning' | 'error', message: string, title?: string) => {
    setToast({ variant, title, body: message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadConfiguration = useCallback(async () => {
    setIsFetchingConfig(true);
    setIsLoadingSyncStatus(true);
    try {
      const { data: configData } = await apiServices.get<{
        configured: boolean;
        config?: {
          trackingServerUrl: string;
          authMethod: AuthMethod;
          timeout: number;
          verifySsl: boolean;
          hasStoredUsername: boolean;
          hasStoredPassword: boolean;
          hasStoredApiToken: boolean;
          lastTestedAt?: string;
          lastTestStatus?: 'success' | 'error';
          lastTestMessage?: string;
          lastSuccessfulTestAt?: string | null;
          lastFailedTestAt?: string | null;
          lastFailedTestMessage?: string | null;
        };
      }>("/integrations/mlflow/config");

      let syncData:
        | {
            lastSyncedAt: string | null;
            lastSyncStatus: 'success' | 'partial' | 'error' | null;
            lastSyncMessage: string | null;
            lastTestedAt: string | null;
            lastTestStatus: 'success' | 'error' | null;
            lastTestMessage: string | null;
            lastSuccessfulTestAt: string | null;
            lastFailedTestAt: string | null;
            lastFailedTestMessage: string | null;
          }
        | null = null;

      try {
        const { data } = await apiServices.get<{
          success: boolean;
          data: {
            configured: boolean;
            lastSyncedAt: string | null;
            lastSyncStatus: 'success' | 'partial' | 'error' | null;
            lastSyncMessage: string | null;
            lastTestedAt: string | null;
            lastTestStatus: 'success' | 'error' | null;
            lastTestMessage: string | null;
            lastSuccessfulTestAt: string | null;
            lastFailedTestAt: string | null;
            lastFailedTestMessage: string | null;
          };
        }>("/integrations/mlflow/sync-status");
        syncData = data?.data ?? null;
      } catch {
        syncData = null;
      } finally {
        setIsLoadingSyncStatus(false);
      }

      if (configData?.configured && configData.config) {
        setFormData((prev) => ({
          ...prev,
          trackingServerUrl: configData.config?.trackingServerUrl ?? '',
          authMethod: configData.config?.authMethod ?? 'none',
          timeout: configData.config?.timeout ?? 30,
          verifySsl: configData.config?.verifySsl ?? true,
          username: '',
          password: '',
          apiToken: '',
        }));
        setConfigMeta({
          hasStoredUsername: Boolean(configData.config.hasStoredUsername),
          hasStoredPassword: Boolean(configData.config.hasStoredPassword),
          hasStoredApiToken: Boolean(configData.config.hasStoredApiToken),
          lastTestedAt: syncData?.lastTestedAt || configData.config.lastTestedAt,
          lastTestStatus: syncData?.lastTestStatus || configData.config.lastTestStatus,
          lastTestMessage: syncData?.lastTestMessage || configData.config.lastTestMessage,
          lastSyncedAt: syncData?.lastSyncedAt ?? null,
          lastSyncStatus: syncData?.lastSyncStatus ?? null,
          lastSyncMessage: syncData?.lastSyncMessage ?? null,
          lastSuccessfulTestAt:
            syncData?.lastSuccessfulTestAt ||
            configData.config.lastSuccessfulTestAt ||
            null,
          lastFailedTestAt:
            syncData?.lastFailedTestAt ||
            configData.config.lastFailedTestAt ||
            null,
          lastFailedTestMessage:
            syncData?.lastFailedTestMessage ||
            configData.config.lastFailedTestMessage ||
            null,
        });
      } else {
        setFormData(() => ({ ...initialFormState }));
        setConfigMeta(null);
      }
    } catch {
      setFormData(() => ({ ...initialFormState }));
      setConfigMeta(null);
      setIsLoadingSyncStatus(false);
    } finally {
      setIsFetchingConfig(false);
      setTestStatus('idle');
    }
  }, []);

  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  const handleSaveConfiguration = useCallback(async () => {
    setIsConfiguring(true);
    try {
      const { data } = await apiServices.post<MLFlowActionResponse>("/integrations/mlflow/configure", buildPayload());
      handleToast('success', data?.message || 'MLFlow configuration saved successfully!', 'Configuration saved');
      await loadConfiguration();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to save configuration. Please try again.';
      handleToast('error', message, 'Save error');
    } finally {
      setIsConfiguring(false);
    }
  }, [buildPayload, loadConfiguration]);

  const handleTestConnection = useCallback(async () => {
    if (!formData.trackingServerUrl.trim()) {
      handleToast('error', 'Please enter a tracking server URL');
      return;
    }

    setTestStatus('testing');

    try {
      const { data } = await apiServices.post<MLFlowActionResponse>("/integrations/mlflow/test", buildPayload());

      if (data?.success) {
        setTestStatus('success');
        handleToast('success', data?.message || 'Successfully connected to MLFlow server!', 'Connection successful');
        await loadConfiguration();
      } else {
        setTestStatus('error');
        handleToast('error', data?.error || 'Connection test failed', 'Connection failed');
      }
    } catch (error) {
      setTestStatus('error');
      const message =
        error instanceof Error
          ? error.message
          : 'Connection test failed. Please check your settings.';
      handleToast('error', message, 'Connection failed');
    }
  }, [buildPayload, formData.trackingServerUrl, loadConfiguration]);

  useEffect(() => {
    setTestStatus('idle');
  }, [
    formData.trackingServerUrl,
    formData.authMethod,
    formData.username,
    formData.password,
    formData.apiToken,
    formData.timeout,
    formData.verifySsl,
  ]);

  const isFormValid = useCallback(() => {
    return formData.trackingServerUrl.trim() !== '' &&
      (formData.authMethod === 'none' ||
        (formData.authMethod === 'basic' && formData.username && formData.password) ||
        (formData.authMethod === 'token' && formData.apiToken));
  }, [formData]);

  const renderDateValue = useCallback((value?: string | null) => {
    if (!value) {
      return (
        <Typography sx={{ fontWeight: 600 }}>Not available</Typography>
      );
    }
    const date = new Date(value);
    return (
      <Box>
        <Typography sx={{ fontWeight: 600 }}>{date.toLocaleDateString()}</Typography>
        <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
          {date.toLocaleTimeString()}
        </Typography>
      </Box>
    );
  }, [theme.palette.text.secondary]);

  const statusCards = useMemo(() => {
    if (!configMeta) {
      return [];
    }

    const connectionStatus = configMeta.lastTestStatus === 'success'
      ? 'Operational'
      : configMeta.lastTestStatus === 'error'
        ? 'Needs attention'
        : 'Pending test';

    const connectionColor = configMeta.lastTestStatus === 'success'
      ? theme.palette.success.main
      : configMeta.lastTestStatus === 'error'
        ? theme.palette.warning.main
        : theme.palette.text.secondary;

    const nextSyncNode = (() => {
      if (!configMeta.lastSuccessfulTestAt && !configMeta.lastSyncedAt) {
        return <Typography sx={{ fontWeight: 600 }}>Pending connection test</Typography>;
      }
      if (!configMeta.lastSyncedAt) {
        return <Typography sx={{ fontWeight: 600 }}>Awaiting first run</Typography>;
      }
      const next = new Date(configMeta.lastSyncedAt);
      next.setHours(next.getHours() + 1);
      return renderDateValue(next.toISOString());
    })();

    return [
      {
        title: "Connection status",
        count: (
          <Typography sx={{ fontWeight: 600, color: connectionColor }}>
            {connectionStatus}
          </Typography>
        ),
        icon: <Activity size={16} color="#A9B3C5" />,
      },
      {
        title: "Last successful test",
        count: renderDateValue(configMeta.lastSuccessfulTestAt || configMeta.lastTestedAt || null),
        icon: <Clock4 size={16} color="#A9B3C5" />,
      },
      {
        title: "Last scheduled sync",
        count: renderDateValue(configMeta.lastSyncedAt || null),
        icon: <Clock4 size={16} color="#A9B3C5" />,
      },
      {
        title: "Next scheduled sync",
        count: nextSyncNode,
        icon: <CalendarClock size={16} color="#A9B3C5" />,
      },
    ];
  }, [configMeta, renderDateValue, theme.palette.success.main, theme.palette.warning.main, theme.palette.text.secondary]);

  const handleResync = useCallback(async () => {
    setIsResyncing(true);
    try {
      await apiServices.get("/integrations/mlflow/models");
      handleToast("success", "Sync triggered successfully.", "Sync started");
      await loadConfiguration();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to trigger sync. Please try again.";
      handleToast("error", message, "Sync failed");
    } finally {
      setIsResyncing(false);
    }
  }, [loadConfiguration]);

  if (isFetchingConfig) {
    return (
      <Stack className="vwhome" gap={theme.spacing(4)} sx={{ pt: theme.spacing(2) }}>
        <PageBreadcrumbs />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(2),
            minHeight: '240px',
            justifyContent: 'center',
          }}
        >
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Loading MLFlow configuration...
          </Typography>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack className="vwhome" gap={theme.spacing(4)} sx={{ pt: theme.spacing(2) }}>
      <PageBreadcrumbs />

      <Box sx={{ mb: theme.spacing(2) }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: theme.spacing(1), fontSize: '15px' }}>
          MLFlow integration configuration
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '13px', color: 'text.secondary', width: '70%' }}>
          Configure your MLFlow connection to sync models and experiments with VerifyWise.
        </Typography>
      </Box>

      {configMeta && statusCards.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(2) }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0, mb: 1 }}>
            <CustomizableButton
              text="Re-run sync"
              onClick={handleResync}
              loading={isResyncing}
              isDisabled={isResyncing || isFetchingConfig}
              sx={{ height: '34px', minHeight: '34px', px: 3, mt: 0 }}
            />
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
              gap: theme.spacing(2),
            }}
          >
            {statusCards.map((card) => (
              <HeaderCard
                key={card.title}
                title={card.title}
                count={card.count}
                icon={card.icon}
                disableNavigation={true}
              />
            ))}
          </Box>
        </Box>
      )}

      {configMeta && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: theme.spacing(2),
            maxWidth: 920,
          }}
        >
          <Box
            sx={{
              border: `1px solid ${
                configMeta.lastTestStatus === 'success'
                  ? theme.palette.status.success.border
                  : theme.palette.status.warning.border
              }`,
              borderRadius: theme.shape.borderRadius,
              p: theme.spacing(2),
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              Last connection test:
              <Chip
                label={configMeta.lastTestStatus === 'success' ? 'Success' : 'Failed'}
                size="small"
                color={configMeta.lastTestStatus === 'success' ? 'success' : 'warning'}
                sx={{ height: 22, fontSize: '11px', textTransform: 'capitalize', borderRadius: '4px' }}
              />
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {configMeta.lastTestedAt
                ? `Ran on ${new Date(configMeta.lastTestedAt).toLocaleDateString()} ${new Date(configMeta.lastTestedAt).toLocaleTimeString()}`
                : 'No successful tests recorded yet.'}
            </Typography>
            {configMeta.lastTestStatus === 'error' && configMeta.lastTestMessage && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {configMeta.lastTestMessage}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {configMeta.lastSuccessfulTestAt
                ? `Last successful connection: ${new Date(
                    configMeta.lastSuccessfulTestAt,
                  ).toLocaleString()}`
                : 'No successful connection recorded yet.'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {configMeta.lastFailedTestMessage
                ? `Last error (${configMeta.lastFailedTestAt
                    ? new Date(configMeta.lastFailedTestAt).toLocaleString()
                    : 'time unknown'}): ${configMeta.lastFailedTestMessage}`
                : 'No recent connection errors.'}
            </Typography>
          </Box>
          <Box
            sx={{
              border: `1px solid ${
                configMeta.lastSyncStatus === 'success'
                  ? theme.palette.status.success.border
                  : configMeta.lastSyncStatus
                    ? theme.palette.status.warning.border
                    : theme.palette.border.dark
              }`,
              borderRadius: theme.shape.borderRadius,
              p: theme.spacing(2),
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              Last scheduled sync:
              <Chip
                label={
                  configMeta.lastSyncStatus === 'success'
                    ? 'Success'
                    : configMeta.lastSyncStatus === 'partial'
                      ? 'Partial'
                      : configMeta.lastSyncStatus === 'error'
                        ? 'Failed'
                        : 'Pending'
                }
                size="small"
                color={
                  configMeta.lastSyncStatus === 'success'
                    ? 'success'
                    : configMeta.lastSyncStatus
                      ? 'warning'
                      : 'default'
                }
                sx={{ height: 22, fontSize: '11px', textTransform: 'capitalize', borderRadius: '4px' }}
              />
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {configMeta.lastSyncedAt
                ? `Ran on ${new Date(configMeta.lastSyncedAt).toLocaleDateString()} ${new Date(configMeta.lastSyncedAt).toLocaleTimeString()}`
                : 'No scheduled syncs have completed yet.'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {isLoadingSyncStatus
                ? 'Checking latest sync status...'
                : !configMeta.lastSuccessfulTestAt
                  ? 'Run a successful connection test to enable scheduled syncs.'
                  : !configMeta.lastSyncedAt
                    ? 'Awaiting the first scheduled sync. This runs automatically every hour.'
                    : configMeta.lastSyncMessage || 'Awaiting the next scheduled sync.'}
            </Typography>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          maxWidth: 560,
          width: '100%',
        }}
      >
          <Stack spacing={theme.spacing(3)} sx={{ marginTop: theme.spacing(2), alignItems: 'flex-start' }}>
            <Field
              id="tracking-server-url"
              label="Tracking server URL"
              value={formData.trackingServerUrl}
              onChange={(e) => handleInputChange('trackingServerUrl', e.target.value)}
              https={true}
              isRequired={true}
              helperText="The URL of your MLFlow tracking server (e.g., https://mlflow.company.com:5000)"
              formHelperTextProps={{
                sx: {
                  marginLeft: 0,
                  whiteSpace: 'nowrap',
                  color: theme.palette.text.secondary,
                },
              }}
              sx={{ width: `${fieldWidth}px` }}
              disabled={isConfiguring}
            />

            <Stack spacing={2} sx={{ width: `${fieldWidth}px` }}>
              <Select
                id="auth-method"
                label="Authentication method"
                value={formData.authMethod}
                onChange={(event) => handleInputChange('authMethod', event.target.value)}
                items={[
                  { _id: 'none', name: 'No authentication' },
                  { _id: 'basic', name: 'Basic auth (username/password)' },
                  { _id: 'token', name: 'API token' }
                ]}
                disabled={isConfiguring}
              />

              {formData.authMethod === 'basic' && (
                <Stack spacing={2}>
                  <Field
                    id="username"
                    label="Username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    isRequired={true}
                    helperText={
                      configMeta?.hasStoredUsername
                        ? 'Leave blank to reuse the stored username'
                        : undefined
                    }
                    formHelperTextProps={{
                      sx: {
                        marginLeft: 0,
                        color: theme.palette.text.secondary,
                      },
                    }}
                    disabled={isConfiguring}
                  />
                  <Field
                    id="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    isRequired={true}
                    helperText={
                      configMeta?.hasStoredPassword
                        ? 'Leave blank to reuse the stored password'
                        : 'Enter your MLFlow password for authentication'
                    }
                    formHelperTextProps={{
                      sx: {
                        marginLeft: 0,
                        color: theme.palette.text.secondary,
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <Box
                          onClick={() => setShowPassword(!showPassword)}
                          sx={{
                            cursor: 'pointer',
                            padding: theme.spacing(1),
                            color: theme.palette.border.dark,
                            '&:hover': {
                              color: theme.palette.text.primary,
                            },
                          }}
                        >
                          {showPassword ? <EyeOffIcon size={16} /> : <VisibilityIcon size={16} />}
                        </Box>
                      ),
                    }}
                    disabled={isConfiguring}
                  />
                </Stack>
              )}

              {formData.authMethod === 'token' && (
                <Field
                  id="api-token"
                  label="API token"
                  type={showApiToken ? 'text' : 'password'}
                  value={formData.apiToken}
                  onChange={(e) => handleInputChange('apiToken', e.target.value)}
                  isRequired={true}
                  helperText={
                    configMeta?.hasStoredApiToken
                      ? 'Leave blank to reuse the stored API token'
                      : 'Enter your MLFlow API token for authentication'
                  }
                  formHelperTextProps={{
                    sx: {
                      marginLeft: 0,
                      color: theme.palette.text.secondary,
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <Box
                        onClick={() => setShowApiToken(!showApiToken)}
                        sx={{
                          cursor: 'pointer',
                          padding: theme.spacing(1),
                          color: theme.palette.border.dark,
                          '&:hover': {
                            color: theme.palette.text.primary,
                          },
                        }}
                      >
                        {showApiToken ? <EyeOffIcon size={16} /> : <VisibilityIcon size={16} />}
                      </Box>
                    ),
                  }}
                  disabled={isConfiguring}
                />
              )}
            </Stack>

            <Field
              id="timeout"
              label="Request timeout (seconds)"
              type="number"
              value={String(formData.timeout)}
              onChange={(e) => {
                const nextValue = Number(e.target.value);
                handleInputChange('timeout', Number.isNaN(nextValue) ? 30 : nextValue);
              }}
              isRequired={true}
              helperText="How long VerifyWise waits before marking MLFlow requests as failed (default 30s)"
              formHelperTextProps={{
                sx: {
                  marginLeft: 0,
                  whiteSpace: 'nowrap',
                  color: theme.palette.text.secondary,
                },
              }}
              sx={{ width: `${fieldWidth}px` }}
              disabled={isConfiguring}
            />

            <Select
              id="verify-ssl"
              label="SSL verification"
              value={formData.verifySsl ? 'true' : 'false'}
              onChange={(event) => handleInputChange('verifySsl', event.target.value === 'true')}
              items={[
                { _id: 'true', name: 'Enabled (recommended)' },
                { _id: 'false', name: 'Disabled (self-signed certs)' },
              ]}
              sx={{ width: `${fieldWidth}px` }}
              disabled={isConfiguring}
            />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: theme.spacing(2),
                pt: theme.spacing(2),
              }}
            >
              <CustomizableButton
                text="Test connection"
                onClick={handleTestConnection}
                loading={testStatus === 'testing'}
                isDisabled={isFetchingConfig || testStatus !== 'idle' || !formData.trackingServerUrl.trim()}
                sx={{
                  height: '34px',
                  minHeight: '34px',
                  px: 3,
                  mt: 0,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 'none',
                  },
                  '&:active': {
                    boxShadow: 'none',
                  },
                }}
              />
              <CustomizableButton
                text="Save configuration"
                startIcon={<CheckCircle size={16} />}
                onClick={handleSaveConfiguration}
                loading={isConfiguring}
                isDisabled={
                  isConfiguring ||
                  isFetchingConfig ||
                  !isFormValid() ||
                  !formData.trackingServerUrl.trim() ||
                  testStatus !== 'success'
                }
                sx={{
                  height: '34px',
                  minHeight: '34px',
                  px: 3,
                  mt: 0,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 'none',
                  },
                  '&:active': {
                    boxShadow: 'none',
                  },
                }}
              />
            </Box>
          </Stack>
        </Box>

      {toast && (
        <Alert
          variant={toast.variant}
          title={toast.title}
          body={toast.body}
          isToast={true}
          onClick={() => setToast(null)}
        />
      )}
    </Stack>
  );
};

export default MLFlowManagement;
