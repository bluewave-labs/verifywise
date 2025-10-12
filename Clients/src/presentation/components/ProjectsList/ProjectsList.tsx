// New component file: ProjectList.tsx
import { useState, useMemo } from "react";
import { Box, Typography, InputBase, IconButton } from "@mui/material";
import { Search as SearchIcon, CirclePlus as AddCircleOutlineIcon } from "lucide-react";
import ProjectCard from "../Cards/ProjectCard";
import ProjectTableView from "./ProjectTableView";
import NoProject from "../NoProject/NoProject";
import ViewToggle from "../ViewToggle";
import CustomizableButton from "../Button/CustomizableButton";
import allowedRoles from "../../../application/constants/permissions";
import { usePersistedViewMode } from "../../hooks/usePersistedViewMode";

import { Project } from "../../../domain/types/Project";
import {
  searchBoxStyle,
  inputStyle,
  projectWrapperStyle,
  noProjectsTextStyle,
  vwhomeBodyProjectsGrid,
} from "./style";

interface ProjectListProps {
  projects: Project[];
  onNewProject?: () => void;
  userRoleName?: string;
  newProjectButtonRef?: React.RefObject<HTMLElement>;
}

const ProjectList = ({ projects, onNewProject, userRoleName, newProjectButtonRef }: ProjectListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const [viewMode, setViewMode] = usePersistedViewMode(
    "projects-view-mode",
    "card"
  );

  // Filter projects with memoization
  const filteredProjects = useMemo(() => {
    return projects.filter((p) =>
      p.project_title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  // Extracted render logic
  const renderProjects = () => {
    if (!projects || projects.length === 0) {
      return viewMode === "table" ? (
        <ProjectTableView projects={[]} />
      ) : (
        <NoProject message="A project is a use-case, AI product or an algorithm. Currently you don't have any projects in this workspace. You can either create a demo project, or click on the 'New project' button to start with one." />
      );
    }

    if (filteredProjects.length === 0) {
      return viewMode === "table" ? (
        <ProjectTableView projects={[]} />
      ) : (
        <Typography variant="body1" sx={noProjectsTextStyle}>
          No projects found. Try another search term or create a new project.
        </Typography>
      );
    }

    if (viewMode === "table") {
      return <ProjectTableView projects={filteredProjects} />;
    }

    if (filteredProjects.length <= 3) {
      return (
        <Box sx={projectWrapperStyle(filteredProjects.length)}>
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </Box>
      );
    }

    return (
      <Box sx={vwhomeBodyProjectsGrid}>
        {filteredProjects.map((project) => (
          <Box key={project.id} sx={{ gridColumn: "span 1" }}>
            <ProjectCard project={project} />
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Controls Row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: "16px",
        }}
      >
        {/* Left Side: Search Box */}
        <Box sx={searchBoxStyle(isSearchBarVisible)}>
          <IconButton
            disableRipple
            disableFocusRipple
            sx={{ "&:hover": { backgroundColor: "transparent" } }}
            aria-label="Toggle project search"
            aria-expanded={isSearchBarVisible}
            onClick={() => setIsSearchBarVisible((prev) => !prev)}
          >
            <SearchIcon size={16} />
          </IconButton>

          {isSearchBarVisible && (
            <InputBase
              autoFocus
              placeholder="Search projects..."
              inputProps={{ "aria-label": "Search projects" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={inputStyle(isSearchBarVisible)}
            />
          )}
        </Box>

        {/* Right Side: New Project Button + View Toggle */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* New Project Button */}
          {onNewProject && (
            <div data-joyride-id="new-project-button" ref={newProjectButtonRef}>
              <CustomizableButton
                variant="contained"
                text="New project"
                sx={{
                  backgroundColor: "#13715B",
                  border: "1px solid #13715B",
                  gap: 2,
                }}
                icon={<AddCircleOutlineIcon size={16} />}
                onClick={onNewProject}
                isDisabled={
                  userRoleName ? !allowedRoles.projects.create.includes(userRoleName) : false
                }
              />
            </div>
          )}

          {/* View Toggle */}
          {projects && projects.length > 0 && (
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          )}
        </Box>
      </Box>

      {/* Projects List */}
      {renderProjects()}
    </Box>
  );
};

export default ProjectList;
