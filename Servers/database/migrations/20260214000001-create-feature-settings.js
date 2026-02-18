'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
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
        console.log('Organizations table does not exist yet. Skipping feature settings.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await createSettingsForTenant(queryInterface, tenantHash, transaction);
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
        await dropSettingsForTenant(queryInterface, tenantHash, transaction);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

async function createSettingsForTenant(queryInterface, tenantHash, transaction) {
  const [schemaExists] = await queryInterface.sequelize.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = :schema);`,
    { transaction, type: queryInterface.sequelize.QueryTypes.SELECT, replacements: { schema: tenantHash } }
  );

  if (!schemaExists.exists) {
    console.log(`Schema ${tenantHash} does not exist. Skipping feature settings.`);
    return;
  }

  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${tenantHash}".feature_settings (
      id SERIAL PRIMARY KEY,
      lifecycle_enabled BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMP DEFAULT NOW(),
      updated_by INTEGER NULL REFERENCES public.users(id)
    );
  `, { transaction });

  // Insert default row
  await queryInterface.sequelize.query(`
    INSERT INTO "${tenantHash}".feature_settings (id)
    VALUES (1)
    ON CONFLICT (id) DO NOTHING;
  `, { transaction });

  console.log(`Created feature_settings for tenant: ${tenantHash}`);
}

async function dropSettingsForTenant(queryInterface, tenantHash, transaction) {
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS "${tenantHash}".feature_settings;`,
    { transaction }
  );
}
