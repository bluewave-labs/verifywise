import React from "react";
import { Select, MenuItem, FormControl } from "@mui/material";
import { dropdownStyles, inputStyles } from "./style";
import { ProjectFilterDropdownProps } from "../../../../../domain/interfaces/iDropdown";

const ProjectFilterDropdown: React.FC<ProjectFilterDropdownProps> = ({
  projects,
  selectedProject,
  onChange,
}) => {
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
        onChange={(e) => onChange(e.target.value)}
        displayEmpty
        sx={{
          ...inputStyles,
          ...dropdownStyles,
        }}
      >     
        <MenuItem value="all">All projects</MenuItem>
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
