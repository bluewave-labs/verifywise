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

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(`CREATE TABLE "${tenantHash}".mlflow_integrations (
          id SERIAL PRIMARY KEY,
          tracking_server_url VARCHAR(255) NOT NULL,
          auth_method VARCHAR(10) NOT NULL DEFAULT 'none' CHECK (auth_method IN ('none', 'basic', 'token')),
          username VARCHAR(255),
          username_iv VARCHAR(255),
          password VARCHAR(255),
          password_iv VARCHAR(255),
          api_token VARCHAR(255),
          api_token_iv VARCHAR(255),
          verify_ssl BOOLEAN NOT NULL DEFAULT TRUE,
          timeout INTEGER NOT NULL DEFAULT 30,
          last_tested_at TIMESTAMP,
          last_test_status VARCHAR(10) CHECK (last_test_status IN ('success', 'error')),
          last_test_message TEXT,
          updated_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );`, { transaction });
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
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${tenantHash}".mlflow_integrations;`, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
