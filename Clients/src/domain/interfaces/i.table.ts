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

export interface IAuditRiskTableProps {
  risks: number[];
  deletedRisks: number[];
  checkedRows: number[];
  setCheckedRows: (checkedRows: number[]) => void;
}

export type ITypeRisk = {
  id: number;
  title: string;
  status: string;
  severity: string;
};

export interface IAuditRiskTableBodyProps {
  rows: ITypeRisk[];
  page: number;
  setCurrentPagingation: (pageNo: number) => void;
  deletedRisks: number[];
  checkedRows: number[];
  setCheckedRows: (checkedRows: number[]) => void;
}

export interface IEvaluationRow {
  id: string;
  model: string;
  dataset: string;
  status: "In Progress" | "Completed" | "Failed" | "Pending" | "Running";
}
