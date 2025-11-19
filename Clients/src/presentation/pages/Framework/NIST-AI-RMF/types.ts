export interface NISTAIRMFCategory {
  id: number;
  title: string;
  index: string;
  description: string;
  function: NISTAIRMFFunction;
}

export interface NISTAIRMFSubcategory {
  id: number;
  title: string;
  index: string;
  description: string;
  status: NISTAIRMFStatus;
  category_id: number;
  implementation_description?: string;
  owner?: string;
  reviewer?: string;
  approver?: string;
  due_date?: string;
  auditor_feedback?: string;
  evidence_links?: string[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  category?: NISTAIRMFCategory;
}

export enum NISTAIRMFFunction {
  GOVERN = "GOVERN",
  MAP = "MAP",
  MEASURE = "MEASURE",
  MANAGE = "MANAGE",
}

export enum NISTAIRMFStatus {
  NOT_STARTED = "Not started",
  IN_PROGRESS = "In progress",
  IMPLEMENTED = "Implemented",
  REQUIRES_ATTENTION = "Requires attention",
  AUDITED = "Audited",
  NOT_APPLICABLE = "Not Applicable",
}

export interface NISTAIRMFEvidenceFile {
  id: number;
  name: string;
  url: string;
  upload_date: string;
  uploaded_by: string;
  file_size: number;
  file_type: string;
}

export interface NISTAIRMFDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaveSuccess?: (success: boolean, message?: string) => void;
  subcategory?: NISTAIRMFSubcategory;
  category?: NISTAIRMFCategory;
  function?: NISTAIRMFFunction;
}

export interface NISTAIRMFUpdateData {
  id: number;
  status: NISTAIRMFStatus;
  implementation_description?: string;
  owner?: string;
  reviewer?: string;
  approver?: string;
  due_date?: string;
  auditor_feedback?: string;
  tags?: string[];
  risks?: number[];
}

export interface FileData {
  file: File;
  id: string;
  name: string;
}

export interface AlertProps {
  variant: "success" | "error" | "warning" | "info";
  body: string;
}
