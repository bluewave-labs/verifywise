import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme
} from "@mui/material";
import singleTheme from '../../../themes/v1SingleTheme';
import { formatDate } from '../../../tools/isoDateToString';
import placeholderImage from "../../../assets/imgs/empty-state.svg";
import IconButton from '../../IconButton';

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
    removeReport
  }: {
    columns: any[];
    rows: any[];
    removeReport: (id: number) => void;
  }) => {
  const theme = useTheme();

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
    </>
  )
}

export default ReportTable