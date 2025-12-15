/* eslint-disable @typescript-eslint/no-explicit-any */
import { SelectChangeEvent, Theme } from "@mui/material";

import { SxProps } from "@mui/material";
import { Dayjs } from "dayjs";
import { ChangeEvent, ComponentType } from "react";
import { RiskModel } from "../models/Common/risks/risk.model";

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
  id: number | string;
  onDelete: () => void;
  onEdit: () => void;
  warningTitle?: string;
  warningMessage?: string | React.ReactNode;
  type: string;
  onMouseEvent: (event: React.SyntheticEvent) => void;
  onMakeVisible?: () => void;
  onDownload?: () => void;
  isVisible?: boolean;
  canDelete?: boolean;
  checkForRisks?: () => Promise<boolean>;
  onDeleteWithRisks?: (deleteRisks: boolean) => void;
  onView?: () => void;
  onSendTest?: () => void;
  onToggleEnable?: () => void;
  // Task-specific props
  isArchived?: boolean;
  onRestore?: () => void;
  onHardDelete?: () => void;
  hardDeleteWarningTitle?: string;
  hardDeleteWarningMessage?: string | React.ReactNode;
}

export interface AutoCompleteOption {
  _id: string;
  name: string;
}

export interface AutoCompleteFieldProps {
  id: string;
  type: string;
  options?: AutoCompleteOption[] | string[];
  placeholder?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  width?: number | string;
  autoCompleteValue?: AutoCompleteOption | undefined;
  setAutoCompleteValue?: (value: AutoCompleteOption | undefined) => void;
  error?: string;
  // New props for multiple selection with string options
  multiple?: boolean;
  value?: string[] | string;
  onChange?: (value: string[] | string) => void;
  label?: string;
  isRequired?: boolean;
}

export interface CheckboxProps {
  id: string;
  label?: string;
  size?: "small" | "medium" | "large";
  isChecked: boolean;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  isDisabled?: boolean;
  sx?: SxProps<Theme>;
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
  setAuditedStatusModalOpen?: (open: boolean) => void;
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
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  width?: number | string;
  sx?: SxProps<Theme>;
  min?: number;
  max?: number;
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
  customRenderValue?: (value: any, selectedItem: any) => string;
  isFilterApplied?: boolean;
}

export interface IBannerProps {
  onClose: () => void;
  bannerText: string;
  bannerWidth: string;
}

export interface IStatusDropdownProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => Promise<boolean>;
  disabled?: boolean;
  size?: "small" | "medium";
  allowedRoles?: string[];
  userRole?: string;
  statusOptions?: string[];
}

export interface ISearchBoxProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  sx?: SxProps<Theme>;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  disabled?: boolean;
  fullWidth?: boolean;
}

export interface IHeatMapCell {
  likelihood: number;
  severity: number;
  risks: RiskModel[];
  riskLevel: number;
  color: string;
}

export interface ITimelineEvent {
  id: string;
  date: Date;
  type: "created" | "resolved" | "escalated" | "mitigated";
  risk: RiskModel;
  title: string;
  description: string;
  riskLevel: number;
}

export interface IGenerateReportProps {
  onClose: () => void;
  onReportGenerated?: () => void;
  reportType: "project" | "organization" | null;
}

export interface IInputProps {
  report_type: string | string[];
  report_name: string;
  project: number | null;
  framework: number;
  projectFrameworkId: number;
  reportType?: "project" | "organization" | null;
}

export interface IHeaderProps {
  onHelperClick?: () => void;
}

export interface IProtectedRouteProps {
  Component: ComponentType<any>;
  [key: string]: any;
}

export interface IPopupProps {
  popupId: string;
  popupContent: React.ReactNode;
  openPopupButtonName: string;
  popupTitle: string;
  popupSubtitle?: string;
  handleOpenOrClose?: (event: React.MouseEvent<HTMLElement>) => void;
  anchor: null | HTMLElement;
}
