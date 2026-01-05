'use strict';

/**
 * Migration: Create workspaces table
 *
 * Creates the workspaces table for multi-tenant workspace architecture.
 * Each workspace represents an isolated environment within an organization
 * with its own database schema and optional OIDC configuration.
 *
 * Key columns:
 * - id: Primary key
 * - org_id: Foreign key to organizations
 * - name: Display name
 * - slug: URL-friendly identifier (unique)
 * - schema_name: PostgreSQL schema name (unique)
 * - oidc_enabled: Whether OIDC SSO is enabled
 * - oidc_issuer: OIDC provider URL
 * - oidc_client_id: OIDC client identifier
 * - oidc_client_secret_encrypted: Encrypted OIDC client secret
 * - is_active: Soft delete / deactivation flag
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      -- Create the workspaces table
      CREATE TABLE IF NOT EXISTS workspaces (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(63) NOT NULL,
        schema_name VARCHAR(63) NOT NULL,
        oidc_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        oidc_issuer VARCHAR(512),
        oidc_client_id VARCHAR(255),
        oidc_client_secret_encrypted TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        -- Unique constraints
        CONSTRAINT workspaces_slug_unique UNIQUE (slug),
        CONSTRAINT workspaces_schema_name_unique UNIQUE (schema_name),
        
        -- Slug format validation: lowercase alphanumeric with hyphens, no leading/trailing hyphens
        CONSTRAINT workspaces_slug_format CHECK (
          slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND
          LENGTH(slug) >= 2 AND
          LENGTH(slug) <= 63
        ),
        
        -- Schema name format validation: PostgreSQL identifier format
        CONSTRAINT workspaces_schema_name_format CHECK (
          schema_name ~ '^[a-z_][a-z0-9_]*$' AND
          LENGTH(schema_name) <= 63
        ),
        
        -- OIDC configuration validation: if enabled, issuer and client_id are required
        CONSTRAINT workspaces_oidc_config CHECK (
          (oidc_enabled = FALSE) OR
          (oidc_enabled = TRUE AND oidc_issuer IS NOT NULL AND oidc_client_id IS NOT NULL)
        )
      );

      -- Create indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_workspaces_org_id ON workspaces(org_id);
      CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
      CREATE INDEX IF NOT EXISTS idx_workspaces_schema_name ON workspaces(schema_name);
      CREATE INDEX IF NOT EXISTS idx_workspaces_is_active ON workspaces(is_active);
      CREATE INDEX IF NOT EXISTS idx_workspaces_org_active ON workspaces(org_id, is_active);

      -- Create trigger for auto-updating updated_at
      CREATE OR REPLACE FUNCTION update_workspaces_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS set_workspaces_updated_at ON workspaces;
      CREATE TRIGGER set_workspaces_updated_at
      BEFORE UPDATE ON workspaces
      FOR EACH ROW
      EXECUTE FUNCTION update_workspaces_updated_at();

      -- Add comment for documentation
      COMMENT ON TABLE workspaces IS 'Multi-tenant workspaces within organizations with optional OIDC SSO configuration';
      COMMENT ON COLUMN workspaces.slug IS 'URL-friendly identifier (lowercase alphanumeric with hyphens)';
      COMMENT ON COLUMN workspaces.schema_name IS 'PostgreSQL schema name for tenant data isolation';
      COMMENT ON COLUMN workspaces.oidc_enabled IS 'Whether OIDC Single Sign-On is enabled for this workspace';
      COMMENT ON COLUMN workspaces.oidc_client_secret_encrypted IS 'Encrypted OIDC client secret - never store in plaintext';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      -- Drop trigger first
      DROP TRIGGER IF EXISTS set_workspaces_updated_at ON workspaces;
      DROP FUNCTION IF EXISTS update_workspaces_updated_at();
      
      -- Drop indexes
      DROP INDEX IF EXISTS idx_workspaces_org_active;
      DROP INDEX IF EXISTS idx_workspaces_is_active;
      DROP INDEX IF EXISTS idx_workspaces_schema_name;
      DROP INDEX IF EXISTS idx_workspaces_slug;
      DROP INDEX IF EXISTS idx_workspaces_org_id;
      
      -- Drop table
      DROP TABLE IF EXISTS workspaces;
    `);
  }
};
