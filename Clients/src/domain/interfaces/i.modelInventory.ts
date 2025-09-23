import { ModelInventoryStatus } from "../enums/modelInventoryStatus";

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
  is_demo?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ModelInventorySummary {
  approved: number;
  restricted: number;
  pending: number;
  blocked: number;
  total: number;
}
