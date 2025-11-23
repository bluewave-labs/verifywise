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
        console.log('Organizations table does not exist yet. Skipping CE marking constraints update.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      for (let organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Remove the intended_purpose column (no longer needed - uses project description)
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".ce_markings DROP COLUMN IF EXISTS intended_purpose;`,
          { transaction }
        );

        // Add foreign key constraint for project_id
        // First check if the constraint already exists to make this migration idempotent
        const constraintCheck = await queryInterface.sequelize.query(
          `SELECT constraint_name
           FROM information_schema.table_constraints
           WHERE table_schema = '${tenantHash}'
           AND table_name = 'ce_markings'
           AND constraint_name = 'ce_markings_project_id_fkey';`,
          { transaction, type: Sequelize.QueryTypes.SELECT }
        );

        if (constraintCheck.length === 0) {
          // Add foreign key constraint with CASCADE delete
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".ce_markings
             ADD CONSTRAINT ce_markings_project_id_fkey
             FOREIGN KEY (project_id)
             REFERENCES "${tenantHash}".projects(id)
             ON DELETE CASCADE;`,
            { transaction }
          );
        }
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
        console.log('Organizations table does not exist yet. Skipping CE marking constraints rollback.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      for (let organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Remove the foreign key constraint
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".ce_markings
           DROP CONSTRAINT IF EXISTS ce_markings_project_id_fkey;`,
          { transaction }
        );

        // Add back the intended_purpose column
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".ce_markings
           ADD COLUMN IF NOT EXISTS intended_purpose TEXT;`,
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
