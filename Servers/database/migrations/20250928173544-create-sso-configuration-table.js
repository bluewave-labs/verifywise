'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      -- Create the sso_configurations table
      CREATE TABLE sso_configurations (
        organization_id INTEGER PRIMARY KEY,
        azure_tenant_id VARCHAR(255) NOT NULL,
        azure_client_id VARCHAR(255) NOT NULL,
        azure_client_secret TEXT NOT NULL,
        cloud_environment VARCHAR(50) DEFAULT 'AzurePublic',
        is_enabled BOOLEAN DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT cloud_env_check CHECK (cloud_environment IN ('AzurePublic', 'AzureGovernment'))
      );

      -- Create trigger to auto-update updated_at
      CREATE TRIGGER set_updated_at_sso_configurations
      BEFORE UPDATE ON sso_configurations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

      -- Create index for quick lookups
      CREATE INDEX idx_sso_config_enabled ON sso_configurations(is_enabled);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS set_updated_at_sso_configurations ON sso_configurations;
      DROP INDEX IF EXISTS idx_sso_config_enabled;
      DROP TABLE IF EXISTS sso_configurations;
    `);
  }
};