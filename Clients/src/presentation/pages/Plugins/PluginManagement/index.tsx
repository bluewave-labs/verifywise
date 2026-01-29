import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Navigate, useLocation } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  Chip as MuiChip,
  Button,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormControl,
} from "@mui/material";
import Chip from "../../../components/Chip";
import {
  ArrowLeft as ArrowLeftIcon,
  CheckCircle as CheckIcon,
  Settings as SettingsIcon,
  Home,
  Puzzle,
  FileSpreadsheet as FileSpreadsheetIcon,
  Package as PackageIcon,
  Database as DatabaseIcon,
} from "lucide-react";
import PageBreadcrumbs from "../../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../../components/Layout/PageHeader";
import PluginSlot from "../../../components/PluginSlot";
import { PLUGIN_SLOTS } from "../../../../domain/constants/pluginSlots";
import { usePluginRegistry } from "../../../../application/contexts/PluginRegistry.context";
import { getPluginByKey, getInstalledPlugins, updatePluginConfiguration, testPluginConnection, connectOAuthWorkspace } from "../../../../application/repository/plugin.repository";
import { usePluginInstallation } from "../../../../application/hooks/usePluginInstallation";
import { Plugin, PluginInstallationStatus } from "../../../../domain/types/plugins";
import Alert from "../../../components/Alert";
import { useAuth } from "../../../../application/hooks/useAuth";
import { cardStyles } from "../../../themes/components";
import ConfirmationModal from "../../../components/Dialogs/ConfirmationModal";
import { IBreadcrumbItem } from "../../../../domain/types/breadcrumbs.types";
import { ENV_VARs } from "../../../../../env.vars";

