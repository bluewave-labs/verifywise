'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const queries = [
      "CREATE TYPE enum_projects_ai_risk_classification_temp AS ENUM ('high risk', 'limited risk', 'minimal risk', 'High risk', 'Limited risk', 'Minimal risk');",
      "ALTER TABLE projects ALTER COLUMN ai_risk_classification TYPE enum_projects_ai_risk_classification_temp USING ai_risk_classification::text::enum_projects_ai_risk_classification_temp",
      "UPDATE projects SET ai_risk_classification = 'High risk' WHERE ai_risk_classification = 'high risk';",
      "UPDATE projects SET ai_risk_classification = 'Limited risk' WHERE ai_risk_classification = 'limited risk';",
      "UPDATE projects SET ai_risk_classification = 'Minimal risk' WHERE ai_risk_classification = 'minimal risk';",
      "DROP TYPE IF EXISTS enum_projects_ai_risk_classification;",
      "CREATE TYPE enum_projects_ai_risk_classification AS ENUM ('High risk', 'Limited risk', 'Minimal risk');",
      "ALTER TABLE projects ALTER COLUMN ai_risk_classification TYPE enum_projects_ai_risk_classification USING ai_risk_classification::text::enum_projects_ai_risk_classification",
      "DROP TYPE enum_projects_ai_risk_classification_temp;"
    ]
    try {
      for (let query of queries) {
        await queryInterface.sequelize.query(
          query, { transaction }
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
    const queries = [
      "CREATE TYPE enum_projects_ai_risk_classification_temp AS ENUM ('high risk', 'limited risk', 'minimal risk', 'High risk', 'Limited risk', 'Minimal risk');",
      "ALTER TABLE projects ALTER COLUMN ai_risk_classification TYPE enum_projects_ai_risk_classification_temp USING ai_risk_classification::text::enum_projects_ai_risk_classification_temp",
      "UPDATE projects SET ai_risk_classification = 'high risk' WHERE ai_risk_classification = 'High risk';",
      "UPDATE projects SET ai_risk_classification = 'limited risk' WHERE ai_risk_classification = 'Limited risk';",
      "UPDATE projects SET ai_risk_classification = 'minimal risk' WHERE ai_risk_classification = 'Minimal risk';",
      "DROP TYPE IF EXISTS enum_projects_ai_risk_classification;",
      "CREATE TYPE enum_projects_ai_risk_classification AS ENUM ('high risk', 'limited risk', 'minimal risk');",
      "ALTER TABLE projects ALTER COLUMN ai_risk_classification TYPE enum_projects_ai_risk_classification USING ai_risk_classification::text::enum_projects_ai_risk_classification",
      "DROP TYPE enum_projects_ai_risk_classification_temp;"
    ]
    try {
      for (let query of queries) {
        await queryInterface.sequelize.query(
          query, { transaction }
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
