import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  useTheme,
  TableFooter,
} from "@mui/material";
import { Suspense, lazy, useMemo, useState, useCallback, useEffect } from "react";
import TablePaginationActions from "../../TablePagination";
import TableHeader, { SortConfig } from "./TableHead";
import EmptyState from "../../EmptyState";
import { ChevronsUpDown } from "lucide-react";

const SelectorVertical = (props: React.SVGProps<SVGSVGElement>) => (
  <ChevronsUpDown size={16} {...props} />
);
import {
  paginationStatus,
  paginationStyle,
  paginationDropdown,
  paginationSelect,
} from "./styles";
import singleTheme from "../../../themes/v1SingleTheme";
import {
  getPaginationRowCount,
  setPaginationRowCount,
} from "../../../../application/utils/paginationStorage";
import { IEvaluationTableProps, IEvaluationRow } from "../../../../domain/interfaces/i.table";

const EvaluationTableBody = lazy(() => import("./TableBody"));

const EVALUATION_SORTING_KEY = "verifywise_evaluation_sorting";

const EvaluationTable: React.FC<IEvaluationTableProps> = ({
  columns,
  rows,
  removeModel,
  page,
  setCurrentPagingation,
  onShowDetails,
  onRerun,
}) => {
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    getPaginationRowCount("evaluation", 10)
  );

  // Initialize sorting state from localStorage
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const saved = localStorage.getItem(EVALUATION_SORTING_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { key: "", direction: null };
      }
    }
    return { key: "", direction: null };
  });

  // Save sorting state to localStorage
  useEffect(() => {
    localStorage.setItem(EVALUATION_SORTING_KEY, JSON.stringify(sortConfig));
  }, [sortConfig]);

  // Sorting handler
  const handleSort = useCallback((columnKey: string) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === columnKey) {
        if (prevConfig.direction === "asc") {
          return { key: columnKey, direction: "desc" };
        } else if (prevConfig.direction === "desc") {
          return { key: "", direction: null };
        }
      }
      return { key: columnKey, direction: "asc" };
    });
  }, []);

  // Sort the rows based on current sort configuration
  const sortedRows = useMemo(() => {
    if (!rows || !sortConfig.key || !sortConfig.direction) {
      return rows || [];
    }

    const sortableRows = [...rows];

    return sortableRows.sort((a: IEvaluationRow, b: IEvaluationRow) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case "id":
          aValue = a.id.toLowerCase();
          bValue = b.id.toLowerCase();
          break;

        case "model":
          aValue = a.model.toLowerCase();
          bValue = b.model.toLowerCase();
          break;

        case "judge":
          aValue = (a.judge || "").toLowerCase();
          bValue = (b.judge || "").toLowerCase();
          break;

        case "prompts":
          aValue = a.prompts ?? 0;
          bValue = b.prompts ?? 0;
          break;

        case "dataset":
          aValue = a.dataset.toLowerCase();
          bValue = b.dataset.toLowerCase();
          break;

        case "status": {
          // Status order: Completed > Running > In Progress > Pending > Failed
          const getStatusValue = (status: string) => {
            switch (status) {
              case "Completed": return 5;
              case "Running": return 4;
              case "In Progress": return 3;
              case "Pending": return 2;
              case "Failed": return 1;
              default: return 0;
            }
          };
          aValue = getStatusValue(a.status);
          bValue = getStatusValue(b.status);
          break;
        }

        case "date":
          aValue = a.date ? new Date(a.date).getTime() : 0;
          bValue = b.date ? new Date(b.date).getTime() : 0;
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

  const theme = useTheme();

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage + rowsPerPage, sortedRows?.length ?? 0);
    return `${start} - ${end}`;
  }, [page, rowsPerPage, sortedRows?.length]);

  const handleChangePage = useCallback(
    (_: unknown, newPage: number) => {
      setCurrentPagingation(newPage);
    },
    [setCurrentPagingation]
  );

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newRowsPerPage = parseInt(event.target.value, 10);
      setRowsPerPage(newRowsPerPage);
      setPaginationRowCount("evaluation", newRowsPerPage);
      setCurrentPagingation(0);
    },
    [setRowsPerPage, setCurrentPagingation]
  );

  return (
    <>
      <TableContainer sx={{ mt: 10 }}>
        <Suspense fallback={<div>Loading...</div>}>
          <Table sx={{ ...singleTheme.tableStyles.primary.frame }}>
            <TableHeader columns={columns} sortConfig={sortConfig} onSort={handleSort} />
            {sortedRows.length !== 0 ? (
              <>
                <EvaluationTableBody
                  rows={sortedRows}
                  onRemoveModel={removeModel}
                  onShowDetails={onShowDetails}
                  onRerun={onRerun}
                  page={page}
                  rowsPerPage={rowsPerPage}
                />
                <TableFooter>
                  <TableRow
                    sx={{
                      "& .MuiTableCell-root.MuiTableCell-footer": {
                        paddingX: theme.spacing(8),
                        paddingY: theme.spacing(4),
                      },
                    }}
                  >
                    <TableCell sx={paginationStatus(theme)}>
                      Showing {getRange} of {sortedRows?.length} evaluation
                      {sortedRows?.length !== 1 ? "s" : ""}
                    </TableCell>
                    <TablePagination
                      count={sortedRows.length}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      rowsPerPageOptions={[5, 10, 15, 20, 25]}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      ActionsComponent={(props) => (
                        <TablePaginationActions {...props} />
                      )}
                      labelRowsPerPage="Evaluations per page"
                      labelDisplayedRows={({ page, count }) =>
                        `Page ${page + 1} of ${Math.max(
                          0,
                          Math.ceil(count / rowsPerPage)
                        )}`
                      }
                      sx={paginationStyle(theme)}
                      slotProps={{
                        select: {
                          MenuProps: {
                            keepMounted: true,
                            PaperProps: {
                              className: "pagination-dropdown",
                              sx: paginationDropdown(theme),
                            },
                            transformOrigin: {
                              vertical: "bottom",
                              horizontal: "left",
                            },
                            anchorOrigin: {
                              vertical: "top",
                              horizontal: "left",
                            },
                            sx: { mt: theme.spacing(-2) },
                          },
                          inputProps: { id: "pagination-dropdown" },
                          IconComponent: SelectorVertical,
                          sx: paginationSelect(theme),
                        },
                      }}
                    />
                  </TableRow>
                </TableFooter>
              </>
            ) : (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={columns.length} sx={{ border: "none", p: 0 }}>
                    <EmptyState message="There is currently no data in this table." />
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        </Suspense>
      </TableContainer>
    </>
  );
};

export default EvaluationTable;
