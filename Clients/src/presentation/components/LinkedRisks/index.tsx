import { Button, Stack, Table, TableBody, TableCell, TableContainer, TableRow, Typography, Checkbox as MuiCheckbox } from '@mui/material';
import { ClearIcon } from '@mui/x-date-pickers/icons';
import React, { useState } from 'react'
import Field from '../Inputs/Field';
import { TITLE_OF_COLUMNS } from './constants';
import singleTheme from '../../themes/v1SingleTheme';
import TableHeader from '../Table/TableHead';
import useProjectRisks from '../../../application/hooks/useProjectRisks';
import placeholderImage from '../../assets/imgs/empty-state.svg';
import RiskChip from '../RiskLevel/RiskChip';
import { ReactComponent as CheckboxOutline } from "../../assets/icons/checkbox-outline.svg";
import { ReactComponent as CheckboxFilled } from "../../assets/icons/checkbox-filled.svg";

import {
  textfieldStyle,
  tableWrapper,
  emptyData,
  styles
} from "./styles";
import { useSearchParams } from 'react-router-dom';
import CustomizableButton from '../../vw-v2-components/Buttons';

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
  const { projectRisks } = useProjectRisks({ projectId });  

  const handleFormSubmit = () => {

  }

  return (
    <Stack sx={styles.container}>
      <Stack sx={styles.headingSection}>
        <Typography sx={ styles.textTitle }>Link a risk from risk database</Typography>
        <ClearIcon
          sx={ styles.clearIconStyle }
          onClick={onClose}
        />
      </Stack>
      <Stack sx={styles.searchInputWrapper}>
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
}) => {
  const cellStyle = singleTheme.tableStyles.primary.body.cell;
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [checkedRows, setCheckedRows] = useState<number[]>([]);
  

  const handleRowClick = (index: number) => {
    setCheckedRows((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  return (
    <TableBody>
      {rows &&
        rows
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((row: any, index: number) => (
            <TableRow key={index} sx={singleTheme.tableStyles.primary.body.row} onClick={() => handleRowClick(index)}>
              <TableCell sx={cellStyle}>
                <MuiCheckbox
                  size="small"
                  id="auto-fill"
                  checked={checkedRows.includes(index)}
                  onChange={() => handleRowClick(index)}
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
                {index + 1}
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
  )
}

export default LinkedRisksPopup