import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";

interface TabFilterBarProps {
  statusFilter?: string;
  onStatusChange?: (val: string) => void;
  applicabilityFilter?: string;
  onApplicabilityChange?: (val: string) => void;
  showStatusFilter?: boolean;
  showApplicabilityFilter?: boolean;
}

const TabFilterBar = ({
  statusFilter,
  onStatusChange,
  applicabilityFilter,
  onApplicabilityChange,
  showStatusFilter,
  showApplicabilityFilter,
}: TabFilterBarProps) => {
  const statusLabel = statusFilter
    ? `Showing: ${statusFilter[0].toUpperCase() + statusFilter.slice(1)}`
    : "Showing: All";

  return (
    <Box sx={{ display: "flex", gap: 2, mb: 2, mt: 8, alignItems: "center", flexWrap: "wrap" }}>
      {showStatusFilter && (
        <>
          <FormControl size="small">
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter ?? ""}
              onChange={(e) => onStatusChange?.(e.target.value)}
              label="Filter by Status"
              sx={{ minWidth: 300 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="not started">Not Started</MenuItem>
              <MenuItem value="in progress">In Progress</MenuItem>
              <MenuItem value="implemented">Implemented</MenuItem>
              <MenuItem value="awaiting approval">Awaiting Approval</MenuItem>
              <MenuItem value="awaiting review">Awaiting Review</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="audited">Audited</MenuItem>
              <MenuItem value="needs rework">Needs Rework</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" sx={{ color: "gray", ml: 10, mt: 0.5 }}>
            {statusLabel}
          </Typography>
        </>
      )}

      {showApplicabilityFilter && (
        <FormControl size="small">
          <InputLabel>Applicability</InputLabel>
          <Select
            value={applicabilityFilter ?? ""}
            onChange={(e) => onApplicabilityChange?.(e.target.value)}
            label="Applicability"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="true">Applicable</MenuItem>
            <MenuItem value="false">Not Applicable</MenuItem>
          </Select>
        </FormControl>
      )}
    </Box>
  );
};

export default TabFilterBar;
