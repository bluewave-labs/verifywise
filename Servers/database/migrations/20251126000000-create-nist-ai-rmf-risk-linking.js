'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration to create junction table for NIST AI RMF subcategories risk linking
 * Following the exact same pattern as ISO 27001 and ISO 42001 implementations
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("Starting NIST AI RMF risk-linking migration for existing tenants");

      // Get all organizations for multi-tenant architecture
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`,
        { transaction }
      );

      if (organizations[0].length === 0) {
        console.log("No organizations found, skipping risk-linking table creation");
        await transaction.commit();
        return;
      }

      // Process each organization to create tenant-specific junction tables
      for (const organization of organizations[0]) {
        try {
          const tenantHash = getTenantHash(organization.id);
          console.log(`Creating risk-linking table for tenant: ${tenantHash} (org_id: ${organization.id})`);

          // Create risk-linking junction table for NIST AI RMF subcategories
          // Following exact ISO pattern: subclauses_iso27001__risks, subclauses_iso__risks
          // Note: project_risks table is in public schema, not tenant schema
          await queryInterface.sequelize.query(`
            CREATE TABLE IF NOT EXISTS "${tenantHash}".nist_ai_rmf_subcategories__risks(
              subcategory_id INT NOT NULL,
              projects_risks_id INT NOT NULL,
              PRIMARY KEY (subcategory_id, projects_risks_id),
              FOREIGN KEY (subcategory_id) REFERENCES "${tenantHash}".nist_ai_rmf_subcategories(id) ON DELETE CASCADE,
              FOREIGN KEY (projects_risks_id) REFERENCES public.projectrisks(id) ON DELETE CASCADE
            );
          `, { transaction });

          // Create indexes for better performance (following ISO pattern)
          await queryInterface.sequelize.query(`
            CREATE INDEX IF NOT EXISTS "${tenantHash}_nist_ai_rmf_subcategories_risks_subcategory_idx"
            ON "${tenantHash}".nist_ai_rmf_subcategories__risks (subcategory_id);
          `, { transaction });

          await queryInterface.sequelize.query(`
            CREATE INDEX IF NOT EXISTS "${tenantHash}_nist_ai_rmf_subcategories_risks_risk_idx"
            ON "${tenantHash}".nist_ai_rmf_subcategories__risks (projects_risks_id);
          `, { transaction });

          console.log(`Successfully created risk-linking table for tenant: ${tenantHash}`);

        } catch (tenantError) {
          console.error(`Failed to create risk-linking table for tenant org_id ${organization.id}:`, tenantError);
          // Continue with other tenants instead of failing entire migration
        }
      }

      await transaction.commit();
      console.log('NIST AI RMF risk-linking migration completed successfully');

    } catch (error) {
      await transaction.rollback();
      console.error('NIST AI RMF risk-linking migration failed and was rolled back:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('Starting rollback of NIST AI RMF risk-linking from existing tenants');

      // Get all organizations
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`,
        { transaction }
      );

      if (organizations[0].length === 0) {
        await transaction.commit();
        return;
      }

      // Rollback junction table for each tenant
      for (const organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        try {
          console.log(`Removing risk-linking table from tenant: ${tenantHash}`);

          await queryInterface.sequelize.query(
            `DROP TABLE IF EXISTS "${tenantHash}".nist_ai_rmf_subcategories__risks;`,
            { transaction }
          );

        } catch (tenantError) {
          console.error(`Failed to remove risk-linking table for tenant ${tenantHash}:`, tenantError);
        }
      }

      await transaction.commit();
      console.log('Successfully rolled back NIST AI RMF risk-linking from all tenant schemas');

    } catch (error) {
      await transaction.rollback();
      console.error('NIST AI RMF risk-linking rollback failed:', error);
      throw error;
    }
  },
};