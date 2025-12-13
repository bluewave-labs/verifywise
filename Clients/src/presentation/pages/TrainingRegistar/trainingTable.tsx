import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  useTheme,
  Stack,
  Typography,
  TableFooter,
  Box,
} from "@mui/material";
import TablePaginationActions from "../../components/TablePagination";
import "../../components/Table/index.css";
import singleTheme from "../../themes/v1SingleTheme";
import CustomIconButton from "../../components/IconButton";
import allowedRoles from "../../../application/constants/permissions";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../../application/hooks/useAuth";
import { getPaginationRowCount, setPaginationRowCount } from "../../../application/utils/paginationStorage";
import { TrainingRegistarModel } from '../../../domain/models/Common/TrainingRegistar/trainingRegistar.model';
import { TrainingStatus } from "../../../domain/enums/status.enum";
import Chip from "../../components/Chip";

//const Alert = lazy(() => import("../../../components/Alert"));

// Training table sorting constants
const TRAINING_SORTING_KEY = "verifywise_training_sorting";

type SortDirection = "asc" | "desc" | null;
type SortConfig = {
  key: string;
  direction: SortDirection;
};

//Constant for table
const TABLE_COLUMNS = [
  { id: "training_name", label: "TRAINING NAME", sortable: true },
  { id: "duration", label: "DURATION", sortable: true },
  { id: "provider", label: "PROVIDER", sortable: true },
  { id: "department", label: "DEPARTMENT", sortable: true },
  { id: "status", label: "STATUS", sortable: true },
  { id: "numberOfPeople", label: "PEOPLE", sortable: true },
  { id: "actions", label: "", sortable: false },
];

interface TrainingTableProps {
  data: TrainingRegistarModel[];
  isLoading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  paginated?: boolean;
  hidePagination?: boolean;
}

const SelectorVertical = (props: React.SVGAttributes<SVGSVGElement>) => (
  <ChevronsUpDown size={16} {...props} />
);

const DEFAULT_ROWS_PER_PAGE = 10;

// Sortable Table Header Component
const SortableTableHead: React.FC<{
  columns: typeof TABLE_COLUMNS;
  sortConfig: SortConfig;
  onSort: (columnId: string) => void;
}> = ({ columns, sortConfig, onSort }) => {
  const theme = useTheme();

  return (
    <TableHead
      sx={{
        backgroundColor:
          singleTheme.tableStyles.primary.header.backgroundColors,
      }}
    >
      <TableRow sx={singleTheme.tableStyles.primary.header.row}>
        {columns.map((column) => (
          <TableCell
            key={column.id}
            sx={{
              ...singleTheme.tableStyles.primary.header.cell,
              ...(column.id === "actions" && {
                position: "sticky",
                right: 0,
                zIndex: 10,
                backgroundColor:
                  singleTheme.tableStyles.primary.header.backgroundColors,
              }),
              ...(column.sortable
                ? {
                    cursor: "pointer",
                    userSelect: "none",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }
                : {}),
            }}
            onClick={() => column.sortable && onSort(column.id)}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: theme.spacing(2),
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: sortConfig.key === column.id ? "primary.main" : "inherit",
                }}
              >
                {column.label}
              </Typography>
              {column.sortable && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: sortConfig.key === column.id ? "primary.main" : "#9CA3AF",
                  }}
                >
                  {sortConfig.key === column.id && sortConfig.direction === "asc" && (
                    <ChevronUp size={16} />
                  )}
                  {sortConfig.key === column.id && sortConfig.direction === "desc" && (
                    <ChevronDown size={16} />
                  )}
                  {sortConfig.key !== column.id && (
                    <ChevronsUpDown size={16} />
                  )}
                </Box>
              )}
            </Box>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

const StatusBadge: React.FC<{ status: TrainingStatus }> = ({
  status,
}) => {
  return <Chip label={status} />;
};

