'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration: Fix approval workflow CHECK constraints
 *
 * The CHECK constraints on status columns in approval workflow tables
 * may have been created with incorrect values (lowercase vs proper case).
 * This migration drops and recreates the constraints with the correct values.
 *
 * Affected tables:
 * - approval_requests.status: 'Pending', 'Approved', 'Rejected', 'Withdrawn'
 * - approval_request_steps.status: 'Pending', 'Completed', 'Rejected'
 * - approval_request_step_approvals.approval_result: 'Pending', 'Approved', 'Rejected'
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
        console.log('Organizations table does not exist yet. Skipping.');
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

        console.log(`Fixing CHECK constraints in ${schema_name}...`);

        // ========================================
        // Fix 1: approval_requests.status
        // ========================================

        // Update any existing lowercase values to proper case
        await queryInterface.sequelize.query(
          `UPDATE "${schema_name}".approval_requests
           SET status = INITCAP(status)
           WHERE LOWER(status) IN ('pending', 'approved', 'rejected', 'withdrawn')`,
          { transaction }
        );

        // Find and drop all CHECK constraints on status column
        const statusConstraints = await queryInterface.sequelize.query(
          `SELECT con.conname as constraint_name
           FROM pg_catalog.pg_constraint con
           INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
           INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = rel.relnamespace
           WHERE nsp.nspname = '${schema_name}'
             AND rel.relname = 'approval_requests'
             AND con.contype = 'c'
             AND pg_get_constraintdef(con.oid) LIKE '%status%'`,
          { transaction, type: Sequelize.QueryTypes.SELECT }
        );

        for (const constraint of statusConstraints) {
          console.log(`  Dropping constraint ${constraint.constraint_name} from ${schema_name}.approval_requests`);
          await queryInterface.sequelize.query(
            `ALTER TABLE "${schema_name}"."approval_requests" DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}"`,
            { transaction }
          );
        }

        // Recreate with correct values
        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema_name}".approval_requests
           ADD CONSTRAINT approval_requests_status_check
           CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Withdrawn'))`,
          { transaction }
        );

        // ========================================
        // Fix 2: approval_request_steps.status
        // ========================================

        // Update any existing lowercase values to proper case
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

        // Find and drop all CHECK constraints on status column
        const stepsStatusConstraints = await queryInterface.sequelize.query(
          `SELECT con.conname as constraint_name
           FROM pg_catalog.pg_constraint con
           INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
           INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = rel.relnamespace
           WHERE nsp.nspname = '${schema_name}'
             AND rel.relname = 'approval_request_steps'
             AND con.contype = 'c'
             AND pg_get_constraintdef(con.oid) LIKE '%status%'`,
          { transaction, type: Sequelize.QueryTypes.SELECT }
        );

        for (const constraint of stepsStatusConstraints) {
          console.log(`  Dropping constraint ${constraint.constraint_name} from ${schema_name}.approval_request_steps`);
          await queryInterface.sequelize.query(
            `ALTER TABLE "${schema_name}"."approval_request_steps" DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}"`,
            { transaction }
          );
        }

        // Recreate with correct values
        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema_name}".approval_request_steps
           ADD CONSTRAINT approval_request_steps_status_check
           CHECK (status IN ('Pending', 'Completed', 'Rejected'))`,
          { transaction }
        );

        // ========================================
        // Fix 3: approval_request_step_approvals.approval_result
        // ========================================

        // Update any existing lowercase values to proper case
        await queryInterface.sequelize.query(
          `UPDATE "${schema_name}".approval_request_step_approvals
           SET approval_result = INITCAP(approval_result)
           WHERE LOWER(approval_result) IN ('pending', 'approved', 'rejected')`,
          { transaction }
        );

        // Find and drop all CHECK constraints on approval_result column
        const approvalResultConstraints = await queryInterface.sequelize.query(
          `SELECT con.conname as constraint_name
           FROM pg_catalog.pg_constraint con
           INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
           INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = rel.relnamespace
           WHERE nsp.nspname = '${schema_name}'
             AND rel.relname = 'approval_request_step_approvals'
             AND con.contype = 'c'
             AND pg_get_constraintdef(con.oid) LIKE '%approval_result%'`,
          { transaction, type: Sequelize.QueryTypes.SELECT }
        );

        for (const constraint of approvalResultConstraints) {
          console.log(`  Dropping constraint ${constraint.constraint_name} from ${schema_name}.approval_request_step_approvals`);
          await queryInterface.sequelize.query(
            `ALTER TABLE "${schema_name}"."approval_request_step_approvals" DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}"`,
            { transaction }
          );
        }

        // Recreate with correct values
        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema_name}".approval_request_step_approvals
           ADD CONSTRAINT approval_request_step_approvals_approval_result_check
           CHECK (approval_result IN ('Pending', 'Approved', 'Rejected'))`,
          { transaction }
        );

        console.log(`Fixed CHECK constraints in ${schema_name}`);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down() {
    // This migration fixes constraints - no rollback needed
    // Rolling back would reintroduce the bugs
    console.log('Rollback not supported for constraint fix migration');
  }
};
