import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  TableFooter,
  Typography,
  useTheme,
} from "@mui/material";
import singleTheme from "../../../themes/v1SingleTheme";
import { useCallback, useMemo, useState, useEffect } from "react";
import TablePaginationActions from "../../TablePagination";
import { ChevronsUpDown } from "lucide-react";
import ScorersTableHead from "./ScorersTableHead";
import ScorersTableBody from "./ScorersTableBody";
import EmptyState from "../../EmptyState";
import {
  getPaginationRowCount,
  setPaginationRowCount,
} from "../../../../application/utils/paginationStorage";

const SelectorVertical = (props: React.SVGAttributes<SVGSVGElement>) => (
  <ChevronsUpDown size={16} {...props} />
);

const SCORERS_SORTING_KEY = "verifywise_scorers_sorting";

export type SortDirection = "asc" | "desc" | null;
export type SortConfig = {
  key: string;
  direction: SortDirection;
};

export interface ScorerRow {
  id: string;
  name: string;
  type: string;
  metricKey: string;
  enabled: boolean;
  defaultThreshold?: number | null;
  config?: {
    judgeModel?: string | { name?: string; provider?: string; params?: Record<string, unknown> };
    model?: string | { name?: string };
    choiceScores?: Array<{ label: string; score: number }>;
    [key: string]: unknown;
  };
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ScorersTableProps {
  rows: ScorerRow[];
  onRowClick?: (scorer: ScorerRow) => void;
  onEdit?: (scorer: ScorerRow) => void;
  onDelete?: (scorer: ScorerRow) => void;
  loading?: boolean;
}

const columns = [
  { id: "name", label: "SCORER", sortable: true },
  { id: "model", label: "MODEL", sortable: true },
  { id: "threshold", label: "THRESHOLD", sortable: true },
  { id: "choiceScores", label: "# CHOICE SCORES", sortable: true },
  { id: "createdAt", label: "DATE", sortable: true },
  { id: "actions", label: "ACTION", sortable: false },
];

const ScorersTable: React.FC<ScorersTableProps> = ({
  rows,
  onRowClick,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    getPaginationRowCount("scorers", 10)
  );

  // Initialize sorting state from localStorage or default to no sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const saved = localStorage.getItem(SCORERS_SORTING_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { key: "", direction: null };
      }
    }
    return { key: "", direction: null };
  });

  // Save sorting state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(SCORERS_SORTING_KEY, JSON.stringify(sortConfig));
  }, [sortConfig]);

  // Sorting handler
  const handleSort = useCallback((columnId: string) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === columnId) {
        if (prevConfig.direction === "asc") {
          return { key: columnId, direction: "desc" };
        } else if (prevConfig.direction === "desc") {
          return { key: "", direction: null };
        }
      }
      return { key: columnId, direction: "asc" };
    });
  }, []);

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

  // Sort the scorers based on current sort configuration
  const sortedRows = useMemo(() => {
    if (!rows || !sortConfig.key || !sortConfig.direction) {
      return rows || [];
    }

    const sortableRows = [...rows];

    return sortableRows.sort((a: ScorerRow, b: ScorerRow) => {
      let aValue: string | number | boolean;
      let bValue: string | number | boolean;

      switch (sortConfig.key) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;

        case "model":
          aValue = getModelName(a).toLowerCase();
          bValue = getModelName(b).toLowerCase();
          break;

        case "threshold":
          aValue = a.defaultThreshold ?? 0;
          bValue = b.defaultThreshold ?? 0;
          break;

        case "choiceScores":
          aValue = a.config?.choiceScores?.length ?? 0;
          bValue = b.config?.choiceScores?.length ?? 0;
          break;

        case "createdAt":
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;

        default:
          return 0;
      }

      // Handle string comparisons
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }

      // Handle number comparisons
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortConfig]);

  // Ensure page is valid when rows change
  const validPage =
    sortedRows.length === 0
      ? 0
      : Math.min(page, Math.max(0, Math.ceil(sortedRows.length / rowsPerPage) - 1));

  useEffect(() => {
    if (page !== validPage) {
      setPage(validPage);
    }
  }, [sortedRows.length, page, validPage]);

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage + rowsPerPage, sortedRows?.length ?? 0);
    return `${start} - ${end}`;
  }, [page, rowsPerPage, sortedRows?.length]);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newRowsPerPage = parseInt(event.target.value, 10);
      setRowsPerPage(newRowsPerPage);
      setPaginationRowCount("scorers", newRowsPerPage);
      setPage(0);
    },
    []
  );

  return (
    <TableContainer>
      <Table sx={{ ...singleTheme.tableStyles.primary.frame }}>
        <ScorersTableHead
          columns={columns}
          sortConfig={sortConfig}
          onSort={handleSort}
        />
        {loading ? (
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} sx={{ textAlign: "center", py: 4 }}>
                <Typography>Loading...</Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        ) : sortedRows.length !== 0 ? (
          <ScorersTableBody
            rows={sortedRows}
            page={validPage}
            rowsPerPage={rowsPerPage}
            onRowClick={onRowClick}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ) : (
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} sx={{ border: "none", p: 0 }}>
                <EmptyState message="No scorers found. Create a scorer to get started." />
              </TableCell>
            </TableRow>
          </TableBody>
        )}
        <TableFooter>
          <TableRow>
            <TableCell colSpan={columns.length} sx={{ border: "none", p: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingX: theme.spacing(4),
                }}
              >
                <Typography
                  sx={{
                    paddingX: theme.spacing(2),
                    fontSize: 12,
                    opacity: 0.7,
                    color: theme.palette.text.secondary,
                  }}
                >
                  Showing {getRange} of {sortedRows?.length} scorer
                  {sortedRows?.length !== 1 ? "s" : ""}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <TablePagination
                    component="div"
                    count={sortedRows?.length}
                    page={validPage}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[5, 10, 15, 20, 25]}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    ActionsComponent={(props) => (
                      <TablePaginationActions {...props} />
                    )}
                    labelRowsPerPage="Scorers per page"
                    labelDisplayedRows={({ page: p, count }) =>
                      `Page ${p + 1} of ${Math.max(
                        0,
                        Math.ceil(count / rowsPerPage)
                      )}`
                    }
                    sx={{
                      mt: theme.spacing(6),
                      color: theme.palette.text.secondary,
                      "& .MuiSelect-select": {
                        width: theme.spacing(10),
                        borderRadius: theme.shape.borderRadius,
                        border: `1px solid ${theme.palette.border.light}`,
                        padding: theme.spacing(4),
                      },
                    }}
                    slotProps={{
                      select: {
                        MenuProps: {
                          keepMounted: true,
                          PaperProps: {
                            className: "pagination-dropdown",
                            sx: { mt: 0, mb: theme.spacing(2) },
                          },
                          transformOrigin: { vertical: "bottom", horizontal: "left" },
                          anchorOrigin: { vertical: "top", horizontal: "left" },
                          sx: { mt: theme.spacing(-2) },
                        },
                        inputProps: { id: "pagination-dropdown" },
                        IconComponent: SelectorVertical,
                        sx: {
                          ml: theme.spacing(4),
                          mr: theme.spacing(12),
                          minWidth: theme.spacing(20),
                          textAlign: "left",
                        },
                      },
                    }}
                  />
                </Box>
              </Box>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default ScorersTable;

