'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Widen description from VARCHAR(255) to TEXT
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".projects
           ALTER COLUMN description TYPE TEXT;`,
          { transaction }
        );

        // Widen goal from VARCHAR(255) to TEXT
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".projects
           ALTER COLUMN goal TYPE TEXT;`,
          { transaction }
        );

        console.log(`Widened description and goal columns for tenant ${tenantHash}`);
      }

      await transaction.commit();
      console.log('Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".projects
           ALTER COLUMN description TYPE VARCHAR(255);`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".projects
           ALTER COLUMN goal TYPE VARCHAR(255);`,
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
