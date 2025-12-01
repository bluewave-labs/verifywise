import { useState, useMemo, useEffect, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import ProjectCard from "../Cards/ProjectCard";
import ProjectTableView from "./ProjectTableView";
import NoProject from "../NoProject/NoProject";
import ViewToggle from "../ViewToggle";
import { usePersistedViewMode } from "../../hooks/usePersistedViewMode";
import { getAllUsers } from "../../../application/repository/user.repository";
import { IProjectListProps } from "../../../domain/interfaces/i.project";
import { SearchBox } from "../Search";
import { GroupBy } from "../Table/GroupBy";
import { useTableGrouping, useGroupByState } from "../../../application/hooks/useTableGrouping";
import { GroupedTableView } from "../Table/GroupedTableView";
import { Project } from "../../../domain/types/Project";
import { ExportMenu } from "../Table/ExportMenu";
import { FilterBy, FilterColumn } from "../Table/FilterBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";

import {
  projectWrapperStyle,
  noProjectsTextStyle,
  vwhomeBodyProjectsGrid,
} from "./style";

const ProjectList = ({ projects, newProjectButton }: IProjectListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = usePersistedViewMode(
    "projects-view-mode",
    "card"
  );

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

  // FilterBy - Dynamic options generators
  const getUniqueProjectOwners = useCallback(() => {
    const ownerIds = new Set<string>();
    projects.forEach((project) => {
      if (project.owner) {
        ownerIds.add(project.owner.toString());
      }
    });
    return Array.from(ownerIds)
      .sort()
      .map((ownerId) => ({
        value: ownerId,
        label: getUserNameById(ownerId),
      }));
  }, [projects, users]);

  const getUniqueProjectStatuses = useCallback(() => {
    const statuses = new Set<string>();
    projects.forEach((project) => {
      if (project.status) {
        statuses.add(project.status);
      }
    });
    return Array.from(statuses)
      .sort()
      .map((status) => ({
        value: status.toLowerCase(),
        label: status,
      }));
  }, [projects]);

  // FilterBy - Filter columns configuration
  const projectFilterColumns: FilterColumn[] = useMemo(() => [
    {
      id: 'project_title',
      label: 'Use case name',
      type: 'text' as const,
    },
    {
      id: 'ai_risk_classification',
      label: 'Risk level',
      type: 'select' as const,
      options: [
        { value: 'High Risk', label: 'High risk' },
        { value: 'Limited Risk', label: 'Limited risk' },
        { value: 'Minimal Risk', label: 'Minimal risk' },
      ],
    },
    {
      id: 'owner',
      label: 'Owner',
      type: 'select' as const,
      options: getUniqueProjectOwners(),
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select' as const,
      options: getUniqueProjectStatuses(),
    },
    {
      id: 'start_date',
      label: 'Start date',
      type: 'date' as const,
    },
  ], [getUniqueProjectOwners, getUniqueProjectStatuses]);

  // FilterBy - Field value getter
  const getProjectFieldValue = useCallback(
    (item: Project, fieldId: string): string | number | Date | null | undefined => {
      switch (fieldId) {
        case 'project_title':
          return item.project_title;
        case 'ai_risk_classification':
          return item.ai_risk_classification;
        case 'owner':
          return item.owner?.toString();
        case 'status':
          return item.status?.toLowerCase();
        case 'start_date':
          return item.start_date;
        default:
          return null;
      }
    },
    []
  );

  // FilterBy - Initialize hook
  const { filterData: filterProjectData, handleFilterChange: handleProjectFilterChange } = useFilterBy<Project>(getProjectFieldValue);

  // Filter projects using FilterBy and search
  const filteredProjects = useMemo(() => {
    // First apply FilterBy conditions
    let result = filterProjectData(projects);

    // Apply search filter last
    // Search by project title or uc_id
    if (searchTerm) {
      result = result.filter((p) =>
        p.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.uc_id && p.uc_id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return result;
  }, [filterProjectData, projects, searchTerm]);

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
        <Box sx={{ display: "flex", gap: "16px", alignItems: "center", flex: 1 }}>
          {projects && projects.length > 0 && (
            <>
              <FilterBy
                columns={projectFilterColumns}
                onFilterChange={handleProjectFilterChange}
              />

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

              <SearchBox
                placeholder="Search use cases..."
                value={searchTerm}
                onChange={setSearchTerm}
                inputProps={{ "aria-label": "Search use cases" }}
                fullWidth={false}
              />
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
