import { FC } from "react";
import { Button } from "@mui/material";
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

const ProjectsOverview: FC = () => (
    <div>
        <div>Projects overview</div>
        <Button variant="contained">New project</Button>
        <div>
            {projects.map((item) => <ProjectCard {...item }/>)}
        </div>
        
    </div>
);

export default ProjectsOverview;