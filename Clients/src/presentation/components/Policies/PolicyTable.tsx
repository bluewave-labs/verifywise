import React from "react";
import CustomizablePolicyTable from "../Table/PolicyTable";
import { TableRow, TableCell } from "@mui/material";
import singleTheme from "../../themes/v1SingleTheme";
import CustomIconButton from "../../components/IconButton";
import useUsers from "../../../application/hooks/useUsers";
import { PolicyTableProps } from "../../../domain/interfaces/i.policy";
import Chip from "../Chip";

const tableHeaders = [
  { id: "title", name: "Title" },
  { id: "status", name: "Status" },
  { id: "tags", name: "Tags" },
  { id: "next_review", name: "Next Review" },
  { id: "author", name: "Author" },
  // { id: "reviewers", name: "Reviewers" },
  { id: "last_updated", name: "Last Updated" },
  { id: "updated_by", name: "Updated By" },
  { id: "actions", name: "Actions" },
];

const PolicyTable: React.FC<PolicyTableProps> = ({
  data,
  onOpen,
  onDelete,
  onLinkedObjects,
  isLoading,
  error,
  onRefresh,
  hidePagination = false,
}) => {
  const cellStyle = singleTheme.tableStyles.primary.body.cell;

  // Helper function to get user name by ID
  const getUserNameById = (id: string | null | undefined | number) => {
    const user = users.find((u) => u.id === id);
    return user ? user.name + " " + user.surname : "-";
  };

  const { users } = useUsers();

  if (error) {
    return (
      <div className="error-message">
        Error loading policies: {error.message}
      </div>
    );
  }

  if (isLoading) {
    return <div className="loading-indicator">Loading policies...</div>;
  }

  if (data.length === 0) {
    return <div className="empty-state">No policies found</div>;
  }

  const rows = data.map((policy) => ({
    ...policy,
    id: policy.id, // needed for row key
  }));

  return (
    <>
      <CustomizablePolicyTable
        data={{ rows, cols: tableHeaders }}
        paginated
        setSelectedRow={() => {}}
        setAnchorEl={() => {}}
        onRowClick={(id: string) => onOpen(Number(id))}
        hidePagination={hidePagination}
        renderRow={(policy, sortConfig) => (
          <TableRow
            key={policy.id}
            tabIndex={0}
            aria-label={`Policy: ${policy.title}`}
            sx={{ ...singleTheme.tableStyles.primary.body.row }}
            onClick={(_event) => {
              const target = _event.target as HTMLElement;

              // Prevent triggering onOpen when clicking within any modal or dialog
              if (
                target.closest("button") ||
                target.closest(".MuiDialog-root") || // MUI Dialog
                target.closest("[role='dialog']") || // General dialogs
                target.closest(".modal") // Any custom modal class
              ) {
                return;
              }

              onOpen(policy.id);
            }}
          >
            <TableCell
              sx={{
                ...cellStyle,
                backgroundColor: sortConfig?.key && sortConfig.key.toLowerCase().includes("title") ? "#e8e8e8" : "#fafafa",
              }}
            >
              {policy.title.length > 30
                ? `${policy.title.slice(0, 30)}...`
                : policy.title}
            </TableCell>
            <TableCell
              sx={{
                ...cellStyle,
                backgroundColor: sortConfig?.key && sortConfig.key.toLowerCase().includes("status") ? "#f5f5f5" : "inherit",
              }}
            >
              <Chip label={policy.status} />
            </TableCell>
            <TableCell
              sx={{
                ...cellStyle,
                backgroundColor: sortConfig?.key && sortConfig.key.toLowerCase().includes("tags") ? "#f5f5f5" : "inherit",
              }}
            >
              {(() => {
                const tags = policy.tags?.join(", ") ?? "-";
                return tags.length > 30 ? `${tags.slice(0, 30)}...` : tags;
              })()}
            </TableCell>
            <TableCell
              sx={{
                ...cellStyle,
                backgroundColor: sortConfig?.key && (sortConfig.key.toLowerCase().includes("next") || sortConfig.key.toLowerCase().includes("review")) ? "#f5f5f5" : "inherit",
              }}
            >
              {policy.next_review_date
                ? new Date(policy.next_review_date).toLocaleDateString()
                : "-"}
            </TableCell>
            <TableCell
              sx={{
                ...cellStyle,
                backgroundColor: sortConfig?.key && sortConfig.key.toLowerCase().includes("author") ? "#f5f5f5" : "inherit",
              }}
            >
              {getUserNameById(policy.author_id)}
            </TableCell>
            {/* <TableCell sx={cellStyle}>
              {
                policy.assigned_reviewer_ids?.map(getUserNameById).join(", ").length > 30 ? `${policy.assigned_reviewer_ids?.map(getUserNameById).join(", ").slice(0, 30)}...` : policy.assigned_reviewer_ids?.map(getUserNameById).join(", ") || "-"
              }
            </TableCell> */}
            <TableCell
              sx={{
                ...cellStyle,
                backgroundColor: sortConfig?.key && (sortConfig.key.toLowerCase().includes("last") || sortConfig.key.toLowerCase().includes("updated")) && !sortConfig.key.toLowerCase().includes("by") ? "#f5f5f5" : "inherit",
              }}
            >
              {policy.last_updated_at
                ? new Date(policy.last_updated_at).toLocaleString()
                : "-"}
            </TableCell>
            <TableCell
              sx={{
                ...cellStyle,
                backgroundColor: sortConfig?.key && sortConfig.key.toLowerCase().includes("updated") && sortConfig.key.toLowerCase().includes("by") ? "#f5f5f5" : "inherit",
              }}
            >
              {getUserNameById(policy.last_updated_by)}
            </TableCell>
            <TableCell
              sx={{
                backgroundColor: sortConfig?.key && sortConfig.key.toLowerCase().includes("actions") ? "#f5f5f5" : "inherit",
              }}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <CustomIconButton
                  id={Number(policy.id)}
                  onDelete={() => {
                    onDelete(policy.id);
                    onRefresh?.();
                  }}
                  onEdit={() => {
                    onOpen(policy.id);
                  }}
                  onLinkedObjects={() => {
                    onLinkedObjects(policy.id);
                  }}
                  onMouseEvent={() => {}}
                  warningTitle="Delete this policy?"
                  warningMessage="When you delete this policy, all data related to it will be removed. This action is non-recoverable."
                  type="Policy"
                />
              </div>
            </TableCell>
          </TableRow>
        )}
      />
    </>
  );
};

export default PolicyTable;
