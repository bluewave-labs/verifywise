"use strict";

/**
 * Migration to create notes table in all tenant schemas
 *
 * Creates the notes table for the collaborative annotation system
 * in all existing tenant schemas.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all tenant schemas
    const tenantSchemas = await queryInterface.sequelize.query(
      `SELECT schema_name
       FROM information_schema.schemata
       WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
       AND schema_name NOT LIKE 'pg_%'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    console.log(
      `[NOTES-MIGRATION] Found ${tenantSchemas.length} tenant schemas`
    );

    for (const { schema_name } of tenantSchemas) {
      try {
        console.log(
          `[NOTES-MIGRATION] Creating notes table in schema: ${schema_name}`
        );

        // Create notes table in tenant schema
        await queryInterface.sequelize.query(
          `CREATE TABLE IF NOT EXISTS "${schema_name}".notes (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            author_id INTEGER NOT NULL,
            attached_to VARCHAR(50) NOT NULL,
            attached_to_id VARCHAR(255) NOT NULL,
            organization_id INTEGER NOT NULL,
            is_edited BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE,
            FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
          )`
        );

        // Create indexes for performance
        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS idx_notes_entity_${schema_name.replace(/[^a-z0-9]/g, "_")}
           ON "${schema_name}".notes(attached_to, attached_to_id, organization_id)`
        );

        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS idx_notes_author_${schema_name.replace(/[^a-z0-9]/g, "_")}
           ON "${schema_name}".notes(author_id)`
        );

        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS idx_notes_organization_${schema_name.replace(/[^a-z0-9]/g, "_")}
           ON "${schema_name}".notes(organization_id)`
        );

        console.log(
          `[NOTES-MIGRATION] ✅ Successfully created notes table and indexes in schema: ${schema_name}`
        );
      } catch (error) {
        console.error(
          `[NOTES-MIGRATION] ⚠️  Error creating notes table in schema ${schema_name}:`,
          error
        );
        // Don't throw - continue with other schemas
      }
    }

    if (tenantSchemas.length === 0) {
      console.log(
        `[NOTES-MIGRATION] ⚠️  No tenant schemas found. Notes table will be created for new tenants.`
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Get all tenant schemas
    const tenantSchemas = await queryInterface.sequelize.query(
      `SELECT schema_name
       FROM information_schema.schemata
       WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
       AND schema_name NOT LIKE 'pg_%'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const { schema_name } of tenantSchemas) {
      // Drop notes table from tenant schema
      await queryInterface.sequelize.query(
        `DROP TABLE IF EXISTS "${schema_name}".notes`
      );
    }
  },
};
