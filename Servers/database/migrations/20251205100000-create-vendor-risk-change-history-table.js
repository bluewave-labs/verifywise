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
        console.log('Organizations table does not exist yet. Skipping vendor risk change history table creation.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Create change history table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".vendor_risk_change_history (
            id SERIAL PRIMARY KEY,
            vendor_risk_id INTEGER NOT NULL REFERENCES "${tenantHash}".vendorrisks(id) ON DELETE CASCADE,
            action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
            field_name VARCHAR(255),
            old_value TEXT,
            new_value TEXT,
            changed_by_user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `, { transaction });

        // Create index on vendor_risk_id for faster lookups
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_vendor_risk_change_history_vendor_risk_id
          ON "${tenantHash}".vendor_risk_change_history(vendor_risk_id);
        `, { transaction });

        // Create index on changed_at for time-based queries
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_vendor_risk_change_history_changed_at
          ON "${tenantHash}".vendor_risk_change_history(changed_at DESC);
        `, { transaction });

        // Create composite index for vendor_risk_id + changed_at (most common query pattern)
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_vendor_risk_change_history_risk_changed
          ON "${tenantHash}".vendor_risk_change_history(vendor_risk_id, changed_at DESC);
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

      // If organizations table doesn't exist, skip migration
      if (!tableExists[0].exists) {
        console.log('Organizations table does not exist yet. Skipping vendor risk change history table rollback.');
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
          DROP TABLE IF EXISTS "${tenantHash}".vendor_risk_change_history;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
