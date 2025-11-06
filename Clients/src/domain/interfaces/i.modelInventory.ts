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
  // New field for file uploads
  security_assessment_data?: FileResponse[]; // optional array to store multiple files
}

export interface FileResponse {
    id: number;
    filename: string;
    size: number;
    mimetype: string;
    upload_date: string;
    uploaded_by: number;
    modelId?: string; // optional
}

export interface ModelInventorySummary {
  approved: number;
  restricted: number;
  pending: number;
  blocked: number;
  total: number;
}
