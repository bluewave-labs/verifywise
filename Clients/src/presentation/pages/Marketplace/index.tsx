import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Stack,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  ArrowLeft,
  RefreshCw as RefreshIcon,
  Store as MarketplaceIcon,
  Search as SearchIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import PluginCard from "../../components/Cards/PluginCard";
import SearchBox from "../../components/Search/SearchBox";
import DualButtonModal from "../../components/Dialogs/DualButtonModal";
import {
  getMarketplacePlugins,
  refreshMarketplace,
  installFromMarketplace,
  MarketplacePlugin,
} from "../../../application/repository/marketplace.repository";
import { getAllPlugins, PluginDTO } from "../../../application/repository/plugin.repository";

interface AlertState {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
}

const PLUGINS_PER_PAGE = 12;

const TYPE_FILTERS = [
  { label: "All", value: "all" },
  { label: "Framework", value: "framework" },
  { label: "Integration", value: "integration" },
  { label: "Feature", value: "feature" },
  { label: "Reporting", value: "reporting" },
];

const Marketplace = () => {
  const navigate = useNavigate();
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

  const showAlert = useCallback(
    (variant: AlertState["variant"], title: string, body: string) => {
      setAlert({ variant, title, body });
    },
    []
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [marketplaceResponse, installedResponse] = await Promise.all([
        getMarketplacePlugins(),
        getAllPlugins(),
      ]);

      if (marketplaceResponse.success && marketplaceResponse.data) {
        setMarketplacePlugins(marketplaceResponse.data.plugins);
        setFromCache(marketplaceResponse.fromCache || false);
        setCacheAge(marketplaceResponse.cacheAge || null);
      } else {
        showAlert("error", "Error", marketplaceResponse.error || "Failed to load marketplace");
      }

      if (installedResponse.success) {
        setInstalledPlugins(installedResponse.data);
      }
    } catch {
      showAlert("error", "Error", "Failed to load marketplace data");
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [alert]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await refreshMarketplace();
      if (response.success && response.data) {
        setMarketplacePlugins(response.data.plugins);
        setFromCache(false);
        setCacheAge(null);
        showAlert("success", "Refreshed", "Marketplace data updated");
      } else {
        showAlert("error", "Error", response.error || "Failed to refresh");
      }
    } catch {
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
    <Stack
      sx={{
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        px: "24px",
        py: "24px",
      }}
    >
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={false}
          onClick={() => setAlert(null)}
        />
      )}

      {/* Header with back button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: "24px",
        }}
      >
        <Stack direction="row" alignItems="center" spacing="16px">
          <IconButton
            onClick={() => navigate("/settings/plugins")}
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
            <ArrowLeft size={16} />
          </IconButton>
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#000000" }}>
              Plugin marketplace
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#666666", mt: "4px" }}>
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
        </Stack>
      </Box>

      {/* Search and filters */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          mb: "24px",
          flexWrap: "wrap",
        }}
      >
        <SearchBox
          value={searchQuery}
          onChange={(value) => setSearchQuery(value)}
          placeholder="Search plugins..."
          sx={{ width: 280 }}
        />

        <Stack direction="row" spacing="8px">
          {TYPE_FILTERS.map((filter) => (
            <Chip
              key={filter.value}
              label={filter.label}
              onClick={() => setTypeFilter(filter.value)}
              sx={{
                height: 32,
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: typeFilter === filter.value ? "#13715B" : "transparent",
                color: typeFilter === filter.value ? "#FFFFFF" : "#344054",
                border: `1px solid ${typeFilter === filter.value ? "#13715B" : "#d0d5dd"}`,
                "&:hover": {
                  backgroundColor: typeFilter === filter.value ? "#0e5c47" : "#f5f5f5",
                },
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Content */}
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
            Unable to load marketplace
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#666666" }}>
            Check your connection and try again
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
                type={plugin.type}
                icon={plugin.icon}
                installed={isPluginInstalled(plugin.id)}
                enabled={false}
                isProcessing={isInstalling === plugin.id}
                variant="marketplace"
                onInstall={() => handleInstallClick(plugin)}
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
                mt: "32px",
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
    </Stack>
  );
};

export default Marketplace;
