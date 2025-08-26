'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all tenant schemas
    const tenantSchemas = await queryInterface.sequelize.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const tenant of tenantSchemas) {
      const schemaName = tenant.schema_name;
      
      await queryInterface.sequelize.query(`
        -- Add settings column to integration_connections table for tenant: ${schemaName}
        ALTER TABLE "${schemaName}".integration_connections 
        ADD COLUMN IF NOT EXISTS settings JSONB;
        
        -- Add comment for settings column
        COMMENT ON COLUMN "${schemaName}".integration_connections.settings 
        IS 'UI-configurable settings (OAuth credentials, endpoints, etc.)';
      `);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Get all tenant schemas
    const tenantSchemas = await queryInterface.sequelize.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const tenant of tenantSchemas) {
      const schemaName = tenant.schema_name;
      
      await queryInterface.sequelize.query(`
        -- Remove settings column from integration_connections table for tenant: ${schemaName}
        ALTER TABLE "${schemaName}".integration_connections 
        DROP COLUMN IF EXISTS settings;
      `);
    }
  }
};