import { useState } from "react";
import { TableBody, TableRow, TableCell, Chip, IconButton, Typography, Popover, Stack } from "@mui/material";
import { Trash2 as TrashIcon, RotateCcw, MoreVertical } from "lucide-react";
import singleTheme from "../../../../themes/v1SingleTheme";
import ConfirmationModal from "../../../Dialogs/ConfirmationModal";
import CustomizableButton from "../../../Button/CustomizableButton";
import { IEvaluationTableBodyProps, IEvaluationRow } from "../../../../types/interfaces/i.table";

const StatusChip: React.FC<{
  status: "In Progress" | "Completed" | "Failed" | "Pending" | "Running" | "Available";
}> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case "In Progress":
      case "Running":
        return {
          backgroundColor: "#fff3e0",
          color: "#ef6c00",
        };
      case "Completed":
        return {
          backgroundColor: "#c8e6c9",
          color: "#388e3c",
        };
      case "Failed":
        return {
          backgroundColor: "#ffebee",
          color: "#c62828",
        };
      case "Pending":
        return {
          backgroundColor: "#e0e0e0",
          color: "#616161",
        };
      case "Available":
        return {
          backgroundColor: "#e3f2fd",
          color: "#1565c0",
        };
      default:
        return {
          backgroundColor: "#e0e0e0",
          color: "#616161",
        };
    }
  };

  const style = getStatusStyles();

  return (
    <Chip
      label={status}
      size="small"
      sx={{
        ...style,
        fontWeight: 500,
        fontSize: "11px",
        height: "22px",
        borderRadius: "4px",
      }}
    />
  );
};

const EvaluationTableBody: React.FC<IEvaluationTableBodyProps> = ({
  rows,
  page,
  rowsPerPage,
  onShowDetails,
  onRemoveModel,
  onRerun,
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<IEvaluationRow | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = useState<IEvaluationRow | null>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, row: IEvaluationRow) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
    setMenuRow(row);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuRow(null);
  };

  const handleRerunClick = () => {
    if (menuRow && onRerun) {
      onRerun(menuRow);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    if (menuRow) {
      setRowToDelete(menuRow);
      setDeleteModalOpen(true);
    }
    handleMenuClose();
  };

  const handleConfirmDelete = () => {
    if (rowToDelete && onRemoveModel) {
      onRemoveModel.onConfirm(String(rowToDelete.id));
      setDeleteModalOpen(false);
      setRowToDelete(null);
    }
  };

  return (
    <TableBody>
      {rows
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((row) => {
          const isRunning = row.status === "Running" || row.status === "In Progress" || row.status === "Pending";
          
          return (
          <TableRow
            key={row.id}
            onClick={() => onShowDetails(row)}
            sx={{
              ...singleTheme.tableStyles.primary.body.row,
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "#F9FAFB",
              },
            }}
          >
            {/* EXPERIMENT ID */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                paddingLeft: "12px",
                paddingRight: "12px",
                textTransform: "none",
                width: "18%",
              }}
            >
              {isRunning ? "Pending..." : row.id}
            </TableCell>

            {/* MODEL - center aligned */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                paddingLeft: "12px",
                paddingRight: "12px",
                textTransform: "none",
                textAlign: "center",
                width: "10%",
              }}
            >
              {row.model}
            </TableCell>

            {/* JUDGE - center aligned */}
            {row.judge !== undefined && (
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  textTransform: "none",
                  textAlign: "center",
                  width: "14%",
                }}
              >
                {row.judge || "-"}
              </TableCell>
            )}

            {/* # PROMPTS - center aligned */}
            {row.prompts !== undefined && (
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  textTransform: "none",
                  textAlign: "center",
                  width: "7%",
                }}
              >
                {row.prompts}
              </TableCell>
            )}

            {/* DATASET - center aligned */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                paddingLeft: "12px",
                paddingRight: "12px",
                textTransform: "none",
                textAlign: "center",
                width: "12%",
              }}
            >
              {row.dataset}
            </TableCell>

            {/* STATUS - center aligned */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                paddingLeft: "12px",
                paddingRight: "12px",
                textTransform: "none",
                textAlign: "center",
                width: "9%",
              }}
            >
              <StatusChip status={row.status} />
            </TableCell>

            {/* DATE - center aligned */}
            {row.date !== undefined && (
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  textTransform: "none",
                  textAlign: "center",
                  width: "14%",
                  fontSize: "12px",
                }}
              >
                {row.date}
              </TableCell>
            )}

            {/* ACTION */}
            {(onRerun || onRemoveModel) && (
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  width: "60px",
                  minWidth: "60px",
                  maxWidth: "60px",
                  textAlign: "center",
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, row)}
                  sx={{
                    color: "#667085",
                    padding: "6px",
                    "&:hover": {
                      backgroundColor: "#F3F4F6",
                    },
                  }}
                >
                  <MoreVertical size={18} />
                </IconButton>
              </TableCell>
            )}
          </TableRow>
        );
        })}
      
      {/* Action Menu */}
      <Popover
        open={Boolean(menuAnchorEl)}
        anchorEl={menuAnchorEl}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{
          "& .MuiPopover-paper": {
            minWidth: 120,
            borderRadius: "4px",
            border: "1px solid #d0d5dd",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            overflow: "hidden",
            mt: 0.5,
            p: 1,
          },
        }}
      >
        <Stack spacing={1}>
          {onRerun && (
            <CustomizableButton
              variant="outlined"
              onClick={handleRerunClick}
              isDisabled={menuRow?.status === "Running" || menuRow?.status === "In Progress" || menuRow?.status === "Pending"}
              startIcon={<RotateCcw size={14} />}
              sx={{
                height: "34px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#374151",
                borderColor: "#d0d5dd",
                backgroundColor: "transparent",
                justifyContent: "flex-start",
                "&:hover": {
                  backgroundColor: "#F0FDF4",
                  borderColor: "#13715B",
                  color: "#13715B",
                },
                "&.Mui-disabled": {
                  color: "#9CA3AF",
                  borderColor: "#E5E7EB",
                },
              }}
            >
              Rerun
            </CustomizableButton>
          )}
          {onRemoveModel && (
            <CustomizableButton
              variant="outlined"
              onClick={handleDeleteClick}
              startIcon={<TrashIcon size={14} />}
              sx={{
                height: "34px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#DC2626",
                borderColor: "#d0d5dd",
                backgroundColor: "transparent",
                justifyContent: "flex-start",
                "&:hover": {
                  backgroundColor: "#FEF2F2",
                  borderColor: "#DC2626",
                },
              }}
            >
              Delete
            </CustomizableButton>
          )}
        </Stack>
      </Popover>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && rowToDelete && (
        <ConfirmationModal
          title="Delete this evaluation?"
          body={
            <Typography fontSize={13}>
              Are you sure you want to delete evaluation "{rowToDelete.name || rowToDelete.id}"? This action cannot be undone.
            </Typography>
          }
          cancelText="Cancel"
          proceedText="Delete"
          onCancel={() => {
            setDeleteModalOpen(false);
            setRowToDelete(null);
          }}
          onProceed={handleConfirmDelete}
          proceedButtonColor="error"
          proceedButtonVariant="contained"
        />
      )}
    </TableBody>
  );
};

export default EvaluationTableBody;
