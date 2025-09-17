import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, Tab, Stack, Typography, Box } from "@mui/material";
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
      <PageBreadcrumbs />
      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent={settingsHelpContent}
        pageTitle="Settings"
      />
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant="h4"
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: "#1A1919",
            }}
          >
            Settings
          </Typography>
          <HelperIcon
            onClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
            size="small"
          />
        </Stack>
      </Box>
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
