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
  approverFilter?: string;
  onOwnerChange?: (val: string) => void;
  reviewerFilter?: string;
  onReviewerChange?: (val: string) => void;
  onApproverChange?: (val: string) => void;
  dueDateFilter?: string;
  onDueDateChange?: (val: string) => void;
  showStatusFilter?: boolean;
  showApplicabilityFilter?: boolean;
  showOwnerFilter?: boolean;
  showReviewerFilter?: boolean;
  showApproverFilter?: boolean;
  showDueDateFilter?: boolean;
  statusOptions?: { label: string; value: string }[];
  approverOptions?: { label: string; value: string }[];
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
  approverOptions = [],
  approverFilter,
  onApproverChange,
  showApproverFilter,
  dueDateFilter,
  onDueDateChange,
  showDueDateFilter,
  showSearchBar = false,
  searchTerm,
  setSearchTerm,
}: TabFilterBarProps) => {
  const mapToSelectItems = (options: { label: string; value: string }[]) =>
    options.map((opt) => ({ _id: opt.value, name: opt.label }));

  const dueDateOptions = [
    { _id: "", name: "All Due Dates" },
    { _id: "1", name: "Due in 1 day" },
    { _id: "3", name: "Due in 3 days" },
    { _id: "7", name: "Due in 1 week" },
    { _id: "14", name: "Due in 2 weeks" },
    { _id: "21", name: "Due in 3 weeks" },
    { _id: "30", name: "Due in 1 month" },
    { _id: "60", name: "Due in 2 months" },
  ];

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
            sx={{
              backgroundColor: statusFilter ? theme.palette.background.fill : 'inherit'
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
            sx={{
              backgroundColor: applicabilityFilter ? theme.palette.background.fill : 'inherit'
            }}
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
            sx={{
              backgroundColor: ownerFilter ? theme.palette.background.fill : 'inherit'
            }}
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
            sx={{
              backgroundColor: reviewerFilter ? theme.palette.background.fill : 'inherit'
            }}
          />
        )}
        
        {showApproverFilter && (
          <Select
            id="approver-filter"
            placeholder="All approvers"
            value={approverFilter ?? ""}
            onChange={(e) => onApproverChange?.(e.target.value as string)}
            items={[
              { _id: "", name: "All Approvers" },
              ...mapToSelectItems(approverOptions),
            ]}
            getOptionValue={(item) => item._id}
            sx={{
              backgroundColor: approverFilter ? theme.palette.background.fill : 'inherit'
            }}
          />
        )}

        {showDueDateFilter && (
          <Select
            id="due-date-filter"
            placeholder="All Due Dates"
            value={dueDateFilter ?? ""}
            onChange={(e) => onDueDateChange?.(e.target.value as string)}
            items={dueDateOptions}
            getOptionValue={(item) => item._id}
            sx={{
              backgroundColor: dueDateFilter ? theme.palette.background.fill : 'inherit'
            }}
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
      </Box>
      <Stack mt={4}>
        {(statusFilter || ownerFilter || approverFilter || reviewerFilter || dueDateFilter ||
          applicabilityFilter === "true" ||
          applicabilityFilter === "false") && (
          <Stack direction="row" spacing={10}>
            <Typography variant="body2" sx={{ color: "gray" }}>Showing:</Typography>
            {statusFilter && (
              <Typography variant="body2" sx={{ color: "gray" }}>
                Status: {statusFilter[0].toUpperCase() + statusFilter.slice(1)}
              </Typography>
            )}
            {ownerFilter && (
              <Typography variant="body2" sx={{ color: "gray" }}>
                Owner: {ownerOptions.find((option) => option.value === ownerFilter)?.label}
              </Typography>
            )}
            {approverFilter && (
              <Typography variant="body2" sx={{ color: "gray" }}>
                Approver: {approverOptions.find((option) => option.value === approverFilter)?.label}
              </Typography>
            )}
            {reviewerFilter && (
              <Typography variant="body2" sx={{ color: "gray" }}>
                Reviewer: {reviewerOptions.find((option) => option.value === reviewerFilter)?.label}
              </Typography>
            )}
            {dueDateFilter && (
              <Typography variant="body2" sx={{ color: "gray" }}>
                Due Date: {dueDateOptions.find((option) => option._id === dueDateFilter)?.name}
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
      </Stack>
    </Box>
  );
};

export default TabFilterBar;
