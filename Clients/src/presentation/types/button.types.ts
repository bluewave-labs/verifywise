import { SxProps, Theme } from "@mui/material";
import {
  ICustomizableButtonCoreProps,
  IFilterButtonCoreProps,
} from "../../domain/types/button.types";

/**
 * Presentation adapter for CustomizableButton component
 * Extends domain props with MUI-specific styling
 */
export interface ICustomizableButtonProps extends ICustomizableButtonCoreProps {
  /** Custom styles using MUI's sx prop */
  sx?: SxProps<Theme>;
}

/**
 * Presentation adapter for FilterButton component
 * Extends domain props with MUI-specific styling
 */
export interface IFilterButtonProps extends IFilterButtonCoreProps {
  /** Additional MUI styles */
  sx?: SxProps<Theme>;
}
