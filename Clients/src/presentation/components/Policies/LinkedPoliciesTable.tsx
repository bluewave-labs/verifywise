/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Box,
    Tooltip,
    IconButton,
    TableFooter,
    useTheme,
    Typography,
} from "@mui/material";

import {
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    Trash2,
} from "lucide-react";

import EmptyState from "../../components/EmptyState";
import TablePaginationActions from "../../components/TablePagination";

import {
    tableRowHoverStyle,
    tableRowDeletingStyle,
    paginationStyle,
    paginationMenuProps,
    paginationSelectStyle,
    tableFooterRowStyle,
    showingTextCellStyle,
} from "../../pages/ModelInventory/style";

import { singleTheme } from "../../themes";
import { useUserMap } from "../../../presentation/hooks/userMap";

interface LinkedObjectsTableProps {
    items: any[];
    projectRisk: any[];
    onRemove: (type: string, id: number) => void;
    deletingId?: number | null;
    hidePagination?: boolean;
    paginated?: boolean;
}


const SORT_KEY = "vw_link_risk_policies_sort";

type SortDirection = "asc" | "desc" | null;
type SortConfig = { key: string; direction: SortDirection };

const TABLE_COLUMNS = [
    { id: "name", label: "NAME", sortable: true },
    { id: "type", label: "TYPE", sortable: true },
    { id: "created_by", label: "CREATED BY", sortable: true },
    { id: "due_date", label: "DUE DATE", sortable: true },
    { id: "actions", label: "", sortable: false },
];

