import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, Tab, Stack } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import Profile from "./Profile/index";
import Password from "./Password/index";
import TeamManagement from "./Team/index";
import { settingTabStyle, tabContainerStyle, tabIndicatorStyle } from "./style";
import Organization from "./Organization";
import Subscription from "./Subscription";
import allowedRoles from "../../../application/constants/permissions";
import { useAuth } from "../../../application/hooks/useAuth";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import settingsHelpContent from "../../helpers/settings-help.html?raw";
import PageHeader from "../../components/Layout/PageHeader";

export default function ProfilePage() {
  const { userRoleName } = useAuth();
  const isTeamManagementDisabled =
    !allowedRoles.projects.editTeamMembers.includes(userRoleName);
  const [activeTab, setActiveTab] = useState(0);
  const [searchParams] = useSearchParams();
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle payment redirect - navigate to subscription tab if session_id and tierId are present
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const tierId = searchParams.get('tierId');
    
    if (sessionId && tierId) {
      setActiveTab(4);
    }
  }, [searchParams]);

  return (
    <Stack className="vwhome">
     <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height: 45 }} > <PageBreadcrumbs /> </Stack>
      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent={settingsHelpContent}
        pageTitle="Settings"
      />
       <PageHeader
               title="Settings"
               description=""
               rightContent={
                  <HelperIcon
                     onClick={() =>
                     setIsHelperDrawerOpen(!isHelperDrawerOpen)
                     }
                     size="small"
                    />
                 }
             />
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
        <Tab label="Subscription" disableRipple sx={settingTabStyle} />
      </Tabs>

      {activeTab === 0 && <Profile />}

      {activeTab === 1 && <Password />}

      {activeTab === 2 && <TeamManagement />}

      {activeTab === 3 && <Organization />}
      {activeTab === 4 && <Subscription />}
    </Stack>
  );
}
