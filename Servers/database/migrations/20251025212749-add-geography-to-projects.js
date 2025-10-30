'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableName = 'projects';

      // ---------- PUBLIC SCHEMA HANDLING ----------
      let tableDefinition;
      let publicTableExists = true;

      try {
        tableDefinition = await queryInterface.describeTable(tableName, { transaction });
      } catch (err) {
        // If describeTable throws, that means the table doesn't exist in this DB yet
        publicTableExists = false;
        console.warn(
          `[add-geography-to-projects] "${tableName}" table not found in public schema; skipping public column add.`
        );
      }

      if (publicTableExists) {
        const columnExistsInPublic = 'geography' in tableDefinition;

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

        // does the tenant schema exist?
        const [schemaExists] = await queryInterface.sequelize.query(
          `
          SELECT 1 FROM information_schema.schemata 
          WHERE schema_name = '${tenantHash}'
        `,
          { transaction, type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        if (!schemaExists) {
          // no schema for this org yet, skip
          continue;
        }

        // does the geography column already exist in <tenantHash>.projects ?
        const [columnExists] = await queryInterface.sequelize.query(
          `
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = '${tenantHash}' 
          AND table_name = 'projects' 
          AND column_name = 'geography'
        `,
          { transaction, type: queryInterface.sequelize.QueryTypes.SELECT }
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

        // check tenant schema exists
        const [schemaExists] = await queryInterface.sequelize.query(
          `
          SELECT 1 FROM information_schema.schemata 
          WHERE schema_name = '${tenantHash}'
        `,
          { transaction, type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        if (!schemaExists) {
          continue;
        }

        // check geography column exists
        const [columnExists] = await queryInterface.sequelize.query(
          `
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = '${tenantHash}' 
          AND table_name = 'projects' 
          AND column_name = 'geography'
        `,
          { transaction, type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        if (columnExists) {
          await queryInterface.sequelize.query(
            `
            ALTER TABLE "${tenantHash}".projects
              DROP COLUMN "geography";
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
  }
};
