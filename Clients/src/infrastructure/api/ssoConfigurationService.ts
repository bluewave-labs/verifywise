import CustomAxios from "./customAxios";

// Types for SSO Configuration API
export interface SSOConfiguration {
  azure_tenant_id: string;
  azure_client_id: string;
  azure_client_secret: string;
  cloud_environment: 'AzurePublic' | 'AzureGovernment';
  is_enabled: boolean;
  auth_method_policy: 'sso_only' | 'password_only' | 'both';
  created_at?: string;
  updated_at?: string;
}

export interface SSOConfigurationResponse {
  success: boolean;
  data: {
    exists: boolean;
    azure_tenant_id?: string;
    azure_client_id?: string;
    cloud_environment?: 'AzurePublic' | 'AzureGovernment';
    is_enabled?: boolean;
    auth_method_policy?: 'sso_only' | 'password_only' | 'both';
    created_at?: string;
    updated_at?: string;
  };
}

export interface CreateUpdateSSOConfigurationPayload {
  azure_tenant_id: string;
  azure_client_id: string;
  azure_client_secret: string;
  cloud_environment: 'AzurePublic' | 'AzureGovernment';
  auth_method_policy: 'sso_only' | 'password_only' | 'both';
}

export interface CreateUpdateSSOConfigurationResponse {
  success: boolean;
  message: string;
  data: {
    azure_tenant_id: string;
    azure_client_id: string;
    cloud_environment: 'AzurePublic' | 'AzureGovernment';
    is_enabled: boolean;
    auth_method_policy: 'sso_only' | 'password_only' | 'both';
  };
}

export interface SSOToggleResponse {
  success: boolean;
  message: string;
  data: {
    is_enabled: boolean;
    azure_tenant_id?: string;
    cloud_environment?: 'AzurePublic' | 'AzureGovernment';
  };
}

export interface APIError {
  success: false;
  error: string;
}

/**
 * SSO Configuration Service
 * Handles all API calls related to SSO configuration management
 */
export const ssoConfigurationService = {
  /**
   * Get SSO configuration for the current organization
   */
  async getSSOConfiguration(organizationId: string): Promise<SSOConfigurationResponse> {
    const response = await CustomAxios.get(`/sso-configuration/${organizationId}`);
    return response.data;
  },

  /**
   * Create or update SSO configuration for the current organization
   */
  async createOrUpdateSSOConfiguration(
    organizationId: string,
    payload: CreateUpdateSSOConfigurationPayload
  ): Promise<CreateUpdateSSOConfigurationResponse> {
    const response = await CustomAxios.post(`/sso-configuration/${organizationId}`, payload);
    return response.data;
  },

  /**
   * Delete SSO configuration for the current organization
   */
  async deleteSSOConfiguration(organizationId: string): Promise<{ success: boolean; message: string }> {
    const response = await CustomAxios.delete(`/sso-configuration/${organizationId}`);
    return response.data;
  },

  /**
   * Enable SSO for the current organization
   */
  async enableSSO(organizationId: string): Promise<SSOToggleResponse> {
    const response = await CustomAxios.post(`/sso-configuration/${organizationId}/enable`);
    return response.data;
  },

  /**
   * Disable SSO for the current organization
   */
  async disableSSO(organizationId: string): Promise<SSOToggleResponse> {
    const response = await CustomAxios.post(`/sso-configuration/${organizationId}/disable`);
    return response.data;
  },

};