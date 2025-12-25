/**
 * View mode type for toggle component
 * Pure domain type with no framework dependencies
 */
export type IViewMode = "card" | "table";

/**
 * Core props for ViewToggle component
 * Pure domain types with no framework dependencies
 */
export interface IViewToggleCoreProps {
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
}
