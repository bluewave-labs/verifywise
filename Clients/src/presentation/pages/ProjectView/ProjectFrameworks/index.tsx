import { useState, useEffect, useMemo, useContext } from "react";
import { Box, Button, Tab, Alert } from "@mui/material";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import { tabStyle, tabPanelStyle } from "../V1.0ProjectView/style";
import VWSkeleton from "../../../vw-v2-components/Skeletons";
import ComplianceTracker from "../../../pages/ComplianceTracker/1.0ComplianceTracker";
import { Project } from "../../../../domain/types/Project";
import { Framework } from "../../../../domain/types/Framework";
import AssessmentTracker from "../../Assessment/1.0AssessmentTracker";
import useFrameworks from "../../../../application/hooks/useFrameworks";
import AddFrameworkModal from "../AddNewFramework";
import useMultipleOnScreen from "../../../../application/hooks/useMultipleOnScreen";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";

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

const ProjectFrameworks = ({ project }: { project: Project }) => {
  const { 
    filteredFrameworks, 
    loading, 
    error, 
    refreshFilteredFrameworks,
    allFrameworks
  } = useFrameworks({
    listOfFrameworks: project.framework,
  });
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<number | null>(
    null
  );
  const [tracker, setTracker] = useState<TrackerTab | ISO42001Tab>(
    "compliance"
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { changeComponentVisibility } = useContext(VerifyWiseContext);

  const { refs, allVisible } = useMultipleOnScreen<HTMLElement>({
    countToTrigger: 1,
  });

  useEffect(() => {
    changeComponentVisibility("projectFrameworks", allVisible);
    changeComponentVisibility(
      "compliance",
      tracker === "compliance" && allVisible
    );
    console.log("allVisible", allVisible);
  }, [allVisible, tracker, changeComponentVisibility]);

  const associatedFrameworkIds =
    project.framework?.map((f) => f.framework_id) || [];

  const projectFrameworks = useMemo(
    () =>
      // Filter frameworks to only include those associated with this project
      filteredFrameworks.filter((fw: Framework) => 
        associatedFrameworkIds.includes(Number(fw.id))
      ),
    [filteredFrameworks, associatedFrameworkIds]
  );

  useEffect(() => {
    if (!loading && projectFrameworks.length > 0) {
      const validIds = projectFrameworks.map((fw: Framework) => Number(fw.id));
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

  const handleFrameworkChange = (frameworkId: number) => {
    setSelectedFrameworkId(frameworkId);
    setTracker(
      frameworkId === FRAMEWORK_IDS.ISO_42001 ? "clauses" : "compliance"
    );
  };

  if (error) {
    return (
      <Box sx={containerStyle}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={refreshFilteredFrameworks} variant="contained">
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
            projectFrameworks.map((fw: Framework, idx: number) => (
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
        frameworks={allFrameworks}
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
                data-joyride-id={
                  tab.value === "compliance" ? "compliance-heading" : undefined
                }
                ref={tab.value === "compliance" ? refs[0] : undefined}
              />
            ))}
          </TabList>
        </Box>
        {isISO42001 ? (
          <>
            <TabPanel value="clauses" sx={tabPanelStyle}>
              <ISO42001Clauses
                project={project}
                framework_id={Number(selectedFrameworkId)}
                projectFrameworkId={Number(selectedFrameworkId)}
              />
            </TabPanel>
            <TabPanel value="annexes" sx={tabPanelStyle}>
              <ISO42001Annex
                project={project}
                framework_id={Number(selectedFrameworkId)}
                projectFrameworkId={Number(selectedFrameworkId)}
              />
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
