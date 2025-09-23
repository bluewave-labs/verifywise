import React, { useState, useEffect } from "react";
import { Box, Stack } from "@mui/material";
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
import Slack from "./Slack";
import { useSearchParams } from "react-router-dom";
import HelperDrawer from "../../components/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import PageHeader from "../../components/Layout/PageHeader";

export default function ProfilePage() {
  const { userRoleName } = useAuth();
  const isTeamManagementDisabled =
    !allowedRoles.projects.editTeamMembers.includes(userRoleName);
  const isSlackTabDisabled = !allowedRoles.slack.view.includes(userRoleName);
  const [activeTab, setActiveTab] = useState("profile");
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSetting = searchParams.get("activeTab");

  useEffect(() => {
    if (activeSetting) {
      setActiveTab(activeSetting);
    }
  }, [activeSetting]);
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
    if (activeSetting) {
      searchParams.delete("activeTab");
      setSearchParams(searchParams);
    }
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
              label="Slack"
              value="slack"
              disableRipple
              sx={settingTabStyle}
              disabled={isSlackTabDisabled}
            />
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

        <TabPanel value="slack">
          <Slack />
        </TabPanel>
      </TabContext>
    </Stack>
  );
}
