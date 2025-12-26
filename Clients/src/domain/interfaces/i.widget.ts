/**
 * Re-export domain types from domain types file
 * Domain layer has zero external dependencies
 */
export type {
  CloseIconProps,
  AutoCompleteOption,
  AutoCompleteFieldCoreProps,
  DatePickerCoreProps,
  DropDownsProps,
  SelectCorProps,
  IBannerProps,
  IStatusDropdownProps,
  ISearchBoxCorePropsBase,
  IHeatMapCell,
  ITimelineEvent,
  IGenerateReportProps,
  ReportFormat,
  IInputProps,
  IHeaderProps,
} from "../types/widget.types";

// Note: React-dependent interfaces (IconButtonProps, CheckboxCoreProps, FieldCoreProps,
// ImageFieldProps, RadioProps, ISearchBoxCoreProps, IProtectedRouteProps, IPopupProps)
// have been moved to: presentation/types/widget.types.ts
