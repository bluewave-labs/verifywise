import React from "react";
import { Select, MenuItem, FormControl } from "@mui/material";
import { dropdownStyles, inputStyles } from "./style";
import { ProjectFilterDropdownProps } from "../../../../../domain/interfaces/iDropdown";

const ProjectFilterDropdown: React.FC<ProjectFilterDropdownProps> = ({
  projects,
  selectedProject,
  onChange,
}) => {
  //remove duplicate projects
  const uniqueProjects = Array.from(
    new Map(projects.map((project) => [project.name.toLowerCase(), project])).values()
  );
  console.log("Unique Projects in Dropdown:", uniqueProjects); // Debugging log
  return (
    <FormControl
      sx={{
        ...inputStyles,
        marginBottom: 10,
      }}
    >
      <Select
        id="project-filter"
        value={selectedProject || ""}
        onChange={(e) => onChange(e.target.value || null)}
        displayEmpty
        sx={{
          ...inputStyles,
          ...dropdownStyles,
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
