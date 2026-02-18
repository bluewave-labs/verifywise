import { useState } from "react";
import { TableBody, TableRow, TableCell, IconButton, Typography, Popover, Stack, Box, keyframes } from "@mui/material";
import { MoreVertical, RotateCcw, Download, Copy, Trash2, Loader2 } from "lucide-react";

// Pulse animation for running text
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// Spin animation for loader icon
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;
import singleTheme from "../../../../themes/v1SingleTheme";
import ConfirmationModal from "../../../Dialogs/ConfirmationModal";
import { CustomizableButton } from "../../../button/customizable-button";
import { IEvaluationTableBodyProps, IEvaluationRow } from "../../../../types/interfaces/i.table";

const EvaluationTableBody: React.FC<IEvaluationTableBodyProps> = ({
  rows,
  page,
  rowsPerPage,
  onShowDetails,
  onRemoveModel,
  onRerun,
  onDownload,
  onCopy,
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

  const handleDownloadClick = () => {
    if (menuRow && onDownload) {
      onDownload(menuRow);
    }
    handleMenuClose();
  };

  const handleCopyClick = () => {
    if (menuRow && onCopy) {
      onCopy(menuRow);
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
            {/* EXPERIMENT NAME */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                paddingLeft: "12px",
                paddingRight: "12px",
                textTransform: "none",
                width: "20%",
              }}
            >
              {isRunning ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    component={Loader2}
                    size={14}
                    sx={{
                      color: "#ef6c00",
                      animation: `${spin} 1s linear infinite`,
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "#ef6c00",
                      fontWeight: 500,
                      animation: `${pulse} 1.5s ease-in-out infinite`,
                    }}
                  >
                    Running...
                  </Typography>
                </Box>
              ) : row.status === "Failed" ? (
                <Typography sx={{ fontSize: 13, color: "#c62828", fontWeight: 500 }}>Failed</Typography>
              ) : (
                row.name || row.id
              )}
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
                width: "14%",
              }}
            >
              {row.dataset}
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
                onClick={(e) => e.stopPropagation()}
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
            minWidth: 140,
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
              }}
            >
              Rerun
            </CustomizableButton>
          )}
          {onDownload && menuRow?.status === "Completed" && (
            <CustomizableButton
              variant="outlined"
              onClick={handleDownloadClick}
              startIcon={<Download size={14} />}
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
              }}
            >
              Download results as JSON
            </CustomizableButton>
          )}
          {onCopy && menuRow?.status === "Completed" && (
            <CustomizableButton
              variant="outlined"
              onClick={handleCopyClick}
              startIcon={<Copy size={14} />}
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
              }}
            >
              Copy results to clipboard
            </CustomizableButton>
          )}
          {onRemoveModel && (
            <CustomizableButton
              variant="outlined"
              onClick={handleDeleteClick}
              startIcon={<Trash2 size={14} />}
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
