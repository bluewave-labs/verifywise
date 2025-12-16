'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔧 Adding implementation_description column to NIST AI RMF subcategories for all tenants...');

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (const org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        // Check if table exists
        const [tableExists] = await queryInterface.sequelize.query(
          `SELECT 1 FROM information_schema.tables
           WHERE table_schema = '${tenantHash}' AND table_name = 'nist_ai_rmf_subcategories'`,
          { transaction, type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        if (!tableExists) {
          console.log(`Table nist_ai_rmf_subcategories does not exist for tenant ${tenantHash}, skipping`);
          continue;
        }

        // Add column if it doesn't exist
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".nist_ai_rmf_subcategories
           ADD COLUMN IF NOT EXISTS implementation_description TEXT;`,
          { transaction }
        );
        console.log(`✅ Ensured implementation_description column exists for ${tenantHash}`);
      }

      await transaction.commit();
      console.log('✅ Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // No-op - don't remove the column in down migration
    console.log('ℹ️ Down migration - no operation');
  }
};
