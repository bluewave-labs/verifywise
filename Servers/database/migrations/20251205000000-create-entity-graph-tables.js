"use strict";

/**
 * Migration to create Entity Graph tables in all tenant schemas
 *
 * Creates three tables for the Entity Graph feature:
 * 1. entity_graph_annotations - User-private notes on graph nodes
 * 2. entity_graph_views - User-saved filter configurations
 * 3. entity_graph_gap_rules - User-customized gap detection rules
 *
 * All tables are user-scoped (private to individual users) within tenant isolation.
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
      `[ENTITY-GRAPH-MIGRATION] Found ${tenantSchemas.length} tenant schemas`
    );

    for (const { schema_name } of tenantSchemas) {
      try {
        console.log(
          `[ENTITY-GRAPH-MIGRATION] Creating Entity Graph tables in schema: ${schema_name}`
        );

        // ============================================
        // 1. Create entity_graph_annotations table
        // ============================================
        await queryInterface.sequelize.query(
          `CREATE TABLE IF NOT EXISTS "${schema_name}".entity_graph_annotations (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            entity_type VARCHAR(50) NOT NULL,
            entity_id VARCHAR(100) NOT NULL,
            organization_id INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
            FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
          )`
        );

        // Unique constraint: one annotation per user per entity
        await queryInterface.sequelize.query(
          `CREATE UNIQUE INDEX IF NOT EXISTS idx_annotations_user_entity_${schema_name.replace(/[^a-z0-9]/g, "_")}
           ON "${schema_name}".entity_graph_annotations(user_id, entity_type, entity_id)`
        );

        // Index for fetching user's annotations
        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS idx_annotations_user_${schema_name.replace(/[^a-z0-9]/g, "_")}
           ON "${schema_name}".entity_graph_annotations(user_id, organization_id)`
        );

        console.log(
          `[ENTITY-GRAPH-MIGRATION] ✅ Created entity_graph_annotations table in schema: ${schema_name}`
        );

        // ============================================
        // 2. Create entity_graph_views table
        // ============================================
        await queryInterface.sequelize.query(
          `CREATE TABLE IF NOT EXISTS "${schema_name}".entity_graph_views (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            user_id INTEGER NOT NULL,
            organization_id INTEGER NOT NULL,
            config JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
            FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
          )`
        );

        // Index for fetching user's views
        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS idx_views_user_${schema_name.replace(/[^a-z0-9]/g, "_")}
           ON "${schema_name}".entity_graph_views(user_id, organization_id)`
        );

        console.log(
          `[ENTITY-GRAPH-MIGRATION] ✅ Created entity_graph_views table in schema: ${schema_name}`
        );

        // ============================================
        // 3. Create entity_graph_gap_rules table
        // ============================================
        await queryInterface.sequelize.query(
          `CREATE TABLE IF NOT EXISTS "${schema_name}".entity_graph_gap_rules (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL UNIQUE,
            organization_id INTEGER NOT NULL,
            rules JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
            FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
          )`
        );

        // Index for fetching by organization
        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS idx_gap_rules_org_${schema_name.replace(/[^a-z0-9]/g, "_")}
           ON "${schema_name}".entity_graph_gap_rules(organization_id)`
        );

        console.log(
          `[ENTITY-GRAPH-MIGRATION] ✅ Created entity_graph_gap_rules table in schema: ${schema_name}`
        );

        console.log(
          `[ENTITY-GRAPH-MIGRATION] ✅ Successfully created all Entity Graph tables in schema: ${schema_name}`
        );
      } catch (error) {
        console.error(
          `[ENTITY-GRAPH-MIGRATION] ⚠️  Error creating Entity Graph tables in schema ${schema_name}:`,
          error
        );
        // Don't throw - continue with other schemas
      }
    }

    if (tenantSchemas.length === 0) {
      console.log(
        `[ENTITY-GRAPH-MIGRATION] ⚠️  No tenant schemas found. Tables will be created for new tenants.`
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
      try {
        // Drop tables in reverse order
        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${schema_name}".entity_graph_gap_rules`
        );
        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${schema_name}".entity_graph_views`
        );
        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${schema_name}".entity_graph_annotations`
        );
        console.log(
          `[ENTITY-GRAPH-MIGRATION] ✅ Dropped Entity Graph tables from schema: ${schema_name}`
        );
      } catch (error) {
        console.error(
          `[ENTITY-GRAPH-MIGRATION] ⚠️  Error dropping tables in schema ${schema_name}:`,
          error
        );
      }
    }
  },
};
