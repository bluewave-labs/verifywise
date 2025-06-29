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

import LinkedRisksTable from '../Table/LinkedRisksTable';

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
        <LinkedRisksTable projectRisksGroup={projectRisks} filteredRisksGroup={filteredRisks}/>
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

export default LinkedRisksPopup