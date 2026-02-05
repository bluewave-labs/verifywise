import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Stack } from "@mui/material";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import { PageBreadcrumbs } from "../../components/breadcrumbs/PageBreadcrumbs";
import Profile from "./Profile/index";
import Password from "./Password/index";
import TeamManagement from "./Team/index";
import Organization from "./Organization";
import Preferences from "./Preferences/index";
import allowedRoles from "../../../application/constants/permissions";
import { useAuth } from "../../../application/hooks/useAuth";
import ApiKeys from "./ApiKeys";
import HelperIcon from "../../components/HelperIcon";
import PageHeader from "../../components/Layout/PageHeader";
import TipBox from "../../components/TipBox";
import TabBar, { TabItem } from "../../components/TabBar";
import { usePluginRegistry } from "../../../application/contexts/PluginRegistry.context";
import { PluginSlot } from "../../components/PluginSlot";
import { PLUGIN_SLOTS } from "../../../domain/constants/pluginSlots";

// Built-in tabs (defined outside component to avoid recreation on each render)
const BUILT_IN_TABS = [
  "profile",
  "password",
  "preferences",
  "team",
  "organization",
  "apikeys",
];

export default function ProfilePage() {
  const { userRoleName } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isTeamManagementDisabled =
    !allowedRoles.projects.editTeamMembers.includes(userRoleName);
  const isApiKeysDisabled = !allowedRoles.apiKeys?.view?.includes(userRoleName);

  // Get plugin tabs dynamically from the plugin registry
  const { getPluginTabs, installedPlugins, isLoading: pluginsLoading } = usePluginRegistry();
  const pluginTabs = useMemo(
    () => getPluginTabs(PLUGIN_SLOTS.SETTINGS_TABS),
    [getPluginTabs]
  );

  const { tab } = useParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState(tab || "profile");

  const validTabs = useMemo(() => {
    // Include plugin tabs in valid tabs
    return [...BUILT_IN_TABS, ...pluginTabs.map((t) => t.value)];
  }, [pluginTabs]);

  // keep state synced with URL
  useEffect(() => {
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    } else if (tab && !BUILT_IN_TABS.includes(tab)) {
      // Tab is not a built-in tab - it might be a plugin tab
      // Don't redirect if plugins are still loading or if plugin tabs haven't loaded yet
      if (!pluginsLoading && installedPlugins.length > 0 && pluginTabs.length === 0) {
        // Plugins are installed but tabs haven't loaded yet - wait
        return;
      }
      if (pluginsLoading) {
        // Plugins still loading - wait
        return;
      }
      // Plugins finished loading and tab is not valid - redirect
      navigate("/settings", { replace: true });
      setActiveTab("profile");
    } else if (!tab) {
      // No tab specified - stay on profile
      setActiveTab("profile");
    } else {
      // Invalid built-in tab - redirect
      navigate("/settings", { replace: true });
      setActiveTab("profile");
    }
  }, [tab, validTabs, navigate, pluginsLoading, installedPlugins.length, pluginTabs.length]);

  // Handle navigation state from command palette
  useEffect(() => {
    if (location.state?.activeTab) {
      const requestedTab = location.state.activeTab;

      // Check if requested tab is valid and user has permission to access it
      if (validTabs.includes(requestedTab)) {
        if (requestedTab === "team" && isTeamManagementDisabled) {
          // If team management is requested but user doesn't have permission, stay on profile
          setActiveTab("profile");
        } else {
          setActiveTab(requestedTab);
        }
      }

      // Clear the navigation state to prevent stale state issues
      navigate(location.pathname, { replace: true });
    }
  }, [
    location.state,
    isTeamManagementDisabled,
    navigate,
    location.pathname,
    validTabs,
  ]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);

    if (newValue === "profile") navigate("/settings");
    else navigate(`/settings/${newValue}`);
  };

  return (
    <Stack className="vwhome">
      <PageBreadcrumbs />
      <PageHeader
        title="Settings"
        description="Manage your profile, security, team members, and application preferences."
        rightContent={
          <HelperIcon
            articlePath="settings/user-management"
            size="small"
          />
        }
      />
      <TipBox entityName="settings" />

      <TabContext value={activeTab}>
        <TabBar
          tabs={[
            {
              label: "Profile",
              value: "profile",
              icon: "User",
            },
            {
              label: "Password",
              value: "password",
              icon: "Lock",
            },
            {
              label: "Team",
              value: "team",
              icon: "Users",
              disabled: isTeamManagementDisabled,
            },
            {
              label: "Organization",
              value: "organization",
              icon: "Building2",
            },
            {
              label: "Preferences",
              value: "preferences",
              icon: "Settings",
            },
            {
              label: "API Keys",
              value: "apikeys",
              icon: "Key",
              disabled: isApiKeysDisabled,
            },
            // Dynamically add plugin tabs
            ...pluginTabs.map((tab) => ({
              label: tab.label,
              value: tab.value,
              icon: (tab.icon || "Settings") as TabItem["icon"],
            })),
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
        />

        <TabPanel value="profile">
          <Profile />
        </TabPanel>

        <TabPanel value="password">
          <Password />
        </TabPanel>

        <TabPanel value="preferences">
          <Preferences />
        </TabPanel>

        <TabPanel value="team">
          <TeamManagement />
        </TabPanel>

        <TabPanel value="organization">
          <Organization />
        </TabPanel>

        <TabPanel value="apikeys">
          <ApiKeys />
        </TabPanel>

        {/* Render plugin tab content dynamically */}
        {pluginTabs.some((tab) => tab.value === activeTab) && (
          <PluginSlot
            id={PLUGIN_SLOTS.SETTINGS_TABS}
            renderType="tab"
            activeTab={activeTab}
          />
        )}
      </TabContext>
    </Stack>
  );
}
