import React from 'react'
import { TableBody, TableCell, TableRow } from '@mui/material';
import IconButton from '../../../IconButton';
import { formatDate } from '../../../../tools/isoDateToString';
import singleTheme from '../../../../themes/v1SingleTheme';
import {styles} from './styles';
import { handleDownload } from '../../../../../application/tools/fileDownload';

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
                {row.filename ? row.filename : '-'}
              </TableCell>
              <TableCell sx={cellStyle}>
                {row.source ? row.source : '-'}
              </TableCell>
              <TableCell sx={cellStyle}>
                {row.project_title ? row.project_title : '-'}
              </TableCell>
              <TableCell sx={cellStyle}>
                {row.uploaded_time ? formatDate(row.uploaded_time.toString()) : "NA"}
              </TableCell>
              <TableCell sx={cellStyle}>
                {row.uploader_name ? row.uploader_name : '-'} {row.uploader_surname ? row.uploader_surname : '-'}
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
                  onEdit={() => handleDownload(row.id, row.filename)}
                  warningTitle="Remove this report?"
                  warningMessage={`Are you sure you want to remove this report. This action is non-recoverable.`}
                ></IconButton>
              </TableCell>
            </TableRow>
          ))}
    </TableBody>
  );
};

export default ReportTableBody