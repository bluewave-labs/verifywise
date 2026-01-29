import React, { useState, useCallback, useMemo, Suspense } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import { TabContext, TabPanel } from "@mui/lab";
import { Home, Puzzle } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import TabBar from "../../components/TabBar";
import PluginCard from "../../components/PluginCard";
import { SearchBox } from "../../components/Search";
import { usePlugins } from "../../../application/hooks/usePlugins";
import { usePluginInstallation } from "../../../application/hooks/usePluginInstallation";
import { Plugin, PluginInstallationStatus } from "../../../domain/types/plugins";
import Alert from "../../components/Alert";
import { useAuth } from "../../../application/hooks/useAuth";
import { IBreadcrumbItem } from "../../../domain/types/breadcrumbs.types";
import Chip from "../../components/Chip";
import { CATEGORIES } from "./categories";

const Plugins: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRoleName } = useAuth();

  // Determine initial tab from URL
  const initialTab = location.pathname.includes("/my-plugins") ? "my-plugins" : "marketplace";

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab);
  const { plugins, loading, refetch } = usePlugins(selectedCategory === "all" ? undefined : selectedCategory);
  const { uninstall, uninstalling } = usePluginInstallation();
  const [toast, setToast] = useState<{
    variant: "success" | "info" | "warning" | "error";
    body: string;
    visible: boolean;
  } | null>(null);

  const isAdmin = userRoleName === "Admin";

  // Refetch plugins when navigating back to this page
  React.useEffect(() => {
    if (location.pathname.includes('/plugins') && !location.pathname.includes('/manage')) {
      refetch();
    }
  }, [location.pathname, refetch]);

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

  // Get current category config
  const currentCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0],
    [selectedCategory]
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

  // Handle plugin uninstallation
  const handleUninstall = useCallback(
    async (installationId: number, pluginKey: string) => {
      try {
        await uninstall(installationId, pluginKey);
        setToast({
          variant: "success",
          body: "Plugin uninstalled successfully!",
          visible: true,
        });
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
      if (!plugin || !plugin.key) {
        setToast({
          variant: "error",
          body: "Invalid plugin data. Please refresh the page.",
          visible: true,
        });
        return;
      }
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
                label: "My plugins",
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
          <Stack direction="row" gap="16px">
            {/* Left Sidebar - Category Menu */}
            <Box
              sx={{
                width: 220,
                minWidth: 220,
                flexShrink: 0,
              }}
            >
              <Stack gap={0.5}>
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategory === category.id;
                  return (
                    <Box
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        padding: "10px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        backgroundColor: isSelected ? "rgba(19, 113, 91, 0.08)" : "transparent",
                        border: isSelected ? "1px solid #13715B" : "1px solid transparent",
                        "&:hover": {
                          backgroundColor: isSelected
                            ? "rgba(19, 113, 91, 0.12)"
                            : "rgba(0, 0, 0, 0.04)",
                        },
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Icon
                        size={16}
                        color={isSelected ? "#13715B" : "#667085"}
                        strokeWidth={1.5}
                      />
                      <Typography
                        sx={{
                          fontSize: "13px",
                          fontWeight: isSelected ? 500 : 400,
                          color: isSelected ? "#13715B" : "#344054",
                        }}
                      >
                        {category.name}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {/* Right Content Area */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack gap="16px">
                {/* Search Bar */}
                <SearchBox
                  placeholder="Search plugins by name, description, or tags..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  sx={{ maxWidth: 400 }}
                />

                {/* Category Header */}
                <Box
                  sx={{
                    padding: "16px 20px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #d0d5dd",
                    borderRadius: "4px",
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
                    {React.createElement(currentCategory.icon, {
                      size: 20,
                      color: "#13715B",
                      strokeWidth: 1.5,
                    })}
                    <Typography
                      sx={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#101828",
                      }}
                    >
                      {currentCategory.name}
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: "#667085",
                      lineHeight: 1.5,
                    }}
                  >
                    {currentCategory.description}
                  </Typography>
                </Box>

                {/* Plugin Cards Grid */}
                {loading ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography sx={{ color: "#667085", fontSize: "14px" }}>
                      Loading plugins...
                    </Typography>
                  </Box>
                ) : filteredPlugins.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography sx={{ color: "#667085", fontSize: "14px" }}>
                      No plugins found matching your criteria
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                    {filteredPlugins.map((plugin) => (
                      <Box
                        key={plugin.key}
                        sx={{
                          width: {
                            xs: "100%",
                            md: "calc(50% - 8px)", // 50% minus half of 16px gap
                          },
                        }}
                      >
                        <PluginCard
                          plugin={plugin}
                          onUninstall={handleUninstall}
                          onManage={handleManage}
                          loading={
                            !!(plugin.installationId &&
                              uninstalling === plugin.installationId)
                          }
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </Stack>
            </Box>
          </Stack>
        </TabPanel>

        {/* My Plugins Tab */}
        <TabPanel value="my-plugins" sx={{ p: 0, pt: 2 }}>
          <Stack gap={2} sx={{ px: 2 }}>
            {/* Summary Chip */}
            <Box>
              <Chip
                label={`${installedPlugins.length} plugin${installedPlugins.length !== 1 ? "s" : ""} installed`}
                backgroundColor="rgba(19, 113, 91, 0.1)"
                textColor="#13715B"
              />
            </Box>

            {/* Plugin Cards Grid */}
            {loading ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography sx={{ color: "#667085", fontSize: "14px" }}>
                  Loading plugins...
                </Typography>
              </Box>
            ) : installedPlugins.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography sx={{ color: "#667085", fontSize: "14px" }}>
                  No plugins installed yet. Visit the marketplace to install plugins.
                </Typography>
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