const TrainingTable: React.FC<TrainingTableProps> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  paginated = true,
  hidePagination = false,
}) => {
  const theme = useTheme();
  const { userRoleName } = useAuth();
  const [page, setPage] = useState(0);

  // Initialize rowsPerPage from localStorage utility
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    getPaginationRowCount('trainingRegistry', DEFAULT_ROWS_PER_PAGE)
  );

  // Initialize sorting state from localStorage or default to no sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const saved = localStorage.getItem(TRAINING_SORTING_KEY);
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
    localStorage.setItem(TRAINING_SORTING_KEY, JSON.stringify(sortConfig));
  }, [sortConfig]);

  const isDeletingAllowed =
    allowedRoles.training?.delete?.includes(userRoleName);

  // Sorting handlers
  const handleSort = useCallback((columnId: string) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === columnId) {
        // Toggle direction if same column, or clear if already descending
        if (prevConfig.direction === "asc") {
          return { key: columnId, direction: "desc" };
        } else if (prevConfig.direction === "desc") {
          return { key: "", direction: null };
        }
      }
      // New column or first sort
      return { key: columnId, direction: "asc" };
    });
  }, []);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newRowsPerPage = parseInt(event.target.value, 10);
      setRowsPerPage(newRowsPerPage);
      setPaginationRowCount('trainingRegistry', newRowsPerPage);
      setPage(0);
    },
    []
  );

  // Sort the training data based on current sort configuration
  const sortedData = useMemo(() => {
    if (!data || !sortConfig.key || !sortConfig.direction) {
      return data || [];
    }

    const sortableData = [...data];

    // Helper functions for sorting
    const parseDuration = (duration: string) => {
      const match = duration.match(/(\d+)/);
      return match ? parseInt(match[0]) : 0;
    };

    const getStatusValue = (status: TrainingStatus) => {
      switch (status) {
        case TrainingStatus.InProgress:
          return 3;
        case TrainingStatus.Planned:
          return 2;
        case TrainingStatus.Completed:
          return 1;
        default:
          return 0;
      }
    };

    return sortableData.sort((a: TrainingRegistarModel, b: TrainingRegistarModel) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case "training_name":
          aValue = a.training_name.toLowerCase();
          bValue = b.training_name.toLowerCase();
          break;

        case "duration":
          // Parse duration for numeric sorting (e.g., "2 hours", "30 minutes")
          aValue = parseDuration(a.duration);
          bValue = parseDuration(b.duration);
          break;

        case "provider":
          aValue = a.provider.toLowerCase();
          bValue = b.provider.toLowerCase();
          break;

        case "department":
          aValue = a.department.toLowerCase();
          bValue = b.department.toLowerCase();
          break;

        case "status":
          // Status order: In Progress > Planned > Completed
          aValue = getStatusValue(a.status);
          bValue = getStatusValue(b.status);
          break;

        case "numberOfPeople":
          aValue = a.numberOfPeople;
          bValue = b.numberOfPeople;
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
  }, [data, sortConfig]);

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage + rowsPerPage, sortedData?.length ?? 0);
    return `${start} - ${end}`;
  }, [page, rowsPerPage, sortedData?.length]);

  
  const tableBody = useMemo(
    () => (
      <TableBody>
        {sortedData?.length > 0 ? (
          sortedData
            .slice(
              hidePagination ? 0 : page * rowsPerPage,
              hidePagination ? Math.min(sortedData.length, 100) : page * rowsPerPage + rowsPerPage
            )
            // Defensive: Filter out invalid records early (fail fast)
            .filter((training) => {
              const isValid = training.id !== undefined && training.id !== null;
              if (!isValid) {
                console.error('[TrainingTable] Invalid training record without ID:', training);
              }
              return isValid;
            })
            .map((training) => {
              // Type guard: After filter, we know id exists
              const trainingId = training.id as number;
              const trainingIdStr = trainingId.toString();

              return (
                <TableRow
                  key={trainingId}
                  sx={{
                    ...singleTheme.tableStyles.primary.body.row,
                    "&:hover": { backgroundColor: "#FBFBFB", cursor: "pointer" },
                  }}
                  onClick={() => {
                    onEdit?.(trainingIdStr);
                  }}
                >
                  <TableCell  sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  cursor: "pointer",
                  textTransform: "none !important",
                  backgroundColor: sortConfig.key === "training_name" ? "#e8e8e8" : "#fafafa",
                }}>
                    {training.training_name}
                  </TableCell>
                  <TableCell  sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  cursor: "pointer",
                  textTransform: "none !important",
                  backgroundColor: sortConfig.key === "duration" ? "#f5f5f5" : "inherit",
                }}>
                    {training.duration}
                  </TableCell>
                  <TableCell  sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  cursor: "pointer",
                  textTransform: "none !important",
                  backgroundColor: sortConfig.key === "provider" ? "#f5f5f5" : "inherit",
                }}>
                    {training.provider}
                  </TableCell>
                  <TableCell  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    cursor: "pointer",
                    textTransform: "none !important",
                    backgroundColor: sortConfig.key === "department" ? "#f5f5f5" : "inherit",
                  }}>
                    {training.department}
                  </TableCell>
                  <TableCell  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    cursor: "pointer",
                    textTransform: "none !important",
                    backgroundColor: sortConfig.key === "status" ? "#f5f5f5" : "inherit",
                  }}>
                    <StatusBadge status={training.status} />
                  </TableCell>
                  <TableCell  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    cursor: "pointer",
                    textTransform: "none !important",
                    backgroundColor: sortConfig.key === "numberOfPeople" ? "#f5f5f5" : "inherit",
                  }}>
                    {training.numberOfPeople}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...singleTheme.tableStyles.primary.body.cell,
                      position: "sticky",
                      right: 0,
                      zIndex: 10,
                      minWidth: "50px",
                      backgroundColor: sortConfig.key === "actions" ? "#f5f5f5" : "inherit",
                    }}
                  >
                    {isDeletingAllowed && (
                      <CustomIconButton
                        id={trainingId}
                        onDelete={(e?: React.MouseEvent) => {
                          e?.stopPropagation();
                          onDelete?.(trainingIdStr);
                        }}
                        onEdit={(e?: React.MouseEvent) => {
                          e?.stopPropagation();
                          onEdit?.(trainingIdStr);
                        }}
                        onMouseEvent={(e: React.SyntheticEvent) => e.stopPropagation()}
                        warningTitle="Delete this training?"
                        warningMessage="When you delete this training, all data related to this training will be removed. This action is non-recoverable."
                        type="Training"
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })
        ) : (
          <TableRow>
            <TableCell
              colSpan={TABLE_COLUMNS.length}
              align="center"
              sx={{ py: 4 }}
            >
              No training data available.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    ),
    [sortedData, page, rowsPerPage, isDeletingAllowed, onEdit, onDelete]
  );

  if (isLoading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          border: "1px solid #EEEEEE",
          borderRadius: "4px",
          padding: theme.spacing(15, 5),
          minHeight: 200,
        }}
      >
        <Typography>Loading...</Typography>
      </Stack>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState message="There is currently no data in this table." />;
  }

  return (
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table sx={singleTheme.tableStyles.primary.frame}>
        <SortableTableHead
          columns={TABLE_COLUMNS}
          sortConfig={sortConfig}
          onSort={handleSort}
        />
        {tableBody}
        {paginated && !hidePagination && (
          <TableFooter>
            <TableRow
              sx={{
                "& .MuiTableCell-root.MuiTableCell-footer": {
                  paddingX: theme.spacing(8),
                  paddingY: theme.spacing(4),
                },
              }}
            >
              <TableCell
                sx={{
                  paddingX: theme.spacing(2),
                  fontSize: 12,
                  opacity: 0.7,
                }}
              >
                Showing {getRange} of {sortedData?.length} training(s)
              </TableCell>
              <TablePagination
                count={sortedData?.length ?? 0}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5, 10, 15, 25]}
                onRowsPerPageChange={handleChangeRowsPerPage}
                ActionsComponent={(props) => (
                  <TablePaginationActions {...props} />
                )}
                labelRowsPerPage="Rows per page"
                labelDisplayedRows={({ page, count }) =>
                  `Page ${page + 1} of ${Math.max(
                    0,
                    Math.ceil(count / rowsPerPage)
                  )}`
                }
                slotProps={{
                  select: {
                    MenuProps: {
                      keepMounted: true,
                      PaperProps: {
                        className: "pagination-dropdown",
                        sx: {
                          mt: 0,
                          mb: theme.spacing(2),
                        },
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
                    sx: {
                      ml: theme.spacing(4),
                      mr: theme.spacing(12),
                      minWidth: theme.spacing(20),
                      textAlign: "left",
                      "&.Mui-focused > div": {
                        backgroundColor: theme.palette.background.main,
                      },
                    },
                  },
                }}
                sx={{
                  mt: theme.spacing(6),
                  color: theme.palette.text.secondary,
                  "& .MuiSelect-icon": {
                    width: "24px",
                    height: "fit-content",
                  },
                  "& .MuiSelect-select": {
                    width: theme.spacing(10),
                    borderRadius: theme.shape.borderRadius,
                    border: `1px solid ${theme.palette.border.light}`,
                    padding: theme.spacing(4),
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

export default TrainingTable;
