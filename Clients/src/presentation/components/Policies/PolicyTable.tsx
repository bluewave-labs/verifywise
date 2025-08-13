import React, { useState, useCallback, useContext } from "react";
import { Policy } from "../../../domain/types/Policy";
import CustomizablePolicyTable from "../Table/PolicyTable";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { TableRow, TableCell, Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography } from "@mui/material";
import { ReactComponent as Settings } from "../../assets/icons/setting.svg" 
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import CustomizableButton from "../../vw-v2-components/Buttons";

interface Props {
  data: Policy[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  error?: Error | null;
}

const tableHeaders = [
  { id: "title", name: "Title" },
  { id: "status", name: "Status" },
  { id: "tags", name: "Tags" },
  { id: "next_review", name: "Next Review" },
  { id: "author", name: "Author" },
  { id: "reviewers", name: "Reviewers" },
  { id: "last_updated", name: "Last Updated" },
  { id: "updated_by", name: "Updated By" },
  { id: "actions", name: "Actions" },
];

const statusColors: Record<string, string> = {
  Draft: "#6c757d",
  "In review": "#fd7e14",
  Approved: "#28a745",
  Published: "#007bff",
  Archived: "#6c757d",
};

const PolicyTable: React.FC<Props> = ({ data, onOpen, onDelete, isLoading, error }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  // Helper function to get user name by ID
  const getUserNameById = (id: string | null | undefined | number) => {
    const user = users.find((u) => u.id === id);
    return user ? user.name : "-";
  };


  const isMenuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, policy: Policy) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedPolicy(policy);
  };

    const { users } =
    useContext(VerifyWiseContext);

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPolicy(null);
  };

  const handleDeleteConfirmation = useCallback(() => {
    console.log("SELECTED POLICY: ", selectedPolicy)
    if (selectedPolicy) {
      onDelete(selectedPolicy.id);
    }
    setOpenDeleteDialog(false);
    handleMenuClose();
  }, [selectedPolicy, onDelete]);

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setSelectedPolicy(null)
  };

  if (error) {
    return <div className="error-message">Error loading policies: {error.message}</div>;
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
        bodyData={[]}
        paginated
        setSelectedRow={() => {}}
        setAnchorEl={() => {}}
        onRowClick={onOpen}
        renderRow={(policy) => (
          <TableRow
            key={policy.id}
            tabIndex={0}
            aria-label={`Policy: ${policy.title}`}
            sx={{
              cursor: "pointer",
              height: 36,
              "&:hover": {
                backgroundColor: "#F8f8f8",
              },
            }}
            onClick={(event) => onOpen(policy.id)}
          >
            <TableCell sx={{ fontSize: 12 }}>{policy.title}</TableCell>
            <TableCell>
              <span
                style={{
                  backgroundColor: statusColors[policy.status] || "#6c757d",
                  color: "#fff",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: 12,
                }}
              >
                {policy.status}
              </span>
            </TableCell>
            <TableCell sx={{ fontSize: 12 }}>{policy.tags?.join(", ") || "-"}</TableCell>
            <TableCell sx={{ fontSize: 12 }}>
              {policy.next_review_date ? new Date(policy.next_review_date).toLocaleDateString() : "-"}
            </TableCell>
            <TableCell sx={{ fontSize: 12 }}>{getUserNameById(policy.author_id)}</TableCell>
            <TableCell sx={{ fontSize: 12 }}>
                {policy.assigned_reviewer_ids?.map(getUserNameById).join(", ") || "-"}
            </TableCell>
            <TableCell sx={{ fontSize: 12 }}>
              {policy.last_updated_at ? new Date(policy.last_updated_at).toLocaleString() : "-"}
            </TableCell>
            <TableCell sx={{ fontSize: 12 }}>{getUserNameById(policy.last_updated_by)}</TableCell>
            <TableCell>
              <IconButton
                aria-label="more"
                disableRipple
                onClick={(e) => handleMenuOpen(e, policy)}
              >
                <Settings />
              </IconButton>
            </TableCell>
          </TableRow>
        )}
      />

      {/* Global Menu */}
      <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (selectedPolicy) {
              onOpen(selectedPolicy.id);
            }
            handleMenuClose();
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setOpenDeleteDialog(true); // Show the confirmation dialog when Delete is clicked
            setAnchorEl(null)
          }}
          style={{ color: "red" }}
        >
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Policy</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this policy? This action is permanent.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="info" disableRipple>
            Cancel
          </Button>
                          <CustomizableButton
                    variant="contained"
                    text="Delete"
                    sx={{
                      backgroundColor: "#DB504A",
                      border: "1px solid #DB504A",
                      gap: 2,
                      
                    }}
                    onClick={() => {
                      handleDeleteConfirmation()
                    }}
                  />
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PolicyTable;
