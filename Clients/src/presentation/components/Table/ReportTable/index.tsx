import {useState, useMemo, useCallback} from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
  Stack
} from "@mui/material";
import singleTheme from '../../../themes/v1SingleTheme';
import { formatDate } from '../../../tools/isoDateToString';
import placeholderImage from "../../../assets/imgs/empty-state.svg";
import IconButton from '../../IconButton';
import { ReactComponent as SelectorVertical } from '../../../assets/icons/selector-vertical.svg'
import TablePaginationActions from '../../TablePagination';

const ReportTableHead = ({ columns }: { columns: any[] }) => {
  return(<>
    <TableHead
      sx={{
        backgroundColor:
          singleTheme.tableStyles.primary.header.backgroundColors,
      }}
    >
      <TableRow sx={singleTheme.tableStyles.primary.header.row}>
        {columns.map((column, index) => (
          <TableCell
            key={index}
            style={{
              ...singleTheme.tableStyles.primary.header.cell,
              ...(index === columns.length - 1
                ? {
                    position: "sticky",
                    right: 0,
                    backgroundColor:
                      singleTheme.tableStyles.primary.header.backgroundColors,
                  }
                : {}),
            }}
          >
            {column}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  </>)
}

const ReportTableBody = ({
  rows,
  onRemoveReport
} : {
  rows: any[],
  onRemoveReport: (id: number) => void;
}) => {
  const cellStyle = singleTheme.tableStyles.primary.body.cell;

  const handleRemoveReport = async (reportId: number) => {
    onRemoveReport(reportId);
  };

  const handelDownloadReport = async (reportId: number) => {
    // Call backend API
  };

  // row onclick function
  const handelEditRisk = (row: any, event?: React.SyntheticEvent) => {}

  return (
    <TableBody>
      {rows &&
        rows
          .map((row, index: number) => (
            <TableRow key={index} sx={singleTheme.tableStyles.primary.body.row}>
              <TableCell sx={cellStyle}>
                {row.report_name ? row.report_name : '-'}
              </TableCell>
              <TableCell sx={cellStyle}>
                {row.type ? row.type : '-'}
              </TableCell>
              <TableCell sx={cellStyle}>
                {row.deadline ? formatDate(row.date.toString()) : "NA"}
              </TableCell>
              <TableCell sx={cellStyle}>
                {row.generated_by ? row.generated_by : '-'}
              </TableCell>
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  position: "sticky",
                  right: 0,
                  minWidth: "50px",
                }}
              >
                <IconButton
                  id={row.id}
                  type="report"
                  onMouseEvent={(e) => handelEditRisk(row, e)}
                  onDelete={() => handleRemoveReport(row.id)}
                  onEdit={() => handelDownloadReport(row)}
                  warningTitle="Remove this report?"
                  warningMessage="Are you sure you want to remove this project report. This action is non-recoverable."
                ></IconButton>
              </TableCell>
            </TableRow>
          ))}
    </TableBody>
  );
}

const ReportTable = ({
    columns,
    rows,
    removeReport,
    page,
    setPage
  }: {
    columns: any[];
    rows: any[];
    removeReport: (id: number) => void;
    page: number,
    setPage: (pageNo: number) => void;
  }) => {
  const theme = useTheme();
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage + rowsPerPage, rows?.length ?? 0);
    return `${start} - ${end}`;
  }, [page, rowsPerPage, rows?.length ?? 0]);

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

  return (
    <>
      <TableContainer>
        <Table
          sx={{
            ...singleTheme.tableStyles.primary.frame,
          }}
        >
          <ReportTableHead columns={columns} />
          {rows.length !== 0 ? 
            <ReportTableBody rows={rows} onRemoveReport={removeReport} /> 
          : (
            <>
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    style={{
                      padding: theme.spacing(15, 5),
                      paddingBottom: theme.spacing(20),
                    }}
                  >
                    <img src={placeholderImage} alt="Placeholder" />
                    <Typography sx={{ fontSize: "13px", color: "#475467" }}>
                      There is currently no data in this table.
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </>
          )}
        </Table>
      </TableContainer>
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingX: theme.spacing(4),
          "& p": {
            color: theme.palette.text.tertiary,
          },
        }}
      >
        <Typography
          sx={{
            paddingX: theme.spacing(2),
            fontSize: 12,
            opacity: 0.7,
          }}
        >
          Showing {getRange} of {rows?.length} project report(s)
        </Typography>
        <TablePagination
          count={rows?.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 15, 20, 25]}
          onRowsPerPageChange={handleChangeRowsPerPage}
          ActionsComponent={(props) => <TablePaginationActions {...props} />}
          labelRowsPerPage="Project risks per page"
          labelDisplayedRows={({ page, count }) =>
            `Page ${page + 1} of ${Math.max(0, Math.ceil(count / rowsPerPage))}`
          }
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
        />
      </Stack>
    </>
  )
}

export default ReportTable