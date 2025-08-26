import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  useTheme,
  Tab,
} from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { useNavigate } from "react-router-dom";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import ConnectionPanel from "../../components/ConnectionPanel";
import { getConfluenceIntegration } from "../../../application/repository/integration.repository";
import CustomizableSkeleton from "../../vw-v2-components/Skeletons";
import ConfluenceSettings from "../../components/IntegrationSettings/ConfluenceSettings";

// Tab styling to match AI Trust Center clean look
const tabStyle = {
  textTransform: "none",
  fontWeight: 400,
  alignItems: "center",
  justifyContent: "flex-start",
  padding: "16px 0 7px",
  minHeight: "20px",
  minWidth: "auto",
  fontSize: 13,
  "&.Mui-selected": {
    color: "#13715B",
  },
};

const tabListStyle = {
  minHeight: "20px",
  "& .MuiTabs-flexContainer": { columnGap: "34px" },
};

const tabPanelStyle = {
  padding: 0,
  pt: 10,
};

const ConfluenceDetail: React.FC = () => {
  const theme = useTheme();
  // const navigate = useNavigate();
  const [tabValue, setTabValue] = useState("about");
  const [confluenceData, setConfluenceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [controller, setController] = useState<AbortController | null>(null);

  const createAbortController = () => {
    if (controller) {
      controller.abort();
    }
    const newController = new AbortController();
    setController(newController);
    return newController.signal;
  };

  const fetchConfluenceData = async () => {
    const signal = createAbortController();
    if (signal.aborted) return;
    
    setIsLoading(true);
    try {
      const response = await getConfluenceIntegration({ signal });
      if (response?.data) {
        setConfluenceData(response.data);
      } else {
        setConfluenceData(null);
      }
    } catch (error) {
      console.error("Error fetching Confluence data:", error);
      // If error is 404, that's expected when no connection exists
      if ((error as any)?.response?.status !== 404) {
        console.error("Unexpected error fetching Confluence data:", error);
      }
      setConfluenceData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfluenceData();
    return () => {
      controller?.abort();
    };
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  return (
    <Stack className="vwhome" gap={theme.spacing(20)}>
      <PageBreadcrumbs 
        items={[
          { label: "Integrations", path: "/integrations" },
          { label: "Confluence", path: "/integrations/confluence" }
        ]}
        autoGenerate={false}
      />
      
      {/* Header */}
      <Stack gap={theme.spacing(8)}>
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 600,
            color: "#1A1919",
            marginBottom: theme.spacing(8),
          }}
        >
          Confluence
        </Typography>
        <Typography
          sx={{
            fontSize: 13,
            color: "#344054",
          }}
        >
          Sync evidence and link documentation from your Confluence spaces.
        </Typography>
      </Stack>

      {/* Tabs */}
      <Box sx={{ width: "100%" }}>
        <TabContext value={tabValue}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList
              onChange={handleTabChange}
              TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
              sx={tabListStyle}
            >
              <Tab
                sx={tabStyle}
                label="About"
                value="about"
                disableRipple
              />
              <Tab
                sx={tabStyle}
                label="Connection"
                value="connection"
                disableRipple
              />
              <Tab
                sx={tabStyle}
                label="Permissions"
                value="permissions"
                disableRipple
              />
              <Tab
                sx={tabStyle}
                label="Troubleshooting"
                value="troubleshooting"
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
          
          <TabPanel value="about" sx={tabPanelStyle}>
          <Stack gap={theme.spacing(8)}>
            <Typography sx={{ fontSize: 15, fontWeight: 600 }}>About Confluence Integration</Typography>
            <Typography sx={{ fontSize: 13, lineHeight: 1.4 }}>
              Connect your Atlassian Confluence instance to VerifyWise using API Token authentication 
              to automatically sync documentation and evidence from your Confluence spaces. This integration
              allows you to:
            </Typography>
            <Box component="ul" sx={{ pl: theme.spacing(8), fontSize: 13, lineHeight: 1.4, "& li": { mb: theme.spacing(2) } }}>
              <li>Access Confluence pages as evidence in VerifyWise</li>
              <li>Link documentation directly from your compliance workflows</li>
              <li>Keep your evidence up-to-date with automatic syncing</li>
              <li>Maintain security with your existing Confluence user permissions</li>
              <li>Use secure API token authentication (no OAuth setup required)</li>
            </Box>
            
            <Typography sx={{ fontSize: 13, fontWeight: 500, mt: theme.spacing(4) }}>Authentication Method</Typography>
            <Typography sx={{ fontSize: 13, lineHeight: 1.4 }}>
              This integration uses <strong>API Token authentication</strong>, which is simple and secure. 
              You'll need to generate an API token from your Atlassian account and provide your 
              Confluence email and domain. The integration will inherit your existing permissions 
              in Confluence.
            </Typography>
          </Stack>
          </TabPanel>
          
          <TabPanel value="connection" sx={tabPanelStyle}>
            {isLoading ? (
              <CustomizableSkeleton height={300} />
            ) : (
              <ConnectionPanel 
                provider="confluence"
                status={confluenceData?.status || "not_connected"}
                lastSync={confluenceData?.last_sync_at}
                connectedSite={confluenceData?.configuration?.site_url}
                onStatusChange={fetchConfluenceData}
              />
            )}
          </TabPanel>
          
          <TabPanel value="permissions" sx={tabPanelStyle}>
          <Stack gap={theme.spacing(8)}>
            <Typography sx={{ fontSize: 15, fontWeight: 600 }}>API Token Permissions</Typography>
            <Typography sx={{ fontSize: 13, lineHeight: 1.4 }}>
              This integration uses API Token authentication with the following access:
            </Typography>
            <Box component="ul" sx={{ pl: theme.spacing(8), fontSize: 13, lineHeight: 1.4, "& li": { mb: theme.spacing(2) } }}>
              <li><strong>Space Access</strong> - Read space information and structure</li>
              <li><strong>Content Access</strong> - Read pages, attachments, and metadata</li>
              <li><strong>User Information</strong> - Access basic profile information</li>
            </Box>
            <Typography sx={{ fontSize: 13, fontStyle: "italic", color: theme.palette.text.secondary, lineHeight: 1.4 }}>
              API tokens inherit your user permissions in Confluence. The integration can only access content that your Confluence user account can access.
            </Typography>
          </Stack>
          </TabPanel>
          
          <TabPanel value="troubleshooting" sx={tabPanelStyle}>
          <Stack gap={theme.spacing(8)}>
            <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Troubleshooting</Typography>
            <Stack gap={theme.spacing(6)}>
              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Connection Issues</Typography>
              <Typography sx={{ fontSize: 13, lineHeight: 1.4 }}>
                If you're having trouble connecting to Confluence with your API token, try these steps:
              </Typography>
              <Box component="ul" sx={{ pl: theme.spacing(8), fontSize: 13, lineHeight: 1.4, "& li": { mb: theme.spacing(2) } }}>
                <li>Verify your API token is correct and hasn't expired</li>
                <li>Check that your email address matches your Confluence account</li>
                <li>Ensure your Confluence domain is correct (e.g., yourcompany.atlassian.net)</li>
                <li>Confirm your Confluence instance is accessible from the internet</li>
                <li>Try generating a new API token if the current one isn't working</li>
              </Box>
              
              <Typography sx={{ fontSize: 13, fontWeight: 500, mt: theme.spacing(4) }}>API Token Setup</Typography>
              <Typography sx={{ fontSize: 13, lineHeight: 1.4 }}>
                To create an API token:
              </Typography>
              <Box component="ol" sx={{ pl: theme.spacing(8), fontSize: 13, lineHeight: 1.4, "& li": { mb: theme.spacing(2) } }}>
                <li>Go to <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" style={{ color: "#13715B" }}>Atlassian Account Settings</a></li>
                <li>Click "Create API token"</li>
                <li>Give your token a descriptive name (e.g., "VerifyWise Integration")</li>
                <li>Copy the token immediately (it won't be shown again)</li>
                <li>Paste it in the Settings tab</li>
              </Box>
            </Stack>
          </Stack>
          </TabPanel>

          <TabPanel value="settings" sx={tabPanelStyle}>
            <ConfluenceSettings />
          </TabPanel>
        </TabContext>
      </Box>
    </Stack>
  );
};

export default ConfluenceDetail;