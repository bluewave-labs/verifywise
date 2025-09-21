import { Box, Button, Stack, Tab, Typography, useTheme } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import React, { useEffect } from "react";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Overview from "./Overview";
import RisksView from "./RisksView";
import ProjectSettings from "./ProjectSettings";
import emptyStateImg from "../../assets/imgs/empty-state.svg";
import useProjectRisks from "../../../application/hooks/useProjectRisks";
import useVendorRisks from "../../../application/hooks/useVendorRisks";
import { useSearchParams } from "react-router-dom";
import useProjectData from "../../../application/hooks/useProjectData";
import { getProjectById } from "../../../application/repository/project.repository";
import {
  tabStyle,
  noProjectContainerStyle,
  noProjectImageStyle,
  noProjectDescriptionStyle,
  newProjectButtonStyle,
  projectTitleStyle,
  projectDescriptionStyle,
  tabContainerStyle,
  tabListContainerStyle,
  tabListStyle,
} from "./styles";

const ProjectView = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "1";

  const { project, setProject } = useProjectData({ projectId });
  const {
    projectRisks,
    loadingProjectRisks,
    error: errorFetchingProjectRisks,
    projectRisksSummary,
  } = useProjectRisks({ projectId: parseInt(projectId) });
  const {
    error: errorFetchingVendorRisks,
    // vendorRisks,
    // vendorRisksSummary,
  } = useVendorRisks({ projectId });

  const theme = useTheme();
  const disableRipple =
    theme.components?.MuiButton?.defaultProps?.disableRipple;

  const [value, setValue] = React.useState("overview");
  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const noProject =
    !project ||
    project.project_title === "No Project found" ||
    Object.keys(project).length === 0;

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const project = await getProjectById({
          id: projectId,
        });
        setProject(project);
      } catch (error) {
        console.error("Error fetching project:", error);
      }
    };
    fetchProject();
  }, [projectId, setProject]);

  if (loadingProjectRisks) {
    return <Typography>Loading project risks...</Typography>;
  }
  if (errorFetchingProjectRisks) {
    return (
      <Typography>
        Error fetching project risks. {errorFetchingProjectRisks}
      </Typography>
    );
  }
  if (errorFetchingVendorRisks) {
    return (
      <Typography>
        Error fetching vendor risks. {errorFetchingVendorRisks}
      </Typography>
    );
  }

  return (
    <Stack>
      <PageBreadcrumbs showDivider={false} />
      {noProject ? (
        //no project found template
        <Box sx={noProjectContainerStyle}>
          {/* empty state image */}
          <Box sx={noProjectImageStyle}>
            <img
              src={emptyStateImg}
              alt="No project found"
            />
          </Box>

          {/* Subtitle */}
          <Typography
            variant="body2"
            sx={noProjectDescriptionStyle}
          >
            No projects found. Create a new project to start with.
          </Typography>
          {/* new project button */}
          <Button
            variant="contained"
            color="primary"
            onClick={() => {}}
            sx={newProjectButtonStyle}
          >
            New Project
          </Button>
        </Box>
      ) : (
        <Stack>
          <Typography sx={projectTitleStyle}>
            {project.project_title} project overview
          </Typography>
          <Typography sx={projectDescriptionStyle}>
            This project includes all the governance process status of the{" "}
            {project.project_title} project.
          </Typography>
          <Stack sx={tabContainerStyle}>
            <TabContext value={value}>
              <Box sx={tabListContainerStyle}>
                <TabList
                  onChange={handleChange}
                  aria-label="project view tabs"
                  sx={tabListStyle}
                >
                  <Tab
                    label="Overview"
                    value="overview"
                    sx={tabStyle}
                    disableRipple={disableRipple}
                  />
                  <Tab
                    label="Project risks"
                    value="project-risks"
                    sx={tabStyle}
                    disableRipple={disableRipple}
                  />
                  <Tab
                    label="Settings"
                    value="settings"
                    sx={tabStyle}
                    disableRipple={disableRipple}
                  />
                </TabList>
              </Box>
              {/* overview panel */}
              <TabPanel value="overview" sx={{ p: "32px 0 0" }}>
                <Overview projectRisksSummary={projectRisksSummary} />
              </TabPanel>
              <TabPanel value="project-risks" sx={{ p: "32px 0 0" }}>
                <RisksView
                  risksSummary={projectRisksSummary}
                  risksData={projectRisks}
                  title="Project"
                  projectId={projectId}
                />
              </TabPanel>
              {/* <TabPanel value="vendor-risks" sx={{ p: "32px 0 0" }}>
                <RisksView
                  risksSummary={vendorRisksSummary}
                  risksData={vendorRisks}
                  title="Vendor"
                  projectId={projectId}
                />
              </TabPanel> */}
              <TabPanel value="settings" sx={{ p: "32px 0 0" }}>
                <ProjectSettings />
              </TabPanel>
            </TabContext>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};

export default ProjectView;
