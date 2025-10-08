import React, { useState, useEffect, useMemo } from "react";
import { Box, Stack } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Tab from "@mui/material/Tab";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import Profile from "./Profile/index";
import Password from "./Password/index";
import TeamManagement from "./Team/index";
import { settingTabStyle, tabContainerStyle, tabIndicatorStyle } from "./style";
import Organization from "./Organization";
import allowedRoles from "../../../application/constants/permissions";
import { useAuth } from "../../../application/hooks/useAuth";
import EntraIdConfig from "./EntraIdConfig";
// import Slack from "./Slack";
import Slack from "./Slack";
import { useSearchParams } from "react-router-dom";
import HelperDrawer from "../../components/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import PageHeader from "../../components/Layout/PageHeader";
import { ENV_VARs } from "../../../../env.vars";

export default function ProfilePage() {
  // const authorizedActiveTabs = ["profile", "password", "team", "organization", "sso"];
  const { userRoleName, userId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isTeamManagementDisabled =
    !allowedRoles.projects.editTeamMembers.includes(userRoleName);
  const isSsoTabDisabled = !allowedRoles.sso.view.includes(userRoleName);
  // const isSlackTabDisabled = !allowedRoles.slack.view.includes(userRoleName);
  const [isPasswordTabDisabled, setIsPasswordTabDisabled] = useState(false);
  const isSlackTabDisabled = !allowedRoles.slack.view.includes(userRoleName);
  const [activeTab, setActiveTab] = useState("profile");
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSetting = searchParams.get("activeTab") || "";
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);
  const isSlackVisible = ENV_VARs.IS_SLACK_VISIBLE === "true";

  const validTabs = useMemo(() => {
    const tabs = ["profile", "password", "team", "organization"];
    if (isSlackVisible) {
      tabs.push("slack")
    }
    return tabs;
  }, [isSlackVisible])

  useEffect(() => {
    if (activeSetting && validTabs.includes(activeSetting)) {
      setActiveTab(activeSetting);
    } else {
      searchParams.delete("activeTab");
      setSearchParams(searchParams);
      setActiveTab("profile");
    }
  }, [activeSetting]);

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
      const validTabs = ['profile', 'password', 'team', 'organization', 'sso'];
      const requestedTab = location.state.activeTab;

      // Check if requested tab is valid and user has permission to access it
      if (validTabs.includes(requestedTab)) {
        if (requestedTab === 'team' && isTeamManagementDisabled) {
          // If team management is requested but user doesn't have permission, stay on profile
          setActiveTab('profile');
        } else {
          setActiveTab(requestedTab);
        }
      }

      // Clear the navigation state to prevent stale state issues
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, isTeamManagementDisabled, navigate, location.pathname]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    if (activeSetting) {
      searchParams.set("activeTab", newValue);
      setSearchParams(searchParams);
    }
    setActiveTab(newValue);
  };

  return (
    <Stack className="vwhome">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ height: 45 }}
      >
        {" "}
        <PageBreadcrumbs />{" "}
      </Stack>
      <HelperDrawer
        open={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(false)}
        title="Settings & configuration"
        description="Manage your account, organization, and system preferences"
        whatItDoes="Configure **user profiles**, *security settings*, **team management**, and *organizational preferences*. Control **access permissions**, *notification preferences*, and **system integrations**."
        whyItMatters="Proper **configuration** ensures your *AI governance platform* operates **securely** and efficiently. Settings management helps maintain **user access controls**, enforce *security policies*, and customize the platform to your *organization's needs*."
        quickActions={[
          {
            label: "Update Profile",
            description: "Manage your personal information and preferences",
            primary: true,
          },
          {
            label: "Manage Team",
            description: "Add users and configure role-based permissions",
          },
        ]}
        useCases={[
          "**User onboarding** with appropriate *role assignments* and **access levels**",
          "**Security configuration** including *password policies* and **authentication methods**",
        ]}
        keyFeatures={[
          "**Role-based access control** with *granular permission settings*",
          "**Team management** with *user invitation* and **deactivation workflows**",
          "**Organization-wide settings** for *branding* and **compliance preferences**",
        ]}
        tips={[
          "**Regularly review** user access to ensure *appropriate permissions*",
          "Enable **two-factor authentication** for *enhanced security*",
          "Document **role definitions** to ensure *consistent permission assignments*",
        ]}
      />
      <PageHeader
        title="Settings"
        description=""
        rightContent={
          <HelperIcon
            onClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
            size="small"
          />
        }
      />
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            onChange={handleTabChange}
            TabIndicatorProps={tabIndicatorStyle}
            sx={tabContainerStyle}
          >
            <Tab
              label="Profile"
              value="profile"
              disableRipple
              sx={settingTabStyle}
            />
            <Tab
              label="Password"
              value="password"
              disableRipple
              sx={settingTabStyle}
              disabled={isPasswordTabDisabled}
            />
            <Tab
              label="Team"
              value="team"
              disableRipple
              sx={settingTabStyle}
              disabled={isTeamManagementDisabled}
            />
            <Tab
              label="Organization"
              value="organization"
              disableRipple
              sx={settingTabStyle}
            />
            <Tab
              label="EntraID SSO"
              value="entraid"
              disableRipple
              sx={settingTabStyle}
              disabled={isSsoTabDisabled}
            />
            {/* <Tab
              label="Slack"
              value="slack"
              disableRipple
              sx={settingTabStyle}
              disabled={isSlackTabDisabled}
            /> */}
            {isSlackVisible && (
              <Tab
                label="Slack"
                value="slack"
                disableRipple
                sx={settingTabStyle}
                disabled={isSlackTabDisabled}
              /> 
            )}
          </TabList>
        </Box>

        <TabPanel value="profile">
          <Profile />
        </TabPanel>

        <TabPanel value="password">
          <Password />
        </TabPanel>

        <TabPanel value="team">
          <TeamManagement />
        </TabPanel>

        <TabPanel value="organization">
          <Organization />
        </TabPanel>

        <TabPanel value="entraid">
          <EntraIdConfig />
        </TabPanel>

        {/* Hiding the slack until all the Slack work has been resolved */}
        {/* <TabPanel value="slack">
          <Slack />
        </TabPanel> */}
        {isSlackVisible && (
          <TabPanel value="slack">
            <Slack />
          </TabPanel>
        )}
      </TabContext>
    </Stack>
  );
}
