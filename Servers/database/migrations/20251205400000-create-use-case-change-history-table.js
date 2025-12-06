'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if organizations table exists
      const tableExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'organizations'
        );`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      // If organizations table doesn't exist, skip migration
      if (!tableExists[0].exists) {
        console.log('Organizations table does not exist yet. Skipping use case change history table creation.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Check if projects table exists in this tenant schema
        const projectsTableExists = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'projects'
          );`,
          { transaction, type: Sequelize.QueryTypes.SELECT }
        );

        // If projects table doesn't exist, skip this tenant
        if (!projectsTableExists[0].exists) {
          console.log(`projects table does not exist in schema ${tenantHash}. Skipping use case change history table creation for this tenant.`);
          continue;
        }

        // Create change history table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".use_case_change_history (
            id SERIAL PRIMARY KEY,
            use_case_id INTEGER NOT NULL REFERENCES "${tenantHash}".projects(id) ON DELETE CASCADE,
            action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
            field_name VARCHAR(255),
            old_value TEXT,
            new_value TEXT,
            changed_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
            changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `, { transaction });

        // Create index on use_case_id for faster lookups
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_use_case_change_history_use_case_id
          ON "${tenantHash}".use_case_change_history(use_case_id);
        `, { transaction });

        // Create index on changed_at for time-based queries
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_use_case_change_history_changed_at
          ON "${tenantHash}".use_case_change_history(changed_at DESC);
        `, { transaction });

        // Create composite index for use_case_id + changed_at (most common query pattern)
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_use_case_change_history_use_case_changed
          ON "${tenantHash}".use_case_change_history(use_case_id, changed_at DESC);
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
      // Check if organizations table exists
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

        // Drop indexes first
        await queryInterface.sequelize.query(`
          DROP INDEX IF EXISTS "${tenantHash}".idx_use_case_change_history_use_case_changed;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP INDEX IF EXISTS "${tenantHash}".idx_use_case_change_history_changed_at;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP INDEX IF EXISTS "${tenantHash}".idx_use_case_change_history_use_case_id;
        `, { transaction });

        // Drop table
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".use_case_change_history;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
