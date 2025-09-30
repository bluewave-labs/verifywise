'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      -- Add SSO fields to users table
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS sso_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS azure_ad_object_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS sso_last_login TIMESTAMP;

      -- Create index for Azure AD object ID lookups
      CREATE INDEX IF NOT EXISTS idx_users_azure_ad_object_id ON users(azure_ad_object_id);

      -- Create composite index for SSO lookups
      CREATE INDEX IF NOT EXISTS idx_users_sso_enabled_org ON users(sso_enabled, organization_id);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      -- Remove indexes
      DROP INDEX IF EXISTS idx_users_azure_ad_object_id;
      DROP INDEX IF EXISTS idx_users_sso_enabled_org;

      -- Remove SSO columns from users table
      ALTER TABLE users
      DROP COLUMN IF EXISTS sso_enabled,
      DROP COLUMN IF EXISTS azure_ad_object_id,
      DROP COLUMN IF EXISTS sso_last_login;
    `);
  }
};
