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
  security_assessment_data: Filedata[],
  is_demo?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface Filedata {
  id: number;
  filename: string;
  size: number;
  mimetype: string;
  upload_date: string;
  uploaded_by: number;
}
