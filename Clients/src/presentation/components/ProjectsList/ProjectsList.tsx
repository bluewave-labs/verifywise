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
import { GroupBy } from "../Table/GroupBy";
import { useTableGrouping, useGroupByState } from "../../../application/hooks/useTableGrouping";
import { GroupedTableView } from "../Table/GroupedTableView";
import { Project } from "../../../domain/types/Project";

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

  // GroupBy state
  const { groupBy, groupSortOrder, handleGroupChange } = useGroupByState();

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

  // Define how to get the group key for each project/use case
  const getProjectGroupKey = (project: Project, field: string): string | string[] => {
    switch (field) {
      case 'risk_level':
        return project.ai_risk_classification || 'Unknown';
      case 'role':
        return project.type_of_high_risk_role ? project.type_of_high_risk_role.replace(/_/g, " ") : 'Unknown';
      case 'owner':
        if (project.owner) {
          return getUserNameById(project.owner.toString());
        }
        return 'Unassigned';
      case 'status':
        return project.status || 'Unknown';
      default:
        return 'Other';
    }
  };

  // Apply grouping to filtered projects (only for table view)
  const groupedProjects = useTableGrouping({
    data: filteredProjects,
    groupByField: viewMode === 'table' ? groupBy : null,
    sortOrder: groupSortOrder,
    getGroupKey: getProjectGroupKey,
  });

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
      return (
        <GroupedTableView
          groupedData={groupedProjects}
          ungroupedData={filteredProjects}
          renderTable={(data, options) => (
            <ProjectTableView
              projects={data}
              hidePagination={options?.hidePagination}
            />
          )}
        />
      );
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

              {viewMode === 'table' && (
                <GroupBy
                  options={[
                    { id: 'risk_level', label: 'Risk level' },
                    { id: 'role', label: 'Role' },
                    { id: 'owner', label: 'Owner' },
                    { id: 'status', label: 'Status' },
                  ]}
                  onGroupChange={handleGroupChange}
                />
              )}
            </>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: "16px",
          }}
        >
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
