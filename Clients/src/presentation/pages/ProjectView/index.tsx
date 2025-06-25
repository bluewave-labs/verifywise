import { Box, Button, Stack, Tab, Typography, useTheme } from "@mui/material";
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
import { getEntityById } from "../../../application/repository/entity.repository";

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

  const tabStyle = {
    textTransform: "none",
    fontWeight: 400,
    alignItems: "flex-start",
    justifyContent: "flex-end",
    padding: "16px 0 7px",
    minHeight: "20px",
  };

  const noProject =
    !project ||
    project.project_title === "No Project found" ||
    Object.keys(project).length === 0;

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const project = await getEntityById({
          routeUrl: `/projects/${projectId}`,
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
      {noProject ? (
        //no project found template
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            mt: "79px",
            mx: "auto",
            p: 10,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: "4px",
            width: { xs: "90%", sm: "90%", md: "1056px" },
            maxWidth: "100%",
            height: { xs: "100%", md: "418px" },
            backgroundColor: "#FFFFFF",
          }}
        >
          {/* empty state image */}
          <Box sx={{ mb: 8 }}>
            <img
              src={emptyStateImg}
              alt="No project found"
              style={{
                maxWidth: "100%",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </Box>

          {/* Subtitle */}
          <Typography
            variant="body2"
            sx={{
              mb: 12,
              color: theme.palette.text.secondary,
              fontSize: "13px",
            }}
          >
            No projects found. Create a new project to start with.
          </Typography>
          {/* new project button */}
          <Button
            variant="contained"
            color="primary"
            onClick={() => {}}
            sx={{
              textTransform: "none",
              borderRadius: "4px",
              py: 1.5,
              backgroundColor: "#4C7DE7",
              fontSize: "13px",
              padding: "10px 16px",
              width: "119px",
              height: "34px",
            }}
          >
            New Project
          </Button>
        </Box>
      ) : (
        <Stack>
          <Typography
            sx={{ color: "#1A1919", fontWeight: 600, mb: "6px", fontSize: 16 }}
          >
            {project.project_title} project overview
          </Typography>
          <Typography
            sx={{
              fontSize: theme.typography.fontSize,
              color: theme.palette.text.secondary,
            }}
          >
            This project includes all the governance process status of the{" "}
            {project.project_title} project.
          </Typography>
          <Stack
            sx={{ minWidth: "968px", overflowX: "auto", whiteSpace: "nowrap" }}
          >
            <TabContext value={value}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <TabList
                  onChange={handleChange}
                  aria-label="project view tabs"
                  sx={{
                    minHeight: "20px",
                    "& .MuiTabs-flexContainer": { columnGap: "34px" },
                  }}
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
