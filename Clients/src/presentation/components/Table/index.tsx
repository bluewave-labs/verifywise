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
import { useEffect, useState, useMemo, useCallback, useContext } from "react";
import TablePaginationActions from "../TablePagination";
import { ReactComponent as SelectorVertical } from "../../assets/icons/selector-vertical.svg";
import singleTheme from "../../themes/v1SingleTheme";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import { formatDate } from "../../tools/isoDateToString";
import { RiskLikelihood, RiskSeverity, MitigationStatus } from "../RiskLevel/riskValues";
import { Likelihood, RISK_LABELS, Severity } from "../../components/RiskLevel/constants";
import { getAllEntities } from "../../../application/repository/entity.repository";

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

type TableRow = {
  id: number | string;
  [key: string]: any;
};

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
  bodyData,
  paginated,
  reversed,
  table,
  onRowClick,
  label,
  setSelectedRow,
  setAnchorEl,
}: {
  data: TableData;
  bodyData: TableRow[];
  paginated?: boolean;
  reversed?: boolean;
  table: string;
  onRowClick?: (rowId: number | string) => void;
  label?: string;
  setSelectedRow: (rowData: object) => void;
  setAnchorEl: (anchor: HTMLElement | null) => void;
}) => {
  const DEFAULT_ROWS_PER_PAGE = 5;
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const { setInputValues, dashboardValues, setDashboardValues } = useContext(VerifyWiseContext);  
  console.log(dashboardValues)  

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

  const mitigationStatusItems = useMemo(
    () => [
      { _id: 1, name: MitigationStatus.NotStarted},
      { _id: 2, name: MitigationStatus.InProgress},
      { _id: 3, name: MitigationStatus.Completed },
      { _id: 4, name: MitigationStatus.OnHold },
      { _id: 5, name: MitigationStatus.Deferred },
      { _id: 6, name: MitigationStatus.Canceled },
      { _id: 7, name: MitigationStatus.RequiresReview },
    ],
    []
  );

  const riskLevelItems = useMemo(
    () => [
      { _id: 1, name: RISK_LABELS.low.text },
      { _id: 2, name: RISK_LABELS.medium.text },
      { _id: 3, name: RISK_LABELS.high.text },
      { _id: 4, name: RISK_LABELS.critical.text },
      { _id: 5, name: RISK_LABELS.noRisk.text },
    ],
    []
  );

  const likelihoodItems = useMemo(
    () => [
      { _id: Likelihood.Rare, name: RiskLikelihood.Rare },
      { _id: Likelihood.Unlikely, name: RiskLikelihood.Unlikely },
      { _id: Likelihood.Possible, name: RiskLikelihood.Possible },
      { _id: Likelihood.Likely, name: RiskLikelihood.Likely },
      { _id: Likelihood.AlmostCertain, name: RiskLikelihood.AlmostCertain }
    ],
    []
  );

  const severityItems = useMemo(
    () => [
      { _id: Severity.Negligible, name: RiskSeverity.Negligible },
      { _id: Severity.Minor, name: RiskSeverity.Minor },
      { _id: Severity.Moderate, name: RiskSeverity.Moderate },
      { _id: Severity.Major, name: RiskSeverity.Major },
      { _id: Severity.Critical, name: RiskSeverity.Critical }
    ],
    []
  );

  const fetchVendors = useCallback(async () => {
    try {
      const response = await getAllEntities({ routeUrl: "/vendors" });
      console.log("response :::: > ", response);
      setDashboardValues((prevValues: any) => ({
        ...prevValues,
        vendors: response.data,
      }));
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  }, [setDashboardValues]);

  useEffect(() => {
    if(label !== 'Project risk'){
      fetchVendors()
    }  
  }, [label])

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

  const riskLevelChecker = (score: string) => {
    const parsedScore = parseInt(score);

    if (!isNaN(parsedScore)) {
      if (parsedScore <= 3) {
        return RISK_LABELS.low.text;
      } else if (parsedScore <= 6) {
        return RISK_LABELS.medium.text;
      } else if (parsedScore <= 9) {
        return RISK_LABELS.high.text;
      } else {
        return RISK_LABELS.critical.text;
      }
    }

    return score;
  }

  const onRowclickHandler = (event: React.MouseEvent<HTMLElement>, rowData: any) => {
    console.log(`Row clicked: ${rowData.id}`);    
    console.log(rowData)
    setSelectedRow(rowData);
    setInputValues(rowData);
    setAnchorEl(event.currentTarget);
    onRowClick && onRowClick(rowData.id as number);
  };

  const renderValue = () => "Hello";

  const tableBody = useMemo(
    () => (
      <>
        <TableBody>
          {bodyData !== null && (
            <>
              {bodyData?.map((row) => (
                <TableRow
                  sx={{
                    ...singleTheme.tableStyles.primary.body.row,
                    height: "36px",
                    "&:hover": {
                      backgroundColor: "#FBFBFB",
                      cursor: "pointer",
                    },
                  }}
                  key={row.id}
                  onClick={(event) => onRowclickHandler(event, row)}
                >
                  {label === "Project risk" ? (
                    <>
                      <TableCell>{(row.risk_name.length > 30) ? row.risk_name.slice(0, 30) + `...` : row.risk_name}</TableCell>
                      <TableCell>{(row.impact.length > 30) ? row.impact.slice(0, 30) + `...` : row.impact}</TableCell>
                      <TableCell>
                        {dashboardValues.users.length !== 0 && <>
                          {dashboardValues.users.find((user: { id: any; }) => user.id === parseInt(row.risk_owner))?.name || row.risk_owner}
                        </>}
                      </TableCell>
                      <TableCell>
                        {severityItems.find((item: {_id: any;}) => item._id === parseInt(row.severity))?.name || row.severity}
                      </TableCell>
                      <TableCell>
                        {likelihoodItems.find((item: {_id: any;}) => item._id === parseInt(row.likelihood))?.name || row.likelihood}
                      </TableCell>
                      <TableCell>{riskLevelChecker(row.risk_level_autocalculated)}</TableCell>
                      <TableCell>
                        {mitigationStatusItems.find((item: {_id: any;}) => item._id === parseInt(row.mitigation_status))?.name || row.mitigation_status}
                      </TableCell>
                      <TableCell>{riskLevelChecker(row.final_risk_level)}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        {dashboardValues.vendors.length !== 0 && <>
                          {dashboardValues.vendors.find((vendor: { id: any; }) => vendor.id === parseInt(row.vendor_name))?.vendor_name || row.vendor_name}
                        </>}
                      </TableCell>
                      <TableCell>{(row.risk_name.length > 50) ? row.risk_name.slice(0,50) + `...` : row.risk_name}</TableCell>
                      <TableCell>
                        {dashboardValues.users.length !== 0 && <>
                          {dashboardValues.users.find((user: { id: any; }) => user.id === parseInt(row.owner))?.name || row.owner}
                        </>}
                      </TableCell>                      
                      <TableCell>
                        {row.review_date
                          ? formatDate(row.review_date.toString())
                          : "No review date"}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </>
          )}
        </TableBody>
        {/* <TableBody>
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
              onClick={(event) => onRowclickHandler(event, row)}
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
        </TableBody> */}
      </>
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
