'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_sso_configuration_providers AS ENUM ('AzureAD');
      `, { transaction });

      await queryInterface.sequelize.query(`
        CREATE TABLE "sso_configurations" (
          "id" SERIAL PRIMARY KEY,
          "organization_id" INTEGER REFERENCES public.organizations(id) ON DELETE CASCADE,
          "provider" enum_sso_configuration_providers NOT NULL,
          "is_enabled" BOOLEAN DEFAULT FALSE,
          "config_data" JSONB NOT NULL,
          "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE("organization_id", "provider")
        );
      `, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS "sso_configurations";
      `, { transaction });

      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_sso_configuration_providers;
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
