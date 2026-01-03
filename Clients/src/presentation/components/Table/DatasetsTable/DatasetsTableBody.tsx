import { useState } from "react";
import {
  TableBody,
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Typography,
  Popover,
  Stack,
  CircularProgress,
} from "@mui/material";
import { Trash2, MoreVertical, Eye, Edit3, Download } from "lucide-react";
import singleTheme from "../../../themes/v1SingleTheme";
import { DatasetRow } from "./index";
import CustomizableButton from "../../Button/CustomizableButton";

interface DatasetsTableBodyProps {
  rows: DatasetRow[];
  page: number;
  rowsPerPage: number;
  onRowClick?: (dataset: DatasetRow) => void;
  onView?: (dataset: DatasetRow) => void;
  onEdit?: (dataset: DatasetRow) => void;
  onDelete?: (dataset: DatasetRow) => void;
  onDownload?: (dataset: DatasetRow) => void;
}

const DatasetsTableBody: React.FC<DatasetsTableBodyProps> = ({
  rows,
  page,
  rowsPerPage,
  onRowClick,
  onView,
  onEdit,
  onDelete,
  onDownload,
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

  const handleDownloadClick = () => {
    if (menuRow && onDownload) {
      onDownload(menuRow);
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
                ) : metadata?.promptCount === 0 ? (
                  <Chip
                    label="Empty"
                    size="small"
                    sx={{
                      height: "22px",
                      fontSize: "11px",
                      fontWeight: 500,
                      borderRadius: "4px",
                      backgroundColor: "#FEE2E2",
                      color: "#DC2626",
                    }}
                  />
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
          {onView && (
            <CustomizableButton
              variant="outlined"
              onClick={handleViewClick}
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
              View prompts
            </CustomizableButton>
          )}
          {onEdit && (
            <CustomizableButton
              variant="outlined"
              onClick={handleEditClick}
              startIcon={<Edit3 size={14} />}
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
              Open in editor
            </CustomizableButton>
          )}
          {onDownload && (
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
              Download JSON
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
    </TableBody>
  );
};

export default DatasetsTableBody;
