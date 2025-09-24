import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Button,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { ProjectRisk } from "../../../domain/types/ProjectRisk";
import Select from "../Inputs/Select";
import { getAllUsers } from "../../../application/repository/user.repository";
import { useProjects } from "../../../application/hooks/useProjects";
import useFrameworks from "../../../application/hooks/useFrameworks";

interface RiskFiltersProps {
  risks: ProjectRisk[];
  onFilterChange: (filteredRisks: ProjectRisk[], activeFilters: FilterState) => void;
  hideProjectFilter?: boolean;
  hideFrameworkFilter?: boolean;
}

interface FilterState {
  riskLevel: string;
  owner: string;
  mitigationStatus: string;
  project: string;
  framework: string;
}

const initialFilterState: FilterState = {
  riskLevel: "all",
  owner: "all",
  mitigationStatus: "all",
  project: "all",
  framework: "all",
};

const RiskFilters: React.FC<RiskFiltersProps> = ({
  risks,
  onFilterChange,
  hideProjectFilter = false,
  hideFrameworkFilter = false
}) => {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [users, setUsers] = useState<any[]>([]);

  // Fetch projects and frameworks
  const { data: projects = [] } = useProjects();
  const { allFrameworks: frameworks = [] } = useFrameworks({ listOfFrameworks: [] });

  
  // Initialize expanded state from localStorage, default to false
  const getInitialExpandedState = (): boolean => {
    const saved = localStorage.getItem('riskFilters_expanded');
    return saved !== null ? JSON.parse(saved) : false;
  };
  
  const [expanded, setExpanded] = useState<boolean>(getInitialExpandedState);

  // Handle expanded state changes and save to localStorage
  const handleExpandedChange = (newExpanded: boolean) => {
    setExpanded(newExpanded);
    localStorage.setItem('riskFilters_expanded', JSON.stringify(newExpanded));
  };

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

  // Apply initial filters when risks change
  React.useEffect(() => {
    if (risks.length > 0) {
      applyFilters(filters);
    }
  }, [risks.length]);

  const applyFilters = (newFilters: FilterState) => {
    let filteredRisks = [...risks];

    // Risk level filter
    if (newFilters.riskLevel !== "all") {
      filteredRisks = filteredRisks.filter((risk) => {
        const currentRiskLevel = (risk.current_risk_level || risk.risk_level_autocalculated || "").toLowerCase();
        
        switch (newFilters.riskLevel) {
          case "veryHigh":
            return currentRiskLevel.includes("very high");
          case "high":
            return currentRiskLevel.includes("high") && !currentRiskLevel.includes("very high");
          case "medium":
            return currentRiskLevel.includes("medium");
          case "low":
            return currentRiskLevel.includes("low") && !currentRiskLevel.includes("very low");
          case "veryLow":
            return currentRiskLevel.includes("very low") || currentRiskLevel.includes("no risk");
          default:
            return true;
        }
      });
    }

    // Project filter (only apply if not hidden)
    if (!hideProjectFilter && newFilters.project !== "all") {
      filteredRisks = filteredRisks.filter((risk) => {
        // First try the projects array, then fallback to project_id
        if (Array.isArray(risk.projects)) {
          return risk.projects.includes(parseInt(newFilters.project));
        }
        // Fallback to project_id field
        return risk.project_id?.toString() === newFilters.project;
      });
    }

    // Framework filter (only apply if not hidden)
    if (!hideFrameworkFilter && newFilters.framework !== "all") {
      filteredRisks = filteredRisks.filter((risk) => {
        // Only filter by frameworks if the frameworks array exists
        return Array.isArray(risk.frameworks) &&
               risk.frameworks.includes(parseInt(newFilters.framework));
      });
    }

    // Owner filter
    if (newFilters.owner !== "all") {
      filteredRisks = filteredRisks.filter((risk) => {
        return risk.risk_owner?.toString() === newFilters.owner;
      });
    }

    // Mitigation status filter
    if (newFilters.mitigationStatus !== "all") {
      filteredRisks = filteredRisks.filter((risk) => {
        const mitigationStatus = risk.mitigation_status?.toLowerCase();
        
        switch (newFilters.mitigationStatus) {
          case "completed":
            return mitigationStatus === "completed";
          case "in_progress":
            return mitigationStatus === "in progress";
          case "pending":
            return mitigationStatus === "not started" || !mitigationStatus;
          case "none":
            return !mitigationStatus;
          default:
            return true;
        }
      });
    }


    onFilterChange(filteredRisks, newFilters);
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearAllFilters = () => {
    setFilters(initialFilterState);
    applyFilters(initialFilterState);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.riskLevel !== "all") count++;
    if (filters.owner !== "all") count++;
    if (filters.mitigationStatus !== "all") count++;
    if (!hideProjectFilter && filters.project !== "all") count++;
    if (!hideFrameworkFilter && filters.framework !== "all") count++;
    return count;
  };

  // Helper function to get user name by ID
  const getUserNameById = (userId: string): string => {
    const user = users.find(u => u.id.toString() === userId.toString());
    if (user) {
      // Try different possible field name combinations
      const firstName = user.firstName || user.first_name || user.name?.split(' ')[0] || '';
      const lastName = user.lastName || user.last_name || user.surname || user.name?.split(' ')[1] || '';
      
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Return full name if available, otherwise fallback to email, then user ID
      return fullName || user.email || `User ${userId}`;
    }
    return userId; // Fallback to ID if user not found
  };

  const getUniqueOwners = () => {
    const ownerIds = new Set<string>();
    risks.forEach(risk => {
      if (risk.risk_owner) {
        ownerIds.add(risk.risk_owner.toString());
      }
    });

    return Array.from(ownerIds)
      .sort()
      .map(ownerId => ({
        id: ownerId,
        name: getUserNameById(ownerId)
      }));
  };

  const getUniqueProjects = () => {
    const projectIds = new Set<string>();
    risks.forEach(risk => {
      // First try the projects array, then fallback to project_id
      if (Array.isArray(risk.projects)) {
        risk.projects.forEach(projectId => {
          projectIds.add(projectId.toString());
        });
      } else if (risk.project_id) {
        // Fallback to project_id field
        projectIds.add(risk.project_id.toString());
      }
    });

    return Array.from(projectIds)
      .sort((a, b) => {
        // Sort by project name if available, otherwise by ID
        const projectA = projects.find(p => p.id.toString() === a);
        const projectB = projects.find(p => p.id.toString() === b);
        const nameA = projectA?.project_title || `Project ${a}`;
        const nameB = projectB?.project_title || `Project ${b}`;
        return nameA.localeCompare(nameB);
      })
      .map(projectId => {
        const project = projects.find(p => p.id.toString() === projectId);
        return {
          id: projectId,
          name: project?.project_title || `Project ${projectId}`
        };
      })
; // Show all projects, even if we only have IDs
  };

  const getUniqueFrameworks = () => {
    const frameworkIds = new Set<string>();
    risks.forEach(risk => {
      if (Array.isArray(risk.frameworks)) {
        risk.frameworks.forEach(frameworkId => {
          frameworkIds.add(frameworkId.toString());
        });
      }
    });

    return Array.from(frameworkIds)
      .sort()
      .map(frameworkId => {
        const framework = frameworks.find(f => f.id.toString() === frameworkId);
        return {
          id: frameworkId,
          name: framework?.name || `Framework ${frameworkId}`
        };
      });
  };

  const activeFilterCount = getActiveFilterCount();
  const uniqueOwners = getUniqueOwners();
  const uniqueProjects = getUniqueProjects();
  const uniqueFrameworks = getUniqueFrameworks();

  return (
    <Paper 
      elevation={0}
      sx={{ 
        mb: 2,
        border: "1px solid #E5E7EB",
        borderRadius: 2,
        backgroundColor: "transparent",
        boxShadow: "none",
      }}
    >
      {/* Filter Header */}
      <Box
        sx={{
          p: 2,
          pl: 6,
          borderBottom: expanded ? "1px solid #E5E7EB" : "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => handleExpandedChange(!expanded)}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <FilterIcon sx={{ color: "#13715B", fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1A1919" }}>
            Filters
          </Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={activeFilterCount}
              size="small"
              sx={{
                backgroundColor: "#13715B",
                color: "white",
                fontWeight: 600,
                minWidth: 20,
                height: 20,
                "& .MuiChip-label": {
                  px: 1,
                  fontSize: 11,
                },
              }}
            />
          )}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          {activeFilterCount > 0 && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              sx={{
                color: "#6B7280",
                textTransform: "none",
                fontSize: 12,
                "&:hover": {
                  backgroundColor: "#F3F4F6",
                }
              }}
            >
              Clear All
            </Button>
          )}
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Filter Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: 3, pl: 9, pt: 5, pb: 7, backgroundColor: "#FFFFFF" }}>
          {/* Dropdown Filters */}
          <Box sx={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing="18px">
              <Select
                id="risk-level-filter"
                label="Risk Level"
                value={filters.riskLevel}
                items={[
                  { _id: "all", name: "All Levels" },
                  { _id: "veryHigh", name: "Very High" },
                  { _id: "high", name: "High" },
                  { _id: "medium", name: "Medium" },
                  { _id: "low", name: "Low" },
                  { _id: "veryLow", name: "Very Low" },
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
                  ...uniqueOwners.map(owner => ({ _id: owner.id, name: owner.name }))
                ]}
                onChange={(e) => handleFilterChange("owner", e.target.value)}
                sx={{ minWidth: 140 }}
              />

              <Select
                id="mitigation-status-filter"
                label="Mitigation Status"
                value={filters.mitigationStatus}
                items={[
                  { _id: "all", name: "All Statuses" },
                  { _id: "completed", name: "Completed" },
                  { _id: "in_progress", name: "In Progress" },
                  { _id: "pending", name: "Pending" },
                  { _id: "none", name: "No Mitigations" },
                ]}
                onChange={(e) => handleFilterChange("mitigationStatus", e.target.value)}
                sx={{ minWidth: 160 }}
              />

              {!hideProjectFilter && (
                <Select
                  id="project-filter"
                  label="Project"
                  value={filters.project}
                  items={[
                    { _id: "all", name: "All Projects" },
                    ...uniqueProjects.map(project => ({ _id: project.id, name: project.name }))
                  ]}
                  onChange={(e) => handleFilterChange("project", e.target.value)}
                  sx={{ minWidth: 160 }}
                />
              )}

              {!hideFrameworkFilter && (
                <Select
                  id="framework-filter"
                  label="Framework"
                  value={filters.framework}
                  items={[
                    { _id: "all", name: "All Frameworks" },
                    ...uniqueFrameworks.map(framework => ({ _id: framework.id, name: framework.name }))
                  ]}
                  onChange={(e) => handleFilterChange("framework", e.target.value)}
                  sx={{ minWidth: 160 }}
                />
              )}
            </Stack>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default RiskFilters;