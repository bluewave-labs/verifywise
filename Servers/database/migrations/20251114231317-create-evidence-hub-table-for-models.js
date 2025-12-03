'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        await queryInterface.sequelize.query(`
          CREATE TABLE "${tenantHash}".evidence_hub (
            id SERIAL PRIMARY KEY,
            evidence_name VARCHAR(255) NOT NULL,
            evidence_type VARCHAR(100) NOT NULL,
            description TEXT NULL,
            evidence_files JSONB NOT NULL DEFAULT '[]',
            expiry_date TIMESTAMP NULL,
            mapped_model_ids INTEGER[] NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `, { transaction });

        // index suggestions
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_evidence_hub_type
          ON "${tenantHash}".evidence_hub(evidence_type);
        `, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".evidence_hub;
        `, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
