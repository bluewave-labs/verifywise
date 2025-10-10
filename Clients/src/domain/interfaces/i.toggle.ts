import { SxProps, Theme } from "@mui/material";

export type IViewMode = "card" | "table";

export interface IViewToggleProps {
  /**
   * Current view mode
   */
  viewMode: IViewMode;
  /**
   * Callback fired when the view mode changes
   */
  onViewChange: (mode: IViewMode) => void;
  /**
   * Whether the component is disabled
   */
  disabled?: boolean;
  /**
   * Size of the toggle buttons
   */
  size?: "small" | "medium" | "large";
  /**
   * Additional styling
   */
  sx?: SxProps<Theme>;
}
