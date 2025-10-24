import React, { useState } from "react";
import { Box, Stack } from "@mui/material";
import Select from "../Inputs/Select";
import { getAllUsers } from "../../../application/repository/user.repository";
import { IProjectFiltersProps } from "../../../domain/interfaces/i.project";
import { IProjectFilterState } from "../../../domain/interfaces/i.project.filter";

const initialFilterState: IProjectFilterState = {
  riskLevel: "all",
  owner: "all",
  status: "all",
};

const ProjectFilters: React.FC<IProjectFiltersProps> = ({
  projects,
  onFilterChange,
}) => {
  const [filters, setFilters] = useState<IProjectFilterState>(initialFilterState);
  const [users, setUsers] = useState<any[]>([]);

  // Fetch users on component mount
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersResponse = await getAllUsers();
        setUsers(usersResponse.data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Apply initial filters when projects change
  React.useEffect(() => {
    if (projects.length > 0) {
      applyFilters(filters);
    }
  }, [projects.length]);

  const applyFilters = (newFilters: IProjectFilterState) => {
    let filteredProjects = [...projects];

    // Risk level filter
    if (newFilters.riskLevel !== "all") {
      filteredProjects = filteredProjects.filter((project) => {
        const riskLevel = (project.ai_risk_classification || "").toLowerCase();

        switch (newFilters.riskLevel) {
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

    // Owner filter
    if (newFilters.owner !== "all") {
      filteredProjects = filteredProjects.filter((project) => {
        return project.owner?.toString() === newFilters.owner;
      });
    }

    // Status filter
    if (newFilters.status !== "all") {
      filteredProjects = filteredProjects.filter((project) => {
        return project.status?.toLowerCase() === newFilters.status.toLowerCase();
      });
    }

    onFilterChange(filteredProjects, newFilters);
  };

  const handleFilterChange = (key: keyof IProjectFilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  // Helper function to get user name by ID
  const getUserNameById = (userId: string): string => {
    const user = users.find((u) => u.id.toString() === userId.toString());
    if (user) {
      // Try different possible field name combinations
      const firstName =
        user.firstName || user.first_name || user.name?.split(" ")[0] || "";
      const lastName =
        user.lastName ||
        user.last_name ||
        user.surname ||
        user.name?.split(" ")[1] ||
        "";

      const fullName = `${firstName} ${lastName}`.trim();

      // Return full name if available, otherwise fallback to email, then user ID
      return fullName || user.email || `User ${userId}`;
    }
    return userId; // Fallback to ID if user not found
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
    <Box sx={{ marginTop: "8px" }}>
      {/* Filter Dropdowns */}
      <Stack direction="row" spacing="16px" alignItems="center">
        <Select
          id="risk-level-filter"
          label="Risk Level"
          value={filters.riskLevel}
          items={[
            { _id: "all", name: "All Levels" },
            { _id: "high", name: "High Risk" },
            { _id: "limited", name: "Limited Risk" },
            { _id: "minimal", name: "Minimal Risk" },
          ]}
          onChange={(e) => handleFilterChange("riskLevel", e.target.value)}
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
          onChange={(e) => handleFilterChange("owner", e.target.value)}
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
          onChange={(e) => handleFilterChange("status", e.target.value)}
          sx={{ minWidth: 140 }}
        />
      </Stack>
    </Box>
  );
};

export default ProjectFilters;