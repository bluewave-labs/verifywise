'use strict';

/**
 * Migration to add approval workflow support for files.
 *
 * Changes:
 * 1. Adds approval_workflow_id column to files table (nullable FK to approval_workflows)
 * 2. Updates entity_type CHECK constraint on approval_workflows to include 'file'
 *
 * When a file is uploaded with an approval workflow:
 * - review_status is set to 'pending_review'
 * - An approval request is created
 * - When approved, review_status changes to 'approved'
 * - When rejected, review_status changes to 'rejected'
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Check if files table exists
        const [tableExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = :schema
            AND table_name = 'files'
          );`,
          {
            transaction,
            replacements: { schema: tenantHash }
          }
        );

        if (!tableExists[0].exists) {
          console.log(`Skipping tenant ${tenantHash}: files table does not exist`);
          continue;
        }

        // 1. Add approval_workflow_id column to files table
        const [columnExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = :schema
            AND table_name = 'files'
            AND column_name = 'approval_workflow_id'
          );`,
          {
            transaction,
            replacements: { schema: tenantHash }
          }
        );

        if (!columnExists[0].exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files
             ADD COLUMN approval_workflow_id INTEGER
             REFERENCES "${tenantHash}".approval_workflows(id) ON DELETE SET NULL;`,
            { transaction }
          );
          console.log(`Added approval_workflow_id column to ${tenantHash}.files`);

          // Create index for better query performance
          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_files_approval_workflow_id
             ON "${tenantHash}".files(approval_workflow_id);`,
            { transaction }
          );
          console.log(`Created index for approval_workflow_id on ${tenantHash}.files`);
        }

        // 2. Update entity_type CHECK constraint on approval_workflows table
        // First, check if the constraint exists and what values it allows
        const [constraintExists] = await queryInterface.sequelize.query(
          `SELECT conname, pg_get_constraintdef(oid) as definition
           FROM pg_constraint
           WHERE conrelid = '"${tenantHash}".approval_workflows'::regclass
           AND conname LIKE '%entity_type%';`,
          { transaction }
        );

        if (constraintExists.length > 0) {
          const currentDef = constraintExists[0].definition || '';

          // Only update if 'file' is not already in the constraint
          if (!currentDef.includes("'file'")) {
            // Drop the old constraint
            await queryInterface.sequelize.query(
              `ALTER TABLE "${tenantHash}".approval_workflows
               DROP CONSTRAINT IF EXISTS approval_workflows_entity_type_check;`,
              { transaction }
            );

            // Add updated constraint with 'file' included
            await queryInterface.sequelize.query(
              `ALTER TABLE "${tenantHash}".approval_workflows
               ADD CONSTRAINT approval_workflows_entity_type_check
               CHECK (entity_type IN ('use_case', 'project', 'file'));`,
              { transaction }
            );
            console.log(`Updated entity_type constraint for ${tenantHash}.approval_workflows`);
          }
        } else {
          // If no constraint exists, create one
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".approval_workflows
             ADD CONSTRAINT approval_workflows_entity_type_check
             CHECK (entity_type IN ('use_case', 'project', 'file'));`,
            { transaction }
          );
          console.log(`Created entity_type constraint for ${tenantHash}.approval_workflows`);
        }
      }

      await transaction.commit();
      console.log('Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Drop index first
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${tenantHash}".idx_files_approval_workflow_id;`,
          { transaction }
        );

        // Drop approval_workflow_id column from files
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".files
           DROP COLUMN IF EXISTS approval_workflow_id;`,
          { transaction }
        );

        // Revert entity_type constraint to original (without 'file')
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".approval_workflows
           DROP CONSTRAINT IF EXISTS approval_workflows_entity_type_check;`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".approval_workflows
           ADD CONSTRAINT approval_workflows_entity_type_check
           CHECK (entity_type IN ('use_case', 'project'));`,
          { transaction }
        );

        console.log(`Reverted changes for ${tenantHash}`);
      }

      await transaction.commit();
      console.log('Rollback completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
