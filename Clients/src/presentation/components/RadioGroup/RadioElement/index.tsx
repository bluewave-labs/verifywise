import styled from 'styled-components';
import { Radio, RadioProps } from '@mui/material';
import {styles} from './styles';

const BpIcon = styled('span')(() => ({...styles.BpIcon}));  
const BpCheckedIcon = styled(BpIcon)({...styles.BpCheckedIcon});

const RadioElement = (props: RadioProps) => {
  return (
    <Radio
      disableRipple
      sx={{
        color: "#D0D5DD",
      }}
      checkedIcon={<BpCheckedIcon />}
      icon={<BpIcon />}
      {...props}
    />
  )
}

export default RadioElement