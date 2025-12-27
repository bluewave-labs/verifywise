import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Navigate, useLocation } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  Chip,
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
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
} from "@mui/material";
import {
  ArrowLeft as ArrowLeftIcon,
  ExternalLink as ExternalLinkIcon,
  CheckCircle as CheckIcon,
  Settings as SettingsIcon,
  Home,
  Puzzle,
  SlidersHorizontal,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Send,
} from "lucide-react";
import PageBreadcrumbs from "../../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../../components/Layout/PageHeader";
import { getPluginByKey, getInstalledPlugins, updatePluginConfiguration, testPluginConnection, connectOAuthWorkspace, getOAuthWorkspaces, updateOAuthWorkspace, disconnectOAuthWorkspace } from "../../../../application/repository/plugin.repository";
import { usePluginInstallation } from "../../../../application/hooks/usePluginInstallation";
import { Plugin, PluginInstallationStatus } from "../../../../domain/types/plugins";
import Alert from "../../../components/Alert";
import { useAuth } from "../../../../application/hooks/useAuth";
import { cardStyles } from "../../../themes/components";
import ConfirmationModal from "../../../components/Dialogs/ConfirmationModal";
import { IBreadcrumbItem } from "../../../../domain/interfaces/i.breadcrumbs";
import { ENV_VARs } from "../../../../../env.vars";

