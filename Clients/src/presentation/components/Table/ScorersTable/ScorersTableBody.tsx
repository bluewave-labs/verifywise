import { useState } from "react";
import {
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { Pencil, Trash2, MoreVertical } from "lucide-react";
import singleTheme from "../../../themes/v1SingleTheme";
import { ScorerRow } from "./index";

interface ScorersTableBodyProps {
  rows: ScorerRow[];
  page: number;
  rowsPerPage: number;
  onRowClick?: (scorer: ScorerRow) => void;
  onEdit?: (scorer: ScorerRow) => void;
  onDelete?: (scorer: ScorerRow) => void;
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

const ScorersTableBody: React.FC<ScorersTableBodyProps> = ({
  rows,
  page,
  rowsPerPage,
  onRowClick,
  onEdit,
  onDelete,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = useState<ScorerRow | null>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, row: ScorerRow) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
    setMenuRow(row);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuRow(null);
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

  // Helper to get model name from scorer
  const getModelName = (scorer: ScorerRow): string => {
    if (typeof scorer.config?.judgeModel === "string") {
      return scorer.config.judgeModel;
    }
    if (typeof scorer.config?.judgeModel === "object" && scorer.config.judgeModel?.name) {
      return scorer.config.judgeModel.name;
    }
    if (typeof scorer.config?.model === "string") {
      return scorer.config.model;
    }
    if (typeof scorer.config?.model === "object" && scorer.config.model?.name) {
      return scorer.config.model.name;
    }
    return scorer.metricKey || "Scorer";
  };

  return (
    <TableBody>
      {rows
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((scorer) => (
          <TableRow
            key={scorer.id}
            onClick={() => onRowClick?.(scorer)}
            sx={{
              ...singleTheme.tableStyles.primary.body.row,
              cursor: onRowClick ? "pointer" : "default",
              "&:hover": {
                backgroundColor: "#F9FAFB",
              },
            }}
          >
            {/* SCORER NAME */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                textTransform: "none",
              }}
            >
              {scorer.name}
            </TableCell>

            {/* MODEL - center aligned */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                textAlign: "center",
                textTransform: "none",
              }}
            >
              {getModelName(scorer)}
            </TableCell>

            {/* THRESHOLD - center aligned */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                textAlign: "center",
                textTransform: "none",
              }}
            >
              {scorer.defaultThreshold ?? "-"}
            </TableCell>

            {/* # CHOICE SCORES - center aligned */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                textAlign: "center",
                textTransform: "none",
              }}
            >
              {scorer.config?.choiceScores?.length ?? "-"}
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
                {formatDate(scorer.createdAt)}
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
                onClick={(e) => handleMenuOpen(e, scorer)}
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
        ))}

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
        {onEdit && (
          <MenuItem onClick={handleEditClick}>
            <ListItemIcon sx={{ minWidth: "32px !important" }}>
              <Pencil size={16} color="#13715B" />
            </ListItemIcon>
            <ListItemText
              primary="Edit"
              primaryTypographyProps={{ fontSize: "13px" }}
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

export default ScorersTableBody;

