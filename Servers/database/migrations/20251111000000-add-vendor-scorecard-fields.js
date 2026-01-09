'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`, { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Create ENUM types for scorecard fields
        await queryInterface.sequelize.query(`
          CREATE TYPE "${tenantHash}".enum_vendors_data_sensitivity AS ENUM (
            'None',
            'Internal only', 
            'Personally identifiable information (PII)',
            'Financial data',
            'Health data (e.g. HIPAA)',
            'Model weights or AI assets',
            'Other sensitive data'
          );`, { transaction });

        await queryInterface.sequelize.query(`
          CREATE TYPE "${tenantHash}".enum_vendors_business_criticality AS ENUM (
            'Low (vendor supports non-core functions)',
            'Medium (affects operations but is replaceable)',
            'High (critical to core services or products)'
          );`, { transaction });

        await queryInterface.sequelize.query(`
          CREATE TYPE "${tenantHash}".enum_vendors_past_issues AS ENUM (
            'None',
            'Minor incident (e.g. small delay, minor bug)',
            'Major incident (e.g. data breach, legal issue)'
          );`, { transaction });

        await queryInterface.sequelize.query(`
          CREATE TYPE "${tenantHash}".enum_vendors_regulatory_exposure AS ENUM (
            'None',
            'GDPR (EU)',
            'HIPAA (US)',
            'SOC 2',
            'ISO 27001',
            'EU AI act',
            'CCPA (california)',
            'Other'
          );`, { transaction });

        // Add the ENUM columns
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendors
            ADD COLUMN "data_sensitivity" "${tenantHash}".enum_vendors_data_sensitivity;`, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendors
            ADD COLUMN "business_criticality" "${tenantHash}".enum_vendors_business_criticality;`, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendors
            ADD COLUMN "past_issues" "${tenantHash}".enum_vendors_past_issues;`, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendors
            ADD COLUMN "regulatory_exposure" "${tenantHash}".enum_vendors_regulatory_exposure;`, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendors
            ADD COLUMN "risk_score" INTEGER;`, { transaction });
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
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`, { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Drop the columns first
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendors
            DROP COLUMN "data_sensitivity";`, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendors
            DROP COLUMN "business_criticality";`, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendors
            DROP COLUMN "past_issues";`, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendors
            DROP COLUMN "regulatory_exposure";`, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendors
            DROP COLUMN "risk_score";`, { transaction });

        // Drop the ENUM types
        await queryInterface.sequelize.query(`
          DROP TYPE IF EXISTS "${tenantHash}".enum_vendors_data_sensitivity;`, { transaction });

        await queryInterface.sequelize.query(`
          DROP TYPE IF EXISTS "${tenantHash}".enum_vendors_business_criticality;`, { transaction });

        await queryInterface.sequelize.query(`
          DROP TYPE IF EXISTS "${tenantHash}".enum_vendors_past_issues;`, { transaction });

        await queryInterface.sequelize.query(`
          DROP TYPE IF EXISTS "${tenantHash}".enum_vendors_regulatory_exposure;`, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};