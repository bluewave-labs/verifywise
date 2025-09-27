'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      )
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(`
          CREATE TABLE "${tenantHash}".model_risks (
            id SERIAL PRIMARY KEY,
            risk_name VARCHAR(255) NOT NULL,
            risk_category enum_model_risks_risk_category NOT NULL,
            risk_level enum_model_risks_risk_level NOT NULL,
            status enum_model_risks_status NOT NULL DEFAULT 'Open',
            owner INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
            target_date TIMESTAMP NOT NULL,
            description TEXT,
            mitigation_plan TEXT,
            impact TEXT,
            likelihood VARCHAR(255),
            key_metrics TEXT,
            current_values TEXT,
            threshold VARCHAR(255),
            model_id INTEGER REFERENCES "${tenantHash}".model_inventories(id) ON DELETE CASCADE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `, { transaction });
      }

      const model_risks = await queryInterface.sequelize.query(`SELECT * FROM public.model_risks;`, { transaction });

      for (let risk of model_risks[0]) {
        const tenantHash = getTenantHash(risk.tenant_id);
        await queryInterface.sequelize.query(`
          INSERT INTO "${tenantHash}".model_risks (
            id, risk_name, risk_category, risk_level, status,
            owner, target_date, description, mitigation_plan,
            impact, likelihood, key_metrics, current_values,
            threshold, model_id, created_at, updated_at
          ) VALUES (
            :id, :risk_name, :risk_category, :risk_level, :status,
            :owner, :target_date, :description, :mitigation_plan,
            :impact, :likelihood, :key_metrics, :current_values,
            :threshold, :model_id, :created_at, :updated_at
          );
        `, { replacements: risk, transaction });
      }

      await queryInterface.sequelize.query(`DROP TABLE public.model_risks;`, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
