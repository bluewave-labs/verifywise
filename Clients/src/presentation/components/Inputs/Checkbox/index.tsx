/**
 * Checkbox component using Material-UI's Checkbox and FormControlLabel.
 *
 * @component
 * @param {string} id - The unique identifier for the checkbox input.
 * @param {string} label - The label displayed next to the checkbox.
 * @param {"small" | "medium" | "large"} [size="medium"] - The size of the checkbox.
 * @param {boolean} isChecked - The checked state of the checkbox.
 * @param {string} value - The value of the checkbox input.
 * @param {function} onChange - The function to call when the checkbox state changes.
 * @param {boolean} [isDisabled] - Whether the checkbox is disabled.
 *
 * @returns {JSX.Element} The rendered Checkbox component.
 */

import {
  FormControlLabel,
  Checkbox as MuiCheckbox,
  useTheme,
} from "@mui/material";
import "./index.css";

import { ReactComponent as CheckboxOutline } from "../../../assets/icons/checkbox-outline.svg";
import { ReactComponent as CheckboxFilled } from "../../../assets/icons/checkbox-filled.svg";
import { FC } from "react";
import { CheckboxProps } from "../../../../domain/interfaces/iWidget";

const Checkbox: FC<CheckboxProps> = ({
  id,
  label,
  size = "medium",
  isChecked,
  value,
  onChange,
  isDisabled,
}) => {
  const sizes: { [key in "small" | "medium" | "large"]: string } = {
    small: "20px",
    medium: "24px",
    large: "28px",
  };
  const theme = useTheme();

  return (
    <FormControlLabel
      className="checkbox-wrapper"
      control={
        <MuiCheckbox
          disableRipple
          checked={isChecked}
          checkedIcon={<CheckboxFilled />}
          icon={<CheckboxOutline />}
          value={value}
          onChange={onChange}
          inputProps={{
            "aria-label": "controlled checkbox",
            id: id,
          }}
          sx={{
            borderRadius: "4px",
            "&:hover": { backgroundColor: "transparent" },
            "& svg": { width: sizes[size], height: sizes[size] },
            "& .MuiTouchRipple-root": {
              display: "none",
            },
          }}
          size={size}
        />
      }
      label={label}
      disabled={isDisabled}
      sx={{
        borderRadius: theme.shape.borderRadius,
        p: theme.spacing(2.5),
        m: theme.spacing(-2.5),
        "& .MuiButtonBase-root": {
          width: theme.spacing(10),
          p: 0,
          mr: theme.spacing(6),
        },
        "&:hover": {
          backgroundColor: "transparent",
        },
        "& span.MuiTypography-root": {
          fontSize: 13,
          color: theme.palette.text.tertiary,
        },
        "& .MuiFormControlLabel-root:hover": {
          backgroundColor: "transparent",
        },
      }}
    />
  );
};

export default Checkbox;
