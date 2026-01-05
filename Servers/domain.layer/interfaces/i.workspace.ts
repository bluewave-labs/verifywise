/**
 * @fileoverview Workspace Interface
 *
 * Defines the Workspace entity for multi-tenant workspace architecture.
 * Each workspace represents an isolated environment within an organization
 * with its own schema and optional OIDC configuration.
 *
 * @module domain.layer/interfaces/i.workspace
 */

export type IWorkspace = {
  id?: number;
  org_id: number;
  name: string;
  slug: string;
  schema_name: string;
  oidc_enabled?: boolean;
  oidc_issuer?: string;
  oidc_client_id?: string;
  oidc_client_secret_encrypted?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
};

/**
 * Input type for creating a new workspace
 */
export type IWorkspaceCreate = {
  org_id: number;
  name: string;
  slug: string;
  oidc_enabled?: boolean;
  oidc_issuer?: string;
  oidc_client_id?: string;
  oidc_client_secret_encrypted?: string;
};

/**
 * Input type for updating a workspace
 */
export type IWorkspaceUpdate = {
  name?: string;
  oidc_enabled?: boolean;
  oidc_issuer?: string;
  oidc_client_id?: string;
  oidc_client_secret_encrypted?: string;
  is_active?: boolean;
};

/**
 * Safe representation of workspace (without secrets)
 */
export type IWorkspaceSafe = Omit<IWorkspace, "oidc_client_secret_encrypted">;