const SortableTableHead = ({
  columns,
  sortConfig,
  onSort,
  theme,
}: {
  columns: typeof TABLE_COLUMNS;
  sortConfig: SortConfig;
  onSort: (columnId: string) => void;
  theme: any;
}) => {
  return (
      <TableHead
          sx={{
              backgroundColor:
                  singleTheme.tableStyles.primary.header.backgroundColors,
          }}
      >
          <TableRow sx={singleTheme.tableStyles.primary.header.row}>
              {/* <TableCell width={50}></TableCell> */}

              {columns.map((column) => (
                  <TableCell
                      key={column.id}
                      component={"td"}
                      className="risk-link-table-header-cel"
                      sx={{
                          ...singleTheme.tableStyles.primary.header.cell,
                          ...(column.id === "actions" && {
                              position: "sticky",
                              right: 0,
                              zIndex: 10,
                              backgroundColor:
                                  singleTheme.tableStyles.primary.header
                                      .backgroundColors,
                          }),
                          ...(column.sortable
                              ? {
                                    cursor: "pointer",
                                    userSelect: "none",
                                    "&:hover": {
                                        backgroundColor:
                                            "rgba(0, 0, 0, 0.04)",
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
                                  color:
                                      sortConfig.key === column.id
                                          ? "primary.main"
                                          : "inherit",
                              }}
                          >
                              {column.label}
                          </Typography>
                          {column.sortable && (
                              <Box
                                  sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      color:
                                          sortConfig.key === column.id
                                              ? "primary.main"
                                              : "#9CA3AF",
                                  }}
                              >
                                  {sortConfig.key === column.id &&
                                      sortConfig.direction === "asc" && (
                                          <ChevronUp size={16} />
                                      )}
                                  {sortConfig.key === column.id &&
                                      sortConfig.direction === "desc" && (
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

const SelectorVertical = (props: any) => (
    <ChevronsUpDown size={16} {...props} />
);

const LinkedObjectsTable: React.FC<LinkedObjectsTableProps> = ({
    items,
    projectRisk,
    onRemove,
    deletingId,
    hidePagination = false,
    paginated = true,
}) => {
    const theme = useTheme();
    const { userMap } = useUserMap();

    // const [sortKey, setSortKey] = useState<SortKey>(null);
    // const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Sorting
    const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
      const saved = localStorage.getItem(SORT_KEY);
      return saved ? JSON.parse(saved) : { key: "", direction: null };
  });

  // Save sorting state to localStorage whenever it changes
  useEffect(() => {
      localStorage.setItem(SORT_KEY, JSON.stringify(sortConfig));
  }, [sortConfig]);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // -----------------------------
    // MERGE ITEMS WITH RISK DATA
    // -----------------------------
    const mergedItems = useMemo(() => {
        return items.map((linked) => {
            const fullRisk = projectRisk.find(
                (r) => Number(r.id) === Number(linked.object_id)
            );

            return {
                id: linked.id,
                type: linked.object_type || "-",
                name: fullRisk?.risk_name || "-",
                created_by:
                    fullRisk?.risk_owner
                        ? userMap.get(String(fullRisk.risk_owner)) || "-"
                        : "-",
                due_date: fullRisk?.deadline || "-",
                object_id: linked.object_id
            };
        });
    }, [items, projectRisk, userMap]);
    
     // -----------------------------
    // Handle Sorting
    // -----------------------------
    const handleSort = (columnId: string) => {
      setSortConfig((prev) => {
          if (prev.key === columnId) {
              if (prev.direction === "asc")
                  return { key: columnId, direction: "desc" };
              if (prev.direction === "desc")
                  return { key: "", direction: null };
          }
          return { key: columnId, direction: "asc" };
      });

      localStorage.setItem(
          SORT_KEY,
          JSON.stringify({ key: columnId, direction: "asc" })
      );
  };

    // -----------------------------
    // SORTED DATA
    // -----------------------------

    type Item = {
      id: any;
      type: any;
      name: any;
      created_by: string;
      due_date: any;
    };
    
    const sortedData = useMemo(() => {
      if (!sortConfig.key || !sortConfig.direction) return mergedItems;
    
      const key = sortConfig.key as keyof Item;
    
      return [...mergedItems].sort((a, b) => {
        const A = (a[key] || "").toString().toLowerCase();
        const B = (b[key] || "").toString().toLowerCase();
    
        if (A < B) return sortConfig.direction === "asc" ? -1 : 1;
        if (A > B) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }, [mergedItems, sortConfig]);


    const getRange = `${page * rowsPerPage + 1} - ${Math.min(
        page * rowsPerPage + rowsPerPage,
        sortedData.length
    )}`;

    // -----------------------------
    // PAGINATION HANDLERS
    // -----------------------------
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

    const TooltipCell: React.FC<{ value?: string | null }> = ({ value }) => {
        const displayValue = value || "-";
        const shouldTruncate = displayValue.length > 20;
        const truncatedValue = shouldTruncate
            ? `${displayValue.substring(0, 30)}...`
            : displayValue;
    
        return shouldTruncate ? (
            <Tooltip title={displayValue} arrow>
                <span style={{ cursor: 'help' }}>{truncatedValue}</span>
            </Tooltip>
        ) : (
            <span>{displayValue}</span>
        );
    };
      

    // -----------------------------
    // TABLE BODY (LIKE EVIDENCE HUB)
    // -----------------------------
    const tableBody = useMemo(
        () => (
            <TableBody>
                {sortedData.length ? (
                    sortedData
                        .slice(
                            hidePagination ? 0 : page * rowsPerPage,
                            hidePagination
                                ? Math.min(sortedData.length, 100)
                                : page * rowsPerPage + rowsPerPage
                        )
                        .map((row) => (
                            <TableRow
                                key={row.id}
                                sx={{
                                    ...singleTheme.tableStyles.primary.body.row,
                                    ...tableRowHoverStyle,
                                    ...(deletingId === row.id &&
                                        tableRowDeletingStyle),
                                }}
                            >
                                {/* <TableCell>{row.name}</TableCell> */}
                                <TableCell
                                >
                                    <TooltipCell value={row.name} />
                                </TableCell>
                                
                                <TableCell>{row.type}</TableCell>
                                <TableCell>{row.created_by}</TableCell>
                                <TableCell>
                                    {row.due_date !== "-"
                                        ? new Date(row.due_date).toLocaleDateString(
                                              "en-GB"
                                          )
                                        : "-"}
                                </TableCell>

                                <TableCell
                                    sx={{
                                        position: "sticky",
                                        right: 0,
                                        background:
                                            singleTheme.tableStyles.primary.header
                                                .backgroundColors,
                                        zIndex: 10,
                                    }}
                                >
                                    <Tooltip title="Remove link">
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                onRemove(row.type, row.id)
                                            }
                                        >
                                            <Trash2 size={18} />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={TABLE_COLUMNS.length} align="center">
                            <EmptyState message="No linked items found." />
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        ),
        [
            sortedData,
            hidePagination,
            page,
            rowsPerPage,
            deletingId,
            onRemove,
        ]
    );

    return (
        <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={singleTheme.tableStyles.primary.frame}>
                {/* HEADER */}
                <SortableTableHead
                        columns={TABLE_COLUMNS}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        theme={theme}
                    />

                {tableBody}

                {/* PAGINATION */}
                {paginated && !hidePagination && sortedData.length > 0 && (
                    <TableFooter>
                        <TableRow sx={tableFooterRowStyle(theme)}>
                            <TableCell sx={showingTextCellStyle(theme)}>
                                Showing {getRange} of {sortedData.length}
                            </TableCell>
                            <TablePagination
                                count={sortedData.length}
                                page={page}
                                rowsPerPage={rowsPerPage}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                rowsPerPageOptions={[5, 10, 15, 25]}
                                ActionsComponent={TablePaginationActions}
                                sx={paginationStyle(theme)}
                                slotProps={{
                                    select: {
                                        MenuProps: paginationMenuProps(theme),
                                        IconComponent: SelectorVertical,
                                        sx: paginationSelectStyle(theme),
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

export default LinkedObjectsTable;
