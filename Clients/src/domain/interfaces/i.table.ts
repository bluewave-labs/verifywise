export interface IAITrustCenterTableColumn {
  id: string;
  label: string;
}
export interface IAITrustCenterTableProps<T> {
  data: T[];
  columns: IAITrustCenterTableColumn[];
  isLoading?: boolean;
  paginated?: boolean;
  emptyStateText?: string;
  renderRow: (item: T) => React.ReactNode;
  onRowClick?: (item: T) => void;
  tableId?: string;
  disabled?: boolean;
}
