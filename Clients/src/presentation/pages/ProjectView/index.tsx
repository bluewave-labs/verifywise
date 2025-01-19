import { Box, Button, Stack, Tab, Typography, useTheme } from "@mui/material";
import projectOverviewData from "../../mocks/projects/project-overview.data";
import React from "react";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Overview from "./Overview";
import RisksView from "./RisksView";
import projectRisksData from "../../mocks/projects/project-risks.data";
import vendorRisksData from "../../mocks/projects/project-vendor-risks.data";
import ProjectSettings from "./ProjectSettings";
import emptyStateImg from "../../assets/imgs/empty-state.svg";

const ProjectView = ({ project = projectOverviewData }) => {
  //project will be { } for testing 
  const { projectTitle, projectRisks, vendorRisks } = project;
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
    projectTitle === "No Project found" ||
    Object.keys(project).length === 0;

  console.log("Project:", project);
  console.log("No project flag:", noProject);

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
            onClick={() => {
              console.log("redirect to create new project");
              //add naviagtion to new project
            }}
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
            {projectTitle} project overview
          </Typography>
          <Typography
            sx={{
              fontSize: theme.typography.fontSize,
              color: theme.palette.text.secondary,
            }}
          >
            This project includes all the governance process status of the
            Chatbot AI project.
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
                    label="Vendor risks"
                    value="vendor-risks"
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
                <Overview mocProject={project} />
              </TabPanel>
              <TabPanel value="project-risks" sx={{ p: "32px 0 0" }}>
                <RisksView
                  risksSummary={projectRisks}
                  risksData={projectRisksData}
                  title="Project"
                />
              </TabPanel>
              <TabPanel value="vendor-risks" sx={{ p: "32px 0 0" }}>
                <RisksView
                  risksSummary={vendorRisks}
                  risksData={vendorRisksData}
                  title="Vendor"
                />
              </TabPanel>
              <TabPanel value="settings" sx={{ p: "32px 0 0" }}>
                <ProjectSettings setTabValue={setValue} />
              </TabPanel>
            </TabContext>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};

export default ProjectView;
