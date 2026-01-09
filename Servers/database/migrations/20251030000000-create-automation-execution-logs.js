'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(`
          CREATE TABLE "${tenantHash}".automation_execution_logs (
            id SERIAL PRIMARY KEY,
            automation_id INTEGER REFERENCES "${tenantHash}".automations(id) ON DELETE CASCADE,
            triggered_at TIMESTAMP DEFAULT NOW(),
            trigger_data JSONB DEFAULT '{}',
            action_results JSONB DEFAULT '[]',
            status TEXT CHECK (status IN ('success', 'partial_success', 'failure')) DEFAULT 'success',
            error_message TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `, { transaction });

        // Create index on automation_id for faster lookups
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_automation_execution_logs_automation_id
          ON "${tenantHash}".automation_execution_logs(automation_id);
        `, { transaction });

        // Create index on triggered_at for sorting
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_automation_execution_logs_triggered_at
          ON "${tenantHash}".automation_execution_logs(triggered_at DESC);
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".automation_execution_logs;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
