export interface IIntegrationConnection {
  id?: number;
  integration_type: 'confluence';
  connection_name: string;
  status: 'connected' | 'not_connected' | 'error';
  configuration?: {
    site_url?: string;
    user_id?: string;
    user_email?: string;
    scopes?: string[];
    [key: string]: any;
  };
  settings?: {
    oauth_client_id?: string;
    oauth_client_secret?: string;
    oauth_redirect_uri?: string;
    oauth_scopes?: string;
    custom_endpoints?: {
      auth_url?: string;
      token_url?: string;
      api_base_url?: string;
    };
    [key: string]: any;
  };
  oauth_token?: string;
  oauth_refresh_token?: string;
  oauth_expires_at?: Date;
  connected_at?: Date;
  last_sync_at?: Date;
  error_message?: string;
  created_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IIntegrationOverview {
  integration_type: 'confluence';
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'not_connected' | 'error';
  connection?: IIntegrationConnection;
}