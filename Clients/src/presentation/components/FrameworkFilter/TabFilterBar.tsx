import { Dispatch, SetStateAction } from "react";
import { Box, Stack, Typography } from "@mui/material";
import Select from "../Inputs/Select";
import { SearchBox } from "../Search";

interface TabFilterBarProps {
  statusFilter?: string;
  onStatusChange?: (val: string) => void;
  applicabilityFilter?: string;
  onApplicabilityChange?: (val: string) => void;
  ownerFilter?: string;
  onOwnerChange?: (val: string) => void;
  reviewerFilter?: string;
  onReviewerChange?: (val: string) => void;
  showStatusFilter?: boolean;
  showApplicabilityFilter?: boolean;
  showOwnerFilter?: boolean;
  showReviewerFilter?: boolean;
  statusOptions?: { label: string; value: string }[];
  ownerOptions?: { label: string; value: string }[];
  reviewerOptions?: { label: string; value: string }[];
  showSearchBar?: boolean;
  searchTerm?: string;
  setSearchTerm?: Dispatch<SetStateAction<string>>;
}

const TabFilterBar = ({
  statusFilter,
  onStatusChange,
  applicabilityFilter,
  onApplicabilityChange,
  ownerFilter,
  onOwnerChange,
  reviewerFilter,
  onReviewerChange,
  showStatusFilter,
  showApplicabilityFilter,
  showOwnerFilter,
  showReviewerFilter,
  statusOptions = [],
  ownerOptions = [],
  reviewerOptions = [],
  showSearchBar = false,
  searchTerm,
  setSearchTerm,
}: TabFilterBarProps) => {
  const mapToSelectItems = (options: { label: string; value: string }[]) =>
    options.map((opt) => ({ _id: opt.value, name: opt.label }));

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 1, mt: "16px", mb: "16px" }}
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
              { _id: "", name: "Status: All (by default)" },
              ...mapToSelectItems(statusOptions),
            ]}
            getOptionValue={(item) => item._id}
            customRenderValue={(_value, selectedItem) => {
              if (selectedItem) {
                return `Status: ${selectedItem.name}`;
              }
              return "Status: All";
            }}
          />
        )}

        {showApplicabilityFilter && (
          <Select
            id="applicability-filter"
            placeholder="Applicability: All (by default)"
            value={applicabilityFilter ?? "all"}
            onChange={(e) => onApplicabilityChange?.(e.target.value as string)}
            items={[
              { _id: "all", name: "Applicability: All (by default)" },
              { _id: "true", name: "Applicable" },
              { _id: "false", name: "Not Applicable" },
            ]}
            getOptionValue={(item) => item._id}
          />
        )}

        {showOwnerFilter && (
          <Select
            id="owner-filter"
            placeholder="All Owners"
            value={ownerFilter ?? ""}
            onChange={(e) => onOwnerChange?.(e.target.value as string)}
            items={[
              { _id: "", name: "All Owners" },
              ...mapToSelectItems(ownerOptions),
            ]}
            getOptionValue={(item) => item._id}
          />
        )}

        {showReviewerFilter && (
          <Select
            id="reviewer-filter"
            placeholder="All Reviewers"
            value={reviewerFilter ?? ""}
            onChange={(e) => onReviewerChange?.(e.target.value as string)}
            items={[
              { _id: "", name: "All Reviewers" },
              ...mapToSelectItems(reviewerOptions),
            ]}
            getOptionValue={(item) => item._id}
          />
        )}

        {showSearchBar && (
          <Box sx={{ width: "300px" }}>
            <SearchBox
              placeholder="Search by title..."
              value={searchTerm ?? ""}
              onChange={(value) => setSearchTerm?.(value)}
              sx={{ mt: 4, mb: 2 }}
            />
          </Box>
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
