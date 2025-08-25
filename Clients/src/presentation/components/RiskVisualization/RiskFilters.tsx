import React from "react";
import { Stack, Box, FormControl, Select, MenuItem, Typography } from "@mui/material";

export interface RiskFilters {
  riskLevel: string;
  owner: string;
  status: string;
}

interface RiskFiltersProps {
  filters: RiskFilters;
  onFiltersChange: (filters: RiskFilters) => void;
  owners: string[];
  statuses: string[];
}

const RiskFiltersComponent: React.FC<RiskFiltersProps> = ({
  filters,
  onFiltersChange,
  owners,
  statuses,
}) => {
  const handleFilterChange = (filterType: keyof RiskFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [filterType]: value,
    });
  };

  return (
    <Box sx={{ backgroundColor: "#FFFFFF", p: 2, borderRadius: 1 }}>
      <Stack direction="row" spacing={3} alignItems="center">
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>
          Filters:
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={filters.riskLevel}
            onChange={(e) => handleFilterChange("riskLevel", e.target.value)}
            displayEmpty
            sx={{ fontSize: 14 }}
          >
            <MenuItem value="">All Levels</MenuItem>
            <MenuItem value="5">Very High</MenuItem>
            <MenuItem value="4">High</MenuItem>
            <MenuItem value="3">Medium</MenuItem>
            <MenuItem value="2">Low</MenuItem>
            <MenuItem value="1">Very Low</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140, ml: "12px" }}>
          <Select
            value={filters.owner}
            onChange={(e) => handleFilterChange("owner", e.target.value)}
            displayEmpty
            sx={{ fontSize: 14 }}
          >
            <MenuItem value="">All Owners</MenuItem>
            {owners.map((owner) => (
              <MenuItem key={owner} value={owner}>
                {owner}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            displayEmpty
            sx={{ fontSize: 14 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {statuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
};

export default RiskFiltersComponent;