import { useState } from "react";
import {
  TableBody,
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { Trash2, MoreVertical, Eye, Edit3 } from "lucide-react";
import singleTheme from "../../../themes/v1SingleTheme";
import { DatasetRow } from "./index";

interface DatasetsTableBodyProps {
  rows: DatasetRow[];
  page: number;
  rowsPerPage: number;
  onRowClick?: (dataset: DatasetRow) => void;
  onView?: (dataset: DatasetRow) => void;
  onEdit?: (dataset: DatasetRow) => void;
  onDelete?: (dataset: DatasetRow) => void;
}

const DatasetsTableBody: React.FC<DatasetsTableBodyProps> = ({
  rows,
  page,
  rowsPerPage,
  onRowClick,
  onView,
  onEdit,
  onDelete,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = useState<DatasetRow | null>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, row: DatasetRow) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
    setMenuRow(row);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuRow(null);
  };

  const handleViewClick = () => {
    if (menuRow && onView) {
      onView(menuRow);
    }
    handleMenuClose();
  };

  const handleEditClick = () => {
    if (menuRow && onEdit) {
      onEdit(menuRow);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    if (menuRow && onDelete) {
      onDelete(menuRow);
    }
    handleMenuClose();
  };

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

  return (
    <TableBody>
      {rows
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((dataset) => {
          const metadata = dataset.metadata;
          
          return (
            <TableRow
              key={dataset.key}
              onClick={() => onRowClick?.(dataset)}
              sx={{
                ...singleTheme.tableStyles.primary.body.row,
                cursor: onRowClick ? "pointer" : "default",
                "&:hover": {
                  backgroundColor: "#F9FAFB",
                },
              }}
            >
              {/* NAME */}
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  textTransform: "none",
                }}
              >
                <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                  {dataset.name}
                </Typography>
              </TableCell>

              {/* TYPE - center aligned */}
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  textAlign: "center",
                  textTransform: "none",
                }}
              >
                {dataset.type ? (
                  <Chip
                    label={
                      dataset.type === "single-turn" ? "Single-Turn" : 
                      dataset.type === "multi-turn" ? "Multi-Turn" : 
                      "🎭 Simulated"
                    }
                    size="small"
                    sx={{
                      height: "22px",
                      fontSize: "11px",
                      fontWeight: 500,
                      borderRadius: "4px",
                      backgroundColor: 
                        dataset.type === "single-turn" ? "#FEF3C7" : 
                        dataset.type === "multi-turn" ? "#E3F2FD" :
                        "#F3E8FF",
                      color: 
                        dataset.type === "single-turn" ? "#92400E" : 
                        dataset.type === "multi-turn" ? "#1565C0" :
                        "#7C3AED",
                    }}
                  />
                ) : (
                  <Typography sx={{ fontSize: "13px", color: "#9CA3AF" }}>-</Typography>
                )}
              </TableCell>

              {/* USE CASE - center aligned */}
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  textAlign: "center",
                  textTransform: "none",
                }}
              >
                {dataset.useCase ? (
                  <Chip
                    label={dataset.useCase === "rag" ? "RAG" : dataset.useCase.charAt(0).toUpperCase() + dataset.useCase.slice(1)}
                    size="small"
                    sx={{
                      height: "22px",
                      fontSize: "11px",
                      fontWeight: 500,
                      borderRadius: "4px",
                      backgroundColor: 
                        dataset.useCase === "chatbot" ? "#CCFBF1" :
                        dataset.useCase === "rag" ? "#f3e5f5" :
                        dataset.useCase === "agent" ? "#FEE2E2" :
                        "#e0e0e0",
                      color:
                        dataset.useCase === "chatbot" ? "#0D9488" :
                        dataset.useCase === "rag" ? "#7b1fa2" :
                        dataset.useCase === "agent" ? "#DC2626" :
                        "#616161",
                    }}
                  />
                ) : (
                  <Typography sx={{ fontSize: "13px", color: "#9CA3AF" }}>-</Typography>
                )}
              </TableCell>

              {/* # PROMPTS - center aligned */}
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  textAlign: "center",
                  textTransform: "none",
                }}
              >
                {metadata?.loading ? (
                  <CircularProgress size={14} sx={{ color: "#9CA3AF" }} />
                ) : (
                  <Typography sx={{ fontSize: "13px", color: "#374151" }}>
                    {metadata?.promptCount ?? "-"}
                  </Typography>
                )}
              </TableCell>

              {/* DIFFICULTY - center aligned */}
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  textAlign: "center",
                  textTransform: "none",
                }}
              >
                {metadata?.loading ? (
                  <CircularProgress size={14} sx={{ color: "#9CA3AF" }} />
                ) : (
                  <Chip
                    label={metadata?.avgDifficulty ?? "Medium"}
                    size="small"
                    sx={{
                      height: "22px",
                      fontSize: "11px",
                      fontWeight: 500,
                      borderRadius: "4px",
                      backgroundColor:
                        metadata?.avgDifficulty === "Easy"
                          ? "#c8e6c9"
                          : metadata?.avgDifficulty === "Medium"
                          ? "#fff3e0"
                          : metadata?.avgDifficulty === "Hard"
                          ? "#ffebee"
                          : "#e0e0e0",
                      color:
                        metadata?.avgDifficulty === "Easy"
                          ? "#388e3c"
                          : metadata?.avgDifficulty === "Medium"
                          ? "#ef6c00"
                          : metadata?.avgDifficulty === "Hard"
                          ? "#c62828"
                          : "#616161",
                    }}
                  />
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
                  {formatDate(dataset.createdAt)}
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
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, dataset)}
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
            </TableRow>
          );
        })}

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          elevation: 2,
          sx: {
            minWidth: 160,
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            "& .MuiMenuItem-root": {
              fontSize: "13px",
              py: 1,
              px: 2,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {onView && (
          <MenuItem onClick={handleViewClick}>
            <ListItemIcon sx={{ minWidth: "32px !important" }}>
              <Eye size={16} color="#374151" />
            </ListItemIcon>
            <ListItemText
              primary="View prompts"
              primaryTypographyProps={{ fontSize: "13px", color: "#374151" }}
            />
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem onClick={handleEditClick}>
            <ListItemIcon sx={{ minWidth: "32px !important" }}>
              <Edit3 size={16} color="#374151" />
            </ListItemIcon>
            <ListItemText
              primary="Open in editor"
              primaryTypographyProps={{ fontSize: "13px", color: "#374151" }}
            />
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDeleteClick}>
            <ListItemIcon sx={{ minWidth: "32px !important" }}>
              <Trash2 size={16} color="#DC2626" />
            </ListItemIcon>
            <ListItemText
              primary="Delete"
              primaryTypographyProps={{ fontSize: "13px", color: "#DC2626" }}
            />
          </MenuItem>
        )}
      </Menu>
    </TableBody>
  );
};

export default DatasetsTableBody;
