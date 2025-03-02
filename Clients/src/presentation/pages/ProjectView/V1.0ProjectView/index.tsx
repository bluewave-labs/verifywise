import { Box, Stack, Tab, Typography } from "@mui/material";
import {
  projectViewHeaderDesc,
  projectViewHeaderTitle,
  tabPanelStyle,
  tabStyle,
} from "./style";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { SyntheticEvent, useEffect, useState } from "react";
import TabContext from "@mui/lab/TabContext";
import VWProjectOverview from "./Overview";
import { useSearchParams } from "react-router-dom";
import { getEntityById } from "../../../../application/repository/entity.repository";
import { Project } from "../../../../domain/Project";
import VWSkeleton from "../../../vw-v2-components/Skeletons";

const VWProjectView = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [project, setProject] = useState<Project>();

  const [value, setValue] = useState("overview");
  const handleChange = (_: SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectData = await getEntityById({
          routeUrl: `/projects/${projectId}`,
        });
        console.log("Project data:", projectData.data);
        setProject(projectData.data);
      } catch (error) {
        console.error("Failed to fetch project data:", error);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  return (
    <Stack className="vw-project-view">
      <Stack className="vw-project-view-header" sx={{ mb: 10 }}>
        {project ? (
          <>
            <Typography sx={projectViewHeaderTitle}>
              {project.project_title} project view
            </Typography>
            <Typography sx={projectViewHeaderDesc}>
              This project includes all the governance process status of the{" "}
              {project.project_title} project
            </Typography>
          </>
        ) : (
          <>
            <VWSkeleton variant="text" width="60%" height={32} />
            <VWSkeleton variant="text" width="80%" height={24} />
          </>
        )}
      </Stack>
      <Stack className="vw-project-view-body">
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList
              onChange={handleChange}
              TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
              sx={{
                minHeight: "20px",
                "& .MuiTabs-flexContainer": { columnGap: "34px" },
              }}
            >
              <Tab
                sx={tabStyle}
                label="Overview"
                value="overview"
                disableRipple
              />
              <Tab
                sx={tabStyle}
                label="Project risks"
                value="project-risks"
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
          <TabPanel value="overview" sx={tabPanelStyle}>
            {project ? (
              <VWProjectOverview project={project} />
            ) : (
              <VWSkeleton variant="rectangular" width="100%" height={400} />
            )}
          </TabPanel>
          <TabPanel value="project-risks" sx={tabPanelStyle}>
            {project ? (
              // Render project risks content here
              <div>Project risks content</div>
            ) : (
              <VWSkeleton variant="rectangular" width="100%" height={400} />
            )}
          </TabPanel>
          <TabPanel value="settings" sx={tabPanelStyle}>
            {project ? (
              // Render settings content here
              <div>Settings content</div>
            ) : (
              <VWSkeleton variant="rectangular" width="100%" height={400} />
            )}
          </TabPanel>
        </TabContext>
      </Stack>
    </Stack>
  );
};

export default VWProjectView;
