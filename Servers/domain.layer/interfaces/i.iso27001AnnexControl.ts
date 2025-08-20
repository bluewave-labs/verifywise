export type ControlStatus =
  | "Waiting"
  | "In progress"
  | "Done"
  | "Review"
  | "Approved";

export interface IISO27001AnnexControl {
  id?: number;
  control_no: number;
  title: string;
  requirement_summary: string;
  key_questions: string[];
  evidence_examples: string[];
  implementation_description: string;
  status: ControlStatus;
  owner?: number;
  reviewer?: number;
  approver?: number;
  due_date?: Date;
  cross_mappings?: object[];
  iso27001annex_category_id: number;
}
