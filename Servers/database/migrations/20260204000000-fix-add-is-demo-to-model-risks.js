"use strict";

/**
 * Migration: Fix missing is_demo column on model_risks table
 *
 * The previous migration 20260113000000-add-is-demo-to-remaining-tables.js
 * is recorded as applied in sequelize_meta but the is_demo column was not
 * actually added to model_risks. This migration adds it if missing.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all tenant schemas (excluding system schemas)
    const schemas = await queryInterface.sequelize.query(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
       AND schema_name NOT LIKE 'pg_%'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const { schema_name } of schemas) {
      try {
        // Check if the table exists in this schema
        const [tableExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${schema_name}'
            AND table_name = 'model_risks'
          )`,
          { type: Sequelize.QueryTypes.SELECT }
        );

        if (!tableExists.exists) {
          console.log(
            `Table ${schema_name}.model_risks does not exist, skipping...`
          );
          continue;
        }

        // Check if column already exists
        const [columns] = await queryInterface.sequelize.query(
          `SELECT column_name FROM information_schema.columns
           WHERE table_schema = '${schema_name}'
           AND table_name = 'model_risks'
           AND column_name = 'is_demo'`,
          { type: Sequelize.QueryTypes.SELECT }
        );

        if (columns) {
          console.log(
            `Column is_demo already exists in ${schema_name}.model_risks, skipping...`
          );
          continue;
        }

        // Add the is_demo column
        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema_name}"."model_risks"
           ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false`
        );

        console.log(
          `Added is_demo column to ${schema_name}.model_risks`
        );
      } catch (error) {
        console.error(
          `Error processing ${schema_name}.model_risks:`,
          error.message
        );
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Get all tenant schemas
    const schemas = await queryInterface.sequelize.query(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
       AND schema_name NOT LIKE 'pg_%'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const { schema_name } of schemas) {
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema_name}"."model_risks"
           DROP COLUMN IF EXISTS is_demo`
        );
        console.log(
          `Removed is_demo column from ${schema_name}.model_risks`
        );
      } catch (error) {
        console.error(
          `Error removing column from ${schema_name}.model_risks:`,
          error.message
        );
      }
    }
  },
};
