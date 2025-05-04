import React from "react";
import { Select, MenuItem, FormControl, Typography } from "@mui/material";

interface ProjectFilterDropdownProps {
  projects: { id: string; name: string }[];
  selectedProject: string | null;
  onChange: (projectId: string | null) => void;
}

const inputStyles = {
  minWidth: 100,
  maxWidth: 200,
  height: 34,
};

const ProjectFilterDropdown: React.FC<ProjectFilterDropdownProps> = ({
  projects,
  selectedProject,
  onChange,
}) => {
//remove duplicate projects
    const uniqueProjects = Array.from(
      new Map(
        projects.map((project) => [project.id.trim().toLowerCase(), project])
      ).values()
    );
  return (
    <FormControl
      sx={{
        ...inputStyles,
        marginBottom: 10,
      }}
    >
      <Typography
        sx={{
          fontSize: 13,
          marginBottom: 4,
        }}
      >
        Project:
      </Typography>
      <Select
        id="project-filter"
        value={selectedProject || ""}
        onChange={(e) => onChange(e.target.value || null)}
        displayEmpty
        sx={{
          ...inputStyles,
          borderRadius: 2,
          padding: "0 12px 0 0",
          fontSize: 13,
          color: "#111827",
        }}
      >
        <MenuItem value="">Select a project</MenuItem>
        <MenuItem value="all">All Files</MenuItem>
        {uniqueProjects.map((project) => (
          <MenuItem key={project.id} value={project.id}>
            {project.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ProjectFilterDropdown;
