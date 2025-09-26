import { ModelInventoryStatus } from "../enums/model-inventory-status.enum";

export interface IModelInventory {
  id?: number;
  provider_model?: string; // Keep for backward compatibility during transition
  provider: string;
  model: string;
  version: string;
  approver: string;
  capabilities: string;
  security_assessment: boolean;
  status: ModelInventoryStatus;
  status_date: Date;
  reference_link?: string;
  biases?: string;
  limitations?: string;
  hosting_provider?: string;
  is_demo?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
