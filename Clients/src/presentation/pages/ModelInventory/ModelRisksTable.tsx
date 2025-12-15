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
  Box,
  TableFooter,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/EmptyState";
import singleTheme from "../../themes/v1SingleTheme";
import IconButton from "../../components/IconButton";
import TablePaginationActions from "../../components/TablePagination";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";

const SelectorVertical = (props: React.SVGAttributes<SVGSVGElement>) => <ChevronsUpDown size={16} {...props} />;
import Chip from "../../components/Chip";
import { IModelRisk } from "../../../domain/interfaces/i.modelRisk";
import { User } from "../../../domain/types/User";
import { ModelRisksTableProps } from "../../../domain/interfaces/i.modelInventory";

// LocalStorage key for sorting
const MODEL_RISKS_SORTING_KEY = "verifywise_model_risks_sorting";

// Types for sorting
type SortDirection = "asc" | "desc" | null;
type SortConfig = {
  key: string;
  direction: SortDirection;
};

const titleOfTableColumns = [
  { id: "risk_name", label: "risk name", sortable: true },
  { id: "model_name", label: "model name", sortable: true },
  { id: "risk_category", label: "category", sortable: true },
  { id: "risk_level", label: "risk level", sortable: true },
  { id: "status", label: "status", sortable: true },
  { id: "owner", label: "owner", sortable: true },
  { id: "target_date", label: "target date", sortable: true },
  { id: "actions", label: " ", sortable: false },
];

