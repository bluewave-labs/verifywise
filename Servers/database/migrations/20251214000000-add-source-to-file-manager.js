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
        
        // Check if column already exists
        const [columns] = await queryInterface.sequelize.query(
          `SELECT column_name FROM information_schema.columns 
           WHERE table_schema = '${tenantHash}' 
           AND table_name = 'file_manager' 
           AND column_name = 'source';`,
          { transaction }
        );

        if (columns.length === 0) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".file_manager 
             ADD COLUMN source VARCHAR(50) DEFAULT 'file_manager';`,
            { transaction }
          );
        }
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
        
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".file_manager DROP COLUMN IF EXISTS source;`,
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
