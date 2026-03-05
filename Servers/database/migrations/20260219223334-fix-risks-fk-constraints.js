'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Fix risks table FK constraints to allow deleting users:
 * - risks.risk_owner: change to ON DELETE SET NULL
 * - risks.risk_approval: change to ON DELETE SET NULL
 */
module.exports = {
  async up(queryInterface, Sequelize) {
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

        const risksExists = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'risks'
          );`,
          { transaction, type: Sequelize.QueryTypes.SELECT }
        );

        if (!risksExists[0].exists) {
          console.log(`risks table does not exist in ${tenantHash}. Skipping.`);
          continue;
        }

        // Fix risk_owner FK
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".risks
          DROP CONSTRAINT IF EXISTS projectrisks_risk_owner_fkey;
        `, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".risks
          ADD CONSTRAINT projectrisks_risk_owner_fkey
          FOREIGN KEY (risk_owner)
          REFERENCES public.users(id)
          ON UPDATE NO ACTION
          ON DELETE SET NULL;
        `, { transaction });

        // Fix risk_approval FK
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".risks
          DROP CONSTRAINT IF EXISTS projectrisks_risk_approval_fkey;
        `, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".risks
          ADD CONSTRAINT projectrisks_risk_approval_fkey
          FOREIGN KEY (risk_approval)
          REFERENCES public.users(id)
          ON UPDATE NO ACTION
          ON DELETE SET NULL;
        `, { transaction });

        console.log(`Fixed risks FK constraints for tenant ${tenantHash}`);
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

        const risksExists = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'risks'
          );`,
          { transaction, type: Sequelize.QueryTypes.SELECT }
        );

        if (!risksExists[0].exists) {
          continue;
        }

        // Revert to original (no ON DELETE clause = RESTRICT)
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".risks
          DROP CONSTRAINT IF EXISTS projectrisks_risk_owner_fkey;
        `, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".risks
          ADD CONSTRAINT projectrisks_risk_owner_fkey
          FOREIGN KEY (risk_owner)
          REFERENCES public.users(id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".risks
          DROP CONSTRAINT IF EXISTS projectrisks_risk_approval_fkey;
        `, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".risks
          ADD CONSTRAINT projectrisks_risk_approval_fkey
          FOREIGN KEY (risk_approval)
          REFERENCES public.users(id);
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
