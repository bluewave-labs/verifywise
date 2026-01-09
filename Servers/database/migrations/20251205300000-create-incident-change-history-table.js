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
        console.log('Organizations table does not exist yet. Skipping incident change history table creation.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Check if ai_incident_managements table exists in this tenant schema
        const incidentTableExists = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'ai_incident_managements'
          );`,
          { transaction, type: Sequelize.QueryTypes.SELECT }
        );

        // If ai_incident_managements table doesn't exist, skip this tenant
        if (!incidentTableExists[0].exists) {
          console.log(`ai_incident_managements table does not exist in schema ${tenantHash}. Skipping incident change history table creation for this tenant.`);
          continue;
        }

        // Create change history table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".incident_change_history (
            id SERIAL PRIMARY KEY,
            incident_id INTEGER NOT NULL REFERENCES "${tenantHash}".ai_incident_managements(id) ON DELETE CASCADE,
            action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
            field_name VARCHAR(255),
            old_value TEXT,
            new_value TEXT,
            changed_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
            changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `, { transaction });

        // Create index on incident_id for faster lookups
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_incident_change_history_incident_id
          ON "${tenantHash}".incident_change_history(incident_id);
        `, { transaction });

        // Create index on changed_at for time-based queries
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_incident_change_history_changed_at
          ON "${tenantHash}".incident_change_history(changed_at DESC);
        `, { transaction });

        // Create composite index for incident_id + changed_at (most common query pattern)
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_incident_change_history_incident_changed
          ON "${tenantHash}".incident_change_history(incident_id, changed_at DESC);
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
          DROP INDEX IF EXISTS "${tenantHash}".idx_incident_change_history_incident_changed;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP INDEX IF EXISTS "${tenantHash}".idx_incident_change_history_changed_at;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP INDEX IF EXISTS "${tenantHash}".idx_incident_change_history_incident_id;
        `, { transaction });

        // Drop table
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".incident_change_history;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
