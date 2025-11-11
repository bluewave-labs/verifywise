import { VendorModel } from "../models/Common/vendor/vendor.model";
import { RiskModel } from "../models/Common/risks/risk.model";
import { FileModel } from "../models/Common/file/file.model";
import { User } from "../types/User";
import { VendorRisk } from "../types/VendorRisk";
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
  renderRow: (item: T, sortConfig?: { key: string; direction: "asc" | "desc" | null }) => React.ReactNode;
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
  judge?: string;
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
  name: keyof FileModel | string;
  sx?: object;
}

export interface IFileBasicTableProps {
  data: {
    rows: any[];
    cols: IColumn[];
  };
  bodyData: FileModel[];
  paginated?: boolean;
  table: string;
  onFileDeleted?: () => void | Promise<void>;
}

export interface IFileTableProps {
  cols: any[];
  
  files: FileModel[];
  onFileDeleted?: () => void | Promise<void>;
}

export interface IProjectRiskTableBodyProps {
  rows: RiskModel[];
  page: number;
  setCurrentPagingation: (pageNo: number) => void;
  currentRisks: number[];
  checkedRows: number[];
  setCheckedRows: (checkedRows: number[]) => void;
  deletedRisks: number[];
  setDeletedRisks: (deletedRisks: number[]) => void;
}

export interface ILinkedRisksTableProps {
  projectRisksGroup: RiskModel[];
  filteredRisksGroup: RiskModel[];
  currentRisks: number[];
  checkedRows: number[];
  setCheckedRows: (checkedRows: number[]) => void;
  deletedRisks: number[];
  setDeletedRisks: (deletedRisks: number[]) => void;
}

export interface LinkedRisksModalProps {
  onClose: () => void;
  currentRisks: number[];
  setSelectecRisks: (selectedRisks: number[]) => void;
  _setDeletedRisks: (deletedRisks: number[]) => void;
  projectId?: number; // Optional project ID to override URL search params
  frameworkId?: number; // Optional framework ID for organizational projects
  isOrganizational?: boolean; // Flag to determine which endpoint to use
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
  renderRow?: (row: any, sortConfig?: { key: string; direction: "asc" | "desc" | null }) => React.ReactNode;
}

export interface IReportTableProps {
  rows: any[];
  onRemoveReport: (id: number) => void;
  page: number;
  rowsPerPage: number;
  sortConfig?: {
    key: string;
    direction: "asc" | "desc" | null;
  };
}

export interface IReportTablePropsExtended {
  columns: any[];
  rows: any[];
  removeReport: (id: number) => void;
  page: number;
  setCurrentPagingation: (pageNo: number) => void;
}

export interface IRiskTableProps {
  users: User[];
  vendors: VendorModel[];
  vendorRisks: VendorRisk[];
  onDelete: (riskId: number) => void;
  onEdit: (riskId: number) => void;
  isDeletingAllowed?: boolean;
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

export interface ITableWithPlaceholderProps {
  vendors: VendorModel[];
  users: User[];
  onDelete: (vendorId?: number) => void;
  onEdit: (vendorId?: number) => void;
}
