export type SSOProvider = "AzureAD";

export interface ISSOConfiguration {
  id?: number;
  organization_id: number;
  provider: SSOProvider;
  is_enabled: boolean;
  config_data: object;
  created_at?: Date;
  updated_at?: Date;
}