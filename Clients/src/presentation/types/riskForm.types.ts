import { SelectChangeEvent } from "@mui/material";
import {
  AddNewRiskFormCoreProps,
  IRiskLevelCoreProps,
  IRiskLevelFormValues,
} from "../../domain/types/riskForm.types";

/**
 * Presentation adapter for AddNewRiskForm component
 * Extends domain props (no additional MUI-specific props needed)
 */
export type AddNewRiskFormProps = AddNewRiskFormCoreProps;

/**
 * Presentation adapter for IRiskLevel component
 * Extends domain props with MUI SelectChangeEvent handler
 */
export interface IRiskLevelProps extends IRiskLevelCoreProps {
  handleOnSelectChange: (
    field: keyof IRiskLevelFormValues
  ) => (event: SelectChangeEvent<string | number>) => void;
}
