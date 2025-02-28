import { Box, Stack, Tab, Typography } from "@mui/material";
import {
  projectViewHeaderDesc,
  projectViewHeaderTitle,
  tabStyle,
} from "./style";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { SyntheticEvent, useState } from "react";
import TabContext from "@mui/lab/TabContext";

const VWProjectView = () => {
  const [value, setValue] = useState("overview");
  const handleChange = (_: SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Stack className="vw-project-view">
      <Stack className="vw-project-view-header" sx={{ mb: 10 }}>
        <Typography sx={projectViewHeaderTitle}>
          {`VerifyWise AI Engine`} project view
        </Typography>
        <Typography sx={projectViewHeaderDesc}>
          This project includes all the governance process status of the{" "}
          {`VerifyWise AI Engine`} project
        </Typography>
      </Stack>
      <Stack className="vw-project-view-body">
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList
              onChange={handleChange}
              TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
              sx={{
                minHeight: "20px",
                "& .MuiTabs-flexContainer": { columnGap: "34px" },
              }}
            >
              <Tab
                sx={tabStyle}
                label="Overview"
                value="overview"
                disableRipple
              />
              <Tab
                sx={tabStyle}
                label="Project risks"
                value="project-risks"
                disableRipple
              />
              <Tab
                sx={tabStyle}
                label="Settings"
                value="settings"
                disableRipple
              />
            </TabList>
          </Box>
          <TabPanel value="overview"></TabPanel>
          <TabPanel value="project-risks"></TabPanel>
          <TabPanel value="settings"></TabPanel>
        </TabContext>
      </Stack>
    </Stack>
  );
};

export default VWProjectView;
