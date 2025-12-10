'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get all existing organizations
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        console.log(`Adding optimization indexes for ${tenantHash}...`);

        try {
          // Index on risks table for filtering and sorting
          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_risks_is_deleted ON "${tenantHash}".risks(is_deleted);`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_risks_created_at_id ON "${tenantHash}".risks(created_at DESC, id ASC);`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_risks_severity_likelihood ON "${tenantHash}".risks(severity, likelihood);`,
            { transaction }
          );

          // Indexes on junction tables for risk_id lookups
          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_projects_risks_risk_id ON "${tenantHash}".projects_risks(risk_id);`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_frameworks_risks_risk_id ON "${tenantHash}".frameworks_risks(risk_id);`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_subclauses_iso_risks_risk_id ON "${tenantHash}".subclauses_iso__risks(projects_risks_id);`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_annexcategories_iso_risks_risk_id ON "${tenantHash}".annexcategories_iso__risks(projects_risks_id);`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_controls_eu_risks_risk_id ON "${tenantHash}".controls_eu__risks(projects_risks_id);`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_answers_eu_risks_risk_id ON "${tenantHash}".answers_eu__risks(projects_risks_id);`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_annexcontrols_iso27001_risks_risk_id ON "${tenantHash}".annexcontrols_iso27001__risks(projects_risks_id);`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_subclauses_iso27001_risks_risk_id ON "${tenantHash}".subclauses_iso27001__risks(projects_risks_id);`,
            { transaction }
          );

          // Foreign key indexes for joins
          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_subclauses_iso_subclause_id ON "${tenantHash}".subclauses_iso__risks(subclause_id);`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_annexcategories_iso_annexcategory_id ON "${tenantHash}".annexcategories_iso__risks(annexcategory_id);`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_controls_eu_control_id ON "${tenantHash}".controls_eu__risks(control_id);`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_answers_eu_answer_id ON "${tenantHash}".answers_eu__risks(answer_id);`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_annexcontrols_iso27001_annexcontrol_id ON "${tenantHash}".annexcontrols_iso27001__risks(annexcontrol_id);`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_subclauses_iso27001_subclause_id ON "${tenantHash}".subclauses_iso27001__risks(subclause_id);`,
            { transaction }
          );

          console.log(`Successfully added optimization indexes for ${tenantHash}`);
        } catch (error) {
          console.log(`Error adding indexes for ${tenantHash}: ${error.message}`);
        }
      }

      await transaction.commit();
      console.log('Risk query optimization indexes migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Risk query optimization indexes migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get all existing organizations
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        console.log(`Removing optimization indexes for ${tenantHash}...`);

        try {
          // Drop all indexes created in up migration
          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_risks_is_deleted;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_risks_created_at_id;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_risks_severity_likelihood;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_projects_risks_risk_id;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_frameworks_risks_risk_id;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_subclauses_iso_risks_risk_id;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_annexcategories_iso_risks_risk_id;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_controls_eu_risks_risk_id;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_answers_eu_risks_risk_id;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_annexcontrols_iso27001_risks_risk_id;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_subclauses_iso27001_risks_risk_id;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_subclauses_iso_subclause_id;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_annexcategories_iso_annexcategory_id;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_controls_eu_control_id;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_answers_eu_answer_id;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_annexcontrols_iso27001_annexcontrol_id;`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `DROP INDEX IF EXISTS "${tenantHash}".idx_subclauses_iso27001_subclause_id;`,
            { transaction }
          );

          console.log(`Successfully removed optimization indexes for ${tenantHash}`);
        } catch (error) {
          console.log(`Error removing indexes for ${tenantHash}: ${error.message}`);
        }
      }

      await transaction.commit();
      console.log('Risk query optimization indexes rollback completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Risk query optimization indexes rollback failed:', error);
      throw error;
    }
  }
};
