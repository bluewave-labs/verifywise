import { Button, Stack, Typography } from '@mui/material';
import { ClearIcon } from '@mui/x-date-pickers/icons';
import React, { useState } from 'react'
import Field from '../Inputs/Field';
import useProjectRisks from '../../../application/hooks/useProjectRisks';
import LinkedRisksTable from '../Table/LinkedRisksTable';
import { useSearchParams } from 'react-router-dom';
import CustomizableButton from '../../vw-v2-components/Buttons';

import {
  textfieldStyle,
  styles,
} from "./styles";

interface LinkedRisksModalProps {
  onClose: () => void;
}

const LinkedRisksPopup: React.FC<LinkedRisksModalProps> = ({
  onClose
}) => {
  const [searchParams] = useSearchParams();
  const pId = searchParams.get("projectId");
  const projectId = parseInt(pId ?? "0");
  const { projectRisks } = useProjectRisks({ projectId });  
  const [searchInput, setSearchInput] = useState<string>("");

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
              disabled={projectRisks.length === 0}
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