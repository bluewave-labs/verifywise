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
        await queryInterface.sequelize.query(`CREATE TABLE "${tenantHash}".mlflow_model_records (
          id SERIAL PRIMARY KEY,
          model_name VARCHAR(255) NOT NULL,
          version VARCHAR(255) NOT NULL,
          lifecycle_stage VARCHAR(255),
          run_id VARCHAR(255),
          description TEXT,
          source VARCHAR(255),
          status VARCHAR(255),
          tags JSONB NOT NULL DEFAULT '{}'::jsonb,
          metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
          parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
          experiment_id VARCHAR(255),
          experiment_name VARCHAR(255),
          artifact_location TEXT,
          training_status VARCHAR(255),
          training_started_at TIMESTAMP,
          training_ended_at TIMESTAMP,
          source_version VARCHAR(255),
          model_created_at TIMESTAMP,
          model_updated_at TIMESTAMP,
          last_synced_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT mlflow_model_records_org_model_version_unique UNIQUE (model_name, version)
        );`, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${tenantHash}".mlflow_model_records;`, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
