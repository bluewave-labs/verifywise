'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      -- Create enum type for integration types
      DO $$ BEGIN
        CREATE TYPE integration_type AS ENUM ('confluence');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- Create enum type for connection status
      DO $$ BEGIN
        CREATE TYPE connection_status AS ENUM ('connected', 'not_connected', 'error');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create the integration_connections table in each tenant schema
    const tenantSchemas = await queryInterface.sequelize.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const tenant of tenantSchemas) {
      const schemaName = tenant.schema_name;
      
      await queryInterface.sequelize.query(`
        -- Create the integration_connections table for tenant: ${schemaName}
        CREATE TABLE IF NOT EXISTS "${schemaName}".integration_connections (
          id SERIAL PRIMARY KEY,
          integration_type integration_type NOT NULL,
          connection_name VARCHAR(255) NOT NULL,
          status connection_status NOT NULL DEFAULT 'not_connected',
          configuration JSONB,
          oauth_token TEXT,
          oauth_refresh_token TEXT,
          oauth_expires_at TIMESTAMP,
          connected_at TIMESTAMP,
          last_sync_at TIMESTAMP,
          error_message TEXT,
          created_by INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(integration_type, connection_name)
        );

        -- Create the trigger function to auto-update updated_at if it doesn't exist
        CREATE OR REPLACE FUNCTION "${schemaName}".update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Attach the trigger to the integration_connections table
        CREATE TRIGGER set_updated_at_integration_connections
        BEFORE UPDATE ON "${schemaName}".integration_connections
        FOR EACH ROW
        EXECUTE FUNCTION "${schemaName}".update_updated_at_column();

        -- Create an index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_integration_connections_type_status 
        ON "${schemaName}".integration_connections (integration_type, status);
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
        DROP TRIGGER IF EXISTS set_updated_at_integration_connections ON "${schemaName}".integration_connections;
        DROP FUNCTION IF EXISTS "${schemaName}".update_updated_at_column();
        DROP INDEX IF EXISTS "${schemaName}".idx_integration_connections_type_status;
        DROP TABLE IF EXISTS "${schemaName}".integration_connections;
      `);
    }

    // Drop the enum types
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS connection_status;
      DROP TYPE IF EXISTS integration_type;
    `);
  }
};