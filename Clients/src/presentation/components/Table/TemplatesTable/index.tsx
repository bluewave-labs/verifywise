import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableFooter,
  Typography,
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";
import singleTheme from "../../../themes/v1SingleTheme";
import { useMemo, useState } from "react";
import TablePaginationActions from "../../TablePagination";
import { ChevronUp, ChevronDown, ChevronsUpDown, Copy } from "lucide-react";
import {
  getPaginationRowCount,
  setPaginationRowCount,
} from "../../../../application/utils/paginationStorage";

// Re-export TemplateRow from TemplatesList
export type { TemplateRow } from "./TemplatesList";
import type { TemplateRow } from "./TemplatesList";
import { getPredominantDifficultyLabel, getDifficultyStyles } from "./TemplatesList";

export type SortDirection = "asc" | "desc" | null;
export type SortConfig = {
  key: string;
  direction: SortDirection;
};

export interface TemplatesTableProps {
  rows: TemplateRow[];
  onRowClick?: (template: TemplateRow) => void;
  onUse?: (template: TemplateRow) => void;
  loading?: boolean;
  copyingTemplate?: boolean;
  emptyMessage?: string;
  showPagination?: boolean;
  compact?: boolean;
}

const getTypeStyles = (type?: string) => {
  switch (type) {
    case "single-turn":
      return { backgroundColor: "#FEF3C7", color: "#92400E" };
    case "multi-turn":
      return { backgroundColor: "#E3F2FD", color: "#1565C0" };
    case "simulated":
      return { backgroundColor: "#EDE9FE", color: "#6D28D9" };
    default:
      return { backgroundColor: "#F3F4F6", color: "#6B7280" };
  }
};

const getCategoryStyles = (category: string) => {
  switch (category) {
    case "chatbot":
      return { backgroundColor: "#CCFBF1", color: "#0D9488" };
    case "rag":
      return { backgroundColor: "#E0E7FF", color: "#3730A3" };
    case "agent":
      return { backgroundColor: "#FEE2E2", color: "#DC2626" };
    default:
      return { backgroundColor: "#F3F4F6", color: "#6B7280" };
  }
};

