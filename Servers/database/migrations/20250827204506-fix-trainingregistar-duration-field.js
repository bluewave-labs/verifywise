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
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".trainingregistar ALTER COLUMN duration TYPE VARCHAR(255) USING duration::TEXT || ' days';`
        );
      }
      await transaction.commit()
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

        // Extract the first integer from the duration string
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".trainingregistar 
            ALTER COLUMN duration TYPE INTEGER 
            USING regexp_replace(duration::TEXT, '^([0-9]+).*$', '\\1')::INTEGER`,
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
