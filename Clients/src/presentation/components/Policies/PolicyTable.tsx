import React from "react";
import { Policy } from "../../../domain/types/Policy";
import CustomizablePolicyTable from "../Table/PolicyTable";
import { TableRow, TableCell } from "@mui/material";
import singleTheme from "../../themes/v1SingleTheme";
import CustomIconButton from "../../components/IconButton";
import useUsers from "../../../application/hooks/useUsers";

interface Props {
  data: Policy[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  error?: Error | null;
}

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

const policyStatusBadgeStyle = (status: string) => {
  const statusStyles: Record<string, { bg: string; color: string }> = {
    Draft: { bg: "#e0e0e0", color: "#616161" },
    "In review": { bg: "#fff3e0", color: "#b71c1c" },
    Approved: { bg: "#c8e6c9", color: "#388e3c" },
    Published: { bg: "#bbdefb", color: "#1976d2" },
    Archived: { bg: "#eeeeee", color: "#757575" },
  };

  const style = statusStyles[status] || { bg: "#f5f5f5", color: "#9e9e9e" };

  return {
    backgroundColor: style.bg,
    color: style.color,
    padding: "4px 8px",
    borderRadius: 12,
    fontWeight: 500,
    fontSize: "11px",
    textTransform: "uppercase" as const,
    display: "inline-block" as const,
    letterSpacing: "0.5px",
  };
};

const PolicyTable: React.FC<Props> = ({
  data,
  onOpen,
  onDelete,
  isLoading,
  error,
  onRefresh,
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
        table="policy-table"
        data={{ rows, cols: tableHeaders }}
        bodyData={[...data]}
        paginated
        setSelectedRow={() => {}}
        setAnchorEl={() => {}}
        onRowClick={onOpen}
        renderRow={(policy) => (
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
            <TableCell sx={cellStyle}>
              {policy.title.length > 30
                ? `${policy.title.slice(0, 30)}...`
                : policy.title}
            </TableCell>
            <TableCell sx={cellStyle}>
              <span style={policyStatusBadgeStyle(policy.status)}>
                {policy.status}
              </span>
            </TableCell>
            <TableCell sx={cellStyle}>
              {policy.tags?.join(", ").length > 30
                ? `${policy.tags?.join(", ").slice(0, 30)}...`
                : policy.tags?.join(", ") || "-"}
            </TableCell>
            <TableCell sx={cellStyle}>
              {policy.next_review_date
                ? new Date(policy.next_review_date).toLocaleDateString()
                : "-"}
            </TableCell>
            <TableCell sx={cellStyle}>
              {getUserNameById(policy.author_id)}
            </TableCell>
            {/* <TableCell sx={cellStyle}>
              {
                policy.assigned_reviewer_ids?.map(getUserNameById).join(", ").length > 30 ? `${policy.assigned_reviewer_ids?.map(getUserNameById).join(", ").slice(0, 30)}...` : policy.assigned_reviewer_ids?.map(getUserNameById).join(", ") || "-"
              }
            </TableCell> */}
            <TableCell sx={cellStyle}>
              {policy.last_updated_at
                ? new Date(policy.last_updated_at).toLocaleString()
                : "-"}
            </TableCell>
            <TableCell sx={cellStyle}>
              {getUserNameById(policy.last_updated_by)}
            </TableCell>
            <TableCell>
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
                  onMouseEvent={() => {}}
                  warningTitle="Delete this policy?"
                  warningMessage="When you delete this policy, all data related to it will be removed. This action is non-recoverable."
                  type=""
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
