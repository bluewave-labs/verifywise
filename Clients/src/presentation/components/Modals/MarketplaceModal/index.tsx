import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Stack,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
} from "@mui/material";
import {
  RefreshCw as RefreshIcon,
  Store as MarketplaceIcon,
  Search as SearchIcon,
  X as CloseIcon,
} from "lucide-react";
import Alert from "../../Alert";
import PluginCard from "../../Cards/PluginCard";
import SearchBox from "../../Search/SearchBox";
import DualButtonModal from "../../Dialogs/DualButtonModal";
import ButtonToggle from "../../ButtonToggle";
import PluginDetailsModal from "../PluginDetailsModal";
import {
  getMarketplacePlugins,
  refreshMarketplace,
  installFromMarketplace,
  MarketplacePlugin,
} from "../../../../application/repository/marketplace.repository";
import { getAllPlugins, PluginDTO } from "../../../../application/repository/plugin.repository";

interface AlertState {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
}

interface MarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallComplete?: () => void;
}

const PLUGINS_PER_PAGE = 9;

const TYPE_FILTERS = [
  { label: "All", value: "all" },
  { label: "Framework", value: "framework" },
  { label: "Integration", value: "integration" },
  { label: "Feature", value: "feature" },
  { label: "Reporting", value: "reporting" },
];