const PluginManagement: React.FC = () => {
  const { pluginKey } = useParams<{ pluginKey: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { userRoleName } = useAuth();
  const { install, uninstall, installing, uninstalling } = usePluginInstallation();
  const { getComponentsForSlot } = usePluginRegistry();
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [configData, setConfigData] = useState<Record<string, string>>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [toast, setToast] = useState<{
    variant: "success" | "info" | "warning" | "error";
    body: string;
    visible: boolean;
  } | null>(null);

  // OAuth connection state
  const [connectingOAuth, setConnectingOAuth] = useState(false);

  const isAdmin = userRoleName === "Admin";

  // Custom breadcrumb items
  const breadcrumbItems: IBreadcrumbItem[] = useMemo(() => {
    const items: IBreadcrumbItem[] = [
      {
        label: "Dashboard",
        path: "/",
        icon: <Home size={14} strokeWidth={1.5} />,
      },
      {
        label: "Plugins",
        path: "/plugins/marketplace",
        icon: <Puzzle size={14} strokeWidth={1.5} />,
      },
    ];

    // Add plugin name if available
    if (plugin) {
      items.push({
        label: plugin.displayName,
        path: `/plugins/${pluginKey}/manage`,
        disabled: true,
      });
    }

    return items;
  }, [plugin, pluginKey]);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (pluginKey !== "slack") return;

      const params = new URLSearchParams(location.search);
      const code = params.get("code");

      if (code) {
        setConnectingOAuth(true);
        try {
          await connectOAuthWorkspace({ pluginKey, code });
          setToast({
            variant: "success",
            body: "Slack workspace connected successfully!",
            visible: true,
          });
          // Remove code from URL - plugin component will fetch workspaces on mount
          navigate(`/plugins/${pluginKey}/manage`, { replace: true });
        } catch (error: any) {
          setToast({
            variant: "error",
            body: error.message || "Failed to connect Slack workspace",
            visible: true,
          });
          // Remove code from URL
          navigate(`/plugins/${pluginKey}/manage`, { replace: true });
        } finally {
          setConnectingOAuth(false);
        }
      }
    };

    handleOAuthCallback();
  }, [location.search, pluginKey, navigate]);

  // Fetch plugin details
  useEffect(() => {
    const fetchPlugin = async () => {
      if (!pluginKey) return;

      try {
        setLoading(true);
        // Fetch plugin metadata
        const pluginData = await getPluginByKey({ key: pluginKey });

        // Fetch installation status
        const installations = await getInstalledPlugins({});
        const installation = installations.find(
          (inst) => inst.pluginKey === pluginKey || inst.plugin?.key === pluginKey
        );

        if (installation) {
          setPlugin({
            ...pluginData,
            installationId: installation.id,
            installationStatus: installation.status,
            installedAt: installation.installedAt,
          });

          // Load existing configuration with defaults
          const defaults: Record<string, any> = {};
          if (pluginKey === "mlflow") {
            defaults.auth_method = "none";
            defaults.verify_ssl = "true";
            defaults.timeout = "30";
          }

          setConfigData({
            ...defaults,
            ...(installation.configuration || {}),
          });
        } else {
          setPlugin(pluginData);
        }
      } catch (error) {
        console.error("Failed to fetch plugin:", error);
        setToast({
          variant: "error",
          body: "Failed to load plugin details",
          visible: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlugin();
  }, [pluginKey]);

  const handleUninstallClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmUninstall = useCallback(async () => {
    if (!plugin?.installationId) return;

    try {
      await uninstall(plugin.installationId, pluginKey);
      setIsDeleteModalOpen(false);
      setToast({
        variant: "success",
        body: "Plugin uninstalled successfully!",
        visible: true,
      });

      // Navigate back to My Plugins after uninstall
      setTimeout(() => navigate("/plugins/my-plugins"), 1500);
    } catch (err: any) {
      setIsDeleteModalOpen(false);
      setToast({
        variant: "error",
        body: err.message || "Failed to uninstall plugin. Please try again.",
        visible: true,
      });
    }
  }, [plugin, uninstall, navigate]);


  const handleCloseToast = () => {
    setToast(null);
  };

  const handleConfigChange = (key: string, value: string) => {
    setConfigData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTestConnection = async () => {
    if (!pluginKey) return;

    setIsTestingConnection(true);
    try {
      const result = await testPluginConnection({
        pluginKey,
        configuration: configData,
      });

      if (result?.success) {
        setToast({
          variant: "success",
          body: result.message || "Connection test successful!",
          visible: true,
        });
      } else {
        setToast({
          variant: "error",
          body: result?.message || "Connection test failed",
          visible: true,
        });
      }
    } catch (err: any) {
      setToast({
        variant: "error",
        body: err.message || "Failed to test connection. Please try again.",
        visible: true,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!plugin?.installationId) return;

    setIsSavingConfig(true);
    try {
      await updatePluginConfiguration({
        installationId: plugin.installationId,
        configuration: configData,
      });

      setToast({
        variant: "success",
        body: "Configuration saved successfully!",
        visible: true,
      });
    } catch (err: any) {
      setToast({
        variant: "error",
        body: err.message || "Failed to save configuration. Please try again.",
        visible: true,
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Get configuration fields based on plugin type
  const getConfigFields = () => {
    const baseFields = [
      {
        key: "server_url",
        label: "Server URL",
        placeholder: "https://example.com",
        type: "url",
      },
      {
        key: "api_key",
        label: "API Key",
        placeholder: "Enter your API key",
        type: "password",
      },
    ];

    // Plugin-specific configurations
    if (pluginKey === "mlflow") {
      return [
        {
          key: "tracking_server_url",
          label: "Tracking Server URL",
          placeholder: "http://localhost:5000",
          type: "url",
        },
        {
          key: "auth_method",
          label: "Authentication Method",
          placeholder: "none",
          type: "select",
          options: [
            { value: "none", label: "None" },
            { value: "basic", label: "Basic Auth" },
            { value: "token", label: "Token" },
          ],
        },
        {
          key: "username",
          label: "Username",
          placeholder: "Enter username",
          type: "text",
          showIf: (data: Record<string, string>) => data.auth_method === "basic",
        },
        {
          key: "password",
          label: "Password",
          placeholder: "Enter password",
          type: "password",
          showIf: (data: Record<string, string>) => data.auth_method === "basic",
        },
        {
          key: "api_token",
          label: "API Token",
          placeholder: "Enter API token",
          type: "password",
          showIf: (data: Record<string, string>) => data.auth_method === "token",
        },
        {
          key: "verify_ssl",
          label: "Verify SSL",
          placeholder: "true",
          type: "checkbox",
        },
        {
          key: "timeout",
          label: "Request Timeout (seconds)",
          placeholder: "30",
          type: "number",
        },
      ];
    }

    return baseFields;
  };

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast && toast.visible) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toast]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <Stack className="vwhome" gap="16px">
        <PageBreadcrumbs items={breadcrumbItems} autoGenerate={false} />
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Stack>
    );
  }

  if (!plugin) {
    return (
      <Stack className="vwhome" gap="16px">
        <PageBreadcrumbs items={breadcrumbItems} autoGenerate={false} />
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Plugin not found
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate("/plugins/marketplace")}
            sx={{ mt: 2 }}
          >
            Go to Marketplace
          </Button>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack className="vwhome" gap="16px">
      <PageBreadcrumbs items={breadcrumbItems} autoGenerate={false} />

      {/* Back Button */}
      <Box>
        <Button
          startIcon={<ArrowLeftIcon size={16} />}
          onClick={() => navigate("/plugins/my-plugins")}
          sx={{
            color: "#344054",
            fontSize: "13px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
          }}
        >
          Back to My Plugins
        </Button>
      </Box>

      <PageHeader
        title={plugin.displayName}
        description={plugin.description}
      />

      <Box sx={{ px: 2 }}>
        <Stack gap={2}>
          {/* Plugin Info Card */}
          <Card sx={(theme) => ({ ...cardStyles.base(theme) as any })}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* Header with Icon */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {plugin.iconUrl ? (
                    <Box
                      component="img"
                      src={plugin.iconUrl}
                      alt={`${plugin.displayName} logo`}
                      sx={{
                        width: 64,
                        height: 64,
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor:
                          plugin.key === "risk-import"
                            ? "rgba(16, 185, 129, 0.1)"
                            : plugin.category === "data_management"
                            ? "rgba(139, 92, 246, 0.1)"
                            : "rgba(99, 102, 241, 0.1)",
                        borderRadius: "12px",
                      }}
                    >
                      {plugin.key === "risk-import" ? (
                        <FileSpreadsheetIcon size={36} color="#10b981" />
                      ) : plugin.category === "data_management" ? (
                        <DatabaseIcon size={36} color="#8b5cf6" />
                      ) : (
                        <PackageIcon size={36} color="#6366f1" />
                      )}
                    </Box>
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                      <Typography variant="h5" fontWeight={600} fontSize={18}>
                        {plugin.displayName}
                      </Typography>
                      {plugin.installationStatus && (
                        <MuiChip
                          size="small"
                          label={plugin.installationStatus}
                          icon={<CheckIcon size={14} />}
                          sx={{
                            fontSize: "11px",
                            height: 24,
                            borderRadius: "4px",
                            backgroundColor: "rgba(34, 197, 94, 0.1)",
                            color: "#16a34a",
                            border: "1px solid rgba(34, 197, 94, 0.2)",
                            fontWeight: 500,
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" fontSize={13}>
                      Version {plugin.version} • {plugin.author || "VerifyWise"}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                {/* Description */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} fontSize={14} mb={1}>
                    About
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontSize={13}>
                    {plugin.longDescription || plugin.description}
                  </Typography>
                </Box>

                {/* Features */}
                {plugin.features && plugin.features.length > 0 && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} fontSize={14} mb={2}>
                        Features
                      </Typography>
                      <Stack spacing={1.5}>
                        {plugin.features.map((feature, index) => (
                          <Box key={index} sx={{ display: "flex", gap: 1 }}>
                            <CheckIcon size={16} color="#13715B" style={{ marginTop: 2, flexShrink: 0 }} />
                            <Box>
                              <Typography variant="body2" fontWeight={500} fontSize={13}>
                                {feature.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" fontSize={12}>
                                {feature.description}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </>
                )}

                {/* Tags */}
                {plugin.tags && plugin.tags.length > 0 && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} fontSize={14} mb={1}>
                        Tags
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {plugin.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            uppercase={false}
                            backgroundColor="#F3F4F6"
                            textColor="#6B7280"
                          />
                        ))}
                      </Box>
                    </Box>
                  </>
                )}

                {/* Links */}
                {/* TODO: Uncomment when ready to add Resources section
                <Divider />
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} fontSize={14} mb={1.5}>
                    Resources
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    {plugin.documentationUrl && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ExternalLinkIcon size={14} />}
                        href={plugin.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          textTransform: "none",
                          fontSize: "12px",
                          borderColor: "#d0d5dd",
                          color: "#344054",
                        }}
                      >
                        Documentation
                      </Button>
                    )}
                    {plugin.supportUrl && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ExternalLinkIcon size={14} />}
                        href={plugin.supportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          textTransform: "none",
                          fontSize: "12px",
                          borderColor: "#d0d5dd",
                          color: "#344054",
                        }}
                      >
                        Support
                      </Button>
                    )}
                  </Stack>
                </Box>
                */}

                {/* Actions */}
                <Divider />

                {/* Install Button - Show when plugin is not installed */}
                {(!plugin.installationStatus || plugin.installationStatus === PluginInstallationStatus.UNINSTALLED || plugin.installationStatus === PluginInstallationStatus.FAILED) && (
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={async () => {
                        try {
                          if (plugin.key) {
                            await install(plugin.key);

                            // Refresh plugin data with installation status
                            const [updatedPlugin, installedPlugins] = await Promise.all([
                              getPluginByKey({ key: plugin.key }),
                              getInstalledPlugins()
                            ]);

                            // Find the installation for this plugin
                            const pluginInstallation = installedPlugins.find(
                              (p) => p.pluginKey === plugin.key || p.plugin?.key === plugin.key
                            );

                            // Merge plugin metadata with installation status
                            setPlugin({
                              ...updatedPlugin,
                              installationStatus: pluginInstallation?.status,
                              installationId: pluginInstallation?.id,
                            });

                            setToast({
                              variant: "success",
                              body: "Plugin installed successfully!",
                              visible: true,
                            });
                          }
                        } catch (err: any) {
                          setToast({
                            variant: "error",
                            body: err.message || "Failed to install plugin. Please try again.",
                            visible: true,
                          });
                        }
                      }}
                      disabled={installing === plugin.key}
                      sx={{
                        backgroundColor: "#13715B",
                        textTransform: "none",
                        fontSize: "13px",
                        fontWeight: 500,
                        "&:hover": {
                          backgroundColor: "#0f5a47",
                        },
                      }}
                    >
                      {installing === plugin.key
                        ? "Installing..."
                        : plugin.installationStatus === PluginInstallationStatus.FAILED
                        ? "Retry Installation"
                        : "Install Plugin"}
                    </Button>
                  </Box>
                )}

                {/* Uninstall Button - Show when plugin is installed */}
                {plugin.installationStatus === PluginInstallationStatus.INSTALLED && (
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleUninstallClick}
                      disabled={uninstalling === plugin.installationId}
                      sx={{
                        textTransform: "none",
                        fontSize: "13px",
                        fontWeight: 500,
                        borderColor: "#dc2626",
                        color: "#dc2626",
                        "&:hover": {
                          backgroundColor: "rgba(220, 38, 38, 0.04)",
                          borderColor: "#dc2626",
                        },
                      }}
                    >
                      {uninstalling === plugin.installationId ? "Uninstalling..." : "Uninstall Plugin"}
                    </Button>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Configuration Card - Only show for installed plugins that require configuration */}
          {plugin.installationStatus === PluginInstallationStatus.INSTALLED && plugin.requiresConfiguration !== false && (
            <Card sx={(theme) => ({ ...cardStyles.base(theme) as any })}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={3}>
                  {/* Configuration Header */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <SettingsIcon size={20} color="#13715B" />
                    <Typography variant="h6" fontWeight={600} fontSize={16}>
                      Configuration
                    </Typography>
                  </Box>

                  <Divider />

                  {/* Configuration Content */}
                  <Box>
                    {/* Show loading during OAuth connection */}
                    {connectingOAuth && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 4 }}>
                        <CircularProgress size={24} />
                        <Typography fontSize={13}>Connecting to Slack...</Typography>
                      </Box>
                    )}

                    {/* Plugin Configuration via PluginSlot */}
                    {!connectingOAuth && pluginKey && getComponentsForSlot(PLUGIN_SLOTS.PLUGIN_CONFIG).some(c => c.pluginKey === pluginKey) ? (
                      <PluginSlot
                        id={PLUGIN_SLOTS.PLUGIN_CONFIG}
                        pluginKey={pluginKey}
                        slotProps={{
                          pluginKey,
                          installationId: plugin.installationId,
                          slackClientId: ENV_VARs.CLIENT_ID,
                          slackOAuthUrl: ENV_VARs.SLACK_URL,
                          onToast: (t: { variant: string; body: string }) => setToast({ ...t, visible: true } as any),
                          configData,
                          onConfigChange: handleConfigChange,
                          onSaveConfiguration: handleSaveConfiguration,
                          onTestConnection: handleTestConnection,
                          isSavingConfig,
                          isTestingConnection,
                        }}
                      />
                    ) : !connectingOAuth && (
                      <>
                        <Typography variant="body2" color="text.secondary" fontSize={13} sx={{ mb: 3 }}>
                          Configure {plugin.displayName} settings and preferences.
                        </Typography>

                        {/* Generic Configuration Form */}
                        <Stack spacing={2.5}>
                          {getConfigFields().map((field: any) => {
                            // Skip field if showIf condition is false
                            if (field.showIf && !field.showIf(configData)) {
                              return null;
                            }

                            // Render based on field type
                            if (field.type === "select") {
                              return (
                                <Box key={field.key}>
                                  <Typography
                                    variant="body2"
                                    fontWeight={500}
                                    fontSize={13}
                                    sx={{ mb: 0.75, color: "#344054" }}
                                  >
                                    {field.label}
                                  </Typography>
                                  <FormControl fullWidth size="small">
                                    <Select
                                      value={configData[field.key] || field.placeholder || ""}
                                      onChange={(e) => handleConfigChange(field.key, e.target.value)}
                                      sx={{
                                        fontSize: "13px",
                                        backgroundColor: "white",
                                      }}
                                    >
                                      {field.options?.map((option: any) => (
                                        <MenuItem key={option.value} value={option.value} sx={{ fontSize: "13px" }}>
                                          {option.label}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Box>
                              );
                            }

                            if (field.type === "multiselect") {
                              const currentValue = configData[field.key] ?
                                (typeof configData[field.key] === 'string' ?
                                  JSON.parse(configData[field.key]) :
                                  configData[field.key]) :
                                [];

                              return (
                                <Box key={field.key}>
                                  <Typography
                                    variant="body2"
                                    fontWeight={500}
                                    fontSize={13}
                                    sx={{ mb: 0.75, color: "#344054" }}
                                  >
                                    {field.label}
                                  </Typography>
                                  <FormControl fullWidth size="small">
                                    <Select
                                      multiple
                                      value={currentValue}
                                      onChange={(e) => {
                                        const value = typeof e.target.value === 'string' ?
                                          e.target.value.split(',') :
                                          e.target.value;
                                        handleConfigChange(field.key, JSON.stringify(value));
                                      }}
                                      renderValue={(selected) => (selected as string[]).join(", ")}
                                      sx={{
                                        fontSize: "13px",
                                        backgroundColor: "white",
                                      }}
                                    >
                                      {field.options?.map((option: any) => (
                                        <MenuItem key={option.value} value={option.value} sx={{ fontSize: "13px" }}>
                                          <Checkbox
                                            checked={currentValue.indexOf(option.value) > -1}
                                            sx={{
                                              color: "#13715B",
                                              "&.Mui-checked": {
                                                color: "#13715B",
                                              },
                                            }}
                                          />
                                          <Typography fontSize={13}>{option.label}</Typography>
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Box>
                              );
                            }

                            if (field.type === "checkbox") {
                              return (
                                <Box key={field.key}>
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        checked={configData[field.key] === "true"}
                                        onChange={(e) => handleConfigChange(field.key, e.target.checked ? "true" : "false")}
                                        sx={{
                                          color: "#13715B",
                                          "&.Mui-checked": {
                                            color: "#13715B",
                                          },
                                        }}
                                      />
                                    }
                                    label={
                                      <Typography variant="body2" fontWeight={500} fontSize={13} sx={{ color: "#344054" }}>
                                        {field.label}
                                      </Typography>
                                    }
                                  />
                                </Box>
                              );
                            }

                            // Default: Text, URL, Password, Number fields
                            return (
                              <Box key={field.key}>
                                <Typography
                                  variant="body2"
                                  fontWeight={500}
                                  fontSize={13}
                                  sx={{ mb: 0.75, color: "#344054" }}
                                >
                                  {field.label}
                                </Typography>
                                <TextField
                                  fullWidth
                                  type={field.type}
                                  placeholder={field.placeholder}
                                  value={configData[field.key] || ""}
                                  onChange={(e) => handleConfigChange(field.key, e.target.value)}
                                  size="small"
                                  sx={{
                                    "& .MuiOutlinedInput-root": {
                                      fontSize: "13px",
                                      backgroundColor: "white",
                                    },
                                  }}
                                />
                              </Box>
                            );
                          })}
                        </Stack>

                        {/* Test Connection and Save Buttons */}
                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
                          <Button
                            variant="outlined"
                            onClick={handleTestConnection}
                            disabled={isTestingConnection || isSavingConfig}
                            sx={{
                              borderColor: "#13715B",
                              color: "#13715B",
                              textTransform: "none",
                              fontSize: "13px",
                              fontWeight: 500,
                              "&:hover": {
                                borderColor: "#0f5a47",
                                backgroundColor: "rgba(19, 113, 91, 0.04)",
                              },
                              "&:disabled": {
                                borderColor: "#d0d5dd",
                                color: "#98a2b3",
                              },
                            }}
                          >
                            {isTestingConnection ? "Testing..." : "Test Connection"}
                          </Button>
                          <Button
                            variant="contained"
                            onClick={handleSaveConfiguration}
                            disabled={isSavingConfig || isTestingConnection}
                            sx={{
                              backgroundColor: "#13715B",
                              textTransform: "none",
                              fontSize: "13px",
                              fontWeight: 500,
                              "&:hover": {
                                backgroundColor: "#0f5a47",
                              },
                              "&:disabled": {
                                backgroundColor: "#d0d5dd",
                              },
                            }}
                          >
                            {isSavingConfig ? "Saving..." : "Save Configuration"}
                          </Button>
                        </Box>
                      </>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Box>

      {/* Toast Notifications */}
      {toast && toast.visible && (
        <Alert
          variant={toast.variant}
          body={toast.body}
          isToast={true}
          onClick={handleCloseToast}
        />
      )}

      {/* Uninstall Confirmation Modal */}
      {isDeleteModalOpen && plugin && (
        <ConfirmationModal
          title="Confirm uninstall"
          body={
            <Typography fontSize={13}>
              Are you sure you want to uninstall {plugin.displayName}? This action cannot be undone.
            </Typography>
          }
          cancelText="Cancel"
          proceedText="Uninstall"
          onCancel={() => setIsDeleteModalOpen(false)}
          onProceed={handleConfirmUninstall}
          proceedButtonColor="error"
          proceedButtonVariant="contained"
        />
      )}
    </Stack>
  );
};

export default PluginManagement;
