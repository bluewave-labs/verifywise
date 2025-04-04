'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const queries = [
      `CREATE TYPE enum_projects_type_of_high_risk_role_temp AS ENUM (
        'deployer', 'provider', 'distributor', 'importer', 'product manufacturer', 'authorized representative',
        'Deployer', 'Provider', 'Distributor', 'Importer', 'Product manufacturer', 'Authorized representative'
      );`,
      "ALTER TABLE projects ALTER COLUMN type_of_high_risk_role TYPE enum_projects_type_of_high_risk_role_temp USING type_of_high_risk_role::text::enum_projects_type_of_high_risk_role_temp",
      "UPDATE projects SET type_of_high_risk_role = 'Deployer' WHERE type_of_high_risk_role = 'deployer';",
      "UPDATE projects SET type_of_high_risk_role = 'Provider' WHERE type_of_high_risk_role = 'provider';",
      "UPDATE projects SET type_of_high_risk_role = 'Distributor' WHERE type_of_high_risk_role = 'distributor';",
      "UPDATE projects SET type_of_high_risk_role = 'Importer' WHERE type_of_high_risk_role = 'importer';",
      "UPDATE projects SET type_of_high_risk_role = 'Product manufacturer' WHERE type_of_high_risk_role = 'product manufacturer';",
      "UPDATE projects SET type_of_high_risk_role = 'Authorized representative' WHERE type_of_high_risk_role = 'authorized representative';",
      "DROP TYPE IF EXISTS enum_projects_type_of_high_risk_role;",
      `CREATE TYPE enum_projects_type_of_high_risk_role AS ENUM (
        'Deployer', 'Provider', 'Distributor', 'Importer', 'Product manufacturer', 'Authorized representative'  
      );`,
      "ALTER TABLE projects ALTER COLUMN type_of_high_risk_role TYPE enum_projects_type_of_high_risk_role USING type_of_high_risk_role::text::enum_projects_type_of_high_risk_role",
      "DROP TYPE enum_projects_type_of_high_risk_role_temp;"
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
      `CREATE TYPE enum_projects_type_of_high_risk_role_temp AS ENUM (
        'deployer', 'provider', 'distributor', 'importer', 'product manufacturer', 'authorized representative',
        'Deployer', 'Provider', 'Distributor', 'Importer', 'Product manufacturer', 'Authorized representative'
      );`,
      "ALTER TABLE projects ALTER COLUMN type_of_high_risk_role TYPE enum_projects_type_of_high_risk_role_temp USING type_of_high_risk_role::text::enum_projects_type_of_high_risk_role_temp",
      "UPDATE projects SET type_of_high_risk_role = 'deployer' WHERE type_of_high_risk_role = 'Deployer';",
      "UPDATE projects SET type_of_high_risk_role = 'provider' WHERE type_of_high_risk_role = 'Provider';",
      "UPDATE projects SET type_of_high_risk_role = 'distributor' WHERE type_of_high_risk_role = 'Distributor';",
      "UPDATE projects SET type_of_high_risk_role = 'importer' WHERE type_of_high_risk_role = 'Importer';",
      "UPDATE projects SET type_of_high_risk_role = 'product manufacturer' WHERE type_of_high_risk_role = 'Product manufacturer';",
      "UPDATE projects SET type_of_high_risk_role = 'authorized representative' WHERE type_of_high_risk_role = 'Authorized representative';",
      "DROP TYPE IF EXISTS enum_projects_type_of_high_risk_role;",
      `CREATE TYPE enum_projects_type_of_high_risk_role AS ENUM (
        'deployer', 'provider', 'distributor', 'importer', 'product manufacturer', 'authorized representative'  
      );`,
      "ALTER TABLE projects ALTER COLUMN type_of_high_risk_role TYPE enum_projects_type_of_high_risk_role USING type_of_high_risk_role::text::enum_projects_type_of_high_risk_role",
      "DROP TYPE enum_projects_type_of_high_risk_role_temp;"
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
