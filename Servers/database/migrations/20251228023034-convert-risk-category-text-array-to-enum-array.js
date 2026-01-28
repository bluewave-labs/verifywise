'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        // Add new column with enum array type
        (tenantHash) => `ALTER TABLE "${tenantHash}".risks ADD COLUMN risk_category_temp enum_projectrisks_risk_category[];`,

        // Convert TEXT[] to enum array
        // For each text value, check if it's a valid enum value, otherwise default to 'Operational risk'
        (tenantHash) => `UPDATE "${tenantHash}".risks SET risk_category_temp = (
          SELECT ARRAY_AGG(
            CASE
              WHEN elem IN (
                'Strategic risk', 'Operational risk', 'Compliance risk', 'Financial risk',
                'Cybersecurity risk', 'Reputational risk', 'Legal risk', 'Technological risk',
                'Third-party/vendor risk', 'Environmental risk', 'Human resources risk',
                'Geopolitical risk', 'Fraud risk', 'Data privacy risk', 'Health and safety risk'
              ) THEN elem::enum_projectrisks_risk_category
              ELSE 'Operational risk'::enum_projectrisks_risk_category
            END
          )
          FROM UNNEST(risk_category) AS elem
        );`,

        // Handle NULL or empty arrays
        (tenantHash) => `UPDATE "${tenantHash}".risks SET risk_category_temp = ARRAY['Operational risk'::enum_projectrisks_risk_category]
          WHERE risk_category_temp IS NULL OR array_length(risk_category_temp, 1) IS NULL;`,

        // Drop old column
        (tenantHash) => `ALTER TABLE "${tenantHash}".risks DROP COLUMN risk_category;`,

        // Rename temp column to final name
        (tenantHash) => `ALTER TABLE "${tenantHash}".risks RENAME COLUMN risk_category_temp TO risk_category;`,

        // Set NOT NULL constraint
        (tenantHash) => `ALTER TABLE "${tenantHash}".risks ALTER COLUMN risk_category SET NOT NULL;`,
      ];

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        const queriesWithTenant = queries.map(query => query(tenantHash));
        for (const query of queriesWithTenant) {
          await queryInterface.sequelize.query(query, { transaction });
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
      const queries = [
        // Add temp TEXT[] column
        (tenantHash) => `ALTER TABLE "${tenantHash}".risks ADD COLUMN risk_category_temp TEXT[];`,

        // Convert enum array back to TEXT array
        (tenantHash) => `UPDATE "${tenantHash}".risks SET risk_category_temp = risk_category::TEXT[];`,

        // Drop enum array column
        (tenantHash) => `ALTER TABLE "${tenantHash}".risks DROP COLUMN risk_category;`,

        // Rename temp column
        (tenantHash) => `ALTER TABLE "${tenantHash}".risks RENAME COLUMN risk_category_temp TO risk_category;`,
      ];

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        const queriesWithTenant = queries.map(query => query(tenantHash));
        for (const query of queriesWithTenant) {
          await queryInterface.sequelize.query(query, { transaction });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
