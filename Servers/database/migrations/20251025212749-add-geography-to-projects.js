'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('projects', 'geography', {
        type: Sequelize.INTEGER,
        allowNull: true, // Allow null initially for existing records
        defaultValue: 1, // Default value for new records
      }, { transaction });

      await queryInterface.sequelize.query(
        `UPDATE public.projects SET geography = 1 WHERE geography IS NULL;`,
        { transaction }
      );

      await queryInterface.changeColumn('projects', 'geography', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      }, { transaction });

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`, { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        const [schemaExists] = await queryInterface.sequelize.query(`
          SELECT 1 FROM information_schema.schemata 
          WHERE schema_name = '${tenantHash}'
        `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

        if (!schemaExists) {
          continue;
        }

        const [columnExists] = await queryInterface.sequelize.query(`
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = '${tenantHash}' 
          AND table_name = 'projects' 
          AND column_name = 'geography'
        `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

        if (columnExists) {
          continue;
        }

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".projects
            ADD COLUMN "geography" INTEGER DEFAULT 1;`, { transaction });

        await queryInterface.sequelize.query(
          `UPDATE "${tenantHash}".projects SET geography = 1 WHERE geography IS NULL;`,
          { transaction }
        );

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".projects
            ALTER COLUMN "geography" SET NOT NULL;`, { transaction });
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
      await queryInterface.removeColumn('projects', 'geography', { transaction });

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`, { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        const [schemaExists] = await queryInterface.sequelize.query(`
          SELECT 1 FROM information_schema.schemata 
          WHERE schema_name = '${tenantHash}'
        `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

        if (!schemaExists) {
          continue;
        }

        const [columnExists] = await queryInterface.sequelize.query(`
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = '${tenantHash}' 
          AND table_name = 'projects' 
          AND column_name = 'geography'
        `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

        if (columnExists) {
          await queryInterface.sequelize.query(`
            ALTER TABLE "${tenantHash}".projects
              DROP COLUMN "geography";`, { transaction });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};