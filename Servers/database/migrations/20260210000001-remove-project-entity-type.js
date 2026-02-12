"use strict";

/**
 * Migration: Remove 'project' from entity_type constraints
 *
 * The 'project' entity type was redundant since we use 'use_case' for projects.
 * This migration removes 'project' from all entity_type CHECK constraints.
 */

const { getTenantHash } = require("../../dist/tools/getTenantHash");

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get all organizations dynamically
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (const org of organizations) {
        const tenant = getTenantHash(org.id);
        // Check if schema exists
        const [schemas] = await queryInterface.sequelize.query(
          `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${tenant}'`,
          { transaction }
        );

        if (schemas.length === 0) {
          console.log(`Schema ${tenant} does not exist, skipping...`);
          continue;
        }

        // Update approval_workflows table constraint
        const [awTableExists] = await queryInterface.sequelize.query(
          `SELECT table_name FROM information_schema.tables
           WHERE table_schema = '${tenant}' AND table_name = 'approval_workflows'`,
          { transaction }
        );

        if (awTableExists.length > 0) {
          // Drop old constraint and add new one
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenant}".approval_workflows
             DROP CONSTRAINT IF EXISTS approval_workflows_entity_type_check;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenant}".approval_workflows
             ADD CONSTRAINT approval_workflows_entity_type_check
             CHECK (entity_type IN ('use_case', 'file'));`,
            { transaction }
          );

          console.log(`Updated approval_workflows constraint for tenant ${tenant}`);
        }

        // Update approval_requests table constraint
        const [arTableExists] = await queryInterface.sequelize.query(
          `SELECT table_name FROM information_schema.tables
           WHERE table_schema = '${tenant}' AND table_name = 'approval_requests'`,
          { transaction }
        );

        if (arTableExists.length > 0) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenant}".approval_requests
             DROP CONSTRAINT IF EXISTS approval_requests_entity_type_check;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenant}".approval_requests
             ADD CONSTRAINT approval_requests_entity_type_check
             CHECK (entity_type IN ('use_case', 'file'));`,
            { transaction }
          );

          console.log(`Updated approval_requests constraint for tenant ${tenant}`);
        }
      }

      await transaction.commit();
      console.log("Migration completed successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Migration failed:", error);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get all organizations dynamically
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (const org of organizations) {
        const tenant = getTenantHash(org.id);

        // Check if schema exists
        const [schemas] = await queryInterface.sequelize.query(
          `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${tenant}'`,
          { transaction }
        );

        if (schemas.length === 0) {
          continue;
        }

        // Restore approval_workflows constraint with 'project'
        const [awTableExists] = await queryInterface.sequelize.query(
          `SELECT table_name FROM information_schema.tables
           WHERE table_schema = '${tenant}' AND table_name = 'approval_workflows'`,
          { transaction }
        );

        if (awTableExists.length > 0) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenant}".approval_workflows
             DROP CONSTRAINT IF EXISTS approval_workflows_entity_type_check;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenant}".approval_workflows
             ADD CONSTRAINT approval_workflows_entity_type_check
             CHECK (entity_type IN ('use_case', 'project', 'file'));`,
            { transaction }
          );
        }

        // Restore approval_requests constraint with 'project'
        const [arTableExists] = await queryInterface.sequelize.query(
          `SELECT table_name FROM information_schema.tables
           WHERE table_schema = '${tenant}' AND table_name = 'approval_requests'`,
          { transaction }
        );

        if (arTableExists.length > 0) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenant}".approval_requests
             DROP CONSTRAINT IF EXISTS approval_requests_entity_type_check;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenant}".approval_requests
             ADD CONSTRAINT approval_requests_entity_type_check
             CHECK (entity_type IN ('use_case', 'project', 'file'));`,
            { transaction }
          );
        }
      }

      await transaction.commit();
      console.log("Rollback completed successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Rollback failed:", error);
      throw error;
    }
  },
};