const ModelRisksTable: React.FC<ModelRisksTableProps> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  users = [],
  models = [],
  hidePagination = false,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const cellStyle = singleTheme.tableStyles.primary.body.cell;

  // Initialize sorting state from localStorage or default to no sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const saved = localStorage.getItem(MODEL_RISKS_SORTING_KEY);
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
    localStorage.setItem(MODEL_RISKS_SORTING_KEY, JSON.stringify(sortConfig));
  }, [sortConfig]);

  const getCellStyle = useCallback((row: IModelRisk) => ({
    ...cellStyle,
    ...(row.is_deleted && {
      textDecoration: 'line-through',
    })
  }), [cellStyle]);

  const formattedUsers = useMemo(() => {
    return users.map((user: User) => ({
      _id: user.id,
      name: `${user.name} ${user.surname}`,
    }));
  }, [users]);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  const dataLength = data?.length ?? 0;

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(
      page * rowsPerPage + rowsPerPage,
      dataLength
    );
    return `${start} - ${end}`;
  }, [page, rowsPerPage, dataLength]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getOwnerName = useCallback((ownerId: string | number) => {
    const owner = formattedUsers.find((user) => user._id == ownerId);
    return owner?.name || "Unknown";
  }, [formattedUsers]);

  const getModelName = useCallback((modelId: number | null | undefined) => {
    if (!modelId) return "N/A";
    const model = models.find((m) => m.id == modelId);
    return model?.model || "Unknown";
  }, [models]);

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

  // Risk level order for sorting
  const getRiskLevelOrder = useCallback((level: string) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return 4;
      case "high":
        return 3;
      case "medium":
        return 2;
      case "low":
        return 1;
      default:
        return 0;
    }
  }, []);

  // Status order for sorting
  const getStatusOrder = useCallback((status: string) => {
    switch (status) {
      case "Open":
        return 1;
      case "In Progress":
        return 2;
      case "Resolved":
        return 3;
      case "Accepted":
        return 4;
      default:
        return 5;
    }
  }, []);

  // Sort the data based on current sort configuration
  const sortedData = useMemo(() => {
    if (!data || !sortConfig.key || !sortConfig.direction) {
      return data || [];
    }

    const sortableData = [...data];

    return sortableData.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case "risk_name":
          aValue = (a.risk_name || "").toLowerCase();
          bValue = (b.risk_name || "").toLowerCase();
          break;
        case "model_name":
          aValue = getModelName(a.model_id).toLowerCase();
          bValue = getModelName(b.model_id).toLowerCase();
          break;
        case "risk_category":
          aValue = (a.risk_category || "").toLowerCase();
          bValue = (b.risk_category || "").toLowerCase();
          break;
        case "risk_level":
          aValue = getRiskLevelOrder(a.risk_level);
          bValue = getRiskLevelOrder(b.risk_level);
          break;
        case "status":
          aValue = getStatusOrder(a.status);
          bValue = getStatusOrder(b.status);
          break;
        case "owner":
          aValue = getOwnerName(a.owner).toLowerCase();
          bValue = getOwnerName(b.owner).toLowerCase();
          break;
        case "target_date":
          aValue = a.target_date ? new Date(a.target_date).getTime() : 0;
          bValue = b.target_date ? new Date(b.target_date).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig, getModelName, getRiskLevelOrder, getStatusOrder, getOwnerName]);

  const tableHeader = useMemo(
    () => (
      <TableHead
        sx={{
          backgroundColor:
            singleTheme.tableStyles.primary.header.backgroundColors,
        }}
      >
        <TableRow sx={singleTheme.tableStyles.primary.header.row}>
          {titleOfTableColumns.map((column, index) => (
            <TableCell
              key={column.id}
              sx={{
                ...singleTheme.tableStyles.primary.header.cell,
                ...(index === titleOfTableColumns.length - 1
                  ? {
                      position: "sticky",
                      right: 0,
                      zIndex: 10,
                      backgroundColor:
                        singleTheme.tableStyles.primary.header.backgroundColors,
                    }
                  : {}),
                ...(column.sortable && {
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }),
              }}
              onClick={() => column.sortable && handleSort(column.id)}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {column.label}
                {column.sortable && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      color:
                        sortConfig.key === column.id
                          ? theme.palette.text.primary
                          : theme.palette.text.disabled,
                    }}
                  >
                    {sortConfig.key === column.id ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )
                    ) : (
                      <ChevronsUpDown size={16} />
                    )}
                  </Box>
                )}
              </Box>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    ),
    [sortConfig, handleSort, theme]
  );

  const tableBody = useMemo(
    () => (
      <TableBody>
        {sortedData &&
          sortedData
            .slice(
              hidePagination ? 0 : page * rowsPerPage,
              hidePagination ? Math.min(sortedData.length, 100) : page * rowsPerPage + rowsPerPage
            )
            .map((row: IModelRisk) => (
              <TableRow
                key={row.id}
                sx={{
                  ...singleTheme.tableStyles.primary.body.row,
                  ...(row.is_deleted && {
                    opacity: 0.7,
                    backgroundColor: theme.palette.action?.hover || '#fafafa',
                  })
                }}
                onClick={() => onEdit(row.id!)}
              >
                <TableCell sx={{
                  ...getCellStyle(row),
                  backgroundColor: sortConfig.key === "risk_name" ? "#e8e8e8" : "#fafafa",
                }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                    {row.risk_name}
                  </Typography>
                </TableCell>
                <TableCell sx={{
                  ...getCellStyle(row),
                  backgroundColor: sortConfig.key === "model_name" ? "#f5f5f5" : "inherit",
                }}>
                  {getModelName(row.model_id)}
                </TableCell>
                <TableCell sx={{
                  ...getCellStyle(row),
                  backgroundColor: sortConfig.key === "risk_category" ? "#f5f5f5" : "inherit",
                }}>
                  {row.risk_category}
                </TableCell>
                <TableCell sx={{
                  ...getCellStyle(row),
                  backgroundColor: sortConfig.key === "risk_level" ? "#f5f5f5" : "inherit",
                }}>
                  <Chip label={row.risk_level} />
                </TableCell>
                <TableCell sx={{
                  ...getCellStyle(row),
                  backgroundColor: sortConfig.key === "status" ? "#f5f5f5" : "inherit",
                }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor:
                          row.status === "Open" ? "#f04438" :
                          row.status === "In Progress" ? "#f79009" :
                          row.status === "Resolved" ? "#12b76a" :
                          "#6b7280", // Accepted
                      }}
                    />
                    <Typography sx={{ fontSize: 13 }}>
                      {row.status}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{
                  ...getCellStyle(row),
                  backgroundColor: sortConfig.key === "owner" ? "#f5f5f5" : "inherit",
                }}>
                  {getOwnerName(row.owner)}
                </TableCell>
                <TableCell sx={{
                  ...getCellStyle(row),
                  backgroundColor: sortConfig.key === "target_date" ? "#f5f5f5" : "inherit",
                }}>
                  {formatDate(row.target_date)}
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    position: "sticky",
                    right: 0,
                    zIndex: 10,
                    minWidth: "50px",
                  }}
                >
                  <IconButton
                    id={row.id!}
                    onDelete={() => onDelete(row.id!)}
                    onEdit={() => onEdit(row.id!)}
                    onMouseEvent={() => {}}
                    warningTitle="Delete this model risk?"
                    warningMessage="This action is non-recoverable."
                    type="model risk"
                  />
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    ),
    [
      sortedData,
      sortConfig,
      page,
      rowsPerPage,
      getCellStyle,
      getModelName,
      getOwnerName,
      onEdit,
      onDelete,
      hidePagination,
      theme,
    ]
  );

  // Show loading state
  if (isLoading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          border: "1px solid #EEEEEE",
          borderRadius: "4px",
          padding: theme.spacing(15, 5),
          paddingBottom: theme.spacing(20),
          gap: theme.spacing(10),
          minHeight: 200,
        }}
      >
        <Typography sx={{ fontSize: "13px", color: "#475467" }}>
          Loading model risks...
        </Typography>
      </Stack>
    );
  }

  return (
    <>
      {/* Empty state outside the table */}
      {!data || data.length === 0 ? (
        <EmptyState message="There are currently no model risks in this table." />
      ) : (
        <TableContainer>
          <Table sx={{ ...singleTheme.tableStyles.primary.frame }}>
            {tableHeader}
            {tableBody}
            {!hidePagination && (
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
                    Showing {getRange} of {dataLength} model risk(s)
                  </TableCell>
                  <TablePagination
                    count={dataLength}
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
      )}
    </>
  );
};

export default ModelRisksTable;