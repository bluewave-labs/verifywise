import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Stack,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import {
  Puzzle as PluginIcon,
  RefreshCw as RefreshIcon,
  Upload as UploadIcon,
  ChevronLeft,
  ChevronRight,
  Store as MarketplaceIcon,
} from "lucide-react";
import MarketplaceModal from "../../../components/Modals/MarketplaceModal";
import Alert from "../../../components/Alert";
import PluginCard from "../../../components/Cards/PluginCard";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import PluginDetailsModal from "../../../components/Modals/PluginDetailsModal";
import DualButtonModal from "../../../components/Dialogs/DualButtonModal";
import TabBar from "../../../components/TabBar";
import {
  getAllPlugins,
  installPlugin,
  uninstallPlugin,
  enablePlugin,
  disablePlugin,
  uploadPlugin,
  PluginDTO,
} from "../../../../application/repository/plugin.repository";
import { useRefreshPluginExtensions } from "../../../../application/contexts/PluginExtensions.context";

interface AlertState {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
}

const PLUGINS_PER_PAGE = 12; // 3 columns x 4 rows

const Plugins = () => {
  // Refresh plugin UI extensions when plugins are enabled/disabled
  const refreshPluginExtensions = useRefreshPluginExtensions();

  const [plugins, setPlugins] = useState<PluginDTO[]>([]);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginDTO | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "enabled" | "disabled">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: "install" | "enable" | "disable" | "uninstall";
    pluginId: string;
    pluginName: string;
  } | null>(null);

  const showAlert = useCallback(
    (variant: AlertState["variant"], title: string, body: string) => {
      setAlert({ variant, title, body });
    },
    []
  );

  const fetchPlugins = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAllPlugins();
      if (response.success) {
        setPlugins(response.data);
      }
    } catch {
      showAlert("error", "Error", "Failed to fetch plugins");
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [alert]);

  // Filter plugins based on tab
  const filteredPlugins = useMemo(() => {
    if (activeTab === "enabled") {
      return plugins.filter((plugin) => plugin.enabled);
    } else if (activeTab === "disabled") {
      return plugins.filter((plugin) => !plugin.enabled && plugin.installed);
    }
    return plugins;
  }, [plugins, activeTab]);

  // Reset to first page when tab changes
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

  // Paginated plugins
  const paginatedPlugins = useMemo(() => {
    const startIndex = currentPage * PLUGINS_PER_PAGE;
    return filteredPlugins.slice(startIndex, startIndex + PLUGINS_PER_PAGE);
  }, [filteredPlugins, currentPage]);

  const totalPages = Math.ceil(filteredPlugins.length / PLUGINS_PER_PAGE);

  // Calculate counts for tabs
  const tabCounts = useMemo(() => ({
    all: plugins.length,
    enabled: plugins.filter((p) => p.enabled).length,
    disabled: plugins.filter((p) => !p.enabled && p.installed).length,
  }), [plugins]);

  const handleInstall = (pluginId: string) => {
    const plugin = plugins.find((p) => p.id === pluginId);
    if (plugin) {
      // Use "enable" for built-in plugins, "install" for marketplace plugins
      const actionType = plugin.isBuiltin ? "enable" : "install";
      setPendingAction({ type: actionType, pluginId, pluginName: plugin.name });
    }
  };

  const handleUninstall = (pluginId: string) => {
    const plugin = plugins.find((p) => p.id === pluginId);
    if (plugin) {
      setPendingAction({ type: "uninstall", pluginId, pluginName: plugin.name });
    }
  };

  const handleToggleEnabled = (pluginId: string) => {
    const plugin = plugins.find((p) => p.id === pluginId);
    if (!plugin) return;

    setPendingAction({
      type: plugin.enabled ? "disable" : "enable",
      pluginId,
      pluginName: plugin.name,
    });
  };

  const executeAction = async () => {
    if (!pendingAction) return;

    const { type, pluginId } = pendingAction;
    setPendingAction(null);
    setActionInProgress(pluginId);

    try {
      let response;
      if (type === "install") {
        response = await installPlugin(pluginId);
      } else if (type === "uninstall") {
        response = await uninstallPlugin(pluginId);
      } else if (type === "enable") {
        response = await enablePlugin(pluginId);
      } else {
        response = await disablePlugin(pluginId);
      }

      if (response.success) {
        const actionWord = type === "install" ? "installed" : type === "uninstall" ? "uninstalled" : type === "enable" ? "enabled" : "disabled";
        showAlert("success", "Success", response.message || `Plugin ${actionWord}`);
        fetchPlugins();
        // Refresh plugin UI extensions so dashboard widgets update
        refreshPluginExtensions();
      } else {
        showAlert("error", "Error", response.error || `Failed to ${type} plugin`);
      }
    } catch {
      showAlert("error", "Error", `Failed to ${type} plugin`);
    } finally {
      setActionInProgress(null);
    }
  };

  const cancelAction = () => {
    setPendingAction(null);
  };

  const handleConfigure = (pluginId: string) => {
    const plugin = plugins.find((p) => p.id === pluginId);
    if (plugin) {
      setSelectedPlugin(plugin);
      setIsDetailsModalOpen(true);
    }
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedPlugin(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".zip")) {
      showAlert("error", "Invalid file", "Please upload a .zip plugin package");
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await uploadPlugin(file);
      if (response.success) {
        showAlert(
          "success",
          "Success",
          response.message || `Plugin "${response.data?.name}" uploaded successfully`
        );
        // Refresh the plugin list
        fetchPlugins();
      } else {
        const errorMessage = response.validationErrors
          ? `${response.error}: ${response.validationErrors.join(", ")}`
          : response.error || "Failed to upload plugin";
        showAlert("error", "Upload failed", errorMessage);
      }
    } catch (error) {
      showAlert(
        "error",
        "Error",
        error instanceof Error ? error.message : "Failed to upload plugin"
      );
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <Stack sx={{ mt: "24px", width: "100%" }}>
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={false}
          onClick={() => setAlert(null)}
        />
      )}

      {/* Hidden file input for upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".zip"
        style={{ display: "none" }}
      />

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: "16px",
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#000000" }}>
            Plugin management
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#666666", mt: "4px" }}>
            Manage installed plugins and extensions
          </Typography>
        </Box>
        <Stack direction="row" spacing="8px">
          <Tooltip title="Refresh">
            <IconButton
              onClick={fetchPlugins}
              disabled={isLoading}
              size="small"
              disableRipple
              sx={{
                width: 32,
                height: 32,
                borderRadius: "4px",
                backgroundColor: "transparent",
                color: "#666",
                border: "1px solid #d0d5dd",
                transition: "all 0.2s ease",
                "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)", borderColor: "#98a2b3" },
              }}
            >
              <RefreshIcon size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Upload plugin">
            <IconButton
              onClick={handleUploadClick}
              disabled={isLoading}
              size="small"
              disableRipple
              sx={{
                width: 32,
                height: 32,
                borderRadius: "4px",
                backgroundColor: "transparent",
                color: "#666",
                border: "1px solid #d0d5dd",
                transition: "all 0.2s ease",
                "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)", borderColor: "#98a2b3" },
              }}
            >
              <UploadIcon size={16} />
            </IconButton>
          </Tooltip>
          <CustomizableButton
            variant="contained"
            text="Browse marketplace"
            icon={<MarketplaceIcon size={14} />}
            onClick={() => setIsMarketplaceOpen(true)}
            sx={{
              height: 34,
              fontSize: 13,
              backgroundColor: "#13715B",
              "&:hover": { backgroundColor: "#0e5c47" },
            }}
          />
        </Stack>
      </Box>

      {/* Tab bar */}
      <TabContext value={activeTab}>
        <TabBar
          tabs={[
            { label: "All", value: "all", icon: "Layers", count: tabCounts.all },
            { label: "Enabled", value: "enabled", icon: "CheckCircle", count: tabCounts.enabled },
            { label: "Disabled", value: "disabled", icon: "XCircle", count: tabCounts.disabled },
          ]}
          activeTab={activeTab}
          onChange={(_e, value) => setActiveTab(value as "all" | "enabled" | "disabled")}
        />
      </TabContext>

      <Box sx={{ mt: "16px" }}>
      {isLoading && plugins.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: "32px" }}>
          <CircularProgress size={32} sx={{ color: "#13715B" }} />
        </Box>
      ) : plugins.length === 0 ? (
        <Box
          sx={{
            border: "2px dashed #d0d5dd",
            borderRadius: "4px",
            p: "48px",
            textAlign: "center",
            backgroundColor: "#fafafa",
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "#f0fdf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              mb: "16px",
            }}
          >
            <PluginIcon size={24} color="#13715B" />
          </Box>
          <Typography
            sx={{ fontSize: 15, fontWeight: 600, color: "#000000", mb: "8px" }}
          >
            No plugins available
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#666666", mb: "24px" }}>
            Plugins will appear here when registered
          </Typography>
          <CustomizableButton
            variant="outlined"
            text="Upload plugin"
            icon={<UploadIcon size={16} />}
            onClick={handleUploadClick}
            sx={{
              height: 34,
              fontSize: 13,
              borderColor: "#13715B",
              color: "#13715B",
              "&:hover": {
                borderColor: "#0e5c47",
                backgroundColor: "rgba(19, 113, 91, 0.04)",
              },
            }}
          />
        </Box>
      ) : filteredPlugins.length === 0 ? (
        <Box
          sx={{
            border: "1px solid #d0d5dd",
            borderRadius: "4px",
            p: "48px",
            textAlign: "center",
            backgroundColor: "#fafafa",
          }}
        >
          <Typography
            sx={{ fontSize: 15, fontWeight: 600, color: "#000000", mb: "8px" }}
          >
            No {activeTab === "all" ? "" : activeTab} plugins
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#666666" }}>
            Upload a plugin or browse the Plugin Marketplace
          </Typography>
        </Box>
      ) : (
        <>
          {/* Plugin grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
            }}
          >
            {paginatedPlugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                id={plugin.id}
                name={plugin.name}
                description={plugin.description}
                version={plugin.version}
                author={plugin.author}
                authorUrl={plugin.authorUrl}
                type={plugin.type}
                icon={plugin.icon}
                installed={plugin.installed}
                enabled={plugin.enabled}
                isBuiltin={plugin.isBuiltin}
                isProcessing={actionInProgress === plugin.id}
                onInstall={handleInstall}
                onUninstall={handleUninstall}
                onToggleEnabled={handleToggleEnabled}
                onConfigure={handleConfigure}
              />
            ))}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: "24px",
                pt: "16px",
                borderTop: "1px solid #d0d5dd",
              }}
            >
              <Typography sx={{ fontSize: 13, color: "#666666" }}>
                Showing {currentPage * PLUGINS_PER_PAGE + 1}-
                {Math.min(
                  (currentPage + 1) * PLUGINS_PER_PAGE,
                  filteredPlugins.length
                )}{" "}
                of {filteredPlugins.length} plugins
              </Typography>
              <Stack direction="row" spacing="8px" alignItems="center">
                <IconButton
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  size="small"
                  disableRipple
                  sx={{
                    border: "1px solid #d0d5dd",
                    borderRadius: "4px",
                    width: 32,
                    height: 32,
                    color: currentPage === 0 ? "#d0d5dd" : "#344054",
                    "&:hover": {
                      backgroundColor: "#F9FAFB",
                    },
                    "&.Mui-disabled": {
                      color: "#d0d5dd",
                    },
                  }}
                >
                  <ChevronLeft size={18} />
                </IconButton>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "#344054",
                    minWidth: 80,
                    textAlign: "center",
                  }}
                >
                  Page {currentPage + 1} of {totalPages}
                </Typography>
                <IconButton
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages - 1}
                  size="small"
                  disableRipple
                  sx={{
                    border: "1px solid #d0d5dd",
                    borderRadius: "4px",
                    width: 32,
                    height: 32,
                    color: currentPage >= totalPages - 1 ? "#d0d5dd" : "#344054",
                    "&:hover": {
                      backgroundColor: "#F9FAFB",
                    },
                    "&.Mui-disabled": {
                      color: "#d0d5dd",
                    },
                  }}
                >
                  <ChevronRight size={18} />
                </IconButton>
              </Stack>
            </Box>
          )}
        </>
      )}
      </Box>

      {/* Plugin Details Modal */}
      <PluginDetailsModal
        plugin={selectedPlugin}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
      />

      {/* Confirmation Modal */}
      <DualButtonModal
        title={
          pendingAction?.type === "install"
            ? "Install plugin"
            : pendingAction?.type === "uninstall"
            ? "Uninstall plugin"
            : pendingAction?.type === "enable"
            ? "Enable plugin"
            : "Disable plugin"
        }
        body={
          pendingAction?.type === "install"
            ? `Are you sure you want to install "${pendingAction?.pluginName}"?`
            : pendingAction?.type === "uninstall" ? (
            <>
              Are you sure you want to uninstall "{pendingAction?.pluginName}"? This will remove the plugin and all its data.
              <br /><br />
              This action cannot be undone.
            </>
          ) : pendingAction?.type === "enable"
            ? `Are you sure you want to enable "${pendingAction?.pluginName}"?`
            : `Are you sure you want to disable "${pendingAction?.pluginName}"?`
        }
        cancelText="Cancel"
        proceedText={
          pendingAction?.type === "install"
            ? "Install"
            : pendingAction?.type === "uninstall"
            ? "Uninstall"
            : pendingAction?.type === "enable"
            ? "Enable"
            : "Disable"
        }
        onCancel={cancelAction}
        onProceed={executeAction}
        isOpen={pendingAction !== null}
        proceedButtonColor={pendingAction?.type === "uninstall" ? "error" : "primary"}
        proceedButtonVariant="contained"
      />

      {/* Marketplace Modal */}
      <MarketplaceModal
        isOpen={isMarketplaceOpen}
        onClose={() => setIsMarketplaceOpen(false)}
        onInstallComplete={fetchPlugins}
      />
    </Stack>
  );
};

export default Plugins;
