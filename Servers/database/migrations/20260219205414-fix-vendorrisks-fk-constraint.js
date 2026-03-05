'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Fix vendorrisks FK constraint: change from ON DELETE SET NULL to ON DELETE CASCADE
 *
 * The vendor_id column is NOT NULL, but the FK was incorrectly set to SET NULL,
 * causing errors when deleting vendors.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if organizations table exists
      const tableExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'organizations'
        );`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      if (!tableExists[0].exists) {
        console.log('Organizations table does not exist yet. Skipping migration.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Check if vendorrisks table exists
        const vendorRisksExists = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'vendorrisks'
          );`,
          { transaction, type: Sequelize.QueryTypes.SELECT }
        );

        if (!vendorRisksExists[0].exists) {
          console.log(`vendorrisks table does not exist in ${tenantHash}. Skipping.`);
          continue;
        }

        // Drop the old FK constraint
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendorrisks
          DROP CONSTRAINT IF EXISTS vendorrisks_vendor_id_fkey;
        `, { transaction });

        // Add new FK constraint with ON DELETE CASCADE
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendorrisks
          ADD CONSTRAINT vendorrisks_vendor_id_fkey
          FOREIGN KEY (vendor_id)
          REFERENCES "${tenantHash}".vendors(id)
          ON UPDATE NO ACTION
          ON DELETE CASCADE;
        `, { transaction });

        console.log(`Fixed vendorrisks FK constraint for tenant ${tenantHash}`);
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
      const tableExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'organizations'
        );`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      if (!tableExists[0].exists) {
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        const vendorRisksExists = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'vendorrisks'
          );`,
          { transaction, type: Sequelize.QueryTypes.SELECT }
        );

        if (!vendorRisksExists[0].exists) {
          continue;
        }

        // Revert to old FK (SET NULL - though this was the bug)
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendorrisks
          DROP CONSTRAINT IF EXISTS vendorrisks_vendor_id_fkey;
        `, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendorrisks
          ADD CONSTRAINT vendorrisks_vendor_id_fkey
          FOREIGN KEY (vendor_id)
          REFERENCES "${tenantHash}".vendors(id)
          ON UPDATE NO ACTION
          ON DELETE SET NULL;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
