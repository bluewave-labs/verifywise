import React, { useState } from "react";
import { Box, Stack } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Tab from "@mui/material/Tab";
import { Eye as VisibilityIcon } from "lucide-react"
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
import HelperDrawer from "../../components/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
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
        open={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(false)}
        title="AI trust center"
        description="Build transparency and trust through your public-facing governance portal"
        whatItDoes="Create a **public trust center** showcasing your *AI governance commitments*, *certifications*, and *responsible AI practices*. Share *policies*, *compliance status*, and *transparency reports* with stakeholders and customers."
        whyItMatters="**Trust centers** demonstrate your commitment to *responsible AI* and help build *confidence* with customers, partners, and regulators. They provide *transparency* into your *AI governance practices* and differentiate you as a *trusted AI provider*."
        quickActions={[
          {
            label: "Customize Trust Center",
            description: "Configure your public portal content and branding",
            primary: true
          },
          {
            label: "Preview Public View",
            description: "See how your trust center appears to external visitors"
          }
        ]}
        useCases={[
          "*Public-facing portal* for customers to review your *AI ethics* and *governance practices*",
          "*Compliance demonstration hub* for sharing *certifications* and *audit reports*"
        ]}
        keyFeatures={[
          "**Customizable public portal** with your *branding* and *messaging*",
          "*Automated updates* from your *internal governance systems*",
          "*Resource library* for sharing *whitepapers* and *compliance documentation*"
        ]}
        tips={[
          "Keep your trust center updated with *latest certifications* and *policy changes*",
          "Include *clear contact information* for *stakeholder questions* and concerns",
          "*Regularly review analytics* to understand what information *visitors seek most*"
        ]}
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
                icon={<VisibilityIcon size={16} />}
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
