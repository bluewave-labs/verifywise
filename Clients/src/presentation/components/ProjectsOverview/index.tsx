import "./index.css";
import { FC } from "react";
import { Box, Typography } from "@mui/material";
import Button from '@mui/material/Button';
import ProjectCard from "./ProjectCard";

const projects = [
    {
        id: 1,
        name: "Marketing AI service",
        description: "This project includes all the governance process status of the Chatbot AI project implemented in the  company.",
        last_update: "23 January 2024",
        owner_name: "Adam McLawn",
        compliense_status: "85%",
        controls_completed: "10/92",
        requirements_completed: "7/49"
    },
    {
        id: 2,
        name: "Marketing AI service",
        description: "This project includes all the governance process status of the Chatbot AI project implemented in the  company.",
        last_update: "23 January 2024",
        owner_name: "Adam McLawn",
        compliense_status: "85%",
        controls_completed: "10/92",
        requirements_completed: "7/49"
    },
    {
        id: 3,
        name: "Marketing AI service",
        description: "This project includes all the governance process status of the Chatbot AI project implemented in the  company.",
        last_update: "23 January 2024",
        owner_name: "Adam McLawn",
        compliense_status: "85%",
        controls_completed: "10/92",
        requirements_completed: "7/49"
    }
];

const ProjectsOverview: FC = () => {
    return (
        <Box sx={{ pt: 36, pl: 20, pr: 20 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 11 }}>
                <Typography variant="h1" component="div" sx={{ color: '#1A1919', fontSize: 16, fontWeight: "bold" }}>
                    Projects overview
                </Typography>
                <Button variant="contained" sx={{ textTransform: "none", borderRadius: 4, maxHeight: 34 }}>
                    New project
                </Button>
            </Box>
        
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                {projects.map((item, i) => 
                    <Box key={i}> 
                        <ProjectCard {...item }/>
                    </Box>
                )}
            </Box>
        </Box>
    )
};

export default ProjectsOverview;