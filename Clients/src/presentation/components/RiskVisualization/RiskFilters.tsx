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
import { ReactComponent as FilterIcon } from "../../assets/icons/filter.svg";
import { ReactComponent as ExpandMoreIcon } from "../../assets/icons/down-arrow.svg";
import { ReactComponent as ExpandLessIcon } from "../../assets/icons/up-arrow.svg";
import { ReactComponent as CloseIcon } from "../../assets/icons/close.svg";
import { ProjectRisk } from "../../../domain/types/ProjectRisk";
import Select from "../Inputs/Select";
import { getAllUsers } from "../../../application/repository/user.repository";

interface RiskFiltersProps {
  risks: ProjectRisk[];
  onFilterChange: (filteredRisks: ProjectRisk[], activeFilters: FilterState) => void;
}

interface FilterState {
  riskLevel: string;
  owner: string;
  mitigationStatus: string;
  searchTerm: string;
}

const initialFilterState: FilterState = {
  riskLevel: "all",
  owner: "all",
  mitigationStatus: "all",
  searchTerm: "",
};

const RiskFilters: React.FC<RiskFiltersProps> = ({ risks, onFilterChange }) => {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [users, setUsers] = useState<any[]>([]);
  
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

    // Search term filter
    if (newFilters.searchTerm.trim()) {
      const searchLower = newFilters.searchTerm.toLowerCase();
      filteredRisks = filteredRisks.filter((risk) => {
        return (
          risk.risk_name?.toLowerCase().includes(searchLower) ||
          risk.risk_description?.toLowerCase().includes(searchLower) ||
          risk.impact?.toLowerCase().includes(searchLower)
        );
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
    if (filters.searchTerm.trim()) count++;
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

  const activeFilterCount = getActiveFilterCount();
  const uniqueOwners = getUniqueOwners();

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
          borderBottom: expanded ? "1px solid #E5E7EB" : "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => handleExpandedChange(!expanded)}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <FilterIcon style={{ color: "#13715B", fontSize: 20 }} />
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
              startIcon={<CloseIcon />}
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
        <Box sx={{ p: 3, pt: 5, pb: 7, backgroundColor: "#FFFFFF" }}>
          {/* Dropdown Filters */}
          <Box sx={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing="12px" sx={{ ml: "12px" }}>
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
            </Stack>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default RiskFilters;