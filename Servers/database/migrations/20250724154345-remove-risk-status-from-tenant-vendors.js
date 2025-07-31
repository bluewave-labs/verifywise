'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");
const logger = require("../../dist/utils/logger");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {

      //check if the column exists in the public schema
      const columnExists = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = 'vendors' 
         AND column_name = 'risk_status';`,
        { transaction }
      );
      
      if (columnExists[0].length > 0) {
        await queryInterface.removeColumn('vendors', 'risk_status', { transaction });
      }
      
      // Get all organizations and remove from their tenant schemas
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      );
      
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        try {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".vendors DROP COLUMN IF EXISTS risk_status;`,
            { transaction }
          );
        } catch (error) {
          logger.error(`Error removing risk_status column from ${tenantHash}.vendors: ${error}`);
          throw error;
        }
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add back to public schema
      await queryInterface.addColumn('vendors', 'risk_status', {
        type: Sequelize.ENUM(
          "Very high risk",
          "High risk", 
          "Medium risk",
          "Low risk",
          "Very low risk"
        ),
        allowNull: true
      }, { transaction });
      
      // Add back to all tenant schemas
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      );
      
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".vendors ADD COLUMN risk_status VARCHAR(50) CHECK (risk_status IN ('Very high risk', 'High risk', 'Medium risk', 'Low risk', 'Very low risk'));`,
          { transaction }
        );
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};