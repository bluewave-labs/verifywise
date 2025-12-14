import { useState } from "react";
import { TableBody, TableRow, TableCell, Box, IconButton, Typography } from "@mui/material";
import singleTheme from "../../../../themes/v1SingleTheme";
import { Trash2 as DeleteIconGrey } from "lucide-react";
import Button from "../../../../components/Button/index";
import ConfirmationModal from "../../../Dialogs/ConfirmationModal";
import { IFairnessTableBodyProps, IFairnessRow } from "../../../../../domain/interfaces/i.table";

const StatusBadge: React.FC<{
  status: "In Progress" | "Completed" | "Failed";
}> = ({ status }) => {
  const statusStyles = {
    "In Progress": {
      bg: "#fff9c4",
      color: "#fbc02d",
      border: "1px solid #fbc02d",
    },
    Completed: { bg: "#c8e6c9", color: "#388e3c", border: "1px solid #388e3c" },
    Failed: { bg: "#ffcdd2", color: "#d32f2f", border: "1px solid #d32f2f" },
  };

  const style = statusStyles[status] || { bg: "#e0e0e0", color: "#424242" };

  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: "4px 8px",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: "0.75rem",
        textTransform: "uppercase",
        display: "inline-block",
        border: style.border,
      }}
    >
      {status}
    </span>
  );
};

const FairnessTableBody: React.FC<IFairnessTableBodyProps> = ({
  rows,
  page,
  rowsPerPage,
  onShowDetails,
  onRemoveModel,
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<IFairnessRow | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, row: IFairnessRow) => {
    e.stopPropagation();
    setRowToDelete(row);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (rowToDelete) {
      onRemoveModel.onConfirm(rowToDelete.id);
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
            <TableRow key={row.id} sx={singleTheme.tableStyles.primary.body.row}>
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  textTransform: "none",
                  width: "20%",
                }}
              >
                {row.status === "In Progress" ? "Pending..." : row.id}
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
                  <StatusBadge status={row.status} />
                </Box>
              </TableCell>
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                }}
              >
                <Box display="flex" justifyContent="left">
                  <Button
                    onClick={() => onShowDetails(row)}
                    sx={{
                      ml: -2,
                      fontSize: "18 !important",
                      backgroundColor: "#13715B", // keep your styling
                      color: "white",
                      textTransform: "none",
                      opacity: row.status !== "Completed" ? 0.5 : 1,
                      pointerEvents: row.status !== "Completed" ? "none" : "auto",
                    }}
                  >
                    Show
                  </Button>
                </Box>
              </TableCell>
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                }}
              >
                <IconButton
                  disabled={row.status !== "Completed"}
                  onClick={(e) => handleDeleteClick(e, row)}
                  sx={{
                    padding: 0,
                    opacity: row.status !== "Completed" ? 0.5 : 1,
                  }}
                >
                  <DeleteIconGrey size={16} />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && rowToDelete && (
        <ConfirmationModal
          isOpen={deleteModalOpen}
          title="Delete this fairness check?"
          body={
            <Typography fontSize={13} color="#344054">
              Are you sure you want to delete fairness check ID {rowToDelete.id}? This action is non-recoverable.
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

export default FairnessTableBody;
