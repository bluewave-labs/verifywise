import { Box, Stack, Tab, Typography } from "@mui/material";
import {
  projectViewHeaderDesc,
  projectViewHeaderTitle,
  tabPanelStyle,
  tabStyle,
} from "./style";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { SyntheticEvent, useState } from "react";
import TabContext from "@mui/lab/TabContext";
import VWProjectOverview from "./Overview";
import { useSearchParams } from "react-router-dom";
import VWSkeleton from "../../../vw-v2-components/Skeletons";
import VWProjectRisks from "./ProjectRisks";
import ProjectSettings from "../ProjectSettings";
import useProjectData from "../../../../application/hooks/useProjectData";
import ProjectFrameworks from "../ProjectFrameworks";
import VWToast from '../../../vw-v2-components/Toast';

const VWProjectView = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "1";
  const [refreshKey, setRefreshKey] = useState(0);
  const { project } = useProjectData({ projectId, refreshKey });

  const [value, setValue] = useState("overview");
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const handleChange = (_: SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const handleRefresh = (isTrigger: boolean, toastMessage?: string) => {
    if (isTrigger) {
      setRefreshKey((prevKey) => prevKey + 1); // send refresh trigger to projectdata hook
      if (toastMessage) {
        setToast({ message: toastMessage, visible: true });
        setTimeout(() => setToast({ message: '', visible: false }), 3000);
      }
    }
  };

  return (
    <Stack className="vw-project-view" overflow={"hidden"}>
      {toast.visible && <VWToast title={toast.message} />}
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
                label="Frameworks"
                value="frameworks"
                sx={tabStyle}
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
              // <></>
              <VWSkeleton variant="rectangular" width="100%" height={400} />
            )}
          </TabPanel>
          <TabPanel value="project-risks" sx={tabPanelStyle}>
            {project ? (
              // Render project risks content here
              <VWProjectRisks />
            ) : (
              <VWSkeleton variant="rectangular" width="100%" height={400} />
            )}
          </TabPanel>
          <TabPanel value="frameworks" sx={tabPanelStyle}>
            {project ? (
              // Render frameworks content here
              <ProjectFrameworks project={project} triggerRefresh={handleRefresh} />
            ) : (
              <VWSkeleton variant="rectangular" width="100%" height={400} />
            )}
          </TabPanel>
          <TabPanel value="settings" sx={tabPanelStyle}>
            {project ? (
              // Render settings content here
              <ProjectSettings triggerRefresh={handleRefresh} />
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
