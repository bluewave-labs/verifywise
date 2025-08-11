export interface IModelInventory {
  id?: number;
  provider_model: string;
  version?: string;
  approver: string;
  capabilities: string[];
  security_assessment: boolean;
  status: ModelInventoryStatus;
  status_date: Date;
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
