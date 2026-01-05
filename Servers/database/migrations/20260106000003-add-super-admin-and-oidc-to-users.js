'use strict';

/**
 * Migration: Add super admin and OIDC fields to users table
 *
 * Adds the following columns to the users table:
 * - is_super_admin: Boolean flag for platform-wide administrative privileges
 * - oidc_subject: OIDC subject identifier for SSO user tracking and audit
 * - oidc_issuer: OIDC issuer URL for SSO user tracking and audit
 *
 * Also adds indexes for efficient querying of OIDC users.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      -- Add is_super_admin column
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

      -- Add OIDC subject column for SSO user tracking
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS oidc_subject VARCHAR(255);

      -- Add OIDC issuer column for SSO user tracking  
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS oidc_issuer VARCHAR(512);

      -- Create index for super admin lookups
      CREATE INDEX IF NOT EXISTS idx_users_is_super_admin 
        ON users(is_super_admin) 
        WHERE is_super_admin = TRUE;

      -- Create composite index for OIDC user lookups (for SSO login)
      CREATE INDEX IF NOT EXISTS idx_users_oidc_identity 
        ON users(oidc_issuer, oidc_subject) 
        WHERE oidc_subject IS NOT NULL AND oidc_issuer IS NOT NULL;

      -- Create index on oidc_issuer for queries filtering by identity provider
      CREATE INDEX IF NOT EXISTS idx_users_oidc_issuer 
        ON users(oidc_issuer) 
        WHERE oidc_issuer IS NOT NULL;

      -- Add comments for documentation
      COMMENT ON COLUMN users.is_super_admin IS 'Platform-wide super admin flag - grants access to all organizations and workspaces';
      COMMENT ON COLUMN users.oidc_subject IS 'OIDC subject identifier from external identity provider for SSO and audit logging';
      COMMENT ON COLUMN users.oidc_issuer IS 'OIDC issuer URL from external identity provider for SSO and audit logging';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      -- Drop indexes first
      DROP INDEX IF EXISTS idx_users_oidc_issuer;
      DROP INDEX IF EXISTS idx_users_oidc_identity;
      DROP INDEX IF EXISTS idx_users_is_super_admin;

      -- Remove OIDC issuer column
      ALTER TABLE users DROP COLUMN IF EXISTS oidc_issuer;

      -- Remove OIDC subject column
      ALTER TABLE users DROP COLUMN IF EXISTS oidc_subject;

      -- Remove is_super_admin column
      ALTER TABLE users DROP COLUMN IF EXISTS is_super_admin;
    `);
  }
};
