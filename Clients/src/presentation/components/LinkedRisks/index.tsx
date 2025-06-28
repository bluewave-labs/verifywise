import { Button, Stack, Table, TableBody, TableCell, TableContainer, TableRow, Typography, Checkbox as MuiCheckbox, TableFooter, useTheme, TablePagination } from '@mui/material';
import { ClearIcon } from '@mui/x-date-pickers/icons';
import React, { useCallback, useMemo, useState } from 'react'
import Field from '../Inputs/Field';
import { TITLE_OF_COLUMNS } from './constants';
import singleTheme from '../../themes/v1SingleTheme';
import TableHeader from '../Table/TableHead';
import useProjectRisks from '../../../application/hooks/useProjectRisks';
import placeholderImage from '../../assets/imgs/empty-state.svg';
import RiskChip from '../RiskLevel/RiskChip';
import { ReactComponent as CheckboxOutline } from "../../assets/icons/checkbox-outline.svg";
import { ReactComponent as CheckboxFilled } from "../../assets/icons/checkbox-filled.svg";
import { ReactComponent as SelectorVertical } from '../../assets/icons/selector-vertical.svg'
import { ProjectRisk } from '../../../domain/types/ProjectRisk';

import {
  textfieldStyle,
  tableWrapper,
  emptyData,
  styles,
  paginationStyle, 
  paginationDropdown, 
  paginationSelect
} from "./styles";
import { useSearchParams } from 'react-router-dom';
import CustomizableButton from '../../vw-v2-components/Buttons';
import TablePaginationActions from '../TablePagination';

interface LinkedRisksModalProps {
  onClose: () => void;
}

interface TableProps {
  rows: ProjectRisk[];
  page: number;
  setCurrentPagingation: (pageNo: number) => void;
}

const LinkedRisksPopup: React.FC<LinkedRisksModalProps> = ({
  onClose
}) => {
  const [searchParams] = useSearchParams();
  const pId = searchParams.get("projectId");
  const projectId = parseInt(pId ?? "0");
  const { projectRisks } = useProjectRisks({ projectId });  
  const [currentPage, setCurrentPage] = useState(0);
  const [searchInput, setSearchInput] = useState<string>("");

  const setCurrentPagingation = (page: number) => {
    setCurrentPage(page)
  }

  const handleFormSubmit = () => {
    onClose();
  }

  const handleOnTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };  

  const filteredRisks = projectRisks.filter(risk =>
    risk.risk_name.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <Stack sx={styles.container}>
      <Stack>
        <Stack sx={styles.headingSection}>
          <Typography sx={ styles.textTitle }>Link a risk from risk database</Typography>
          <ClearIcon
            sx={ styles.clearIconStyle }
            onClick={onClose}
          />
        </Stack>
        <Stack 
          component="form"
          sx={styles.searchInputWrapper}>
          <Typography sx={{ fontSize: 13, color: "#344054", mr: 8 }}>Search from the risk database:</Typography>
          <Stack>
            <Field
              id="risk-input"
              width="350px"
              sx={textfieldStyle}
              value={searchInput}
              onChange={handleOnTextFieldChange}
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
        </Stack>
      </Stack>
      <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end'}}>
        <Button 
          sx={styles.cancelBtn}
          onClick={onClose}
        >Cancel</Button>
        <CustomizableButton
          sx={styles.CustomizableButton}
          variant="contained"
          text="Use selected risks"
          onClick={handleFormSubmit}
        />
      </Stack>
    </Stack>
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
        <TableRow sx={{
          '& .MuiTableCell-root.MuiTableCell-footer': {
            paddingX: theme.spacing(8),
            paddingY: theme.spacing(4),
          }}}>
          <TablePagination
            count={rows?.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 15, 20, 25]}
            onRowsPerPageChange={handleChangeRowsPerPage}
            ActionsComponent={(props) => <TablePaginationActions {...props} />}
            labelRowsPerPage="Risks per page"
            labelDisplayedRows={({ page, count }) =>
              `Page ${page + 1} of ${Math.max(0, Math.ceil(count / rowsPerPage))}`
            }
            sx={paginationStyle}
            slotProps={{
              select: {
                MenuProps: {
                  keepMounted: true,
                  PaperProps: {
                    className: "pagination-dropdown",
                    sx: paginationDropdown,
                  },
                  transformOrigin: { vertical: "bottom", horizontal: "left" },
                  anchorOrigin: { vertical: "top", horizontal: "left" },
                  sx: { mt: theme.spacing(-2) },
                },
                inputProps: { id: "pagination-dropdown" },
                IconComponent: SelectorVertical,
                sx: paginationSelect,
              },
            }}
          />
        </TableRow>
      </TableFooter>
    </>
  )
}

export default LinkedRisksPopup