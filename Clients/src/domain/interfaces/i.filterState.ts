/**
 * Filter state interface for risk filtering
 * Pure domain type - no UI dependencies
 */
export interface IFilterState {
  riskLevel: string;
  owner: string;
  mitigationStatus: string;
  deletionStatus: string;
}
