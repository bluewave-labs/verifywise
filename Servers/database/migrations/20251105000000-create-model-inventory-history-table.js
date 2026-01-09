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
          CREATE TABLE "${tenantHash}".model_inventory_history (
            id SERIAL PRIMARY KEY,
            parameter VARCHAR(255) NOT NULL,
            snapshot_data JSONB NOT NULL DEFAULT '{}',
            recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
            triggered_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `, { transaction });

        // Create index on parameter for faster filtering
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_model_inventory_history_parameter
          ON "${tenantHash}".model_inventory_history(parameter);
        `, { transaction });

        // Create index on recorded_at for time-based queries
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_model_inventory_history_recorded_at
          ON "${tenantHash}".model_inventory_history(recorded_at DESC);
        `, { transaction });

        // Create composite index for parameter + recorded_at queries (most common use case)
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_model_inventory_history_param_recorded
          ON "${tenantHash}".model_inventory_history(parameter, recorded_at DESC);
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
          DROP TABLE IF EXISTS "${tenantHash}".model_inventory_history;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
