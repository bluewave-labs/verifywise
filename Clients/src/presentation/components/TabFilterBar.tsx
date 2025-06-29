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

return (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2, mt: 8 }}>
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
      {showStatusFilter && (
        <FormControl size="small">
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter ?? ""}
            onChange={(e) => onStatusChange?.(e.target.value)}
            label="Filter by Status"
            sx={{ minWidth: 150 }}
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

          {(statusFilter) && (
      <Typography variant="body2" sx={{ color: "gray", mt: 1, ml: 10 }}>
        Showing:
        {statusFilter && ` Status: ${statusFilter[0].toUpperCase() + statusFilter.slice(1)}`}
      </Typography>
    )}

    {(applicabilityFilter) && (
      <Typography variant="body2" sx={{ color: "gray", mt: 1, ml: 10 }}>
        {applicabilityFilter !== "all" && (
          <>
            {" Applicability: "}
            {applicabilityFilter === "true" ? "Applicable" : "Not Applicable"}
          </>
        )}
      </Typography>
    )}
    </Box>
  </Box>
);

};

export default TabFilterBar;
