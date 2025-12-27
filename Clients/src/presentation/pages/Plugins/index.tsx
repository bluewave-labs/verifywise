import React, { useState, useCallback, useMemo, Suspense } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Box, Stack, TextField, InputAdornment, Chip } from "@mui/material";
import { TabContext, TabPanel } from "@mui/lab";
import { Search as SearchIcon, Home, Puzzle } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import TabBar from "../../components/TabBar";
import PluginCard from "../../components/PluginCard";
import { usePlugins } from "../../../application/hooks/usePlugins";
import { usePluginInstallation } from "../../../application/hooks/usePluginInstallation";
import { Plugin, PluginInstallationStatus } from "../../../domain/types/plugins";
import Alert from "../../components/Alert";
import { useAuth } from "../../../application/hooks/useAuth";
import { IBreadcrumbItem } from "../../../domain/interfaces/i.breadcrumbs";

const Plugins: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRoleName } = useAuth();

  // Determine initial tab from URL
  const initialTab = location.pathname.includes("/my-plugins") ? "my-plugins" : "marketplace";

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab);
  const { plugins, loading, refetch } = usePlugins(selectedCategory);
  const { install, uninstall, installing, uninstalling } = usePluginInstallation();
  const [toast, setToast] = useState<{
    variant: "success" | "info" | "warning" | "error";
    body: string;
    visible: boolean;
  } | null>(null);

  const isAdmin = userRoleName === "Admin";

  // Custom breadcrumb items
  const breadcrumbItems: IBreadcrumbItem[] = useMemo(() => [
    {
      label: "Dashboard",
      path: "/",
      icon: <Home size={14} strokeWidth={1.5} />,
    },
    {
      label: "Plugins",
      path: "/plugins",
      disabled: true,
      icon: <Puzzle size={14} strokeWidth={1.5} />,
    },
  ], []);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      setActiveTab(newValue);
    },
    []
  );

  // Filter plugins by search query
  const filteredPlugins = useMemo(() => {
    if (!searchQuery) return plugins;
    const lowerQuery = searchQuery.toLowerCase();
    return plugins.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }, [plugins, searchQuery]);

  // Filter to show only installed plugins
  const installedPlugins = useMemo(
    () => plugins.filter((p) => p.installationStatus === PluginInstallationStatus.INSTALLED),
    [plugins]
  );

  // Plugin categories
  const categories = [
    { id: "all", name: "All Plugins" },
    { id: "communication", name: "Communication" },
    { id: "ml_ops", name: "ML Operations" },
    { id: "version_control", name: "Version Control" },
    { id: "monitoring", name: "Monitoring" },
    { id: "security", name: "Security" },
  ];

  // Handle plugin installation
  const handleInstall = useCallback(
    async (pluginKey: string) => {
      try {
        await install(pluginKey);
        setToast({
          variant: "success",
          body: "Plugin installed successfully!",
          visible: true,
        });
        // Refetch plugins to update installation status
        refetch();
      } catch (err: any) {
        setToast({
          variant: "error",
          body: err.message || "Failed to install plugin. Please try again.",
          visible: true,
        });
      }
    },
    [install, refetch]
  );

  // Handle plugin uninstallation
  const handleUninstall = useCallback(
    async (installationId: number) => {
      try {
        await uninstall(installationId);
        setToast({
          variant: "success",
          body: "Plugin uninstalled successfully!",
          visible: true,
        });
        // Refetch plugins to update the list
        refetch();
      } catch (err: any) {
        setToast({
          variant: "error",
          body: err.message || "Failed to uninstall plugin. Please try again.",
          visible: true,
        });
      }
    },
    [uninstall, refetch]
  );

  // Handle plugin management
  const handleManage = useCallback(
    (plugin: Plugin) => {
      // Navigate to plugin management
      navigate(`/plugins/${plugin.key}/manage`);
    },
    [navigate]
  );

  // Close toast
  const handleCloseToast = () => {
    setToast(null);
  };

  // Auto-hide toast after 3 seconds
  React.useEffect(() => {
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

  return (
    <Stack className="vwhome" gap="16px">
      <PageBreadcrumbs items={breadcrumbItems} autoGenerate={false} />

      <PageHeader
        title="Plugins"
        description="Discover and manage plugins to extend VerifyWise functionality"
      />

      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: "#d0d5dd" }}>
          <TabBar
            tabs={[
              { label: "Marketplace", value: "marketplace", icon: "Store" },
              {
                label: "My Plugins",
                value: "my-plugins",
                icon: "Package",
                count: installedPlugins.length,
              },
            ]}
            activeTab={activeTab}
            onChange={handleTabChange}
          />
        </Box>

        {/* Marketplace Tab */}
        <TabPanel value="marketplace" sx={{ p: 0, pt: 2 }}>
          <Stack gap={2} sx={{ px: 2 }}>
            {/* Search Bar */}
            <TextField
              fullWidth
              placeholder="Search plugins by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon size={20} />
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: 600,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                },
              }}
            />

            {/* Category Filter */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {categories.map((category) => {
                const isSelected =
                  (category.id === "all" && !selectedCategory) ||
                  selectedCategory === category.id;
                return (
                  <Chip
                    key={category.id}
                    label={category.name}
                    onClick={() =>
                      setSelectedCategory(
                        category.id === "all" ? undefined : category.id
                      )
                    }
                    sx={{
                      cursor: "pointer",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: isSelected ? 500 : 400,
                      backgroundColor: isSelected
                        ? "rgba(19, 113, 91, 0.1)"
                        : "transparent",
                      color: isSelected ? "#13715B" : "#344054",
                      border: `1px solid ${isSelected ? "#13715B" : "#d0d5dd"}`,
                      "&:hover": {
                        backgroundColor: isSelected
                          ? "rgba(19, 113, 91, 0.15)"
                          : "rgba(0, 0, 0, 0.04)",
                        borderColor: isSelected ? "#13715B" : "#344054",
                      },
                    }}
                  />
                );
              })}
            </Box>

            {/* Plugin Cards Grid */}
            {loading ? (
              <Box sx={{ textAlign: "center", py: 4 }}>Loading plugins...</Box>
            ) : filteredPlugins.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                No plugins found matching your criteria
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                {filteredPlugins.map((plugin) => (
                  <Box
                    key={plugin.key}
                    sx={{
                      width: {
                        xs: "100%",
                        md: "calc(50% - 8px)",
                        lg: "calc(33.333% - 11px)",
                      },
                    }}
                  >
                    <PluginCard
                      plugin={plugin}
                      onInstall={handleInstall}
                      onUninstall={handleUninstall}
                      onManage={handleManage}
                      loading={
                        installing === plugin.key ||
                        !!(plugin.installationId &&
                          uninstalling === plugin.installationId)
                      }
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Stack>
        </TabPanel>

        {/* My Plugins Tab */}
        <TabPanel value="my-plugins" sx={{ p: 0, pt: 2 }}>
          <Stack gap={2} sx={{ px: 2 }}>
            {/* Summary Chip */}
            <Box>
              <Chip
                label={`${installedPlugins.length} plugin${installedPlugins.length !== 1 ? "s" : ""} installed`}
                sx={{
                  borderRadius: "4px",
                  fontSize: "13px",
                  fontWeight: 500,
                  backgroundColor: "rgba(19, 113, 91, 0.1)",
                  color: "#13715B",
                  border: "1px solid #13715B",
                }}
              />
            </Box>

            {/* Plugin Cards Grid */}
            {loading ? (
              <Box sx={{ textAlign: "center", py: 4 }}>Loading plugins...</Box>
            ) : installedPlugins.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                No plugins installed yet. Visit the marketplace to install plugins.
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                {installedPlugins.map((plugin) => (
                  <Box
                    key={plugin.key}
                    sx={{
                      width: {
                        xs: "100%",
                        md: "calc(50% - 8px)",
                        lg: "calc(33.333% - 11px)",
                      },
                    }}
                  >
                    <PluginCard
                      plugin={plugin}
                      onUninstall={handleUninstall}
                      onManage={handleManage}
                      loading={
                        !!(
                          plugin.installationId &&
                          uninstalling === plugin.installationId
                        )
                      }
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Stack>
        </TabPanel>
      </TabContext>

      {/* Toast Notifications */}
      {toast && toast.visible && (
        <Suspense fallback={<div>Loading...</div>}>
          <Alert
            variant={toast.variant}
            body={toast.body}
            isToast={true}
            onClick={handleCloseToast}
          />
        </Suspense>
      )}
    </Stack>
  );
};

export default Plugins;
