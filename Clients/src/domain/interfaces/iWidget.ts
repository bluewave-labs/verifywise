import { Theme } from "@mui/material";

import { SxProps } from "@mui/material";

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
