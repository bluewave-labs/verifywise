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

        // 1. Widen public_id column from VARCHAR(8) to VARCHAR(16)
        //    for new 8-byte (64-bit) IDs. Existing 8-char values are unaffected.
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".intake_forms
          ALTER COLUMN public_id TYPE VARCHAR(16);
        `, { transaction });

        // 2. Add composite index on (ip_address, created_at DESC)
        //    for the rate-limiting query that scans by IP within the last hour.
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_intake_submissions_ip_address
          ON "${tenantHash}".intake_submissions(ip_address, created_at DESC);
        `, { transaction });

        console.log(`Applied security fixes for tenant ${tenantHash}`);
      }

      await transaction.commit();
      console.log('Migration intake-forms-security-fixes completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration intake-forms-security-fixes failed:', error);
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

        await queryInterface.sequelize.query(`
          DROP INDEX IF EXISTS "${tenantHash}".idx_intake_submissions_ip_address;
        `, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".intake_forms
          ALTER COLUMN public_id TYPE VARCHAR(8);
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
