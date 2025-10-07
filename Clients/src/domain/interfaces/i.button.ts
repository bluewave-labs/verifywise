import { SxProps, Theme } from "@mui/material";

/**
 * Props interface for the CustomizableButton component
 */
export interface ICustomizableButtonProps {
  /** The variant of the button */
  variant?: "contained" | "outlined" | "text";
  /** The size of the button */
  size?: "small" | "medium" | "large";
  /** If true, the button will be disabled */
  isDisabled?: boolean;
  /** If true, the button will be styled as a link */
  isLink?: boolean;
  /** The color theme of the button */
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
  /** Click event handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Custom styles using MUI's sx prop */
  sx?: SxProps<Theme>;
  /** Button text content (deprecated: use children instead) */
  text?: string;
  /** Icon element (deprecated: use startIcon or endIcon instead) */
  icon?: React.ReactNode;
  /** Icon to display at the start of the button */
  startIcon?: React.ReactNode;
  /** Icon to display at the end of the button */
  endIcon?: React.ReactNode;
  /** Button content */
  children?: React.ReactNode;
  /** Loading state - shows spinner and disables button */
  loading?: boolean;
  /** Custom loading indicator */
  loadingIndicator?: React.ReactNode;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** ARIA described by for accessibility */
  ariaDescribedBy?: string;
  /** Test identifier for automated testing */
  testId?: string;
  /** Button type attribute */
  type?: "button" | "submit" | "reset";
  /** Full width button */
  fullWidth?: boolean;
  /** Custom class name */
  className?: string;
  /** Tooltip text */
  title?: string;
}

export interface IFilterButtonProps {
  /** Whether the filters panel is currently open */
  isOpen: boolean;
  /** Whether there are any active filters */
  hasActiveFilters: boolean;
  /** Number of active filters to display in badge */
  activeFilterCount?: number;
  /** Click handler for the filter button */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional styles */
  sx?: object;
}

export interface IButtonToggleOption {
  value: string;
  label: string;
}

export interface IButtonToggleProps {
  options: IButtonToggleOption[];
  value: string;
  onChange: (value: string) => void;
  height?: number;
}
