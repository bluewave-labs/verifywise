import React from "react";
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";

interface SelectItem {
  _id: string;
  name: string;
}

interface SelectProps {
  id: string;
  label: string;
  value: string;
  items: SelectItem[];
  onChange: (event: SelectChangeEvent) => void;
  sx?: any;
}

const Select: React.FC<SelectProps> = ({
  id,
  label,
  value,
  items,
  onChange,
  sx = {},
}) => {
  return (
    <FormControl size="small" sx={{ minWidth: 140, ...sx }}>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <MuiSelect
        labelId={`${id}-label`}
        id={id}
        value={value}
        label={label}
        onChange={onChange}
      >
        {items.map((item) => (
          <MenuItem key={item._id} value={item._id}>
            {item.name}
          </MenuItem>
        ))}
      </MuiSelect>
    </FormControl>
  );
};

export default Select;