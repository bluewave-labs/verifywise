/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dayjs } from "dayjs";
import { RiskModel } from "../models/Common/risks/risk.model";

/**
 * Widget-related domain types
 * Pure domain types with no React dependencies
 */

export interface CloseIconProps {
  text: string;
}

export interface AutoCompleteOption {
  _id: string;
  name: string;
}

export interface AutoCompleteFieldCoreProps {
  id: string;
  type: string;
  options?: AutoCompleteOption[] | string[];
  placeholder?: string;
  disabled?: boolean;
  width?: number | string;
  autoCompleteValue?: AutoCompleteOption | undefined;
  setAutoCompleteValue?: (value: AutoCompleteOption | undefined) => void;
  error?: string;
  multiple?: boolean;
  value?: string[] | string;
  onChange?: (value: string[] | string) => void;
  label?: string;
  isRequired?: boolean;
}

export interface DatePickerCoreProps {
  label?: string;
  isRequired?: boolean;
  isOptional?: boolean;
  optionalLabel?: string;
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

export interface SelectCorProps {
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

export interface ISearchBoxCorePropsBase {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
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

export type ReportFormat = "pdf" | "docx";

export interface IInputProps {
  report_type: string | string[];
  report_name: string;
  project: number | null;
  framework: number;
  projectFrameworkId: number;
  reportType?: "project" | "organization" | null;
  format: ReportFormat;
}

export interface IHeaderProps {
  onHelperClick?: () => void;
}

// Note: React-dependent interfaces (IconButtonProps, CheckboxCoreProps, FieldCoreProps,
// ImageFieldProps, RadioProps, ISearchBoxCoreProps, IProtectedRouteProps, IPopupProps)
// have been moved to: presentation/types/widget.types.ts
