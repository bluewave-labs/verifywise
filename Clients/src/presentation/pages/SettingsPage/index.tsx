import React, { useState } from "react";
import { Tabs, Tab, Box, useTheme } from "@mui/material";
import Profile from "./Profile/index";
import Password from "./Password/index";
import Team from "./Team/index";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState(0);

  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFileUpload = () => {
    document.getElementById("profile-upload")?.click();
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
        <Tab label="Users" />
        <Tab label="Password" />
        <Tab label="Team" />
      </Tabs>

      {activeTab === 0 && <Profile />}

      {activeTab === 1 && <Password />}

      {activeTab === 2 && <Team />}
    </Box>
  );
}
