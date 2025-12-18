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
import DatasetsTableHead from "./DatasetsTableHead";
import DatasetsTableBody from "./DatasetsTableBody";
import EmptyState from "../../EmptyState";
import {
  getPaginationRowCount,
  setPaginationRowCount,
} from "../../../../application/utils/paginationStorage";

const SelectorVertical = (props: React.SVGAttributes<SVGSVGElement>) => (
  <ChevronsUpDown size={16} {...props} />
);

const DATASETS_SORTING_KEY = "verifywise_datasets_sorting";

export type SortDirection = "asc" | "desc" | null;
export type SortConfig = {
  key: string;
  direction: SortDirection;
};

export interface DatasetRow {
  key: string;
  name: string;
  path: string;
  useCase?: string;
  type?: "single-turn" | "multi-turn" | "simulated";
  createdAt?: string | null;
  updatedAt?: string | null;
  metadata?: {
    promptCount?: number;
    avgDifficulty?: string;
    loading?: boolean;
  };
}

export interface DatasetsTableProps {
  rows: DatasetRow[];
  onRowClick?: (dataset: DatasetRow) => void;
  onView?: (dataset: DatasetRow) => void;
  onEdit?: (dataset: DatasetRow) => void;
  onDelete?: (dataset: DatasetRow) => void;
  onDownload?: (dataset: DatasetRow) => void;
  loading?: boolean;
  emptyMessage?: string;
  hidePagination?: boolean;
}

const columns = [
  { id: "name", label: "NAME", sortable: true },
  { id: "type", label: "TYPE", sortable: true },
  { id: "useCase", label: "USE CASE", sortable: true },
  { id: "promptCount", label: "# PROMPTS", sortable: true },
  { id: "difficulty", label: "DIFFICULTY", sortable: true },
  { id: "createdAt", label: "DATE", sortable: true },
  { id: "actions", label: "ACTION", sortable: false },
];

const DatasetsTable: React.FC<DatasetsTableProps> = ({
  rows,
  onRowClick,
  onView,
  onEdit,
  onDelete,
  onDownload,
  loading = false,
  emptyMessage = "No datasets found. Upload a dataset or copy from templates.",
  hidePagination = false,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    getPaginationRowCount("datasets", 10)
  );

  // Initialize sorting state from localStorage or default to no sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const saved = localStorage.getItem(DATASETS_SORTING_KEY);
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
    localStorage.setItem(DATASETS_SORTING_KEY, JSON.stringify(sortConfig));
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

  // Sort the datasets based on current sort configuration
  const sortedRows = useMemo(() => {
    if (!rows || !sortConfig.key || !sortConfig.direction) {
      return rows || [];
    }

    const sortableRows = [...rows];

    return sortableRows.sort((a: DatasetRow, b: DatasetRow) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;

        case "promptCount":
          aValue = a.metadata?.promptCount ?? 0;
          bValue = b.metadata?.promptCount ?? 0;
          break;

        case "useCase":
          aValue = (a.useCase || "").toLowerCase();
          bValue = (b.useCase || "").toLowerCase();
          break;

        case "type":
          aValue = (a.type || "").toLowerCase();
          bValue = (b.type || "").toLowerCase();
          break;

        case "difficulty": {
          // Difficulty order: Hard > Medium > Easy
          const getDifficultyValue = (diff?: string) => {
            if (!diff) return 0;
            const lower = diff.toLowerCase();
            if (lower.includes("hard")) return 3;
            if (lower.includes("medium")) return 2;
            if (lower.includes("easy")) return 1;
            return 0;
          };
          aValue = getDifficultyValue(a.metadata?.avgDifficulty);
          bValue = getDifficultyValue(b.metadata?.avgDifficulty);
          break;
        }

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
      setPaginationRowCount("datasets", newRowsPerPage);
      setPage(0);
    },
    []
  );

  return (
    <TableContainer>
      <Table sx={{ ...singleTheme.tableStyles.primary.frame }}>
        <DatasetsTableHead
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
          <DatasetsTableBody
            rows={sortedRows}
            page={hidePagination ? 0 : validPage}
            rowsPerPage={hidePagination ? sortedRows.length : rowsPerPage}
            onRowClick={onRowClick}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onDownload={onDownload}
          />
        ) : (
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} sx={{ border: "none", p: 0 }}>
                <EmptyState message={emptyMessage} />
              </TableCell>
            </TableRow>
          </TableBody>
        )}
        {!hidePagination && (
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
                  Showing {getRange} of {sortedRows?.length} dataset
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
                    labelRowsPerPage="Datasets per page"
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
        )}
      </Table>
    </TableContainer>
  );
};

export default DatasetsTable;
