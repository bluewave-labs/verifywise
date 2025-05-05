import { Theme } from "@mui/material";

import { SxProps } from "@mui/material";
import { Dayjs } from "dayjs";

/**
 * Props for the CloseButton component.
 *
 * @interface CloseIconProps
 * @property {string} text - The color of the close icon.
 */
export interface CloseIconProps {
  text: string;
}

export interface IconButtonProps {
  id: number;
  onDelete: () => void;
  onEdit: () => void;
  warningTitle: string;
  warningMessage: string;
  type: string;
  onMouseEvent: (event: React.SyntheticEvent) => void;
}

export interface AutoCompleteOption {
  _id: string;
  name: string;
}

export interface AutoCompleteFieldProps {
  id: string;
  type: string;
  options?: AutoCompleteOption[];
  placeholder?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  width?: number | string;
  autoCompleteValue: AutoCompleteOption | undefined;
  setAutoCompleteValue: (value: AutoCompleteOption | undefined) => void;
  error?: string;
}

export interface CheckboxProps {
  id: string;
  label: string;
  size?: "small" | "medium" | "large";
  isChecked: boolean;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isDisabled?: boolean;
}
export interface DatePickerProps {
  label?: string;
  isRequired?: boolean;
  isOptional?: boolean;
  optionalLabel?: string;
  sx?: object;
  date: Dayjs | null;
  error?: string;
  handleDateChange: (date: Dayjs | null) => void;
}
