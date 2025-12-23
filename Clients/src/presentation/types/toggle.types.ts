import { SxProps, Theme } from "@mui/material";
import { IViewToggleCoreProps } from "../../domain/interfaces/i.toggle";

/**
 * Presentation adapter for ViewToggle component
 * Extends domain props with MUI-specific styling
 */
export interface IViewToggleProps extends IViewToggleCoreProps {
  /**
   * Additional styling
   */
  sx?: SxProps<Theme>;
}
