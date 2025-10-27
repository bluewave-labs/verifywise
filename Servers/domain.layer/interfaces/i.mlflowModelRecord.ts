export interface IMLFlowModelRecord {
  id?: number;
  organization_id: number;
  model_name: string;
  version: string;
  lifecycle_stage?: string | null;
  run_id?: string | null;
  description?: string | null;
  source?: string | null;
  status?: string | null;
  tags?: Record<string, string>;
  metrics?: Record<string, number>;
  parameters?: Record<string, string>;
  experiment_id?: string | null;
  experiment_name?: string | null;
  artifact_location?: string | null;
  training_status?: string | null;
  training_started_at?: Date | null;
  training_ended_at?: Date | null;
  source_version?: string | null;
  model_created_at?: Date | null;
  model_updated_at?: Date | null;
  last_synced_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}
