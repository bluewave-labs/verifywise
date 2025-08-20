import React, { useContext, useState } from "react";
import { Tabs, Tab, Stack } from "@mui/material";
import Profile from "./Profile/index";
import Password from "./Password/index";
import TeamManagement from "./Team/index";
import { settingTabStyle, tabContainerStyle, tabIndicatorStyle } from "./style";
import Organization from "./Organization";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import allowedRoles from "../../../application/constants/permissions";

export default function ProfilePage() {
  const { userRoleName } = useContext(VerifyWiseContext);
  const isTeamManagementDisabled = !allowedRoles.projects.editTeamMembers.includes(userRoleName);
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Stack className="vwhome">
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        TabIndicatorProps={tabIndicatorStyle}
        sx={tabContainerStyle}
      >
        <Tab label="Profile" disableRipple sx={settingTabStyle} />
        <Tab label="Password" disableRipple sx={settingTabStyle} />
        <Tab label="Team" disableRipple sx={settingTabStyle} disabled={isTeamManagementDisabled} />
        <Tab label="Organization" disableRipple sx={settingTabStyle} />
      </Tabs>

      {activeTab === 0 && <Profile />}

      {activeTab === 1 && <Password />}

      {activeTab === 2 && <TeamManagement />}

      {activeTab === 3 && <Organization />}
    </Stack>
  );
}
