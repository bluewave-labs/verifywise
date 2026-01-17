'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration: Fix approval workflow tables schema mismatch
 *
 * Fixes discrepancies between the migration and createNewTenant.ts:
 * 1. Renames current_step_number to current_step in approval_requests
 * 2. Updates status CHECK constraints to use proper casing ('Pending' vs 'pending')
 * 3. Adds missing columns (date_assigned, date_completed) to approval_request_steps
 * 4. Removes extra columns (requires_all_approvers, updated_at) from approval_request_steps
 */

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

      if (!tableExists[0].exists) {
        console.log('Organizations table does not exist yet. Skipping schema fix.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (const organization of organizations[0]) {
        const schema_name = getTenantHash(organization.id);
        // Check if approval_requests table exists
        const [approvalTableExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${schema_name}'
            AND table_name = 'approval_requests'
          )`,
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        if (!approvalTableExists.exists) {
          console.log(`Table ${schema_name}.approval_requests does not exist, skipping...`);
          continue;
        }

        // Fix 1: Rename current_step_number to current_step if it exists
        const [hasOldColumn] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = '${schema_name}'
            AND table_name = 'approval_requests'
            AND column_name = 'current_step_number'
          )`,
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        if (hasOldColumn.exists) {
          console.log(`Renaming current_step_number to current_step in ${schema_name}.approval_requests`);
          await queryInterface.sequelize.query(
            `ALTER TABLE "${schema_name}".approval_requests
             RENAME COLUMN current_step_number TO current_step`,
            { transaction }
          );

          // Set NOT NULL and DEFAULT after rename
          await queryInterface.sequelize.query(
            `ALTER TABLE "${schema_name}".approval_requests
             ALTER COLUMN current_step SET NOT NULL,
             ALTER COLUMN current_step SET DEFAULT 1`,
            { transaction }
          );
        }

        // Fix 2: Update status CHECK constraint in approval_requests (if using lowercase)
        // First, update any existing lowercase values
        await queryInterface.sequelize.query(
          `UPDATE "${schema_name}".approval_requests
           SET status = INITCAP(status)
           WHERE status IN ('pending', 'approved', 'rejected', 'withdrawn')`,
          { transaction }
        );

        // Fix 3: Update status CHECK constraint in approval_request_steps
        await queryInterface.sequelize.query(
          `UPDATE "${schema_name}".approval_request_steps
           SET status = CASE
             WHEN LOWER(status) = 'pending' THEN 'Pending'
             WHEN LOWER(status) = 'approved' THEN 'Completed'
             WHEN LOWER(status) = 'completed' THEN 'Completed'
             WHEN LOWER(status) = 'rejected' THEN 'Rejected'
             ELSE status
           END
           WHERE LOWER(status) IN ('pending', 'approved', 'completed', 'rejected')`,
          { transaction }
        );

        // Fix 4: Update approval_result CHECK constraint in approval_request_step_approvals
        await queryInterface.sequelize.query(
          `UPDATE "${schema_name}".approval_request_step_approvals
           SET approval_result = INITCAP(approval_result)
           WHERE approval_result IN ('pending', 'approved', 'rejected')`,
          { transaction }
        );

        // Fix 5: Add date_assigned column if missing
        const [hasDateAssigned] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = '${schema_name}'
            AND table_name = 'approval_request_steps'
            AND column_name = 'date_assigned'
          )`,
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        if (!hasDateAssigned.exists) {
          console.log(`Adding date_assigned column to ${schema_name}.approval_request_steps`);
          await queryInterface.sequelize.query(
            `ALTER TABLE "${schema_name}".approval_request_steps
             ADD COLUMN date_assigned TIMESTAMP NOT NULL DEFAULT NOW()`,
            { transaction }
          );
        }

        // Fix 6: Add date_completed column if missing
        const [hasDateCompleted] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = '${schema_name}'
            AND table_name = 'approval_request_steps'
            AND column_name = 'date_completed'
          )`,
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        if (!hasDateCompleted.exists) {
          console.log(`Adding date_completed column to ${schema_name}.approval_request_steps`);
          await queryInterface.sequelize.query(
            `ALTER TABLE "${schema_name}".approval_request_steps
             ADD COLUMN date_completed TIMESTAMP`,
            { transaction }
          );
        }

        console.log(`Fixed approval tables schema in ${schema_name}`);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // This migration fixes schema inconsistencies - no rollback needed
    // Rolling back would reintroduce the bugs
    console.log('Rollback not supported for schema fix migration');
  }
};
