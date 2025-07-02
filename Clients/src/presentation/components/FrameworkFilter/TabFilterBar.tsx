import { Box, Stack, Typography } from "@mui/material";
import Select from "../Inputs/Select";
interface TabFilterBarProps {
  statusFilter?: string;
  onStatusChange?: (val: string) => void;
  applicabilityFilter?: string;
  onApplicabilityChange?: (val: string) => void;
  showStatusFilter?: boolean;
  showApplicabilityFilter?: boolean;
  statusOptions?: { label: string; value: string }[];
}

const TabFilterBar = ({
  statusFilter,
  onStatusChange,
  applicabilityFilter,
  onApplicabilityChange,
  showStatusFilter,
  showApplicabilityFilter,
  statusOptions = [],
}: TabFilterBarProps) => {
  const mapToSelectItems = (options: { label: string; value: string }[]) =>
    options.map((opt) => ({ _id: opt.value, name: opt.label }));

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2, mt: 8 }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}
      >
        {showStatusFilter && (
          <Select
            id="status-filter"
            placeholder="All"
            value={statusFilter ?? ""}
            onChange={(e) => onStatusChange?.(e.target.value as string)}
            items={[
              { _id: "", name: "All" },
              ...mapToSelectItems(statusOptions),
            ]}
            getOptionValue={(item) => item._id}
          />
        )}

        {showApplicabilityFilter && (
          <Select
            id="applicability-filter"
            placeholder="All"
            value={applicabilityFilter ?? "all"}
            onChange={(e) => onApplicabilityChange?.(e.target.value as string)}
            items={[
              { _id: "all", name: "All" },
              { _id: "true", name: "Applicable" },
              { _id: "false", name: "Not Applicable" },
            ]}
            getOptionValue={(item) => item._id}
          />
        )}

        {(statusFilter ||
          applicabilityFilter === "true" ||
          applicabilityFilter === "false") && (
          <Stack direction="row" spacing={10}>
            {statusFilter && (
              <Typography variant="body2" sx={{ color: "gray" }}>
                Showing: {statusFilter[0].toUpperCase() + statusFilter.slice(1)}
              </Typography>
            )}
            {(applicabilityFilter === "true" ||
              applicabilityFilter === "false") && (
              <Typography variant="body2" sx={{ color: "gray" }}>
                Showing:{" "}
                {applicabilityFilter === "true"
                  ? "Applicable"
                  : "Not Applicable"}
              </Typography>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default TabFilterBar;
