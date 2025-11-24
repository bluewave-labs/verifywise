import { useState, useMemo, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import ProjectCard from "../Cards/ProjectCard";
import ProjectTableView from "./ProjectTableView";
import NoProject from "../NoProject/NoProject";
import ViewToggle from "../ViewToggle";
import { usePersistedViewMode } from "../../hooks/usePersistedViewMode";
import Select from "../Inputs/Select";
import { getAllUsers } from "../../../application/repository/user.repository";
import { IProjectListProps } from "../../../domain/interfaces/i.project";
import { IProjectFilterState } from "../../../domain/interfaces/i.project.filter";
import { SearchBox } from "../Search";
import { ExportMenu } from "../Table/ExportMenu";

import {
  projectWrapperStyle,
  noProjectsTextStyle,
  vwhomeBodyProjectsGrid,
} from "./style";

const ProjectList = ({ projects, newProjectButton, onFilterChange }: IProjectListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = usePersistedViewMode(
    "projects-view-mode",
    "card"
  );

  const [filters, setFilters] = useState<IProjectFilterState>({
    riskLevel: "all",
    owner: "all",
    status: "all",
  });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersResponse = await getAllUsers();
        setUsers(usersResponse.data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (projects.length > 0) {
      fetchUsers();
    }
  }, [projects.length]);

  const getUserNameById = (userId: string): string => {
    const user = users.find((u) => u.id.toString() === userId.toString());
    if (user) {
      const firstName =
        user.firstName || user.first_name || user.name?.split(" ")[0] || "";
      const lastName =
        user.lastName || user.last_name || user.surname || user.name?.split(" ")[1] || "";
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || user.email || `User ${userId}`;
    }
    return userId;
  };

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Apply filters
    if (filters.riskLevel !== "all") {
      result = result.filter((project) => {
        const riskLevel = (project.ai_risk_classification || "").toLowerCase();
        switch (filters.riskLevel) {
          case "high":
            return riskLevel.includes("high");
          case "limited":
            return riskLevel.includes("limited");
          case "minimal":
            return riskLevel.includes("minimal");
          default:
            return true;
        }
      });
    }

    if (filters.owner !== "all") {
      result = result.filter((project) => {
        return project.owner?.toString() === filters.owner;
      });
    }

    if (filters.status !== "all") {
      result = result.filter((project) => {
        return project.status?.toLowerCase() === filters.status.toLowerCase();
      });
    }

    // Apply search filter last 
    // Search by project title or uc_id
    if (searchTerm) {
      result = result.filter((p) =>
        p.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.uc_id && p.uc_id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return result;
  }, [projects, searchTerm, filters]);

  const handleFilterChange = (key: keyof IProjectFilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(filteredProjects, newFilters);
    }
  };

  // Extracted render logic
  const renderProjects = () => {
    if (!projects || projects.length === 0) {
      return viewMode === "table" ? (
        <ProjectTableView projects={[]} />
      ) : (
        <NoProject message="A use case is a real-world scenario describing how an AI system is applied within an organization. Currently you don't have any use cases in this workspace. You can either create a demo use case, or click on the 'New use case' button to start with one." />
      );
    }

    if (filteredProjects.length === 0) {
      return viewMode === "table" ? (
        <ProjectTableView projects={[]} />
      ) : (
        <Typography variant="body1" sx={noProjectsTextStyle}>
          No use cases found. Try another search term or create a new use case.
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

  const getUniqueOwners = () => {
    const ownerIds = new Set<string>();
    projects.forEach((project) => {
      if (project.owner) {
        ownerIds.add(project.owner.toString());
      }
    });

    return Array.from(ownerIds)
      .sort()
      .map((ownerId) => ({
        id: ownerId,
        name: getUserNameById(ownerId),
      }));
  };

  const getUniqueStatuses = () => {
    const statuses = new Set<string>();
    projects.forEach((project) => {
      if (project.status) {
        statuses.add(project.status);
      }
    });

    return Array.from(statuses).sort().map((status) => ({
      id: status.toLowerCase(),
      name: status,
    }));
  };

  const uniqueOwners = getUniqueOwners();
  const uniqueStatuses = getUniqueStatuses();

  // Export columns and data for use cases
  const exportColumns = useMemo(() => {
    return [
      { id: 'uc_id', label: 'Use Case ID' },
      { id: 'project_title', label: 'Use Case Title' },
      { id: 'ai_risk_classification', label: 'AI Risk Level' },
      { id: 'type_of_high_risk_role', label: 'Role' },
      { id: 'start_date', label: 'Start Date' },
      { id: 'last_updated', label: 'Last Updated' },
      { id: 'owner', label: 'Owner' },
      { id: 'status', label: 'Status' },
    ];
  }, []);

  const exportData = useMemo(() => {
    return filteredProjects.map((project) => {
      const ownerName = project.owner ? getUserNameById(project.owner.toString()) : '-';

      return {
        uc_id: project.uc_id || project.id?.toString() || '-',
        project_title: project.project_title || '-',
        ai_risk_classification: project.ai_risk_classification || '-',
        type_of_high_risk_role: project.type_of_high_risk_role?.replace(/_/g, ' ') || '-',
        start_date: project.start_date ? new Date(project.start_date).toLocaleDateString() : '-',
        last_updated: project.last_updated ? new Date(project.last_updated).toLocaleDateString() : '-',
        owner: ownerName,
        status: project.status || '-',
      };
    });
  }, [filteredProjects, users]);

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          mb: "16px",
        }}
      >
        <Box sx={{ display: "flex", gap: "16px", alignItems: "flex-end", flex: 1 }}>
          {projects && projects.length > 0 && (
            <>
              <Select
                id="risk-level-filter"
                label="Risk level"
                value={filters.riskLevel}
                items={[
                  { _id: "all", name: "All Levels" },
                  { _id: "high", name: "High Risk" },
                  { _id: "limited", name: "Limited Risk" },
                  { _id: "minimal", name: "Minimal Risk" },
                ]}
                onChange={(e) => handleFilterChange("riskLevel", e.target.value.toString())}
                sx={{ minWidth: 140 }}
              />

              <Select
                id="owner-filter"
                label="Owner"
                value={filters.owner}
                items={[
                  { _id: "all", name: "All Owners" },
                  ...uniqueOwners.map((owner) => ({
                    _id: owner.id,
                    name: owner.name,
                  })),
                ]}
                onChange={(e) => handleFilterChange("owner", e.target.value.toString())}
                sx={{ minWidth: 140 }}
              />

              <Select
                id="status-filter"
                label="Status"
                value={filters.status}
                items={[
                  { _id: "all", name: "All Statuses" },
                  ...uniqueStatuses.map((status) => ({
                    _id: status.id,
                    name: status.name,
                  })),
                ]}
                onChange={(e) => handleFilterChange("status", e.target.value.toString())}
                sx={{ minWidth: 140 }}
              />

              <Box sx={{ width: 300 }}>
                <SearchBox
                  placeholder="Search use cases..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                  inputProps={{ "aria-label": "Search use cases" }}
                />
              </Box>
            </>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          {projects && projects.length > 0 && (
            <ExportMenu
              data={exportData}
              columns={exportColumns}
              filename="use-cases"
              title="Use Cases"
            />
          )}
          {newProjectButton}
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
