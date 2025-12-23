/**
 * Re-export domain types from domain types file
 * Domain layer has zero external dependencies
 */
export type {
  RiskFormValues,
  MitigationFormValues,
  AddNewRiskFormCoreProps,
  IRiskSectionProps,
  RiskSectionProps,
  IRiskFormValues,
  IRiskFormErrors,
  IAuditRiskModalProps,
  IRiskLevelFormValues,
  IRiskLevelCoreProps,
  IRiskChipProps,
} from "../types/riskForm.types";

// For backwards compatibility
export type { AddNewRiskFormCoreProps as AddNewRiskFormProps } from "../types/riskForm.types";
