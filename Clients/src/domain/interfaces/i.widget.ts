/**
 * Re-export domain types from domain types file
 * Domain layer has zero external dependencies
 */
export type {
  CloseIconProps,
  IconButtonProps,
  AutoCompleteOption,
  AutoCompleteFieldCoreProps,
  CheckboxCoreProps,
  DatePickerCoreProps,
  DropDownsProps,
  FieldCoreProps,
  ImageFieldProps,
  RadioProps,
  SelectCorProps,
  IBannerProps,
  IStatusDropdownProps,
  ISearchBoxCoreProps,
  IHeatMapCell,
  ITimelineEvent,
  IGenerateReportProps,
  ReportFormat,
  IInputProps,
  IHeaderProps,
  IProtectedRouteProps,
  IPopupProps,
} from "../types/widget.types";

/**
 * Backwards compatibility: re-export presentation adapter types
 * Note: These re-exports enable consumers to use MUI-specific props
 * The actual types are defined in presentation/types/widget.types.ts
 */
export type {
  AutoCompleteFieldProps,
  CheckboxProps,
  DatePickerProps,
  FieldProps,
  SelectProps,
  ISearchBoxProps,
} from "../../presentation/types/widget.types";