const TemplatesTable: React.FC<TemplatesTableProps> = ({
  rows,
  onRowClick,
  onUse,
  loading = false,
  copyingTemplate = false,
  emptyMessage = "No template datasets available",
  showPagination = true,
  compact = false,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    getPaginationRowCount("templates", 10)
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "",
    direction: null,
  });

  // Sorted rows
  const sortedRows = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return rows;

    return [...rows].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      switch (sortConfig.key) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "type":
          aVal = a.type || "";
          bVal = b.type || "";
          break;
        case "category":
          aVal = a.category;
          bVal = b.category;
          break;
        case "tests":
          aVal = a.test_count ?? 0;
          bVal = b.test_count ?? 0;
          break;
        case "difficulty": {
          const order = { Easy: 0, Medium: 1, Hard: 2 };
          aVal = order[getPredominantDifficultyLabel(a.difficulty) as keyof typeof order] ?? 1;
          bVal = order[getPredominantDifficultyLabel(b.difficulty) as keyof typeof order] ?? 1;
          break;
        }
        default:
          return 0;
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortConfig]);

  // Paginated rows
  const paginatedRows = useMemo(() => {
    if (!showPagination) return sortedRows;
    const start = page * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, page, rowsPerPage, showPagination]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        if (prev.direction === "desc") return { key: "", direction: null };
        return { key, direction: "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPaginationRowCount("templates", newRowsPerPage);
    setPage(0);
  };

  // Sortable header cell
  const SortableHeader = ({ label, sortKey, width }: { label: string; sortKey: string; width: string }) => (
    <TableCell
      sx={{
        ...singleTheme.tableStyles.primary.header.cell,
        width,
        cursor: "pointer",
        userSelect: "none",
        textAlign: sortKey === "name" ? "left" : "center",
        "&:hover": {
          backgroundColor: "rgba(0, 0, 0, 0.04)",
        },
      }}
      onClick={() => handleSort(sortKey)}
    >
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            fontSize: compact ? "12px" : "13px",
            color: sortConfig.key === sortKey ? "primary.main" : "inherit",
          }}
        >
          {label}
        </Typography>
        <Box sx={{ color: sortConfig.key === sortKey ? "primary.main" : "#9CA3AF", display: "flex", alignItems: "center" }}>
          {sortConfig.key === sortKey && sortConfig.direction === "asc" && <ChevronUp size={14} />}
          {sortConfig.key === sortKey && sortConfig.direction === "desc" && <ChevronDown size={14} />}
          {sortConfig.key !== sortKey && <ChevronsUpDown size={14} />}
        </Box>
      </Box>
    </TableCell>
  );

  return (
    <TableContainer>
      <Table sx={{ ...singleTheme.tableStyles.primary.frame }} size={compact ? "small" : "medium"}>
        <TableHead sx={{ backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors }}>
          <TableRow sx={singleTheme.tableStyles.primary.header.row}>
            <SortableHeader label="DATASET" sortKey="name" width="25%" />
            <SortableHeader label="TYPE" sortKey="type" width="15%" />
            <SortableHeader label="CATEGORY" sortKey="category" width="15%" />
            <SortableHeader label="# PROMPTS" sortKey="tests" width="12%" />
            <SortableHeader label="DIFFICULTY" sortKey="difficulty" width="13%" />
            <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "15%", textAlign: "center" }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: compact ? "12px" : "13px" }}>
                ACTION
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} sx={{ textAlign: "center", py: 4 }}>
                <CircularProgress size={24} sx={{ color: "#13715B" }} />
              </TableCell>
            </TableRow>
          ) : paginatedRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            paginatedRows.map((template) => {
              const difficultyLabel = getPredominantDifficultyLabel(template.difficulty);
              return (
                <TableRow
                  key={template.key}
                  onClick={() => onRowClick?.(template)}
                  sx={{
                    ...singleTheme.tableStyles.primary.body.row,
                    cursor: onRowClick ? "pointer" : "default",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                >
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, maxWidth: "400px" }}>
                    <Typography sx={{ fontSize: compact ? "12px" : "13px", fontWeight: 500 }}>
                      {template.name}
                    </Typography>
                    {template.description && !compact && (
                      <Typography
                        sx={{
                          fontSize: "11px",
                          color: "#9CA3AF",
                          mt: 0.25,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "380px",
                        }}
                        title={template.description}
                      >
                        {template.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, textAlign: "center" }}>
                    {template.type ? (
                      <Chip
                        label={template.type === "single-turn" ? "Single-Turn" : template.type === "multi-turn" ? "Multi-Turn" : "Simulated"}
                        size="small"
                        sx={{
                          height: compact ? "20px" : "22px",
                          fontSize: compact ? "10px" : "11px",
                          fontWeight: 500,
                          borderRadius: "4px",
                          ...getTypeStyles(template.type),
                        }}
                      />
                    ) : (
                      <Typography sx={{ fontSize: "13px", color: "#9CA3AF" }}>-</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, textAlign: "center" }}>
                    <Chip
                      label={template.category === "rag" ? "RAG" : template.category === "chatbot" ? "Chatbot" : "Agent"}
                      size="small"
                      sx={{
                        height: compact ? "20px" : "22px",
                        fontSize: compact ? "10px" : "11px",
                        fontWeight: 500,
                        borderRadius: "4px",
                        ...getCategoryStyles(template.category),
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, textAlign: "center" }}>
                    <Typography sx={{ fontSize: compact ? "12px" : "13px", color: "#6B7280" }}>
                      {template.test_count ?? "-"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, textAlign: "center" }}>
                    <Chip
                      label={difficultyLabel}
                      size="small"
                      sx={{
                        ...getDifficultyStyles(difficultyLabel),
                        height: compact ? "20px" : "22px",
                        fontSize: compact ? "10px" : "11px",
                        fontWeight: 500,
                        borderRadius: "4px",
                        "& .MuiChip-label": { px: 1 },
                      }}
                    />
                  </TableCell>
                  <TableCell
                    sx={{ ...singleTheme.tableStyles.primary.body.cell, textAlign: "center" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Copy size={compact ? 12 : 14} />}
                      onClick={() => onUse?.(template)}
                      disabled={copyingTemplate}
                      sx={{
                        textTransform: "none",
                        fontSize: compact ? "11px" : "12px",
                        height: compact ? "24px" : "28px",
                        borderColor: "#d0d5dd",
                        color: "#344054",
                        "&:hover": {
                          borderColor: "#13715B",
                          color: "#13715B",
                        },
                      }}
                    >
                      Use
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
        {showPagination && sortedRows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                count={sortedRows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                ActionsComponent={TablePaginationActions}
                sx={{
                  borderBottom: "none",
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontSize: "12px",
                  },
                }}
              />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  );
};

export default TemplatesTable;
export { getPredominantDifficultyLabel, getDifficultyStyles, getTypeStyles, getCategoryStyles } from "./TemplatesList";
export { default as TemplatesList } from "./TemplatesList";

