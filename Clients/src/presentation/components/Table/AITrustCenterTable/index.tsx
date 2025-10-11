import React, { useState, useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableFooter,
  Typography,
  useTheme,
  Stack,
  Paper,
} from "@mui/material";
import singleTheme from "../../../themes/v1SingleTheme";
import TablePaginationActions from "../../TablePagination";
import { ChevronsUpDown } from "lucide-react";
import Placeholder from "../../../assets/imgs/empty-state.svg";
import { IAITrustCenterTableProps } from "../../../../domain/interfaces/i.table";

const SelectorVertical = (props: any) => (
  <ChevronsUpDown size={16} {...props} />
);

const DEFAULT_ROWS_PER_PAGE = 5;

const AITrustCenterTable = <T extends { id: number }>({
  data,
  columns,
  isLoading = false,
  paginated = true,
  emptyStateText = "No data found. Add your first item to get started.",
  renderRow,
  onRowClick,
  tableId = "ai-trust-center-table",
  disabled = false,
}: IAITrustCenterTableProps<T>) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

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

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage + rowsPerPage, data?.length ?? 0);
    return `${start} - ${end}`;
  }, [page, rowsPerPage, data?.length]);

  const tableHeader = useMemo(
    () => (
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
                // Remove width constraints to match original AI Trust Center behavior
                minWidth: "auto",
                width: "auto",
                ...(column.id === "action" && {
                  position: "sticky",
                  right: 0,
                  zIndex: 10,
                  backgroundColor:
                    singleTheme.tableStyles.primary.header.backgroundColors,
                }),
              }}
            >
              {column.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    ),
    [columns]
  );

  const tableBody = useMemo(
    () => (
      <TableBody
        sx={{
          ...(disabled && {
            opacity: 0.6,
            pointerEvents: "none",
          }),
        }}
      >
        {data &&
          data
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((item) => (
              <TableRow
                key={item.id}
                sx={{
                  ...singleTheme.tableStyles.primary.body.row,
                  "& .MuiTableCell-root": {
                    padding: "8px 10px !important",
                    // Remove width constraints to match original AI Trust Center behavior
                    minWidth: "auto",
                    width: "auto",
                  },
                  ...(onRowClick &&
                    !disabled && {
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "#FBFBFB",
                      },
                    }),
                }}
                onClick={() => !disabled && onRowClick?.(item)}
              >
                {renderRow(item)}
              </TableRow>
            ))}
      </TableBody>
    ),
    [data, page, rowsPerPage, renderRow, onRowClick, disabled]
  );

  const emptyState = useMemo(
    () => (
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
          backgroundColor: "#FFFFFF",
        }}
      >
        <img src={Placeholder} alt="Empty state" />
        <Typography sx={{ fontSize: "13px", color: "#475467" }}>
          {emptyStateText}
        </Typography>
      </Stack>
    ),
    [theme, emptyStateText]
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
        <Typography sx={{ fontSize: "13px", color: "#475467" }}>
          Loading...
        </Typography>
      </Stack>
    );
  }

  if (!data || data.length === 0) {
    return emptyState;
  }

  return (
    <TableContainer component={Paper} id={tableId}>
      <Table sx={singleTheme.tableStyles.primary.frame}>
        {tableHeader}
        {tableBody}
        {paginated && (
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
                Showing {getRange} of {data?.length} item(s)
              </TableCell>
              <TablePagination
                count={data?.length}
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

export default AITrustCenterTable;
