export class SubControlModel {
  id?: number;
  title!: string;
  description!: string;
  order_no?: number;
  status?: "Waiting" | "In progress" | "Done";
  approver?: number;
  risk_review?: "Acceptable risk" | "Residual risk" | "Unacceptable risk";
  owner?: number;
  reviewer?: number;
  due_date?: Date;
  implementation_details?: string;
  evidence_description?: string;
  feedback_description?: string;
  evidence_files?: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[];
  feedback_files?: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[];
  control_id!: number;
  is_demo?: boolean;
  created_at?: Date;

  constructor(data: SubControlModel) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.order_no = data.order_no;
    this.status = data.status;
    this.approver = data.approver;
    this.risk_review = data.risk_review;
    this.owner = data.owner;
    this.reviewer = data.reviewer;
    this.due_date = data.due_date;
    this.implementation_details = data.implementation_details;
    this.evidence_description = data.evidence_description;
    this.feedback_description = data.feedback_description;
    this.evidence_files = data.evidence_files;
    this.feedback_files = data.feedback_files;
    this.control_id = data.control_id;
    this.is_demo = data.is_demo;
    this.created_at = data.created_at;
  }

  static createSubControl(data: SubControlModel): SubControlModel {
    return new SubControlModel(data);
  }
}
