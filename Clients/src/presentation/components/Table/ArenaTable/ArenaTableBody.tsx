import { useState } from "react";
import {
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Popover,
  Typography,
  Chip,
  Stack,
  Box,
  CircularProgress,
} from "@mui/material";
import { Eye, Trash2, MoreVertical } from "lucide-react";
import singleTheme from "../../../themes/v1SingleTheme";
import { ArenaRow } from "./index";
import ConfirmationModal from "../../Dialogs/ConfirmationModal";
import CustomizableButton from "../../Button/CustomizableButton";

interface ArenaTableBodyProps {
  rows: ArenaRow[];
  page: number;
  rowsPerPage: number;
  onRowClick?: (row: ArenaRow) => void;
  onViewResults?: (row: ArenaRow) => void;
  onDelete?: (row: ArenaRow) => void;
  deleting?: string | null;
}

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + ", " + date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusChip = (status: string) => {
  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    completed: { bg: "#dcfce7", color: "#166534", label: "Completed" },
    running: { bg: "#dbeafe", color: "#1e40af", label: "Running" },
    pending: { bg: "#fef3c7", color: "#92400e", label: "Pending" },
    failed: { bg: "#fee2e2", color: "#991b1b", label: "Failed" },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        backgroundColor: config.bg,
        color: config.color,
        fontWeight: 600,
        fontSize: 11,
        height: 24,
      }}
    />
  );
};

// Helper to get contestant name from string or object
const getContestantName = (contestant: string | { name?: string }, index: number): string => {
  if (typeof contestant === "string") return contestant;
  return contestant?.name || `Player ${index + 1}`;
};

const ArenaTableBody: React.FC<ArenaTableBodyProps> = ({
  rows,
  page,
  rowsPerPage,
  onRowClick,
  onViewResults,
  onDelete,
  deleting,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = useState<ArenaRow | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<ArenaRow | null>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, row: ArenaRow) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
    setMenuRow(row);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuRow(null);
  };

  const handleViewResultsClick = () => {
    if (menuRow && onViewResults) {
      onViewResults(menuRow);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    if (menuRow) {
      setRowToDelete(menuRow);
      setDeleteConfirmOpen(true);
    }
    handleMenuClose();
  };

  const handleConfirmDelete = () => {
    if (rowToDelete && onDelete) {
      onDelete(rowToDelete);
    }
    setDeleteConfirmOpen(false);
    setRowToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setRowToDelete(null);
  };

  // Contestant colors for visual distinction
  const contestantColors = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // purple
    "#ec4899", // pink
  ];

  return (
    <TableBody>
      {rows
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((row) => (
          <TableRow
            key={row.id}
            onClick={() => onRowClick?.(row)}
            sx={{
              ...singleTheme.tableStyles.primary.body.row,
              cursor: onRowClick ? "pointer" : "default",
              "&:hover": {
                backgroundColor: "#F9FAFB",
              },
            }}
          >
            {/* BATTLE NAME */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                textTransform: "none",
              }}
            >
              <Typography sx={{ fontWeight: 500, fontSize: 13 }}>
                {row.name}
              </Typography>
            </TableCell>

            {/* CONTESTANTS - center aligned */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                textAlign: "center",
                textTransform: "none",
              }}
            >
              <Stack
                direction="row"
                spacing={0.5}
                justifyContent="center"
                flexWrap="wrap"
                gap={0.5}
              >
                {row.contestants?.slice(0, 4).map((contestant, idx) => {
                  const name = getContestantName(contestant, idx);
                  return (
                    <Box
                      key={`${name}-${idx}`}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1,
                        py: 0.25,
                        borderRadius: "4px",
                        backgroundColor: `${contestantColors[idx % contestantColors.length]}10`,
                        border: `1px solid ${contestantColors[idx % contestantColors.length]}30`,
                      }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "4px",
                          backgroundColor: contestantColors[idx % contestantColors.length],
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          fontWeight: 700,
                          color: "#fff",
                        }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#374151" }}>
                        {name}
                      </Typography>
                    </Box>
                  );
                })}
                {row.contestants?.length > 4 && (
                  <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>
                    +{row.contestants.length - 4} more
                  </Typography>
                )}
              </Stack>
            </TableCell>

            {/* STATUS - center aligned */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                textAlign: "center",
                textTransform: "none",
              }}
            >
              {getStatusChip(row.status)}
            </TableCell>

            {/* WINNER - center aligned */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                textAlign: "center",
                textTransform: "none",
              }}
            >
              {row.status === "completed" && row.winner ? (
                <Chip
                  label={row.winner}
                  size="small"
                  sx={{
                    backgroundColor: "#fef3c7",
                    color: "#92400e",
                    fontWeight: 600,
                    fontSize: 11,
                    height: 24,
                  }}
                  icon={
                    <Box
                      component="span"
                      sx={{
                        fontSize: 12,
                        ml: 0.5,
                      }}
                    >
                      🏆
                    </Box>
                  }
                />
              ) : row.status === "running" ? (
                <Typography sx={{ fontSize: 12, color: "#6B7280", fontStyle: "italic" }}>
                  In progress...
                </Typography>
              ) : row.status === "failed" ? (
                <Typography sx={{ fontSize: 12, color: "#991b1b" }}>
                  —
                </Typography>
              ) : (
                <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>
                  —
                </Typography>
              )}
            </TableCell>

            {/* DATE - center aligned */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                textAlign: "center",
                textTransform: "none",
              }}
            >
              <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                {formatDate(row.createdAt)}
              </Typography>
            </TableCell>

            {/* ACTION - center aligned */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                textAlign: "center",
                minWidth: "80px",
                maxWidth: "80px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {deleting === row.id ? (
                <CircularProgress size={18} sx={{ color: "#6366f1" }} />
              ) : (
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
              )}
            </TableCell>
          </TableRow>
        ))}

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
          {onViewResults && menuRow?.status === "completed" && (
            <CustomizableButton
              variant="outlined"
              onClick={handleViewResultsClick}
              startIcon={<Eye size={14} />}
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
              View Results
            </CustomizableButton>
          )}
          {onDelete && (
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
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        title="Delete Arena Battle"
        body={
          <Typography sx={{ fontSize: 14, color: "#667085" }}>
            Are you sure you want to delete "{rowToDelete?.name}"? This action cannot be undone.
          </Typography>
        }
        cancelText="Cancel"
        proceedText="Delete"
        onCancel={handleCancelDelete}
        onProceed={handleConfirmDelete}
        proceedButtonColor="error"
        proceedButtonVariant="contained"
      />
    </TableBody>
  );
};

export default ArenaTableBody;

