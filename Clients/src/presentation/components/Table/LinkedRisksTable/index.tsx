import { Table, TableBody, TableCell, TableContainer, TableFooter, TableRow, Typography, useTheme, Checkbox as MuiCheckbox } from '@mui/material'
import React, { useCallback, useState } from 'react'
import singleTheme from '../../../themes/v1SingleTheme'
import TableHeader from '../TableHead'
import { TITLE_OF_COLUMNS } from '../../LinkedRisks/constants'
import { ProjectRisk } from '../../../../domain/types/ProjectRisk'
import placeholderImage from '../../assets/imgs/empty-state.svg';

import { ReactComponent as CheckboxOutline } from "../../assets/icons/checkbox-outline.svg";
import { ReactComponent as CheckboxFilled } from "../../assets/icons/checkbox-filled.svg";
import { ReactComponent as SelectorVertical } from '../../assets/icons/selector-vertical.svg'
import RiskChip from '../../RiskLevel/RiskChip';

import {
  tableWrapper,
  emptyData,
  paginationStyle, 
  paginationDropdown, 
  paginationSelect,
  styles
} from "../styles";
import TablePagination from '../../TablePagination'
import TablePaginationActions from '../../TablePagination'

interface TableProps {
  rows: ProjectRisk[];
  page: number;
  setCurrentPagingation: (pageNo: number) => void;
}

const LinkedRisksTable = (
  projectRisks: ProjectRisk[],
  filteredRisks: ProjectRisk[] ) => {

  const [currentPage, setCurrentPage] = useState(0);
  const setCurrentPagingation = (page: number) => {
    setCurrentPage(page)
  }

  return (
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
            {filteredRisks.length > 0 ? 
              <RiskTableBody 
                rows={filteredRisks} 
                setCurrentPagingation={setCurrentPagingation}
                page={currentPage}
              />
            : <>
              <TableRow>
                <TableCell
                  colSpan={TITLE_OF_COLUMNS.length}
                  align="center"
                  sx={emptyData}
                >
                  <img src={placeholderImage} alt="Placeholder" />
                  <Typography sx={styles.textBase}>
                    No risks found in database
                  </Typography>
                </TableCell>
              </TableRow>
            </>}
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
                    There is currently no risk in this project.
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </>}
      </Table>
    </TableContainer>
  )
}

const RiskTableBody: React.FC<TableProps> = ({
  rows,
  page,
  setCurrentPagingation
}) => {
  const cellStyle = singleTheme.tableStyles.primary.body.cell;
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [checkedRows, setCheckedRows] = useState<number[]>([]);
  const theme = useTheme();  

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setCurrentPagingation(newPage);
  }, [setCurrentPagingation]);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setCurrentPagingation(0);
    },
    [setRowsPerPage, setCurrentPagingation]
  );

  const handleRowClick = (riskId: number) => {
    setCheckedRows((prev) =>
      prev.includes(riskId)
        ? prev.filter((i) => i !== riskId)
        : [...prev, riskId]
    );
  };

  return (
    <>
      <TableBody>
        {rows &&
          rows
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row: ProjectRisk, index: number) => (
              <TableRow key={index} sx={singleTheme.tableStyles.primary.body.row} onClick={() => handleRowClick(row.id)}>
                <TableCell sx={cellStyle}>
                  <MuiCheckbox
                    size="small"
                    id="auto-fill"
                    checked={checkedRows.includes(row.id)}
                    onChange={() => handleRowClick(row.id)}
                    onClick={(e) => e.stopPropagation()}  
                    checkedIcon={<CheckboxFilled />}
                    icon={<CheckboxOutline />}
                    sx={{
                      borderRadius: "4px",
                      "&:hover": { backgroundColor: "transparent" },
                      "& svg": { width: "small", height: "small" },
                      "& .MuiTouchRipple-root": {
                        display: "none",
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={cellStyle}>
                  {row.id ? row.id : page * rowsPerPage + index + 1}
                </TableCell>
                <TableCell>
                  {row.risk_name ? row.risk_name : '-'}
                </TableCell>
                <TableCell sx={{maxWidth: '300px'}}>
                  {row.risk_description ? row.risk_description : '-'}
                </TableCell>
                <TableCell sx={cellStyle}>
                  {row.risk_severity ? <RiskChip label={row.risk_severity} /> : '-'}
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
      <TableFooter>
        
      </TableFooter>
    </>
  )
}

export default LinkedRisksTable