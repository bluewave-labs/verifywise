import React from "react";
import { Box, Stack } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import { Eye as VisibilityIcon } from "lucide-react"
import TrustCenterResources from "./Resources";
import AITrustCenterSubprocessors from "./Subprocessors";
import AITrustCenterSettings from "./Settings";
import AITrustCenterOverview from "./Overview";
import PageTour from "../../components/PageTour";
import AITrustCenterSteps from "./AITrustCenterSteps";
import {
  aiTrustCenterTabPanelStyle,
  aiTrustCenterPreviewButtonStyle,
} from "./styles";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { extractUserToken } from "../../../application/tools/extractToken";
import { useSelector } from "react-redux";
import HelperIcon from "../../components/HelperIcon";
import PageHeader from "../../components/Layout/PageHeader";
import { useNavigate, useParams } from "react-router-dom";
import TabBar from "../../components/TabBar";
import { useAITrustCentreResourcesQuery } from "../../../application/hooks/useAITrustCentreResourcesQuery";
import { useAITrustCentreSubprocessorsQuery } from "../../../application/hooks/useAITrustCentreSubprocessorsQuery";
import TipBox from "../../components/TipBox";

const AITrustCenter: React.FC = () => {
const params = useParams<{ tab?: string }>();
const navigate = useNavigate();

// active tab based on URL or default to "overview"
const tabValue = params.tab || "overview";

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) =>
    navigate(`/ai-trust-center/${newValue}`);
  const authToken = useSelector(
    (state: { auth: { authToken: string } }) => state.auth.authToken
  );
  const userToken = extractUserToken(authToken);
  const tenantHash = userToken?.tenantId;

  // Fetch data for tab counts
  const { data: resources, isLoading: resourcesLoading } = useAITrustCentreResourcesQuery();
  const { data: subprocessors, isLoading: subprocessorsLoading } = useAITrustCentreSubprocessorsQuery();

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
    <Stack className="vwhome" gap={"16px"}>
      <PageBreadcrumbs />

        <PageHeader
               title="AI trust center"
               description="AI Trust Center centralizes your AI policies, certifications, and
               subprocessors to demonstrate responsible, transparent, and compliant AI practices."
               rightContent={
                  <HelperIcon
                     articlePath="ai-governance/ai-trust-center"
                     size="small"
                    />
                 }
             />
      <TipBox entityName="ai-trust-center" />


      <Stack>
        <TabContext value={tabValue}>
          <Box sx={{ position: "relative" }}>
            <TabBar
              tabs={[
                {
                  label: "Overview",
                  value: "overview",
                  icon: "LayoutDashboard",
                },
                {
                  label: "Resources",
                  value: "resources",
                  icon: "FileText",
                  count: resources?.length,
                  isLoading: resourcesLoading,
                },
                {
                  label: "Subprocessors",
                  value: "subprocessors",
                  icon: "Building2",
                  count: subprocessors?.length,
                  isLoading: subprocessorsLoading,
                },
                {
                  label: "Settings",
                  value: "settings",
                  icon: "Settings",
                },
              ]}
              activeTab={tabValue}
              onChange={handleTabChange}
              dataJoyrideId="trust-center-tabs"
            />
            <Box
              data-joyride-id="preview-mode-button"
              sx={{
                position: "absolute",
                right: 0,
                bottom: 7,
              }}
            >
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
            </Box>
          </Box>

          <TabPanel value="overview" sx={aiTrustCenterTabPanelStyle} data-joyride-id="trust-center-overview">
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

      <PageTour steps={AITrustCenterSteps} run={true} tourKey="ai-trust-center-tour" />
    </Stack>
  );
};

export default AITrustCenter;
