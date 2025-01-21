import { Checkbox, FormControlLabel } from "@mui/material";

interface VWCheckboxProps {
  id?: string;
  isChecked?: boolean;
  color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  required?: boolean;
  title: string;
  checkboxSX?: object;
  labelSX?: object;
  onClick?: () => void;
  onChange?: () => void;
}

const VWCheckbox = ({
  id,
  isChecked,
  color = "primary",
  size = "medium",
  disabled,
  required,
  title,
  checkboxSX,
  labelSX,
  onClick,
  onChange,
}: VWCheckboxProps) => {
  return (
    <FormControlLabel
      id={`vwcheckbox-${id}`}
      control={
        <Checkbox
          disableRipple
          disabled={disabled}
          checked={isChecked}
          required={required}
          color={color}
          size={size}
          sx={checkboxSX}
          onClick={onClick}
          onChange={onChange}
        />
      }
      label={title}
      sx={labelSX}
    />
  );
};

export default VWCheckbox;
