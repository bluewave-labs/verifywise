export interface IModelInventory {
  id?: number;
  provider_model?: string; // Keep for backward compatibility during transition
  provider: string;
  model: string;
  version?: string;
  approver: number;
  capabilities: string[];
  security_assessment: boolean;
  status: ModelInventoryStatus;
  status_date: Date;
  reference_link?: string;
  biases?: string;
  limitations?: string;
  hosting_provider?: string;
  used_in_projects: string[];
  is_demo?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export enum ModelInventoryStatus {
  APPROVED = "Approved",
  RESTRICTED = "Restricted",
  PENDING = "Pending",
  BLOCKED = "Blocked",
}

export interface ModelInventorySummary {
  approved: number;
  restricted: number;
  pending: number;
  blocked: number;
  total: number;
}
