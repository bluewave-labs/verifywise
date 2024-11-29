import React, { useState } from "react";
import { Tabs, Tab, Box, useTheme } from "@mui/material";
import Profile from "./Profile/index";
import Password from "./Password/index";
import TeamManagement from "./Team/index";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState(0);

  const theme = useTheme();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: "100%", marginLeft: theme.spacing(10) }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": { textTransform: "none" },
          "& .Mui-selected": { color: theme.palette.primary.main },
          "& .MuiTabs-indicator": {
            backgroundColor: theme.palette.primary.main,
          },
        }}
      >
        <Tab label="Profile" disableRipple />
        <Tab label="Password" disableRipple />
        <Tab label="Team" disableRipple />
      </Tabs>

      {activeTab === 0 && <Profile />}

      {activeTab === 1 && <Password />}

      {activeTab === 2 && <TeamManagement />}
    </Box>
  );
}
