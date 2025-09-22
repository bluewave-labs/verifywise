'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(`SELECT id FROM public.organizations;`, { transaction })
      for (let i = 0; i < organizations[0].length; i++) {
        const organization = organizations[0][i];
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(
          `CREATE TABLE "${tenantHash}".bias_fairness_evaluations (
            id SERIAL PRIMARY KEY,
            eval_id VARCHAR(255) UNIQUE NOT NULL,
            model_name VARCHAR(255) NOT NULL,
            dataset_name VARCHAR(255) NOT NULL,
            model_task VARCHAR(100) NOT NULL,
            label_behavior VARCHAR(50) NOT NULL,
            config_data JSONB NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            results JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );`, { transaction }
        );
        await Promise.all(
          [
            `CREATE INDEX idx_${tenantHash}_bias_fairness_evaluations_status ON "${tenantHash}".bias_fairness_evaluations(status);`,
            `CREATE INDEX idx_${tenantHash}_bias_fairness_evaluations_eval_id ON "${tenantHash}".bias_fairness_evaluations(eval_id);`
          ].map(async (query) => {
            await queryInterface.sequelize.query(query, { transaction });
          })
        );
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
      const organizations = await queryInterface.sequelize.query(`SELECT id FROM public.organizations;`, { transaction })
      for (let i = 1; i < organizations[0].length; i++) {
        const organization = organizations[0][i];
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${tenantHash}".bias_fairness_evaluations;`, { transaction }
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
