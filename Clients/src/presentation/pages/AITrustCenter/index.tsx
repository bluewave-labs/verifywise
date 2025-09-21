import React, { useState } from "react";
import { Box, Stack } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Tab from "@mui/material/Tab";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TrustCenterResources from "./Resources";
import AITrustCenterSubprocessors from "./Subprocessors";
import AITrustCenterSettings from "./Settings";
import AITrustCenterOverview from "./Overview";
import {
  aiTrustCenterTabStyle,
  aiTrustCenterTabPanelStyle,
  aiTrustCenterTabListStyle,
  aiTrustCenterPreviewButtonStyle,
} from "./styles";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { extractUserToken } from "../../../application/tools/extractToken";
import { useSelector } from "react-redux";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import aiTrustCenterHelpContent from "../../../presentation/helpers/ai-trust-center-help.html?raw";
import PageHeader from "../../components/Layout/PageHeader";

const AITrustCenter: React.FC = () => {
  const [tabValue, setTabValue] = React.useState("overview");
  const handleTabChange = (_: React.SyntheticEvent, newValue: string) =>
    setTabValue(newValue);
  const authToken = useSelector(
    (state: { auth: { authToken: string } }) => state.auth.authToken
  );
  const userToken = extractUserToken(authToken);
  const tenantHash = userToken?.tenantId;

  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  const handlePreviewMode = () => {
    try {
      if (!tenantHash) {
        console.error("Tenant hash not found in token");
        return;
      }
      // Open the public page in a new tab
      const publicUrl = `${window.location.origin}/aiTrustCentre/${tenantHash}`;
      window.open(publicUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error opening preview:", error);
    }
  };

  return (
    <Stack className="vwhome" gap={"24px"}>
      <PageBreadcrumbs />
      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent={aiTrustCenterHelpContent}
        pageTitle="AI Trust Center"
      />

        <PageHeader
               title="AI trust center"
               description="AI Trust Center centralizes your AI policies, certifications, and
               subprocessors to demonstrate responsible, transparent, and compliant AI practices."
               rightContent={
                  <HelperIcon
                     onClick={() =>
                     setIsHelperDrawerOpen(!isHelperDrawerOpen)
                     }
                     size="small"
                    />
                 }
             />
      

      <Stack>
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
                label="Settings"
                value="settings"
                disableRipple
              />
              <CustomizableButton
                variant="contained"
                text="Preview mode"
                sx={{
                  ...aiTrustCenterPreviewButtonStyle,
                  opacity: !tenantHash ? 0.5 : 1,
                  cursor: !tenantHash ? "not-allowed" : "pointer",
                }}
                icon={<VisibilityIcon />}
                onClick={handlePreviewMode}
                isDisabled={!tenantHash}
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
          <TabPanel value="settings" sx={aiTrustCenterTabPanelStyle}>
            <AITrustCenterSettings />
          </TabPanel>
        </TabContext>
      </Stack>
    </Stack>
  );
};

export default AITrustCenter;
