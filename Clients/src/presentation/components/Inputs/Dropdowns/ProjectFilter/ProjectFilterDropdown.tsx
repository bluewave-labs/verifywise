import React from "react";
import { Select, MenuItem, FormControl, useTheme } from "@mui/material";
import { dropdownStyles, inputStyles } from "./style";
import { ProjectFilterDropdownProps } from "../../../../../domain/interfaces/iDropdown";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const ProjectFilterDropdown: React.FC<ProjectFilterDropdownProps> = ({
  projects,
  selectedProject,
  onChange,
  sx
}) => {
  const theme = useTheme();
  return (
    <>
      <FormControl
        disabled={projects.length === 0}
      >
        <Select
          id="project-filter"
          value={selectedProject || ""}
          onChange={(e) => onChange(e.target.value)}
          displayEmpty
          IconComponent={KeyboardArrowDownIcon}
          sx={{
            ...inputStyles,
            ...dropdownStyles,
            ...sx,
            "& svg path": {
              fill: theme.palette.other.icon,
            }
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                borderRadius: theme.shape.borderRadius,
                boxShadow: theme.boxShadow,
                mt: 1,
                "& .MuiMenuItem-root": {
                  fontSize: 13,
                  color: theme.palette.text.primary,
                  "&:hover": {
                    backgroundColor: theme.palette.background.accent,
                  },
                  "&.Mui-selected": {
                    backgroundColor: theme.palette.background.accent,
                    "&:hover": {
                      backgroundColor: theme.palette.background.accent,
                    },
                  },
                  "& .MuiTouchRipple-root": {
                    display: "none",
                  },
                },
              },
            },
          }}
        >     
          {projects.length > 0 ? 
            <MenuItem value="all">All projects</MenuItem> : 
            <MenuItem value="all">No project available</MenuItem>
          }
          {projects.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              {project.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
};

export default ProjectFilterDropdown;
