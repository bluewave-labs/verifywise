'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get all schemas (tenants)
    const schemas = await queryInterface.sequelize.query(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
       AND schema_name NOT LIKE 'pg_%'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Add approval_workflow_id column to projects table in each tenant schema
    for (const { schema_name } of schemas) {
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema_name}".projects
           ADD COLUMN IF NOT EXISTS approval_workflow_id INTEGER REFERENCES "${schema_name}".approval_workflows(id) ON DELETE SET NULL`
        );
        console.log(`Added approval_workflow_id column to ${schema_name}.projects`);
      } catch (error) {
        console.error(`Error adding approval_workflow_id to ${schema_name}.projects:`, error.message);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Get all schemas (tenants)
    const schemas = await queryInterface.sequelize.query(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
       AND schema_name NOT LIKE 'pg_%'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Remove approval_workflow_id column from projects table in each tenant schema
    for (const { schema_name } of schemas) {
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema_name}".projects
           DROP COLUMN IF EXISTS approval_workflow_id`
        );
        console.log(`Removed approval_workflow_id column from ${schema_name}.projects`);
      } catch (error) {
        console.error(`Error removing approval_workflow_id from ${schema_name}.projects:`, error.message);
      }
    }
  }
};
