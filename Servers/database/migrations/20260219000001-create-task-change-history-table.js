'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'organizations'
        );`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      if (!tableExists[0].exists) {
        console.log('Organizations table does not exist yet. Skipping task_change_history creation.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Check if tasks table exists for this tenant before creating change history
        const [tasksTableExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'tasks'
          );`,
          { transaction, type: Sequelize.QueryTypes.SELECT }
        );

        if (!tasksTableExists.exists) {
          console.log(`Tasks table does not exist for tenant ${tenantHash}, skipping task_change_history.`);
          continue;
        }

        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".task_change_history (
            id SERIAL PRIMARY KEY,
            task_id INTEGER NOT NULL REFERENCES "${tenantHash}".tasks(id) ON DELETE CASCADE,
            action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
            field_name VARCHAR(255),
            old_value TEXT,
            new_value TEXT,
            changed_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
            changed_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_task_change_history_task_id
          ON "${tenantHash}".task_change_history(task_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_task_change_history_changed_at
          ON "${tenantHash}".task_change_history(changed_at DESC);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_task_change_history_task_changed
          ON "${tenantHash}".task_change_history(task_id, changed_at DESC);
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
      const tableExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'organizations'
        );`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      if (!tableExists[0].exists) {
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".task_change_history CASCADE;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