const MarketplaceModal = ({ isOpen, onClose, onInstallComplete }: MarketplaceModalProps) => {
  const [marketplacePlugins, setMarketplacePlugins] = useState<MarketplacePlugin[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<PluginDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInstalling, setIsInstalling] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [cacheAge, setCacheAge] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [pendingInstall, setPendingInstall] = useState<MarketplacePlugin | null>(null);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginDTO | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const showAlert = useCallback(
    (variant: AlertState["variant"], title: string, body: string) => {
      setAlert({ variant, title, body });
    },
    []
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled([
        getMarketplacePlugins(),
        getAllPlugins(),
      ]);

      const [marketplaceResult, installedResult] = results;

      // Handle marketplace response
      if (marketplaceResult.status === "fulfilled") {
        const marketplaceResponse = marketplaceResult.value;
        if (marketplaceResponse.success && marketplaceResponse.data) {
          setMarketplacePlugins(marketplaceResponse.data.plugins);
          setFromCache(marketplaceResponse.fromCache || false);
          setCacheAge(marketplaceResponse.cacheAge || null);
        } else {
          showAlert("error", "Error", marketplaceResponse.error || "Failed to load marketplace");
        }
      } else {
        console.error("Marketplace fetch failed:", marketplaceResult.reason);
        showAlert("error", "Error", "Failed to connect to marketplace");
      }

      // Handle installed plugins response
      if (installedResult.status === "fulfilled") {
        const installedResponse = installedResult.value;
        if (installedResponse.success) {
          setInstalledPlugins(installedResponse.data);
        }
      } else {
        console.error("Installed plugins fetch failed:", installedResult.reason);
        // Don't show error - marketplace is still usable without installed list
      }
    } catch (error) {
      console.error("Unexpected error in fetchData:", error);
      showAlert("error", "Error", "Failed to load marketplace data");
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled([
        refreshMarketplace(),
        getAllPlugins(),
      ]);

      const [marketplaceResult, installedResult] = results;
      let marketplaceSuccess = false;

      // Handle marketplace response
      if (marketplaceResult.status === "fulfilled") {
        const marketplaceResponse = marketplaceResult.value;
        if (marketplaceResponse.success && marketplaceResponse.data) {
          setMarketplacePlugins(marketplaceResponse.data.plugins);
          setFromCache(false);
          setCacheAge(null);
          marketplaceSuccess = true;
        } else {
          showAlert("error", "Error", marketplaceResponse.error || "Failed to refresh");
        }
      } else {
        console.error("Marketplace refresh failed:", marketplaceResult.reason);
        showAlert("error", "Error", "Failed to connect to marketplace");
      }

      // Handle installed plugins response
      if (installedResult.status === "fulfilled") {
        const installedResponse = installedResult.value;
        if (installedResponse.success) {
          setInstalledPlugins(installedResponse.data);
        }
      } else {
        console.error("Installed plugins refresh failed:", installedResult.reason);
        // Don't show error - marketplace refresh is the primary operation
      }

      if (marketplaceSuccess) {
        showAlert("success", "Refreshed", "Marketplace data updated");
      }
    } catch (error) {
      console.error("Unexpected error in handleRefresh:", error);
      showAlert("error", "Error", "Failed to refresh marketplace");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInstallClick = (plugin: MarketplacePlugin) => {
    setPendingInstall(plugin);
  };

  const handleInstallConfirm = async () => {
    if (!pendingInstall) return;

    const plugin = pendingInstall;
    setPendingInstall(null);
    setIsInstalling(plugin.id);

    try {
      const response = await installFromMarketplace(plugin);
      if (response.success) {
        showAlert("success", "Installed", `${plugin.name} installed successfully`);
        // Refresh installed plugins list
        const installedResponse = await getAllPlugins();
        if (installedResponse.success) {
          setInstalledPlugins(installedResponse.data);
        }
        onInstallComplete?.();
      } else {
        showAlert("error", "Error", response.error || "Failed to install plugin");
      }
    } catch {
      showAlert("error", "Error", "Failed to install plugin");
    } finally {
      setIsInstalling(null);
    }
  };

  const handleInstallCancel = () => {
    setPendingInstall(null);
  };

  const handleViewDetails = (pluginId: string) => {
    const plugin = marketplacePlugins.find((p) => p.id === pluginId);
    if (plugin) {
      // Convert MarketplacePlugin to PluginDTO format for the modal
      const pluginDTO: PluginDTO = {
        id: plugin.id,
        name: plugin.name,
        description: plugin.description,
        version: plugin.version,
        author: plugin.author.name,
        authorUrl: plugin.author.url,
        type: plugin.type,
        icon: plugin.icon,
        installed: isPluginInstalled(plugin.id),
        enabled: false,
        isBuiltin: false,
        permissions: plugin.permissions || [],
        config: {},
      };
      setSelectedPlugin(pluginDTO);
      setIsDetailsOpen(true);
    }
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedPlugin(null);
  };

  // Check if a plugin is already installed
  const isPluginInstalled = useCallback(
    (pluginId: string) => {
      return installedPlugins.some((p) => p.id === pluginId);
    },
    [installedPlugins]
  );

  // Filter plugins based on search and type
  const filteredPlugins = useMemo(() => {
    let result = marketplacePlugins;

    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter((p) => p.type === typeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return result;
  }, [marketplacePlugins, typeFilter, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [typeFilter, searchQuery]);

  // Paginate
  const paginatedPlugins = useMemo(() => {
    const start = currentPage * PLUGINS_PER_PAGE;
    return filteredPlugins.slice(start, start + PLUGINS_PER_PAGE);
  }, [filteredPlugins, currentPage]);

  const totalPages = Math.ceil(filteredPlugins.length / PLUGINS_PER_PAGE);

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: "90vw",
            maxWidth: 1200,
            height: "85vh",
            maxHeight: 800,
            borderRadius: "4px",
          },
        }}
      >
        <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", height: "100%" }}>
          {alert && (
            <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 1 }}>
              <Alert
                variant={alert.variant}
                title={alert.title}
                body={alert.body}
                isToast={false}
                onClick={() => setAlert(null)}
              />
            </Box>
          )}

          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: "24px",
              borderBottom: "1px solid #d0d5dd",
            }}
          >
            <Stack direction="row" alignItems="center" spacing="16px">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "4px",
                  backgroundColor: "#f0fdf4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MarketplaceIcon size={20} color="#13715B" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#000000" }}>
                  Plugin marketplace
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#666666", mt: "2px" }}>
                  Discover and install plugins to extend VerifyWise
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing="12px">
              {fromCache && cacheAge && (
                <Typography sx={{ fontSize: 12, color: "#999999" }}>
                  Last updated: {cacheAge}
                </Typography>
              )}
              <Tooltip title="Refresh">
                <IconButton
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  size="small"
                  disableRipple
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "4px",
                    backgroundColor: "transparent",
                    color: "#666",
                    border: "1px solid #d0d5dd",
                    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                  }}
                >
                  <RefreshIcon size={16} className={isRefreshing ? "animate-spin" : ""} />
                </IconButton>
              </Tooltip>
              <IconButton
                onClick={onClose}
                size="small"
                disableRipple
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "4px",
                  backgroundColor: "transparent",
                  color: "#666",
                  "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                }}
              >
                <CloseIcon size={18} />
              </IconButton>
            </Stack>
          </Box>

          {/* Search and filters */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              p: "16px 24px",
              borderBottom: "1px solid #d0d5dd",
              flexWrap: "wrap",
            }}
          >
            <SearchBox
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
              placeholder="Search plugins..."
              sx={{ width: 280 }}
            />

            <ButtonToggle
              options={TYPE_FILTERS}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value)}
              height={34}
            />
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: "auto", p: "24px" }}>
            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: "64px" }}>
                <CircularProgress size={32} sx={{ color: "#13715B" }} />
              </Box>
            ) : marketplacePlugins.length === 0 ? (
              <Box
                sx={{
                  border: "2px dashed #d0d5dd",
                  borderRadius: "4px",
                  p: "64px",
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
                  <MarketplaceIcon size={24} color="#13715B" />
                </Box>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#000000", mb: "8px" }}>
                  Marketplace coming soon
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#666666" }}>
                  The plugin marketplace is not available yet. Check back later for official plugins.
                </Typography>
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
                <SearchIcon size={24} color="#999999" style={{ marginBottom: 16 }} />
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#000000", mb: "8px" }}>
                  No plugins found
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#666666" }}>
                  Try adjusting your search or filters
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
                      author={plugin.author.name}
                      authorUrl={plugin.author.url}
                      type={plugin.type}
                      icon={plugin.icon}
                      installed={isPluginInstalled(plugin.id)}
                      enabled={false}
                      isProcessing={isInstalling === plugin.id}
                      variant="marketplace"
                      onInstall={() => handleInstallClick(plugin)}
                      onConfigure={handleViewDetails}
                    />
                  ))}
                </Box>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      mt: "24px",
                      gap: "8px",
                    }}
                  >
                    {Array.from({ length: totalPages }, (_, i) => (
                      <Box
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: currentPage === i ? 600 : 400,
                          backgroundColor: currentPage === i ? "#13715B" : "transparent",
                          color: currentPage === i ? "#FFFFFF" : "#344054",
                          border: `1px solid ${currentPage === i ? "#13715B" : "#d0d5dd"}`,
                          "&:hover": {
                            backgroundColor: currentPage === i ? "#0e5c47" : "#f5f5f5",
                          },
                        }}
                      >
                        {i + 1}
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Install confirmation modal */}
      <DualButtonModal
        title="Install plugin"
        body={
          pendingInstall ? (
            <>
              Are you sure you want to install "{pendingInstall.name}" v{pendingInstall.version}?
              {pendingInstall.permissions && pendingInstall.permissions.length > 0 && (
                <>
                  <br /><br />
                  <strong>Required permissions:</strong>
                  <br />
                  {pendingInstall.permissions.join(", ")}
                </>
              )}
            </>
          ) : ""
        }
        cancelText="Cancel"
        proceedText="Install"
        onCancel={handleInstallCancel}
        onProceed={handleInstallConfirm}
        isOpen={pendingInstall !== null}
        proceedButtonColor="primary"
        proceedButtonVariant="contained"
      />

      {/* Plugin Details Modal */}
      <PluginDetailsModal
        plugin={selectedPlugin}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
      />
    </>
  );
};

export default MarketplaceModal;
