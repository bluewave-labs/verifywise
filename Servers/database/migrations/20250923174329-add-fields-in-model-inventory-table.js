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

         // Add the four new columns in one query
         await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".model_inventories
           ADD COLUMN reference_link VARCHAR,
           ADD COLUMN biases VARCHAR,
           ADD COLUMN limitations VARCHAR,
           ADD COLUMN hosting_provider VARCHAR;`,
          { transaction }
        );

        // Pre-populate default values for existing rows
        await queryInterface.sequelize.query(
          `UPDATE "${tenantHash}".model_inventories
           SET reference_link = '', biases = '', limitations = '', hosting_provider = '';`,
          { transaction }
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
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, 
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
      // Remove the four columns
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".model_inventories
            DROP COLUMN reference_link,
            DROP COLUMN biases,
            DROP COLUMN limitations,
            DROP COLUMN hosting_provider;`,
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