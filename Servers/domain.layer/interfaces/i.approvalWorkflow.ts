import { EntityType } from "../enums/approval-workflow.enum";

export interface IApprovalWorkflowAttributes {
  id?: number;
  workflow_title: string;
  entity_type: EntityType;
  description?: string;
  is_active?: boolean;
  created_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IApprovalWorkflowStepAttributes {
  id?: number;
  workflow_id: number;
  step_number: number;
  step_name: string;
  description?: string;
  requires_all_approvers?: boolean;
  created_at?: Date;
}

export interface IApprovalStepApproversAttributes {
  id?: number;
  workflow_step_id: number;
  approver_id: number;
  created_at?: Date;
}

export interface IApprovalRequestAttributes {
  id?: number;
  request_name: string;
  workflow_id: number;
  entity_id?: number;
  entity_type?: EntityType;
  entity_data?: any;
  status: string;
  requested_by: number;
  current_step?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IApprovalRequestStepAttributes {
  id?: number;
  request_id: number;
  step_number: number;
  step_name: string;
  status: string;
  date_assigned?: Date;
  date_completed?: Date;
  step_details?: any;
  created_at?: Date;
}

export interface IApprovalRequestStepApprovalAttributes {
  id?: number;
  request_step_id: number;
  approver_id: number;
  approval_result?: string;
  comments?: string;
  approved_at?: Date;
  created_at?: Date;
}
