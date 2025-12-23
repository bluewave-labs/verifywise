import { SelectChangeEvent, SxProps, Theme } from "@mui/material";
import {
  AutoCompleteFieldCoreProps,
  CheckboxCoreProps,
  DatePickerCoreProps,
  FieldCoreProps,
  SelectCorProps,
  ISearchBoxCoreProps,
} from "../../domain/types/widget.types";

/**
 * Presentation adapters for widget components
 * Extends domain props with MUI-specific types
 */

export interface AutoCompleteFieldProps extends AutoCompleteFieldCoreProps {
  sx?: SxProps<Theme>;
}

export interface CheckboxProps extends CheckboxCoreProps {
  sx?: SxProps<Theme>;
}

export interface DatePickerProps extends DatePickerCoreProps {
  sx?: object;
}

export interface FieldProps extends FieldCoreProps {
  sx?: SxProps<Theme>;
}

export interface SelectProps extends SelectCorProps {
  onChange: (
    event: SelectChangeEvent<string | number>,
    child: React.ReactNode
  ) => void;
  sx?: object;
}

export interface ISearchBoxProps extends ISearchBoxCoreProps {
  sx?: SxProps<Theme>;
}
