import { useState } from "react";
import { Box, Button, Tab } from "@mui/material";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import { tabStyle, tabPanelStyle } from "../V1.0ProjectView/style";
import VWSkeleton from "../../../vw-v2-components/Skeletons";
import ComplianceTracker from "../../../pages/ComplianceTracker/1.0ComplianceTracker";
import { Project } from "../../../../domain/types/Project";
import AssessmentTracker from "../../Assessment/1.0AssessmentTracker";

import {
  containerStyle,
  headerContainerStyle,
  frameworkTabsContainerStyle,
  getFrameworkTabStyle,
  addButtonStyle,
  tabListStyle,
} from "./styles";
import ISO42001Annex from "../../ISO/Annex";
import ISO42001Clauses from "../../ISO/Clause";

const frameworks = [
  { label: "EU AI Act", value: "eu-ai-act" },
  { label: "ISO 42001", value: "iso-42001" },
];

const trackerTabs = [
  { label: "Compliance tracker", value: "compliance" },
  { label: "Assessment tracker", value: "assessment" },
];

const iso42001Tabs = [
  { label: "Clauses", value: "clauses" },
  { label: "Annexs", value: "annexs" },
];

const ProjectFrameworks = ({ project }: { project: Project }) => {
  const [framework, setFramework] = useState("eu-ai-act");
  const [tracker, setTracker] = useState("compliance");
  const [isoTab, setIsoTab] = useState("clauses");

  const currentTabs = framework === "iso-42001" ? iso42001Tabs : trackerTabs;
  const currentValue = framework === "iso-42001" ? isoTab : tracker;
  const setCurrentValue = framework === "iso-42001" ? setIsoTab : setTracker;

  return (
    <Box sx={containerStyle}>
      {/* Framework Tabs and Add Button */}
      <Box sx={headerContainerStyle}>
        {/* Framework Tabs as classic tabs, not buttons */}
        <Box sx={frameworkTabsContainerStyle}>
          {frameworks.map((fw, idx) => {
            const isActive = framework === fw.value;
            return (
              <Box
                key={fw.value}
                onClick={() => setFramework(fw.value)}
                sx={getFrameworkTabStyle(
                  isActive,
                  idx === frameworks.length - 1
                )}
              >
                {fw.label}
              </Box>
            );
          })}
        </Box>
        <Button variant="contained" sx={addButtonStyle}>
          Add new framework
        </Button>
      </Box>

      {/* Tracker Tabs */}
      <TabContext value={currentValue}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
          <TabList
            onChange={(_, v) => setCurrentValue(v)}
            TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
            sx={tabListStyle}
          >
            {currentTabs.map((tab) => (
              <Tab
                key={tab.value}
                sx={tabStyle}
                label={tab.label}
                value={tab.value}
                disableRipple
              />
            ))}
          </TabList>
        </Box>
        {framework === "iso-42001" ? (
          <>
            <TabPanel value="clauses" sx={tabPanelStyle}>
              {project ? (
                <ISO42001Clauses />
              ) : (
                <VWSkeleton variant="rectangular" width="100%" height={400} />
              )}
            </TabPanel>
            <TabPanel value="annexs" sx={tabPanelStyle}>
              {project ? (
                <ISO42001Annex />
              ) : (
                <VWSkeleton variant="rectangular" width="100%" height={400} />
              )}
            </TabPanel>
          </>
        ) : (
          <>
            <TabPanel value="compliance" sx={tabPanelStyle}>
              {project ? (
                <ComplianceTracker project={project} />
              ) : (
                <VWSkeleton variant="rectangular" width="100%" height={400} />
              )}
            </TabPanel>
            <TabPanel value="assessment" sx={tabPanelStyle}>
              {project ? (
                <AssessmentTracker project={project} />
              ) : (
                <VWSkeleton variant="rectangular" width="100%" height={400} />
              )}
            </TabPanel>
          </>
        )}
      </TabContext>
    </Box>
  );
};

export default ProjectFrameworks;
