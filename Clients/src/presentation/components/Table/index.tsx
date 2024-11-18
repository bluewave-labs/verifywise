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
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setRowsPerPage } from "../../tools/uiSlice";
import TablePaginationActions from "../TablePagination";
import { ReactComponent as SelectorVertical } from "../../assets/icons/selector-vertical.svg";
import singleTheme from "../../themes/v1SingleTheme";
import { LinearProgress } from "@mui/material";

/**
 * Interface for TableData object.
 * @typedef {Object} TableData
 * @property {Array} cols - Array of column objects, each containing id and name.
 * @property {Array} rows - Array of row objects, each containing id, icon, and data properties.
 */

interface TableData {
  cols: any[];
  rows: any[];
}

/**
 * Renders a basic table component.
 *
 * @remarks
 * This component displays tabular data with pagination and sorting options.
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
 *
 * @returns The rendered table component.
 */

const BasicTable = ({
  data,
  paginated,
  reversed,
  table,
  onRowClick,
  label
}: {
  data: TableData;
  paginated?: boolean;
  reversed?: boolean;
  table: any;
  onRowClick?: (rowId: number) => void;
  label?: string;
}) => {
  const DEFAULT_ROWS_PER_PAGE = 5;
  const theme = useTheme();
  const dispatch = useDispatch();
  const uiState = useSelector((state: any) => state.ui);
  let rowsPerPage = uiState?.[table]?.rowsPerPage ?? DEFAULT_ROWS_PER_PAGE;
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [data]);

  const cellStyle = singleTheme.tableStyles.primary.body.cell;

  const iconCell = {
    display: "flex",
    justifyContent: "center",
    itemAlign: "center",
  };

  /**
   * Handles the page change for the table pagination.
   *
   * @param {Object} event - Event object.
   * @param {number} newPage - New page number.
   */

  const handleChangePage = (event: any, newPage: any) => {
    console.log(event);
    setPage(newPage);
  };

  /**
   * Handles the change of rows per page in pagination.
   *
   * @param {Object} event - Event object.
   */

  const handleChangeRowsPerPage = (event: any) => {
    dispatch(
      setRowsPerPage({
        value: parseInt(event.target.value, 10),
        table: table,
      })
    );
    setPage(0);
  };

  let displayData = [];

  if (data && data.rows) {
    let rows = reversed ? [...data.rows].reverse() : data.rows;
    displayData = paginated
      ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : rows;
  }

  if (!data || !data.cols || !data.rows) {
    return <div>No data</div>;
  }

  /**
   * Gets the range of displayed rows based on the current page and rows per page.
   *
   * @returns {string} Display range in the format "start - end".
   */

  const getRange = () => {
    let start = page * rowsPerPage + 1;
    let end = Math.min(page * rowsPerPage + rowsPerPage, data.rows.length);
    return `${start} - ${end}`;
  };

  const getProgressColor = (value: number) => {
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
  };

  return (
    <>
      <TableContainer>
        <Table sx={singleTheme.tableStyles.primary.frame}>
          <TableHead
            sx={{
              backgroundColors:
                singleTheme.tableStyles.primary.header.backgroundColors,
            }}
          >
            <TableRow sx={singleTheme.tableStyles.primary.header.row}>
              {data.cols.map((col) => {
                return (
                  <TableCell
                    style={singleTheme.tableStyles.primary.header.cell}
                    key={col.id}
                  >
                    {col.name}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayData.map((row) => {
              return (
                <TableRow
                  sx={singleTheme.tableStyles.primary.body.row}
                  key={row.id}
                  onClick={() => {
                    console.log(`Row clicked: ${row.id}`);
                    onRowClick && onRowClick(row.id);
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
                  {row.data.map((cell: any) => {
                    return (
                      <TableCell sx={cellStyle} key={cell.id}>
                        {cell.id === "4" ? (
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
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
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {paginated && (
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
            Showing {getRange()} of {data.rows.length} {label || "monitor(s)"}
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
      )}
    </>
  );
};

export default BasicTable;
