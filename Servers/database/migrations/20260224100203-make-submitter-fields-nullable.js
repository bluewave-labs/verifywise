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

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".intake_submissions
          ALTER COLUMN submitter_email DROP NOT NULL;
        `, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".intake_submissions
          ALTER COLUMN submitter_name DROP NOT NULL;
        `, { transaction });

        console.log(`Made submitter fields nullable for tenant ${tenantHash}`);
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

        // Set null values to empty string before adding NOT NULL constraint
        await queryInterface.sequelize.query(`
          UPDATE "${tenantHash}".intake_submissions
          SET submitter_email = '' WHERE submitter_email IS NULL;
        `, { transaction });

        await queryInterface.sequelize.query(`
          UPDATE "${tenantHash}".intake_submissions
          SET submitter_name = '' WHERE submitter_name IS NULL;
        `, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".intake_submissions
          ALTER COLUMN submitter_email SET NOT NULL;
        `, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".intake_submissions
          ALTER COLUMN submitter_name SET NOT NULL;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
