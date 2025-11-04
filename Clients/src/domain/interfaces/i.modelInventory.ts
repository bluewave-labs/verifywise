import { ModelInventoryStatus } from "../enums/modelInventory.enum";

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
  projects: number[];
  frameworks: number[];
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
