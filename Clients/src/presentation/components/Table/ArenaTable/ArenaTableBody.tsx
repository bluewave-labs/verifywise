import { useState } from "react";
import {
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Chip,
  Stack,
  Box,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { MoreVertical } from "lucide-react";
import singleTheme from "../../../themes/v1SingleTheme";
import { ArenaRow } from "./index";
import ConfirmationModal from "../../Dialogs/ConfirmationModal";

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

// Status chip matching EvaluationTable style
const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  const getStatusStyles = () => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "running":
      case "pending":
        return {
          backgroundColor: "#fff3e0",
          color: "#ef6c00",
          label: normalizedStatus === "running" ? "Running" : "Pending",
        };
      case "completed":
        return {
          backgroundColor: "#c8e6c9",
          color: "#388e3c",
          label: "Completed",
        };
      case "failed":
        return {
          backgroundColor: "#ffebee",
          color: "#c62828",
          label: "Failed",
        };
      default:
        return {
          backgroundColor: "#e0e0e0",
          color: "#616161",
          label: status,
        };
    }
  };

  const style = getStatusStyles();

  return (
    <Chip
      label={style.label}
      size="small"
      sx={{
        backgroundColor: style.backgroundColor,
        color: style.color,
        fontWeight: 500,
        fontSize: "11px",
        height: "22px",
        borderRadius: "4px",
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
  const theme = useTheme();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = useState<ArenaRow | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<ArenaRow | null>(null);

  const dropDownStyle = singleTheme.dropDownStyles.primary;

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
                        px: 1.25,
                        py: 0.5,
                        borderRadius: "6px",
                        backgroundColor: `${contestantColors[idx % contestantColors.length]}20`,
                        border: `1px solid ${contestantColors[idx % contestantColors.length]}50`,
                      }}
                    >
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: contestantColors[idx % contestantColors.length] }}>
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

            {/* DATASET - center aligned */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                textAlign: "center",
                textTransform: "none",
              }}
            >
              <Typography sx={{ fontSize: 12, color: "#475569" }}>
                {row.dataset ? row.dataset.split('/').pop()?.replace('.json', '') || row.dataset : '-'}
              </Typography>
            </TableCell>

            {/* STATUS - center aligned */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                textAlign: "center",
                textTransform: "none",
              }}
            >
              <StatusChip status={row.status} />
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
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "6px",
                    background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                    boxShadow: "0 2px 6px rgba(245,158,11,0.25)",
                  }}
                >
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                    {row.winner}
                  </Typography>
                </Box>
              ) : row.status === "running" || row.status === "pending" ? (
                <Typography sx={{ fontSize: 12, color: "#ef6c00", fontStyle: "italic" }}>
                  In progress...
                </Typography>
              ) : row.status === "failed" ? (
                <Typography sx={{ fontSize: 12, color: "#c62828" }}>
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
                  disableRipple={theme.components?.MuiIconButton?.defaultProps?.disableRipple}
                  onClick={(e) => handleMenuOpen(e, row)}
                  sx={singleTheme.iconButtons}
                >
                  <MoreVertical size={18} />
                </IconButton>
              )}
            </TableCell>
          </TableRow>
        ))}

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        slotProps={{
          paper: {
            sx: dropDownStyle,
          },
        }}
      >
        {onViewResults && menuRow?.status === "completed" && (
          <MenuItem onClick={handleViewResultsClick}>
            View results
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem
            onClick={handleDeleteClick}
            sx={{ color: "#d32f2f" }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

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

