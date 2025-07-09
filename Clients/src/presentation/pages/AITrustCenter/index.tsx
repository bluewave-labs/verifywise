import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Tab from '@mui/material/Tab';
import VisibilityIcon from "@mui/icons-material/Visibility";
import TrustCenterResources from "./Resources";
import AITrustCenterSubprocessors from "./Subprocessors";
import AITrustCenterControls from "./Controls";
import AITrustCenterSettings from "./Settings";
import AITrustCenterOverview from "./Overview";
import { 
  aiTrustCenterHeaderTitle, 
  aiTrustCenterHeaderDesc, 
  aiTrustCenterTabStyle, 
  aiTrustCenterTabPanelStyle, 
  aiTrustCenterTabListStyle,
  aiTrustCenterPreviewButtonStyle
} from "./styles";
import CustomizableButton from "../../vw-v2-components/Buttons";

const AITrustCenter: React.FC = () => {
  const [tabValue, setTabValue] = React.useState('overview');
  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => setTabValue(newValue);

  return (
    <Stack className="vw-project-view" overflow={"hidden"}>
      <Stack className="vw-project-view-header" sx={{ mb: 10 }}>
        <Typography sx={aiTrustCenterHeaderTitle}>
          AI trust center
        </Typography>
        <Typography sx={aiTrustCenterHeaderDesc}>
          Manage and monitor AI governance, compliance, and trust-related activities
        </Typography>
      </Stack>
      <Stack className="vw-project-view-body">
        <TabContext value={tabValue}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList
              onChange={handleTabChange}
              TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
              sx={aiTrustCenterTabListStyle}
            >
              <Tab
                sx={aiTrustCenterTabStyle}
                label="Overview"
                value="overview"
                disableRipple
              />
              <Tab
                sx={aiTrustCenterTabStyle}
                label="Resources"
                value="resources"
                disableRipple
              />
              <Tab
                sx={aiTrustCenterTabStyle}
                label="Subprocessors"
                value="subprocessors"
                disableRipple
              />
              <Tab
                sx={aiTrustCenterTabStyle}
                label="Controls"
                value="controls"
                disableRipple
              />
              <Tab
                sx={aiTrustCenterTabStyle}
                label="Settings"
                value="settings"
                disableRipple
              />
               <CustomizableButton
                variant="contained"
                text="Preview mode"
                sx={{
                  ...aiTrustCenterPreviewButtonStyle
                }}
                icon={<VisibilityIcon />}
                onClick={() => {}}
              />
            </TabList>
          </Box>
          <TabPanel value="overview" sx={aiTrustCenterTabPanelStyle}>
            <AITrustCenterOverview />
          </TabPanel>
          <TabPanel value="resources" sx={aiTrustCenterTabPanelStyle}>
            <TrustCenterResources />
          </TabPanel>
          <TabPanel value="subprocessors" sx={aiTrustCenterTabPanelStyle}>
            <AITrustCenterSubprocessors />
          </TabPanel>
          <TabPanel value="controls" sx={aiTrustCenterTabPanelStyle}>
            <AITrustCenterControls />
          </TabPanel>
          <TabPanel value="settings" sx={aiTrustCenterTabPanelStyle}>
            <AITrustCenterSettings />
          </TabPanel>
        </TabContext>
      </Stack>
    </Stack>
  );
};

export default AITrustCenter; 