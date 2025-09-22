import React, { useEffect, useState } from "react";
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
import Subscription from "./Subscription";
import allowedRoles from "../../../application/constants/permissions";
import { useAuth } from "../../../application/hooks/useAuth";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import settingsHelpContent from "../../helpers/settings-help.html?raw";
import PageHeader from "../../components/Layout/PageHeader";
import { useSearchParams } from "react-router-dom";

export default function ProfilePage() {
  const { userRoleName } = useAuth();
  const isTeamManagementDisabled =
    !allowedRoles.projects.editTeamMembers.includes(userRoleName);
  const [activeTab, setActiveTab] = useState("profile");
  const [searchParams] = useSearchParams();
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  // Handle payment redirect - navigate to subscription tab if session_id and tierId are present
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const tierId = searchParams.get('tierId');
    
    if (sessionId && tierId) {
      setActiveTab("subscription");
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
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            onChange={handleTabChange}
            TabIndicatorProps={tabIndicatorStyle}
            sx={tabContainerStyle}
          >
            <Tab label="Profile" value="profile" disableRipple sx={settingTabStyle} />
            <Tab label="Password" value="password" disableRipple sx={settingTabStyle} />
            <Tab
              label="Team"
              value="team"
              disableRipple
              sx={settingTabStyle}
              disabled={isTeamManagementDisabled}
            />
            <Tab label="Organization" value="organization" disableRipple sx={settingTabStyle} />
            <Tab label="Subscription" value="subscription" disableRipple sx={settingTabStyle} />
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
          {activeTab === "organization" && <Organization />}
          {activeTab === "subscription" && <Subscription />}
        </TabPanel>
      </TabContext>
    </Stack>
  );
}
