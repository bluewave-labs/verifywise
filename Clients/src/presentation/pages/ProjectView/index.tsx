import { Box, Stack, Tab, Typography, useTheme } from "@mui/material";
import projectOverviewData from "../../mocks/projects/project-overview.data";
import React from "react";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Overview from "./Overview";
import RisksView from "./RisksView";
import projectRisksData from "../../mocks/projects/project-risks.data"
import vendorRisksData from "../../mocks/projects/project-vendor-risks.data";
import ProjectSettings from "./ProjectSettings";
      
const ProjectView = ({ project = projectOverviewData }) => {
    const { projectTitle, projectRisks, vendorRisks } = project;
    const theme = useTheme();
    const disableRipple = theme.components?.MuiButton?.defaultProps?.disableRipple;

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
        minHeight: "20px"
    };
      
    return (
        <Stack>
            <Typography sx={{ color: "#1A1919", fontWeight: 600, mb: "6px", fontSize: 16 }}>
                {projectTitle} project overview
            </Typography>
            <Typography sx={{ fontSize: theme.typography.fontSize, color: theme.palette.text.secondary }}>This project includes all the governance process status of the Chatbot AI project.</Typography>
            <Stack sx={{ minWidth: "968px", overflowX: "auto",  whiteSpace: "nowrap" }}>
                <TabContext value={value}>
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <TabList onChange={handleChange} aria-label="project view tabs" 
                            sx={{ minHeight: "20px", 
                                "& .MuiTabs-flexContainer": { columnGap: "34px" } }}
                        >
                            <Tab label="Overview" value="overview" sx={tabStyle} disableRipple={disableRipple} />
                            <Tab label="Project risks" value="project-risks" sx={tabStyle} disableRipple={disableRipple} />
                            <Tab label="Vendor risks" value="vendor-risks" sx={tabStyle} disableRipple={disableRipple} />
                            <Tab label="Settings" value="settings" sx={tabStyle} disableRipple={disableRipple} />
                        </TabList>
                    </Box>
                    <TabPanel value="overview" sx={{ p: "32px 0 0" }}><Overview mocProject={project} /></TabPanel>
                    <TabPanel value="project-risks" sx={{ p: "32px 0 0" }}>
                        <RisksView risksSummary={projectRisks} risksData={projectRisksData} title="Project" />
                    </TabPanel>
                    <TabPanel value="vendor-risks" sx={{ p: "32px 0 0" }}>
                        <RisksView risksSummary={vendorRisks} risksData={vendorRisksData} title="Vendor" />
                    </TabPanel>
                    <TabPanel value="settings" sx={{ p: "32px 0 0" }}>
                        <ProjectSettings setTabValue={setValue}/>
                    </TabPanel>
                </TabContext>
            </Stack>
        </Stack>
    )
};

export default ProjectView;