'use strict';

/**
 * Add a partial unique index on ai_detection_scans to prevent concurrent
 * active scans for the same repository.
 *
 * Only enforces uniqueness when status is 'pending', 'cloning', or 'scanning'.
 * Completed/failed/cancelled scans are not constrained.
 */
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
          CREATE UNIQUE INDEX IF NOT EXISTS "${tenantHash}_ai_scans_unique_active_idx"
          ON "${tenantHash}".ai_detection_scans (repository_owner, repository_name)
          WHERE status IN ('pending', 'cloning', 'scanning');
        `, { transaction });

        console.log(`Added unique active scan constraint for tenant ${tenantHash}`);
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

        await queryInterface.sequelize.query(`
          DROP INDEX IF EXISTS "${tenantHash}"."${tenantHash}_ai_scans_unique_active_idx";
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
