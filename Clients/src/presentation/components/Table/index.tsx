import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import "./index.css";
import { useEffect, useState, useMemo, useCallback } from "react";
import TablePaginationActions from "../TablePagination";
import { ReactComponent as SelectorVertical } from "../../assets/icons/selector-vertical.svg";
import singleTheme from "../../themes/v1SingleTheme";
import { LinearProgress } from "@mui/material";

interface RowData {
  id: number | string;
  data: {
    id: number | string;
    data: string | number;
  }[];
  icon?: string;
}

interface ColData {
  id: number | string;
  name: string;
}

interface TableData {
  cols: ColData[];
  rows: RowData[];
}

/**
 * BasicTable component renders a table with optional pagination, sorting options, row click handling, and custom styling.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {Object} props.data - Data for the table including columns and rows.
 * @param {Array} props.data.cols - Array of objects for column headers.
 * @param {number} props.data.cols[].id - Unique identifier for the column.
 * @param {string} props.data.cols[].name - Name of the column to display as header.
 * @param {Array} props.data.rows - Array of row objects.
 * @param {number} props.data.rows[].id - Unique identifier for the row.
 * @param {Array} props.data.rows[].data - Array of cell data objects for the row.
 * @param {number} props.data.rows[].data[].id - Unique identifier for the cell.
 * @param {JSX.Element} props.data.rows[].data[].data - The content to display in the cell.
 * @param {function} props.data.rows.data.handleClick - Function to call when the row is clicked.
 * @param {boolean} [props.paginated=false] - Flag to enable pagination.
 * @param {boolean} [props.reversed=false] - Flag to enable reverse order.
 * @param {number} props.rowsPerPage- Number of rows per page (table).
 * @param {string} props.table - The ID of the table container.
 * @param {(rowId: number | string) => void} [props.onRowClick] - Optional callback function to handle row click events.
 * @param {string} [props.label] - Optional label for the table items.
 *
 * @returns The rendered table component.
 */

const BasicTable = ({
  data,
  paginated,
  reversed,
  table,
  onRowClick,
  label,
}: {
  data: TableData;
  paginated?: boolean;
  reversed?: boolean;
  table: string;
  onRowClick?: (rowId: number | string) => void;
  label?: string;
}) => {
  const DEFAULT_ROWS_PER_PAGE = 5;
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  useEffect(() => {
    setPage(0);
  }, [data]);

  const cellStyle = singleTheme.tableStyles.primary.body.cell;

  const iconCell = {
    display: "flex",
    justifyContent: "center",
    itemAlign: "center",
  };

  const handleChangePage = useCallback((_: any, newPage: any) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const displayData = useMemo(() => {
    if (!data || !data.rows) return [];
    let rows = reversed ? [...data.rows].reverse() : data.rows;
    return paginated
      ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : rows;
  }, [data, reversed, paginated, page, rowsPerPage]);

  const getRange = useCallback(() => {
    let start = page * rowsPerPage + 1;
    let end = Math.min(page * rowsPerPage + rowsPerPage, data.rows.length);
    return `${start} - ${end}`;
  }, [page, rowsPerPage, data.rows.length]);

  const getProgressColor = useCallback((value: number) => {
    if (value <= 10) return "#FF4500"; // 0-10%
    if (value <= 20) return "#FF4500"; // 11-20%
    if (value <= 30) return "#FFA500"; // 21-30%
    if (value <= 40) return "#FFD700"; // 31-40%
    if (value <= 50) return "#E9F14F"; // 41-50%
    if (value <= 60) return "#CDDD24"; // 51-60%
    if (value <= 70) return "#64E730"; // 61-70%
    if (value <= 80) return "#32CD32"; // 71-80%
    if (value <= 90) return "#228B22"; // 81-90%
    return "#008000"; // 91-100%
  }, []);

  const tableHeader = useMemo(
    () => (
      <TableHead
        sx={{
          backgroundColors:
            singleTheme.tableStyles.primary.header.backgroundColors,
        }}
      >
        <TableRow sx={singleTheme.tableStyles.primary.header.row}>
          {data.cols.map((col) => (
            <TableCell
              style={singleTheme.tableStyles.primary.header.cell}
              key={col.id}
            >
              {col.name}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    ),
    [data.cols]
  );

  const tableBody = useMemo(
    () => (
      <TableBody>
        {displayData.map((row) => (
          <TableRow
            sx={{
              ...singleTheme.tableStyles.primary.body.row, 
              height: "36px", 
              "&:hover":{
                backgroundColor: "#FBFBFB",
                cursor: "pointer",
              }
            }}
            key={row.id}
            onClick={() => {
              console.log(`Row clicked: ${row.id}`);
              onRowClick && onRowClick(row.id as number);
            }}
          >
            {row.icon && (
              <TableCell
                sx={{ ...cellStyle, ...iconCell }}
                key={`icon-${row.id}`}
              >
                <img src={row.icon} alt="status icon" width={20} />
              </TableCell>
            )}
            {row.data.map((cell: any) => (
              <TableCell sx={cellStyle} key={cell.id}>
                {cell.id === "4" ? (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2">{cell.data}</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(cell.data)}
                      sx={{
                        width: "100px",
                        height: "8px",
                        borderRadius: "4px",
                        backgroundColor: theme.palette.grey[200],
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: getProgressColor(
                            parseFloat(cell.data)
                          ),
                        },
                      }}
                    />
                  </Stack>
                ) : (
                  cell.data
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    ),
    [
      displayData,
      cellStyle,
      iconCell,
      onRowClick,
      theme.palette.grey,
      getProgressColor,
    ]
  );

  const pagination = useMemo(() => {
    if (!paginated) {
      return <></>;
    }

    return (
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        px={theme.spacing(4)}
        sx={{
          "& p": {
            color: theme.palette.text.tertiary,
          },
        }}
      >
        <Typography px={theme.spacing(2)} fontSize={12} sx={{ opacity: 0.7 }}>
          Showing {getRange()} of {data.rows.length}{" "}
          {label
            ? data.rows.length === 1
              ? label
              : `${label}s`
            : data.rows.length === 1
            ? "item"
            : "items"}
        </Typography>
        <TablePagination
          count={data.rows.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 15, 25]}
          onRowsPerPageChange={handleChangeRowsPerPage}
          ActionsComponent={(props) => <TablePaginationActions {...props} />}
          labelRowsPerPage="Rows per page"
          labelDisplayedRows={({ page, count }) =>
            `Page ${page + 1} of ${Math.max(0, Math.ceil(count / rowsPerPage))}`
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
                "&.Mui-focused > div": {
                  backgroundColor: theme.palette.background.main,
                },
              },
            },
          }}
          sx={{
            mt: theme.spacing(6),
            color: theme.palette.text.secondary,
            "& svg path": {
              stroke: theme.palette.text.tertiary,
              strokeWidth: 1.3,
            },
            "& .MuiSelect-select": {
              border: 1,
              borderColor: theme.palette.border,
              borderRadius: theme.shape.borderRadius,
            },
          }}
        />
      </Stack>
    );
  }, [
    paginated,
    theme,
    getRange,
    data.rows.length,
    label,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
  ]);

  return (
    <>
      <TableContainer id={table}>
        <Table sx={singleTheme.tableStyles.primary.frame}>
          {tableHeader}
          {tableBody}
        </Table>
      </TableContainer>
      {pagination}
    </>
  );
};

export default BasicTable;
