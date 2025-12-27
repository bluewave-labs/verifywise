/**
 * Status data interface for charts and visualizations
 * Pure domain type - no UI dependencies
 */
export interface IStatusData {
  label: string;
  value: number;
  color: string;
}
