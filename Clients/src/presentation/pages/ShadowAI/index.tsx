import React from "react";
import { Box, Tab } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { useLocation, useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import Events from "./Events";
import Inventory from "./Inventory";
import Policies from "./Policies";
import Violations from "./Violations";
import Reviews from "./Reviews";
import Evidence from "./Evidence";
import Connectors from "./Connectors";

const TAB_MAP: Record<string, string> = {
  "/shadow-ai": "dashboard",
  "/shadow-ai/events": "events",
  "/shadow-ai/inventory": "inventory",
  "/shadow-ai/policies": "policies",
  "/shadow-ai/violations": "violations",
  "/shadow-ai/reviews": "reviews",
  "/shadow-ai/evidence": "evidence",
  "/shadow-ai/connectors": "connectors",
};

const REVERSE_TAB_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_MAP).map(([k, v]) => [v, k])
);

const ShadowAI: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab = TAB_MAP[location.pathname] || "dashboard";

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    navigate(REVERSE_TAB_MAP[newValue] || "/shadow-ai");
  };

  return (
    <Box sx={{ width: "100%", px: 3, py: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Box component="h1" sx={{ fontSize: 22, fontWeight: 600, m: 0, mb: 0.5 }}>
          Shadow AI
        </Box>
        <Box component="p" sx={{ fontSize: 13, color: "text.secondary", m: 0 }}>
          AI usage oversight and governance intelligence from your existing security stack
        </Box>
      </Box>

      <TabContext value={currentTab}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40, fontSize: 13, textTransform: "none" } }}
          >
            <Tab label="Dashboard" value="dashboard" />
            <Tab label="Events" value="events" />
            <Tab label="AI Inventory" value="inventory" />
            <Tab label="Policies" value="policies" />
            <Tab label="Violations" value="violations" />
            <Tab label="Reviews" value="reviews" />
            <Tab label="Evidence" value="evidence" />
            <Tab label="Connectors" value="connectors" />
          </TabList>
        </Box>

        <TabPanel value="dashboard" sx={{ p: 0, pt: 2 }}><Dashboard /></TabPanel>
        <TabPanel value="events" sx={{ p: 0, pt: 2 }}><Events /></TabPanel>
        <TabPanel value="inventory" sx={{ p: 0, pt: 2 }}><Inventory /></TabPanel>
        <TabPanel value="policies" sx={{ p: 0, pt: 2 }}><Policies /></TabPanel>
        <TabPanel value="violations" sx={{ p: 0, pt: 2 }}><Violations /></TabPanel>
        <TabPanel value="reviews" sx={{ p: 0, pt: 2 }}><Reviews /></TabPanel>
        <TabPanel value="evidence" sx={{ p: 0, pt: 2 }}><Evidence /></TabPanel>
        <TabPanel value="connectors" sx={{ p: 0, pt: 2 }}><Connectors /></TabPanel>
      </TabContext>
    </Box>
  );
};

export default ShadowAI;
