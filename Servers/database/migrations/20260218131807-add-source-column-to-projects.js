"use strict";

/**
 * Migration: Add _source column to projects table
 *
 * This column allows plugins to identify projects they created.
 * For example, jira-assets plugin sets _source = 'jira-assets' for imported use-cases.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get all tenant schemas
    const [schemas] = await queryInterface.sequelize.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name LIKE 'tenant_%'
    `);

    // Add _source column to each tenant's projects table
    for (const { schema_name } of schemas) {
      await queryInterface.sequelize.query(`
        ALTER TABLE "${schema_name}".projects
        ADD COLUMN IF NOT EXISTS _source VARCHAR(100)
      `);
    }
  },

  async down(queryInterface, Sequelize) {
    // Get all tenant schemas
    const [schemas] = await queryInterface.sequelize.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name LIKE 'tenant_%'
    `);

    // Remove _source column from each tenant's projects table
    for (const { schema_name } of schemas) {
      await queryInterface.sequelize.query(`
        ALTER TABLE "${schema_name}".projects
        DROP COLUMN IF EXISTS _source
      `);
    }
  },
};
