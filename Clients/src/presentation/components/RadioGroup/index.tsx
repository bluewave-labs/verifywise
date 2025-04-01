import React from 'react';
import { FormControl, RadioGroup, FormControlLabel } from '@mui/material';
import RadioElement from './RadioElement';
import { labelStyle } from './styles';

interface RadioProps {
  values: any[];
  defaultValue: string
}

const RadioComponent: React.FC<RadioProps> = ({
  values,
  defaultValue
}) => {
  return (
    <FormControl>
      <RadioGroup
        aria-labelledby="radio-buttons-group-label"
        defaultValue={defaultValue}
        name="radio-buttons-group"
      >
      {values.map((value, index) => (
        <FormControlLabel 
          key={index}
          value={value} 
          control={<RadioElement />} 
          label={value} 
          sx={labelStyle}           
        />
      ))}
      </RadioGroup>
    </FormControl>
  )
}

export default RadioComponent