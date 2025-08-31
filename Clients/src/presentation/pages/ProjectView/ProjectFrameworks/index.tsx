import { useState, useEffect, useMemo, useContext } from "react";
import { Box, Button, Tab, Alert } from "@mui/material";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import { tabStyle, tabPanelStyle } from "../V1.0ProjectView/style";
import CustomizableSkeleton from "../../../vw-v2-components/Skeletons";
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
import allowedRoles from "../../../../application/constants/permissions";
import TabFilterBar from "../../../components/FrameworkFilter/TabFilterBar";
import { useSearchParams } from "react-router-dom";

const FRAMEWORK_IDS = {
  EU_AI_ACT: 1,
} as const;

const TRACKER_TABS = [
  { label: "Controls", value: "compliance" },
  { label: "Assessments", value: "assessment" },
] as const;

type TrackerTab = (typeof TRACKER_TABS)[number]["value"];

const ProjectFrameworks = ({
  project,
  triggerRefresh,
  initialFrameworkId,
}: {
  project: Project;
  triggerRefresh?: (isTrigger: boolean, toastMessage?: string) => void;
  initialFrameworkId: number;
}) => {
  const {
    filteredFrameworks,
    loading,
    error,
    refreshFilteredFrameworks,
    allFrameworks,
  } = useFrameworks({
    listOfFrameworks: project.framework,
  });
  const [selectedFrameworkId, setSelectedFrameworkId] =
    useState<number>(initialFrameworkId);
  const [tracker, setTracker] = useState<TrackerTab>("compliance");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const { changeComponentVisibility, userRoleName } =
    useContext(VerifyWiseContext);

  const { refs, allVisible } = useMultipleOnScreen<HTMLElement>({
    countToTrigger: 1,
  });

  const isManagingFrameworksDisabled =
    !allowedRoles.frameworks.manage.includes(userRoleName);

  useEffect(() => {
    changeComponentVisibility("projectFrameworks", allVisible);
    changeComponentVisibility(
      "compliance",
      tracker === "compliance" && allVisible
    );
  }, [allVisible, tracker, changeComponentVisibility]);

  const associatedFrameworkIds =
    project.framework?.map((f) => f.framework_id) || [];

  const projectFrameworks = useMemo(
    () =>
      filteredFrameworks.filter((fw: Framework) =>
        associatedFrameworkIds.includes(Number(fw.id))
      ),
    [filteredFrameworks, associatedFrameworkIds]
  );

  useEffect(() => {
    if (!loading && projectFrameworks.length > 0 && !hasInitialized) {
      const validIds = projectFrameworks.map((fw: Framework) => Number(fw.id));

      // If initialFrameworkId is provided and valid, use it
      if (initialFrameworkId && validIds.includes(initialFrameworkId)) {
        setSelectedFrameworkId(initialFrameworkId);
        setTracker(searchParams.get("controlId") ? "compliance" : "assessment");
      }
      // Otherwise, use the default logic
      else if (
        !selectedFrameworkId ||
        !validIds.includes(selectedFrameworkId)
      ) {
        const initialFramework = projectFrameworks[0];
        setSelectedFrameworkId(Number(initialFramework.id));
        setTracker("compliance");
      }

      setHasInitialized(true);
    }
  }, [
    loading,
    projectFrameworks,
    selectedFrameworkId,
    initialFrameworkId,
    hasInitialized,
  ]);

  const handleFrameworkChange = (frameworkId: number) => {
    searchParams.delete("framework");
    searchParams.delete("topicId");
    searchParams.delete("questionId");
    setSearchParams(searchParams);
    setSelectedFrameworkId(frameworkId);
    setTracker("compliance");
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

  const isEUAIAct = Number(selectedFrameworkId) === FRAMEWORK_IDS.EU_AI_ACT;
  const tabs = TRACKER_TABS;

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [applicabilityFilter, setApplicabilityFilter] = useState<string>("all");

  const euAIActStatusOptions = [
    { value: "waiting", label: "Waiting" },
    { value: "in progress", label: "In Progress" },
    { value: "done", label: "Done" },
  ];

  const euAIActAssessmentsOptions = [
    { value: "not started", label: "Not started" },
    { value: "in progress", label: "In Progress" },
    { value: "done", label: "Done" },
  ];

  const statusOptions = isEUAIAct
    ? tracker === "compliance"
      ? euAIActStatusOptions
      : euAIActAssessmentsOptions
    : [];

  useEffect(() => {
    setStatusFilter("");
    setApplicabilityFilter("");
  }, [tracker]);

  return (
    <Box sx={containerStyle}>
      <Box sx={headerContainerStyle}>
        <Box sx={frameworkTabsContainerStyle}>
          {loading ? (
            <CustomizableSkeleton
              variant="rectangular"
              width={200}
              height={40}
            />
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
          disabled={isManagingFrameworksDisabled}
        >
          Manage frameworks
        </Button>
      </Box>
      <TabFilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        applicabilityFilter={applicabilityFilter}
        onApplicabilityChange={setApplicabilityFilter}
        showStatusFilter={
          isEUAIAct && (tracker === "compliance" || tracker === "assessment")
        }
        showApplicabilityFilter={false}
        statusOptions={statusOptions}
      />

      <AddFrameworkModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        frameworks={allFrameworks}
        project={project}
        onFrameworksChanged={(action, frameworkId?: number) => {
          if (triggerRefresh) {
            if (action === "add")
              triggerRefresh(true, "Framework added successfully");
            else if (action === "remove") {
              triggerRefresh(true, "Framework removed successfully");
              // Find a framework whose id is not the removed one, and set its id as selected
              const nextFramework = project.framework.find(
                (f) => Number(f.framework_id) !== frameworkId
              );
              handleFrameworkChange(nextFramework?.framework_id!);
            } else triggerRefresh(true);
          }
          refreshFilteredFrameworks();
        }}
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
        {isEUAIAct ? (
          <>
            <TabPanel value="compliance" sx={tabPanelStyle}>
              <ComplianceTracker
                project={project}
                statusFilter={statusFilter}
              />
            </TabPanel>
            <TabPanel value="assessment" sx={tabPanelStyle}>
              <AssessmentTracker
                project={project}
                statusFilter={statusFilter}
              />
            </TabPanel>
          </>
        ) : (
          <TabPanel value="compliance" sx={tabPanelStyle}>
            <ComplianceTracker project={project} statusFilter={statusFilter} />
          </TabPanel>
        )}
      </TabContext>
    </Box>
  );
};

export default ProjectFrameworks;
