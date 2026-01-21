"use strict";

/**
 * Migration: Add is_demo column to tables that need it for demo data management
 *
 * Tables being updated:
 * - risks (tenant schema)
 * - model_risks (tenant schema)
 * - policy_manager (tenant schema)
 * - trainingregistar (tenant schema)
 * - ai_incident_managements (tenant schema)
 * - tasks (tenant schema)
 * - evidence_hub (tenant schema)
 * - vendorrisks (tenant schema)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = [
      "risks",
      "model_risks",
      "policy_manager",
      "trainingregistar",
      "ai_incident_managements",
      "tasks",
      "evidence_hub",
      "vendor_risks",
    ];

    // Get all tenant schemas (excluding system schemas)
    const schemas = await queryInterface.sequelize.query(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
       AND schema_name NOT LIKE 'pg_%'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const { schema_name } of schemas) {
      for (const table of tables) {
        try {
          // Check if the table exists in this schema
          const [tableExists] = await queryInterface.sequelize.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = '${schema_name}'
              AND table_name = '${table}'
            )`,
            { type: Sequelize.QueryTypes.SELECT }
          );

          if (!tableExists.exists) {
            console.log(
              `Table ${schema_name}.${table} does not exist, skipping...`
            );
            continue;
          }

          // Check if column already exists
          const [columns] = await queryInterface.sequelize.query(
            `SELECT column_name FROM information_schema.columns
             WHERE table_schema = '${schema_name}'
             AND table_name = '${table}'
             AND column_name = 'is_demo'`,
            { type: Sequelize.QueryTypes.SELECT }
          );

          if (columns) {
            console.log(
              `Column is_demo already exists in ${schema_name}.${table}, skipping...`
            );
            continue;
          }

          // Add the is_demo column
          await queryInterface.sequelize.query(
            `ALTER TABLE "${schema_name}"."${table}"
             ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false`
          );

          console.log(
            `Added is_demo column to ${schema_name}.${table}`
          );
        } catch (error) {
          console.error(
            `Error processing ${schema_name}.${table}:`,
            error.message
          );
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tables = [
      "risks",
      "model_risks",
      "policy_manager",
      "trainingregistar",
      "ai_incident_managements",
      "tasks",
      "evidence_hub",
      "vendor_risks",
    ];

    // Get all tenant schemas
    const schemas = await queryInterface.sequelize.query(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
       AND schema_name NOT LIKE 'pg_%'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const { schema_name } of schemas) {
      for (const table of tables) {
        try {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${schema_name}"."${table}"
             DROP COLUMN IF EXISTS is_demo`
          );
          console.log(
            `Removed is_demo column from ${schema_name}.${table}`
          );
        } catch (error) {
          console.error(
            `Error removing column from ${schema_name}.${table}:`,
            error.message
          );
        }
      }
    }
  },
};
