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
            ADD COLUMN IF NOT EXISTS risk_assessment JSONB,
            ADD COLUMN IF NOT EXISTS risk_tier VARCHAR(20),
            ADD COLUMN IF NOT EXISTS risk_override JSONB;
        `, { transaction });

        console.log(`Enhanced intake_submissions for tenant ${tenantHash}`);
      }

      await transaction.commit();
      console.log('Migration enhance-intake-submissions completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration enhance-intake-submissions failed:', error);
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
          ALTER TABLE "${tenantHash}".intake_submissions
            DROP COLUMN IF EXISTS risk_assessment,
            DROP COLUMN IF EXISTS risk_tier,
            DROP COLUMN IF EXISTS risk_override;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
