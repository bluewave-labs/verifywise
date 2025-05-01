import { FileData } from "./File";

export type Subcontrol = {
  control_id?: number;
  id?: number;
  order_no?: number;
  title?: string;
  description?: string;
  status?: string;
  approver?: number;
  risk_review?: string;
  owner?: number;
  reviewer?: number;
  implementation_details?: string;
  due_date?: string;
  evidence_description?: string;
  feedback_description?: string;
  evidence_files?: FileData[];
  feedback_files?: FileData[];
};
