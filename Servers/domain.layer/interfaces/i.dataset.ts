import { DatasetStatus } from "../enums/dataset-status.enum";
import { DatasetType } from "../enums/dataset-type.enum";
import { DataClassification } from "../enums/data-classification.enum";

export interface IDataset {
  id?: number;
  name: string;
  description: string;
  version: string;
  owner: string;
  type: DatasetType;
  function: string;
  source: string;
  license?: string;
  format?: string;
  classification: DataClassification;
  contains_pii: boolean;
  pii_types?: string;
  status: DatasetStatus;
  status_date: Date;
  known_biases?: string;
  bias_mitigation?: string;
  collection_method?: string;
  preprocessing_steps?: string;
  documentation_data?: DocumentationFile[];
  is_demo?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface DocumentationFile {
  id: number;
  filename: string;
  size: number;
  mimetype: string;
  upload_date: string;
  uploaded_by: number;
}

export interface IDatasetModelInventory {
  id?: number;
  dataset_id: number;
  model_inventory_id: number;
  relationship_type: string;
  created_at?: Date;
}

export interface IDatasetProject {
  id?: number;
  dataset_id: number;
  project_id: number;
  created_at?: Date;
}

export interface IDatasetChangeHistory {
  id?: number;
  dataset_id: number;
  action: "created" | "updated" | "deleted";
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_by_user_id?: number;
  changed_at?: Date;
}
