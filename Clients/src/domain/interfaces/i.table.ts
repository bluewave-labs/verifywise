import { IEvent } from "./i.event";
import { IUser } from "./iUser";

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

export interface IEvaluationTableBodyProps {
  rows: IEvaluationRow[];
  page: number;
  rowsPerPage: number;
  onShowDetails: (model: IEvaluationRow) => void;
  onRemoveModel: {
    onConfirm: (id: string) => void;
  };
}

export interface IEvaluationTableProps {
  columns: string[];
  rows: IEvaluationRow[];
  removeModel: {
    onConfirm: (id: string) => void; // actually deletes
  };
  page: number;
  setCurrentPagingation: (pageNo: number) => void;
  onShowDetails: (model: IEvaluationRow) => void;
}

export interface IEventsTableProps {
  data: IEvent[];
  users?: IUser[];
  isLoading?: boolean;
  paginated?: boolean;
}

export interface IFairnessTableBodyProps {
  rows: any[];
  page: number;
  rowsPerPage: number;
  onShowDetails: (model: any) => void;
  onRemoveModel: {
    onConfirm: (id: number) => void;
  };
}
