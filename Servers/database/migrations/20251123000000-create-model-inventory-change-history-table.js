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

        // Create change history table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".model_inventory_change_history (
            id SERIAL PRIMARY KEY,
            model_inventory_id INTEGER NOT NULL REFERENCES "${tenantHash}".model_inventories(id) ON DELETE CASCADE,
            action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
            field_name VARCHAR(255),
            old_value TEXT,
            new_value TEXT,
            changed_by_user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `, { transaction });

        // Create index on model_inventory_id for faster lookups
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_model_inventory_change_history_model_id
          ON "${tenantHash}".model_inventory_change_history(model_inventory_id);
        `, { transaction });

        // Create index on changed_at for time-based queries
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_model_inventory_change_history_changed_at
          ON "${tenantHash}".model_inventory_change_history(changed_at DESC);
        `, { transaction });

        // Create composite index for model_inventory_id + changed_at (most common query pattern)
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_model_inventory_change_history_model_changed
          ON "${tenantHash}".model_inventory_change_history(model_inventory_id, changed_at DESC);
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
          DROP TABLE IF EXISTS "${tenantHash}".model_inventory_change_history;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
