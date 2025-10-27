'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add 'Prohibited' value to the ai_risk_classification enum
     * This enum is used in the projects table for EU AI Act risk classification
     */
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_projects_ai_risk_classification" ADD VALUE 'Prohibited';`
    );
  },

  async down (queryInterface, Sequelize) {
    /**
     * Removing enum values in PostgreSQL is not straightforward.
     * The safest approach is to recreate the enum type without the 'Prohibited' value.
     * This requires temporarily changing the column type, dropping and recreating the enum.
     */
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Create a temporary enum type with the original values (without 'Prohibited')
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_projects_ai_risk_classification_temp" AS ENUM ('High risk', 'Limited risk', 'Minimal risk');`,
        { transaction }
      );

      // Change the column to use the temporary type
      await queryInterface.sequelize.query(
        `ALTER TABLE "projects" ALTER COLUMN "ai_risk_classification" TYPE "enum_projects_ai_risk_classification_temp" USING "ai_risk_classification"::text::"enum_projects_ai_risk_classification_temp";`,
        { transaction }
      );

      // Drop the old enum type
      await queryInterface.sequelize.query(
        `DROP TYPE "enum_projects_ai_risk_classification";`,
        { transaction }
      );

      // Create the enum type again with original values
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_projects_ai_risk_classification" AS ENUM ('High risk', 'Limited risk', 'Minimal risk');`,
        { transaction }
      );

      // Change the column back to use the recreated enum type
      await queryInterface.sequelize.query(
        `ALTER TABLE "projects" ALTER COLUMN "ai_risk_classification" TYPE "enum_projects_ai_risk_classification" USING "ai_risk_classification"::text::"enum_projects_ai_risk_classification";`,
        { transaction }
      );

      // Drop the temporary enum type
      await queryInterface.sequelize.query(
        `DROP TYPE "enum_projects_ai_risk_classification_temp";`,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
