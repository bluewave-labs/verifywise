'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`, { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".projects
            ADD COLUMN "target_industry" character varying(255);`, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".projects
            ADD COLUMN "description" character varying(255);`, { transaction });
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
        `SELECT id FROM public.organizations;`, { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".projects
            DROP COLUMN "target_industry";`, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".projects
            DROP COLUMN "description";`, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

