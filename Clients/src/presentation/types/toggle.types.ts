import { SxProps, Theme } from "@mui/material";
import { IViewToggleCoreProps, IViewMode } from "./interfaces/i.toggle";

// Re-export for consumers
export type { IViewMode };

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
