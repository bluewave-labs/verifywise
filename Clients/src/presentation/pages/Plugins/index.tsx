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
import {
  categorySidebar,
  categoryMenuItem,
  categoryMenuText,
  categoryHeader,
  categoryHeaderTitle,
  categoryHeaderDescription,
  pluginCardsGrid,
  pluginCardWrapper,
  pluginCardWrapperThreeColumn,
  emptyStateContainer,
  emptyStateText,
  tabPanelStyle,
} from "./style";

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
      } catch (err: unknown) {
        setToast({
          variant: "error",
          body: err instanceof Error ? err.message : "Failed to uninstall plugin. Please try again.",
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
        <TabPanel value="marketplace" sx={tabPanelStyle}>
          <Stack direction="row" gap="16px">
            {/* Left Sidebar - Category Menu */}
            <Box sx={categorySidebar}>
              <Stack gap={0.5}>
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategory === category.id;
                  return (
                    <Box
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      sx={categoryMenuItem(isSelected)}
                    >
                      <Icon
                        size={16}
                        color={isSelected ? "#13715B" : "#667085"}
                        strokeWidth={1.5}
                      />
                      <Typography sx={categoryMenuText(isSelected)}>
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
                <Box sx={categoryHeader}>
                  <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
                    {React.createElement(currentCategory.icon, {
                      size: 20,
                      color: "#13715B",
                      strokeWidth: 1.5,
                    })}
                    <Typography sx={categoryHeaderTitle}>
                      {currentCategory.name}
                    </Typography>
                  </Stack>
                  <Typography sx={categoryHeaderDescription}>
                    {currentCategory.description}
                  </Typography>
                </Box>

                {/* Plugin Cards Grid */}
                {loading ? (
                  <Box sx={emptyStateContainer}>
                    <Typography sx={emptyStateText}>
                      Loading plugins...
                    </Typography>
                  </Box>
                ) : filteredPlugins.length === 0 ? (
                  <Box sx={emptyStateContainer}>
                    <Typography sx={emptyStateText}>
                      No plugins found matching your criteria
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={pluginCardsGrid}>
                    {filteredPlugins.map((plugin) => (
                      <Box key={plugin.key} sx={pluginCardWrapper}>
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
        <TabPanel value="my-plugins" sx={tabPanelStyle}>
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
              <Box sx={emptyStateContainer}>
                <Typography sx={emptyStateText}>
                  Loading plugins...
                </Typography>
              </Box>
            ) : installedPlugins.length === 0 ? (
              <Box sx={emptyStateContainer}>
                <Typography sx={emptyStateText}>
                  No plugins installed yet. Visit the marketplace to install plugins.
                </Typography>
              </Box>
            ) : (
              <Box sx={pluginCardsGrid}>
                {installedPlugins.map((plugin) => (
                  <Box key={plugin.key} sx={pluginCardWrapperThreeColumn}>
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