const PluginManagement: React.FC = () => {
  const { pluginKey } = useParams<{ pluginKey: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { userRoleName } = useAuth();
  const { uninstall, uninstalling } = usePluginInstallation();
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

  // Slack OAuth state
  const [slackWorkspaces, setSlackWorkspaces] = useState<any[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [globalRoutingTypes, setGlobalRoutingTypes] = useState<string[]>([]);
  const [tablePage, setTablePage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isRoutingModalOpen, setIsRoutingModalOpen] = useState(false);

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

  // Fetch Slack workspaces
  const fetchSlackWorkspaces = useCallback(async () => {
    if (pluginKey !== "slack") return;

    try {
      setLoadingWorkspaces(true);
      const workspaces = await getOAuthWorkspaces({ pluginKey });
      setSlackWorkspaces(workspaces);
    } catch (error) {
      console.error("Failed to fetch Slack workspaces:", error);
    } finally {
      setLoadingWorkspaces(false);
    }
  }, [pluginKey]);

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
          // Remove code from URL
          navigate(`/plugins/${pluginKey}/manage`, { replace: true });
          // Refresh workspaces
          fetchSlackWorkspaces();
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
  }, [location.search, pluginKey, navigate, fetchSlackWorkspaces]);

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

        // Fetch Slack workspaces if this is Slack plugin
        if (pluginKey === "slack" && installation) {
          fetchSlackWorkspaces();
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
  }, [pluginKey, fetchSlackWorkspaces]);

  const handleUninstallClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmUninstall = useCallback(async () => {
    if (!plugin?.installationId) return;

    try {
      await uninstall(plugin.installationId);
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

  // Slack OAuth handlers
  const handleAddToSlack = () => {
    if (!pluginKey) return;

    const clientId = ENV_VARs.CLIENT_ID;
    const redirectUri = encodeURIComponent(`${window.location.origin}/plugins/${pluginKey}/manage`);
    const scope = encodeURIComponent("incoming-webhook,chat:write");

    const slackOAuthUrl = `${ENV_VARs.SLACK_URL}?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}`;
    window.open(slackOAuthUrl, '_blank', 'noopener,noreferrer');
  };

  const handleUpdateWorkspaceRouting = async (webhookId: number, routing_type: string[]) => {
    if (!pluginKey) return;

    try {
      await updateOAuthWorkspace({
        pluginKey,
        webhookId,
        routing_type,
      });

      setToast({
        variant: "success",
        body: "Notification routing updated successfully!",
        visible: true,
      });

      // Refresh workspaces
      fetchSlackWorkspaces();
    } catch (err: any) {
      setToast({
        variant: "error",
        body: err.message || "Failed to update routing settings.",
        visible: true,
      });
    }
  };

  const handleDisconnectWorkspace = async (webhookId: number) => {
    if (!pluginKey) return;

    try {
      await disconnectOAuthWorkspace({
        pluginKey,
        webhookId,
      });

      setToast({
        variant: "success",
        body: "Workspace disconnected successfully!",
        visible: true,
      });

      // Refresh workspaces
      fetchSlackWorkspaces();
    } catch (err: any) {
      setToast({
        variant: "error",
        body: err.message || "Failed to disconnect workspace.",
        visible: true,
      });
    }
  };

  const handleApplyGlobalRouting = async () => {
    if (!pluginKey || slackWorkspaces.length === 0) return;

    try {
      // Apply global routing to all workspaces
      await Promise.all(
        slackWorkspaces.map((workspace) =>
          updateOAuthWorkspace({
            pluginKey,
            webhookId: workspace.id,
            routing_type: globalRoutingTypes,
          })
        )
      );

      setToast({
        variant: "success",
        body: `Notification routing updated for all ${slackWorkspaces.length} workspace(s)!`,
        visible: true,
      });

      // Refresh workspaces
      fetchSlackWorkspaces();
    } catch (err: any) {
      setToast({
        variant: "error",
        body: err.message || "Failed to apply routing settings.",
        visible: true,
      });
    }
  };

  // Table handlers
  const handleChangePage = (_: unknown, newPage: number) => {
    setTablePage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setTablePage(0);
  };

  const handleToggleWorkspace = async (webhookId: number, isActive: boolean) => {
    if (!pluginKey) return;

    try {
      await updateOAuthWorkspace({
        pluginKey,
        webhookId,
        is_active: !isActive,
      });

      setToast({
        variant: "success",
        body: "Workspace status updated successfully!",
        visible: true,
      });

      fetchSlackWorkspaces();
    } catch (err: any) {
      setToast({
        variant: "error",
        body: err.message || "Failed to update workspace status.",
        visible: true,
      });
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
    } else if (pluginKey === "slack") {
      return [
        {
          key: "routing_type",
          label: "Notification Types",
          placeholder: "Select notification types",
          type: "multiselect",
          options: [
            { value: "Membership and roles", label: "Membership and roles" },
            { value: "Projects and organizations", label: "Projects and organizations" },
            { value: "Policy reminders and status", label: "Policy reminders and status" },
            { value: "Evidence and task alerts", label: "Evidence and task alerts" },
            { value: "Control or policy changes", label: "Control or policy changes" },
          ],
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
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                      <Typography variant="h5" fontWeight={600} fontSize={18}>
                        {plugin.displayName}
                      </Typography>
                      {plugin.installationStatus && (
                        <Chip
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
                            variant="outlined"
                            sx={{ fontSize: "11px", height: 24 }}
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
                {plugin.installationStatus === PluginInstallationStatus.INSTALLED && (
                  <>
                    <Divider />
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
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Configuration Card - Only show for installed plugins */}
          {plugin.installationStatus === PluginInstallationStatus.INSTALLED && (
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
                    {pluginKey === "slack" ? (
                      <Box>
                        <Typography variant="body2" color="text.secondary" fontSize={13} sx={{ mb: 3 }}>
                          Connect your Slack workspace and route VerifyWise notifications to specific channels.
                        </Typography>

                        {/* Action Buttons */}
                        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mb: 3 }}>
                          <a href="#" onClick={(e) => { e.preventDefault(); handleAddToSlack(); }}>
                            <img
                              alt="Add to Slack"
                              height="34"
                              width="120"
                              src="https://platform.slack-edge.com/img/add_to_slack.png"
                              srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                            />
                          </a>
                          <Button
                            variant="contained"
                            startIcon={<SlidersHorizontal size={18} />}
                            onClick={() => setIsRoutingModalOpen(true)}
                            disabled={slackWorkspaces.length === 0}
                            sx={{
                              height: "34px",
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
                            Configure
                          </Button>
                        </Stack>

                        {/* Workspaces Table */}
                        {loadingWorkspaces || connectingOAuth ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 4 }}>
                            <CircularProgress size={24} />
                            <Typography fontSize={13}>
                              {connectingOAuth ? "Connecting to Slack..." : "Loading workspaces..."}
                            </Typography>
                          </Box>
                        ) : (
                          <TableContainer sx={{ border: "1px solid #d0d5dd", borderRadius: "8px" }}>
                            <Table>
                              <TableHead sx={{ backgroundColor: "#f9fafb" }}>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600, fontSize: "12px", textTransform: "uppercase", color: "#475467" }}>
                                    Team Name
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 600, fontSize: "12px", textTransform: "uppercase", color: "#475467" }}>
                                    Channel
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 600, fontSize: "12px", textTransform: "uppercase", color: "#475467" }}>
                                    Creation Date
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 600, fontSize: "12px", textTransform: "uppercase", color: "#475467" }}>
                                    Active
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 600, fontSize: "12px", textTransform: "uppercase", color: "#475467" }}>
                                    Action
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {slackWorkspaces.length > 0 ? (
                                  slackWorkspaces
                                    .slice(tablePage * rowsPerPage, tablePage * rowsPerPage + rowsPerPage)
                                    .map((workspace) => (
                                      <TableRow key={workspace.id} sx={{ "&:hover": { backgroundColor: "#f9fafb" } }}>
                                        <TableCell sx={{ fontSize: "13px" }}>{workspace.team_name}</TableCell>
                                        <TableCell sx={{ fontSize: "13px" }}>#{workspace.channel}</TableCell>
                                        <TableCell sx={{ fontSize: "13px" }}>
                                          {workspace.created_at ? new Date(workspace.created_at).toLocaleDateString() : "-"}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: "13px" }}>
                                          {workspace.is_active ? "Yes" : "No"}
                                        </TableCell>
                                        <TableCell>
                                          <Stack direction="row" spacing={1}>
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              onClick={() => handleToggleWorkspace(workspace.id, workspace.is_active)}
                                              sx={{
                                                minWidth: "auto",
                                                px: 1,
                                                fontSize: "12px",
                                                textTransform: "none",
                                                borderColor: "#d0d5dd",
                                                color: "#344054",
                                              }}
                                              title={workspace.is_active ? "Disable" : "Enable"}
                                            >
                                              {workspace.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                            </Button>
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              color="error"
                                              onClick={() => handleDisconnectWorkspace(workspace.id)}
                                              sx={{
                                                minWidth: "auto",
                                                px: 1,
                                                fontSize: "12px",
                                                textTransform: "none",
                                              }}
                                              title="Delete"
                                            >
                                              <Trash2 size={16} />
                                            </Button>
                                          </Stack>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                      <Typography fontSize={13} color="text.secondary">
                                        No workspaces connected yet. Click "Add to Slack" above to connect.
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                              {slackWorkspaces.length > 5 && (
                                <TableFooter>
                                  <TableRow>
                                    <TablePagination
                                      count={slackWorkspaces.length}
                                      page={tablePage}
                                      onPageChange={handleChangePage}
                                      rowsPerPage={rowsPerPage}
                                      rowsPerPageOptions={[5, 10, 15, 25]}
                                      onRowsPerPageChange={handleChangeRowsPerPage}
                                      labelRowsPerPage="Rows per page"
                                      sx={{ fontSize: "13px" }}
                                    />
                                  </TableRow>
                                </TableFooter>
                              )}
                            </Table>
                          </TableContainer>
                        )}

                        {/* Notification Routing Modal - Placeholder */}
                        {isRoutingModalOpen && (
                          <Box
                            sx={{
                              position: "fixed",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: "rgba(0, 0, 0, 0.5)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 9999,
                            }}
                            onClick={() => setIsRoutingModalOpen(false)}
                          >
                            <Box
                              sx={{
                                backgroundColor: "white",
                                borderRadius: "8px",
                                p: 3,
                                maxWidth: "600px",
                                width: "90%",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Typography variant="h6" fontWeight={600} fontSize={16} sx={{ mb: 2 }}>
                                Notification Routing
                              </Typography>
                              <Typography variant="body2" color="text.secondary" fontSize={13} sx={{ mb: 3 }}>
                                Configure which notification types go to which Slack channels.
                              </Typography>

                              {/* Global Routing Configuration */}
                              <Stack spacing={2} sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" fontWeight={500} fontSize={13}>
                                  Apply to all workspaces:
                                </Typography>
                                <FormControl fullWidth size="small">
                                  <Select
                                    multiple
                                    value={globalRoutingTypes}
                                    onChange={(e) => {
                                      const value = typeof e.target.value === 'string' ?
                                        e.target.value.split(',') :
                                        e.target.value;
                                      setGlobalRoutingTypes(value);
                                    }}
                                    renderValue={(selected) =>
                                      (selected as string[]).length === 0
                                        ? "Select notification types..."
                                        : `${(selected as string[]).length} type(s) selected`
                                    }
                                    displayEmpty
                                    sx={{ fontSize: "13px" }}
                                  >
                                    {[
                                      "Membership and roles",
                                      "Projects and organizations",
                                      "Policy reminders and status",
                                      "Evidence and task alerts",
                                      "Control or policy changes",
                                    ].map((option) => (
                                      <MenuItem key={option} value={option} sx={{ fontSize: "13px" }}>
                                        <Checkbox
                                          checked={globalRoutingTypes.indexOf(option) > -1}
                                          sx={{
                                            color: "#13715B",
                                            "&.Mui-checked": { color: "#13715B" },
                                          }}
                                        />
                                        <Typography fontSize={13}>{option}</Typography>
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Stack>

                              <Stack direction="row" spacing={2} justifyContent="flex-end">
                                <Button
                                  variant="outlined"
                                  onClick={() => setIsRoutingModalOpen(false)}
                                  sx={{ textTransform: "none", fontSize: "13px" }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="contained"
                                  onClick={() => {
                                    handleApplyGlobalRouting();
                                    setIsRoutingModalOpen(false);
                                  }}
                                  disabled={globalRoutingTypes.length === 0}
                                  sx={{
                                    backgroundColor: "#13715B",
                                    textTransform: "none",
                                    fontSize: "13px",
                                    "&:hover": { backgroundColor: "#0f5a47" },
                                  }}
                                >
                                  Save Changes
                                </Button>
                              </Stack>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" fontSize={13} sx={{ mb: 3 }}>
                        Configure {plugin.displayName} settings and preferences.
                      </Typography>
                    )}

                    {/* Configuration Form (hide for Slack) */}
                    {pluginKey !== "slack" && (
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
                    )}

                    {/* Test Connection and Save Buttons (hide for Slack) */}
                    {pluginKey !== "slack" && (
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
                      {pluginKey === "mlflow" && (
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
                      )}
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
