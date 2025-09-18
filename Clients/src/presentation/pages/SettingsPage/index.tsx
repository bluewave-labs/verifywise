import React, { useEffect, useState } from "react";
import { Tabs, Tab, Stack } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import Profile from "./Profile/index";
import Password from "./Password/index";
import TeamManagement from "./Team/index";
import { settingTabStyle, tabContainerStyle, tabIndicatorStyle } from "./style";
import Organization from "./Organization";
import allowedRoles from "../../../application/constants/permissions";
import { useAuth } from "../../../application/hooks/useAuth";
import SlackIntegration from "./Slack";
import { useSearchParams } from "react-router-dom";

export default function ProfilePage() {
  const { userRoleName } = useAuth();
  const isTeamManagementDisabled =
    !allowedRoles.projects.editTeamMembers.includes(userRoleName);
  const [activeTab, setActiveTab] = useState(0);
  const [searchParams] = useSearchParams();
  const activeSetting = searchParams.get("activeTab");

  useEffect(() => {
    if (activeSetting) {
      setActiveTab(parseInt(activeSetting, 10));
    }
  }, [activeSetting]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Stack className="vwhome">
      <PageBreadcrumbs />
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        TabIndicatorProps={tabIndicatorStyle}
        sx={tabContainerStyle}
      >
        <Tab label="Profile" disableRipple sx={settingTabStyle} />
        <Tab label="Password" disableRipple sx={settingTabStyle} />
        <Tab
          label="Team"
          disableRipple
          sx={settingTabStyle}
          disabled={isTeamManagementDisabled}
        />
        <Tab label="Organization" disableRipple sx={settingTabStyle} />
        <Tab label="Slack" disableRipple sx={settingTabStyle} />
      </Tabs>

      {activeTab === 0 && <Profile />}

      {activeTab === 1 && <Password />}

      {activeTab === 2 && <TeamManagement />}

      {activeTab === 3 && <Organization />}

      {activeTab === 4 && <SlackIntegration />}
    </Stack>
  );
}
