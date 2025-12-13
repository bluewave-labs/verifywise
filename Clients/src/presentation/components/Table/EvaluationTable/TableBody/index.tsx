import { useState } from "react";
import { TableBody, TableRow, TableCell, Chip, Box, IconButton, Tooltip, Typography } from "@mui/material";
import { Trash2 as TrashIcon, RotateCcw } from "lucide-react";
import singleTheme from "../../../../themes/v1SingleTheme";
import ConfirmationModal from "../../../Dialogs/ConfirmationModal";
import { IEvaluationTableBodyProps, IEvaluationRow } from "../../../../../domain/interfaces/i.table";

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

  const handleDeleteClick = (e: React.MouseEvent, row: IEvaluationRow) => {
    e.stopPropagation();
    setRowToDelete(row);
    setDeleteModalOpen(true);
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
                width: "14%",
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
                  width: "10%",
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
                  width: "14%",
                }}
              >
                {row.prompts}
              </TableCell>
            )}

            {/* DATASET */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                paddingLeft: "12px",
                paddingRight: "12px",
                textTransform: "none",
                width: "8%",
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
                width: "14%",
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
                  width: "80px",
                  minWidth: "80px",
                  maxWidth: "80px",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {onRerun && (
                    <Tooltip title={isRunning ? "Evaluation in progress" : "Rerun this evaluation"}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRerun(row);
                          }}
                          disabled={isRunning}
                          sx={{
                            color: isRunning ? "#d0d5dd" : "#13715B",
                            padding: "4px",
                            "&:hover": {
                              backgroundColor: isRunning ? "transparent" : "rgba(19, 113, 91, 0.1)",
                            },
                          }}
                        >
                          <RotateCcw size={16} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  {onRemoveModel && (
                    <Tooltip title="Delete this evaluation">
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteClick(e, row)}
                        sx={{
                          color: "#667085",
                          padding: "4px",
                          "&:hover": {
                            backgroundColor: "rgba(220, 38, 38, 0.1)",
                            color: "#DC2626",
                          },
                        }}
                      >
                        <TrashIcon size={16} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            )}
          </TableRow>
        );
        })}
      
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
