import React from "react";
import { Switch, SwitchProps, useTheme } from "@mui/material";
import { getToggleStyles } from "./styles";

/**
 * Custom Toggle component styled to match the application's color scheme and Checkbox style.
 * @param {SwitchProps} props - Props for the MUI Switch component.
 */
const Toggle: React.FC<SwitchProps> = (props) => {
  const theme = useTheme();
  return (
    <Switch
      disableRipple
      {...props}
      sx={getToggleStyles(theme)}
    />
  );
};

export default Toggle; 