import { useState, useEffect, useMemo } from "react";
import { Box, Button, Tab, Alert } from "@mui/material";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import { tabStyle, tabPanelStyle } from "../V1.0ProjectView/style";
import VWSkeleton from "../../../vw-v2-components/Skeletons";
import ComplianceTracker from "../../../pages/ComplianceTracker/1.0ComplianceTracker";
import { Project } from "../../../../domain/types/Project";
import AssessmentTracker from "../../Assessment/1.0AssessmentTracker";
import useFrameworks from "../../../../application/hooks/useFrameworks";
import AddFrameworkModal from "../AddNewFramework";

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

// Constants
const FRAMEWORK_IDS = {
  EU_AI_ACT: 1,
  ISO_42001: 2,
} as const;

const TRACKER_TABS = [
  { label: "Compliance tracker", value: "compliance" },
  { label: "Assessment tracker", value: "assessment" },
] as const;

const ISO_42001_TABS = [
  { label: "Clauses", value: "clauses" },
  { label: "Annexes", value: "annexes" },
] as const;

type TrackerTab = (typeof TRACKER_TABS)[number]["value"];
type ISO42001Tab = (typeof ISO_42001_TABS)[number]["value"];

// interface Framework {
//   id: number;
//   name: string;
//   description: string;
//   is_demo: boolean;
//   project_id: string;
// }

const ProjectFrameworks = ({ project }: { project: Project }) => {
  const { frameworks, loading, error, refreshFrameworks } = useFrameworks();
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<number | null>(
    null
  );
  const [tracker, setTracker] = useState<TrackerTab | ISO42001Tab>(
    "compliance"
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const associatedFrameworkIds =
    project.framework?.map((f) => f.framework_id) || [];

  const projectFrameworks = useMemo(
    () => [
      ...frameworks.filter((fw) =>
        associatedFrameworkIds.includes(Number(fw.id))
      ),
      {
        id: FRAMEWORK_IDS.ISO_42001,
        name: "ISO 42001",
        description:
          "ISO 42001 is a framework for managing and improving the quality of products and services.",
        is_demo: false,
        project_id: "",
      },
    ],
    [frameworks, associatedFrameworkIds]
  );

  // Set initial framework when frameworks are loaded
  useEffect(() => {
    if (!loading && projectFrameworks.length > 0) {
      const validIds = projectFrameworks.map((fw) => Number(fw.id));
      if (!selectedFrameworkId || !validIds.includes(selectedFrameworkId)) {
        const initialFramework = projectFrameworks[0];
        setSelectedFrameworkId(Number(initialFramework.id));
        setTracker(
          Number(initialFramework.id) === FRAMEWORK_IDS.ISO_42001
            ? "clauses"
            : "compliance"
        );
      }
    }
  }, [loading, projectFrameworks, selectedFrameworkId]);

  // const currentFramework = useMemo(() =>
  //   frameworks.find(fw => Number(fw.id) === selectedFrameworkId),
  //   [frameworks, selectedFrameworkId]
  // );

  const handleFrameworkChange = (frameworkId: number) => {
    setSelectedFrameworkId(frameworkId);
    setTracker(
      frameworkId === FRAMEWORK_IDS.ISO_42001 ? "clauses" : "compliance"
    );
  };

  // const renderFrameworkContent = () => {
  //   if (!project) {
  //     return <VWSkeleton variant="rectangular" width="100%" height={400} />;
  //   }

  //   const isEUAIAct = Number(currentFramework?.id) === FRAMEWORK_IDS.EU_AI_ACT;
  //   const isISO42001 = Number(currentFramework?.id) === FRAMEWORK_IDS.ISO_42001;

  //   if (isEUAIAct) {
  //     return tracker === 'compliance' ? (
  //       <ComplianceTracker project={project} />
  //     ) : (
  //       <AssessmentTracker project={project} />
  //     );
  //   }

  //   if (isISO42001) {
  //     return tracker === 'clauses' ? (
  //       <ISO42001Clauses />
  //     ) : (
  //       <ISO42001Annex />
  //     );
  //   }

  //   return null;
  // };

  if (error) {
    return (
      <Box sx={containerStyle}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={refreshFrameworks} variant="contained">
          Retry
        </Button>
      </Box>
    );
  }

  const isISO42001 = Number(selectedFrameworkId) === FRAMEWORK_IDS.ISO_42001;
  const tabs = isISO42001 ? ISO_42001_TABS : TRACKER_TABS;

  return (
    <Box sx={containerStyle}>
      <Box sx={headerContainerStyle}>
        <Box sx={frameworkTabsContainerStyle}>
          {loading ? (
            <VWSkeleton variant="rectangular" width={200} height={40} />
          ) : (
            projectFrameworks.map((fw, idx) => (
              <Box
                key={fw.id}
                onClick={() => handleFrameworkChange(Number(fw.id))}
                sx={getFrameworkTabStyle(
                  selectedFrameworkId === Number(fw.id),
                  idx === projectFrameworks.length - 1
                )}
              >
                {fw.name}
              </Box>
            ))
          )}
        </Box>
        <Button
          variant="contained"
          sx={addButtonStyle}
          onClick={() => setIsModalOpen(true)}
        >
          Add new framework
        </Button>
      </Box>

      <AddFrameworkModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        frameworks={frameworks}
        project={project}
      />

      <TabContext value={tracker}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
          <TabList
            onChange={(_, v) => setTracker(v)}
            TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
            sx={tabListStyle}
          >
            {tabs.map((tab) => (
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
        {isISO42001 ? (
          <>
            <TabPanel value="clauses" sx={tabPanelStyle}>
              <ISO42001Clauses />
            </TabPanel>
            <TabPanel value="annexes" sx={tabPanelStyle}>
              <ISO42001Annex />
            </TabPanel>
          </>
        ) : (
          <>
            <TabPanel value="compliance" sx={tabPanelStyle}>
              <ComplianceTracker project={project} />
            </TabPanel>
            <TabPanel value="assessment" sx={tabPanelStyle}>
              <AssessmentTracker project={project} />
            </TabPanel>
          </>
        )}
      </TabContext>
    </Box>
  );
};

export default ProjectFrameworks;
