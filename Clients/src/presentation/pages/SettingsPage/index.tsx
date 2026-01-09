import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Stack } from "@mui/material";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import Profile from "./Profile/index";
import Password from "./Password/index";
import TeamManagement from "./Team/index";
import Organization from "./Organization";
import Preferences from "./Preferences/index";
import allowedRoles from "../../../application/constants/permissions";
import { useAuth } from "../../../application/hooks/useAuth";
import ApiKeys from "./ApiKeys";
import EntraIdConfig from "./EntraIdConfig";
import HelperIcon from "../../components/HelperIcon";
import PageHeader from "../../components/Layout/PageHeader";
import TipBox from "../../components/TipBox";
import TabBar from "../../components/TabBar";

export default function ProfilePage() {
  // const authorizedActiveTabs = ["profile", "password", "team", "organization", "sso"];
  const { userRoleName, userId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isTeamManagementDisabled =
    !allowedRoles.projects.editTeamMembers.includes(userRoleName);
  const isSsoTabDisabled = !allowedRoles.sso.view.includes(userRoleName);
  const [isPasswordTabDisabled, setIsPasswordTabDisabled] = useState(false);
  const isApiKeysDisabled = !allowedRoles.apiKeys?.view?.includes(userRoleName);

  const { tab } = useParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState(tab || "profile");

  const validTabs = useMemo(() => {
    const tabs = [
      "profile",
      "password",
      "preferences",
      "team",
      "organization",
      "apikeys",
      "entraid",
    ];
    return tabs;
  }, []);

  // keep state synced with URL
  useEffect(() => {
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    } else {
      navigate("/settings", { replace: true });
      setActiveTab("profile");
    }
  }, [tab, validTabs, navigate]);

  // Check if user is SSO-authenticated and disable password tab
  useEffect(() => {
    const checkSsoStatus = async () => {
      if (!userId) return;

      try {
        const { getUserById } = await import("../../../application/repository/user.repository");
        const userData = await getUserById({ userId });
        const actualUserData = userData?.data || userData;

        // If user has SSO provider and SSO user ID, disable password tab
        if (actualUserData?.sso_provider && actualUserData?.sso_user_id) {
          setIsPasswordTabDisabled(true);
          // If currently on password tab, redirect to profile
          if (activeTab === "password") {
            setActiveTab("profile");
          }
        }
      } catch (error) {
        console.error("Failed to check SSO status:", error);
      }
    };

    checkSsoStatus();
  }, [userId, activeTab]);

  // Handle navigation state from command palette
  useEffect(() => {
    if (location.state?.activeTab) {
      const validTabs = ['profile', 'password', 'team', 'organization', 'entraid'];
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
              disabled: isPasswordTabDisabled,
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
            {
              label: "EntraID SSO",
              value: "entraid",
              icon: "Shield",
              disabled: isSsoTabDisabled,
            }
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

        <TabPanel value="entraid">
          <EntraIdConfig />
        </TabPanel>
      </TabContext>
    </Stack>
  );
}
