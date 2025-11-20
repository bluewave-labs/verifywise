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
  DRAFT = "Draft",
  IN_PROGRESS = "In progress",
  AWAITING_REVIEW = "Awaiting review",
  AWAITING_APPROVAL = "Awaiting approval",
  IMPLEMENTED = "Implemented",
  NEEDS_REWORK = "Needs rework",
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
  onSaveSuccess?: (success: boolean, message?: string, savedSubcategoryId?: number) => void;
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
