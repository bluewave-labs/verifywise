import { Stack, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { ClearIcon } from '@mui/x-date-pickers/icons';
import React, { useState } from 'react'
import Field from '../Inputs/Field';
import { TITLE_OF_COLUMNS } from './constants';
import singleTheme from '../../themes/v1SingleTheme';
import TableHeader from '../Table/TableHead';
import useProjectRisks from '../../../application/hooks/useProjectRisks';
import placeholderImage from '../../assets/imgs/empty-state.svg'

import {
  textfieldStyle,
  tableWrapper,
  emptyData,
  styles
} from "./styles";
import { useSearchParams } from 'react-router-dom';

interface LinkedRisksModalProps {
  onClose: () => void;
}

interface TableProps {
  rows: any[];
  page: number;
}

const LinkedRisksPopup: React.FC<LinkedRisksModalProps> = ({
  onClose
}) => {
  const [searchParams] = useSearchParams();
  const projectId = parseInt(searchParams.get("projectId") ?? "0");
  const [refreshKey, setRefreshKey] = useState(0);
  const { projectRisks } = useProjectRisks({ projectId, refreshKey });  

  return (
    <Stack sx={{
      width: "100%",
      backgroundColor: "#FCFCFD",
      padding: 10,
      borderRadius: "4px",
      gap: 10,
    }}>
      <Stack sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        width: '100%'
      }}>
        <Typography sx={{ fontSize: 16, color: "#344054", fontWeight: "bold" }}>Link a risk from risk database</Typography>
        <ClearIcon
          sx={{ color: "#98A2B3", cursor: "pointer" }}
          onClick={onClose}
        />
      </Stack>
      <Stack sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center"
      }}>
        <Typography sx={{ fontSize: 13, color: "#344054", mr: 8 }}>Search from the risk database:</Typography>
        <Stack>
          <Field
            id="risk-input"
            width="350px"
            sx={textfieldStyle}
          />
        </Stack>
      </Stack>
      <Stack>
        <TableContainer>
          <Table
            sx={{
              ...singleTheme.tableStyles.primary.frame,
              ...tableWrapper
            }}
          >
            <TableHeader columns={TITLE_OF_COLUMNS} />
            {projectRisks.length > 0 ? 
              <>
                <RiskTableBody rows={projectRisks} page={0}/>
              </> 
              : <>
                <TableBody>
                  <TableRow>
                    <TableCell
                      colSpan={TITLE_OF_COLUMNS.length}
                      align="center"
                      sx={emptyData}
                    >
                      <img src={placeholderImage} alt="Placeholder" />
                      <Typography sx={styles.textBase}>
                        There is currently no data in this table.
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </>}
          </Table>
        </TableContainer>
      </Stack>
    </Stack>
  )
}

const RiskTableBody: React.FC<TableProps> = ({
  rows,
  page,
}) => {
  const cellStyle = singleTheme.tableStyles.primary.body.cell;
  const [rowsPerPage, setRowsPerPage] = useState(5);

  return (
    <TableBody>
      {rows &&
        rows
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((row: any, index: number) => (
            <TableRow key={index} sx={singleTheme.tableStyles.primary.body.row}>
              <TableCell sx={cellStyle}>
                -
              </TableCell>
              <TableCell sx={cellStyle}>
                {index + 1}
              </TableCell>
              <TableCell sx={cellStyle}>
                {row.risk_description ? row.risk_description : '-'}
              </TableCell>
              <TableCell sx={cellStyle}>
                {row.risk_severity ? row.risk_severity : '-'}
              </TableCell>
              <TableCell sx={cellStyle}>
                {row.likelihood ? row.likelihood : '-'}
              </TableCell>
              <TableCell sx={cellStyle}>
                {row.risk_category ? row.risk_category : '-'}
              </TableCell>
            </TableRow>
          ))}
    </TableBody>
  )
}

export default LinkedRisksPopup