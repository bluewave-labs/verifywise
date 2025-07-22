'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        (tenantHash) => `ALTER TABLE "${tenantHash}".projectrisks ADD COLUMN risk_category_temp TEXT[];`,
        (tenantHash) => `UPDATE "${tenantHash}".projectrisks SET risk_category_temp = Array[risk_category::Text];`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".projectrisks DROP COLUMN risk_category;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".projectrisks RENAME COLUMN risk_category_temp TO risk_category;`,
      ]
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      )
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
        (tenantHash) => `ALTER TABLE "${tenantHash}".projectrisks ADD COLUMN risk_category_temp enum_projectrisks_risk_category;`,
        (tenantHash) => `UPDATE "${tenantHash}".projectrisks SET risk_category_temp = CASE 
          WHEN array_length(risk_category, 1) > 0 THEN risk_category[1]::enum_projectrisks_risk_category 
          ELSE NULL 
        END;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".projectrisks DROP COLUMN risk_category;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".projectrisks RENAME COLUMN risk_category_temp TO risk_category;`,
      ]
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      )
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
