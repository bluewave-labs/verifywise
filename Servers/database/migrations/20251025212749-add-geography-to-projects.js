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

        if (!columnExistsInPublic) {
          // 1. add column nullable default 1
          await queryInterface.addColumn(
            tableName,
            'geography',
            {
              type: Sequelize.INTEGER,
              allowNull: true,
              defaultValue: 1,
            },
            { transaction }
          );

          // 2. backfill
          await queryInterface.sequelize.query(
            `UPDATE public.${tableName} SET geography = 1 WHERE geography IS NULL;`,
            { transaction }
          );

          // 3. make NOT NULL
          await queryInterface.changeColumn(
            tableName,
            'geography',
            {
              type: Sequelize.INTEGER,
              allowNull: false,
              defaultValue: 1,
            },
            { transaction }
          );
        } else {
          // Column exists but normalize constraints / default
          await queryInterface.changeColumn(
            tableName,
            'geography',
            {
              type: Sequelize.INTEGER,
              allowNull: false,
              defaultValue: 1,
            },
            { transaction }
          );
        }
      }

      // ---------- TENANT SCHEMAS HANDLING ----------
      // We only bother looping orgs if organizations table exists;
      // otherwise this will also explode on a new empty DB.
      let orgRows = [];
      try {
        const organizations = await queryInterface.sequelize.query(
          `SELECT id FROM public.organizations;`,
          { transaction }
        );
        orgRows = organizations[0] || [];
      } catch (err) {
        console.warn(
          `[add-geography-to-projects] "organizations" table not found in public schema; skipping tenant schemas.`
        );
      }

      for (let organization of orgRows) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".projects
            ADD COLUMN "geography" INTEGER DEFAULT 1;`, { transaction });

        await queryInterface.sequelize.query(
          `UPDATE "${tenantHash}".projects SET geography = 1 WHERE geography IS NULL;`,
          { transaction }
        );

        if (!columnExists) {
          // add col
          await queryInterface.sequelize.query(
            `
            ALTER TABLE "${tenantHash}".projects
              ADD COLUMN "geography" INTEGER DEFAULT 1;
          `,
            { transaction }
          );

          // backfill
          await queryInterface.sequelize.query(
            `
            UPDATE "${tenantHash}".projects
            SET geography = 1
            WHERE geography IS NULL;
          `,
            { transaction }
          );

          // enforce NOT NULL
          await queryInterface.sequelize.query(
            `
            ALTER TABLE "${tenantHash}".projects
              ALTER COLUMN "geography" SET NOT NULL;
          `,
            { transaction }
          );
        } else {
          // column exists, just normalize nullability/default
          await queryInterface.sequelize.query(
            `
            ALTER TABLE "${tenantHash}".projects
              ALTER COLUMN "geography" SET DEFAULT 1;
          `,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `
            ALTER TABLE "${tenantHash}".projects
              ALTER COLUMN "geography" SET NOT NULL;
          `,
            { transaction }
          );
        }
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
      const tableName = 'projects';

      // ---------- PUBLIC SCHEMA ROLLBACK ----------
      let publicTableExists = true;
      try {
        await queryInterface.describeTable(tableName, { transaction });
      } catch (err) {
        publicTableExists = false;
        console.warn(
          `[add-geography-to-projects][down] "${tableName}" table not found in public schema; skipping public column drop.`
        );
      }

      if (publicTableExists) {
        // try dropping column; if it doesn't exist it's fine to skip
        try {
          await queryInterface.removeColumn(tableName, 'geography', { transaction });
        } catch (err) {
          console.warn(
            `[add-geography-to-projects][down] Could not drop "geography" from public.${tableName}; maybe it wasn't there.`
          );
        }
      }

      // ---------- TENANT SCHEMAS ROLLBACK ----------
      let orgRows = [];
      try {
        const organizations = await queryInterface.sequelize.query(
          `SELECT id FROM public.organizations;`,
          { transaction }
        );
        orgRows = organizations[0] || [];
      } catch (err) {
        console.warn(
          `[add-geography-to-projects][down] "organizations" table not found; skipping tenant schemas.`
        );
      }

      for (let organization of orgRows) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".projects
            DROP COLUMN "geography";`, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
