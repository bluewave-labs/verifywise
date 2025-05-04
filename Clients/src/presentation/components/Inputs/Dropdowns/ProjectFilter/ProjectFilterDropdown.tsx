import React from "react";
import { Select, MenuItem, FormControl, InputLabel } from "@mui/material";

interface ProjectFilterDropdownProps {
  projects: { id: string; name: string }[];
  selectedProject: string | null;
  onChange: (projectId: string | null) => void;
}

const ProjectFilterDropdown: React.FC<ProjectFilterDropdownProps> = ({
  projects,
  selectedProject,
  onChange,
}) => {
  return (
    <FormControl fullWidth>
      <InputLabel id="project-filter-label">Filter by Project</InputLabel>
      <Select
        labelId="project-filter-label"
        value={selectedProject || ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <MenuItem value="">All Files</MenuItem>
        {projects.map((project) => (
          <MenuItem key={project.id} value={project.id}>
            {project.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ProjectFilterDropdown;
