import { useState } from "react";
import { TableBody, TableRow, TableCell, Chip, Box, IconButton, Typography } from "@mui/material";
import { Trash2 as TrashIcon } from "lucide-react";
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
    <>
      <TableBody>
        {rows
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((row) => (
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
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  textTransform: "none",
                  width: "20%",
                }}
              >
                {row.status === "Running" || row.status === "In Progress"
                  ? "Pending..."
                  : row.id}
              </TableCell>
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  textTransform: "none",
                }}
              >
                {row.model}
              </TableCell>
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  textTransform: "none",
                }}
              >
                {row.judge}
              </TableCell>
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  textTransform: "none",
                }}
              >
                {row.dataset}
              </TableCell>
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  textTransform: "none",
                }}
              >
                <Box sx={{ width: "50%", ml: -4 }}>
                  <StatusChip status={row.status} />
                </Box>
              </TableCell>
              {onRemoveModel && (
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    paddingLeft: "12px",
                    paddingRight: "12px",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <IconButton
                      onClick={(e) => handleDeleteClick(e, row)}
                      sx={{ padding: 0 }}
                    >
                      <TrashIcon size={18} color="#667085" />
                    </IconButton>
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
      </TableBody>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && rowToDelete && (
        <ConfirmationModal
          isOpen={deleteModalOpen}
          title="Delete this evaluation?"
          body={
            <Typography fontSize={13} color="#344054">
              Are you sure you want to delete evaluation "{rowToDelete.name || rowToDelete.id}"?
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
          TitleFontSize={0}
        />
      )}
    </>
  );
};

export default EvaluationTableBody;
