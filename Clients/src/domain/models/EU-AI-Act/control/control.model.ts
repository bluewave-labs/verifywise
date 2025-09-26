export class ControlModel {
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
  control_category_id!: number;
  is_demo?: boolean;
  created_at?: Date;

  constructor(data: ControlModel) {
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
    this.control_category_id = data.control_category_id;
    this.is_demo = data.is_demo;
    this.created_at = data.created_at;
  }

  static createNewControl(data: ControlModel): ControlModel {
    return new ControlModel(data);
  }
}
