export class ISO27001AnnexControlModel {
  id?: number;
  implementation_description!: string;
  evidence_links!: Object[];
  status!: string;
  owner!: number;
  reviewer!: number;
  approver!: number;
  due_date!: Date;
  auditor_feedback!: string;
  annexcontrol_meta_id!: number;
  projects_frameworks_id!: number;
  created_at!: Date;
  is_demo!: boolean;

  constructor(data: ISO27001AnnexControlModel) {
    this.id = data.id;
    this.implementation_description = data.implementation_description;
    this.evidence_links = data.evidence_links;
    this.status = data.status;
    this.owner = data.owner;
    this.reviewer = data.reviewer;
    this.approver = data.approver;
    this.due_date = data.due_date;
    this.auditor_feedback = data.auditor_feedback;
    this.annexcontrol_meta_id = data.annexcontrol_meta_id;
    this.projects_frameworks_id = data.projects_frameworks_id;
    this.created_at = data.created_at;
    this.is_demo = data.is_demo;
  }

  static createNewISO27001AnnexControl(data: ISO27001AnnexControlModel) {
    return new ISO27001AnnexControlModel(data);
  }
}
