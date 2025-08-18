export type ControlStatus =
  | "Waiting"
  | "In progress"
  | "Done"
  | "Review"
  | "Approved";

export interface IISO27001AnnexControl {
  id?: number;
  implementation_description: string;
  evidence_links: Object[];
  status: string;
  owner: number;
  reviewer: number;
  approver: number;
  due_date: Date;
  auditor_feedback: string;
  annexcontrol_meta_id: number;
  projects_frameworks_id: number;
  created_at: Date;
  is_demo: boolean;
}
