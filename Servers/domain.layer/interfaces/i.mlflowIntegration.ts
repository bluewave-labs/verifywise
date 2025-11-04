export type MLFlowAuthMethod = "none" | "basic" | "token";
export type MLFlowTestStatus = "success" | "error";
export type MLFlowSyncStatus = "success" | "partial" | "error";

export interface IMLFlowIntegration {
  id?: number;
  tracking_server_url: string;
  auth_method: MLFlowAuthMethod;
  username?: string | null;
  username_iv?: string | null;
  password?: string | null;
  password_iv?: string | null;
  api_token?: string | null;
  api_token_iv?: string | null;
  verify_ssl: boolean;
  timeout: number;
  last_tested_at?: Date | null;
  last_test_status?: MLFlowTestStatus | null;
  last_test_message?: string | null;
  last_successful_test_at?: Date | null;
  last_failed_test_at?: Date | null;
  last_failed_test_message?: string | null;
  last_synced_at?: Date | null;
  last_sync_status?: MLFlowSyncStatus | null;
  last_sync_message?: string | null;
  updated_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}
