import React, { useState } from "react";
import { Box, Tab } from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import SsoConfigTab from "./SsoConfigTab";
import SecurityControlsTab from "./SecurityControlsTab";

const tabStyle = {
  textTransform: "none",
  fontWeight: 400,
  alignItems: "center",
  justifyContent: "flex-end",
  padding: "16px 0 7px",
  minHeight: "20px",
  minWidth: "auto",
  "&.Mui-selected": {
    color: "#13715B",
  },
};

const tabPanelStyle = {
  padding: 0,
  pt: 2,
};

const EntraIdConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState("1");

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{
      position: "relative",
      mt: 3,
      width: { xs: "90%", md: "70%" },
    }}>
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            onChange={handleTabChange}
            TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
            sx={{
              minHeight: "20px",
              "& .MuiTabs-flexContainer": { columnGap: "34px" },
            }}
          >
            <Tab label="SSO Configuration" value="1" sx={tabStyle} disableRipple />
            <Tab label="Security Controls" value="2" sx={tabStyle} disableRipple />
          </TabList>
        </Box>

        <TabPanel value="1" sx={tabPanelStyle}>
          <SsoConfigTab />
        </TabPanel>

        <TabPanel value="2" sx={tabPanelStyle}>
          <SecurityControlsTab />
        </TabPanel>
      </TabContext>
    </Box>
  );
};

export default EntraIdConfig;