import { FileData } from "../types/File";
import { ProjectRisk } from "../types/ProjectRisk";
import { User } from "../types/User";
import { IEvent } from "./i.event";
import { ITask } from "./i.task";
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

export interface IFairnessTableProps {
  columns: any[];
  rows: any[];
  removeModel: {
    onConfirm: (id: number) => void; // actually deletes
  };
  page: number;
  setCurrentPagingation: (pageNo: number) => void;
  onShowDetails: (model: any) => void;
}
export interface IColumn {
  id: number;
  name: keyof FileData | string;
  sx?: object;
}

export interface IFileBasicTableProps {
  data: {
    rows: any[];
    cols: IColumn[];
  };
  bodyData: FileData[];
  paginated?: boolean;
  table: string;
  onFileDeleted?: () => void | Promise<void>;
}

export interface IFileTableProps {
  cols: any[];
  files: FileData[];
  onFileDeleted?: () => void | Promise<void>;
}

export interface IProjectRiskTableBodyProps {
  rows: ProjectRisk[];
  page: number;
  setCurrentPagingation: (pageNo: number) => void;
  currentRisks: number[];
  checkedRows: number[];
  setCheckedRows: (checkedRows: number[]) => void;
  deletedRisks: number[];
  setDeletedRisks: (deletedRisks: number[]) => void;
}

export interface ILinkedRisksTableProps {
  projectRisksGroup: ProjectRisk[];
  filteredRisksGroup: ProjectRisk[];
  currentRisks: number[];
  checkedRows: number[];
  setCheckedRows: (checkedRows: number[]) => void;
  deletedRisks: number[];
  setDeletedRisks: (deletedRisks: number[]) => void;
}

export interface ITableProps {
  data: {
    rows: any[];
    cols: { id: string; name: string }[];
  };
  bodyData?: any[];
  paginated?: boolean;
  reversed?: boolean;
  table?: string;
  onRowClick?: (id: string) => void;
  label?: string;
  setSelectedRow: (row: any) => void;
  setAnchorEl: (element: HTMLElement | null) => void;
  renderRow?: (row: any) => React.ReactNode;
}

export interface IReportTableProps {
  rows: any[];
  onRemoveReport: (id: number) => void;
  page: number;
  rowsPerPage: number;
}

export interface IReportTablePropsExtended {
  columns: any[];
  rows: any[];
  removeReport: (id: number) => void;
  page: number;
  setCurrentPagingation: (pageNo: number) => void;
}

export interface ITasksTableProps {
  tasks: ITask[];
  users: User[];
  onArchive: (taskId: number) => void;
  onEdit: (task: ITask) => void;
  onStatusChange: (taskId: number) => (newStatus: string) => Promise<boolean>;
  statusOptions: string[];
  isUpdateDisabled?: boolean;
  onRowClick?: (task: ITask) => void;
}
