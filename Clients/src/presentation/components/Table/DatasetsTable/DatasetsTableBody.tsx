import { useState } from "react";
import {
  TableBody,
  TableRow,
  TableCell,
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
import Chip from "../../Chip";

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
                    uppercase={false}
                    backgroundColor={
                      dataset.useCase === "chatbot" ? "#E3F2FD" :
                      dataset.useCase === "rag" ? "#F3E5F5" :
                      dataset.useCase === "agent" ? "#FFF3E0" :
                      "#F3F4F6"
                    }
                    textColor={
                      dataset.useCase === "chatbot" ? "#1565C0" :
                      dataset.useCase === "rag" ? "#7B1FA2" :
                      dataset.useCase === "agent" ? "#EF6C00" :
                      "#6B7280"
                    }
                  />
                ) : (
                  <Typography sx={{ fontSize: "13px", color: "#9CA3AF" }}>-</Typography>
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
                ) : metadata?.avgDifficulty ? (
                  <Chip
                    label={metadata.avgDifficulty}
                    uppercase={false}
                    variant={
                      metadata.avgDifficulty === "Easy" ? "success" :
                      metadata.avgDifficulty === "Medium" ? "warning" :
                      metadata.avgDifficulty === "Hard" ? "error" :
                      "default"
                    }
                  />
                ) : (
                  <Chip label="-" uppercase={false} variant="default" />
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

