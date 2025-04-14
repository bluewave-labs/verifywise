import React from 'react'
import { TableBody, TableCell, TableRow } from '@mui/material';
import IconButton from '../../../IconButton';
import { formatDate } from '../../../../tools/isoDateToString';
import singleTheme from '../../../../themes/v1SingleTheme';
import {styles} from './styles';

interface TableProps {
  rows: any[];
  onRemoveReport: (id: number) => void;
  page: number;
  rowsPerPage: number
}

const ReportTableBody: React.FC<TableProps> = ({
  rows,
  onRemoveReport,
  page,
  rowsPerPage
}) => {
  const cellStyle = singleTheme.tableStyles.primary.body.cell;

  const handleRemoveReport = async (reportId: number) => {
    onRemoveReport(reportId);
  };

  const handleDownloadReport = async () => {
    // Call backend API
  };

  // row onclick function
  const handleEditRisk = () => {}

  return (
    <TableBody>
      {rows &&
        rows
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
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
                  ...styles.setting
                }}
              >
                <IconButton
                  id={row.id}
                  type="report"
                  onMouseEvent={() => handleEditRisk()}
                  onDelete={() => handleRemoveReport(row.id)}
                  onEdit={() => handleDownloadReport()}
                  warningTitle="Remove this report?"
                  warningMessage={`Are you sure you want to remove "${row.report_name}" report. This action is non-recoverable.`}
                ></IconButton>
              </TableCell>
            </TableRow>
          ))}
    </TableBody>
  );
};

export default ReportTableBody