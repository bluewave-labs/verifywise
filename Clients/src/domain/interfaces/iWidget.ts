import { SelectChangeEvent, Theme } from "@mui/material";

import { SxProps } from "@mui/material";
import { Dayjs } from "dayjs";
import { ChangeEvent } from "react";

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
  disabled?: boolean;
}

export interface DropDownsProps {
  elementId?: string;
  state?: any;
  setState?: (newState: any) => void;
  isControl?: boolean;
  projectId?: number;
  readOnly?: boolean;
}

export interface FieldProps {
  type?: string;
  id?: string;
  label?: string;
  https?: boolean;
  isRequired?: boolean;
  isOptional?: boolean;
  optionalLabel?: string;
  autoComplete?: string;
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onInput?: (event: React.FormEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  width?: number | string;
  sx?: SxProps<Theme>;
}

export interface ImageFieldProps {
  id: string;
  src: string;
  loading: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export interface RadioProps {
  checked: boolean;
  value: string;
  id: string;
  size: "small" | "medium";
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  title: string;
  desc: string;
}

export interface SelectProps {
  id: string;
  label?: string;
  placeholder?: string;
  isHidden?: boolean;
  value: string | number;
  items: {
    _id: number | string;
    name: string;
    email?: string;
    surname?: string;
  }[];
  isRequired?: boolean;
  error?: string;
  onChange: (
    event: SelectChangeEvent<string | number>,
    child: React.ReactNode
  ) => void;
  sx?: object;
  getOptionValue?: (item: any) => any;
  disabled?: boolean;
}

export interface IBannerProps {
  onClose: () => void;
  bannerText: string;
  bannerWidth: string;
}
