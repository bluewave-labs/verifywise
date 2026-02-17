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
        console.log('Organizations table does not exist yet. Skipping lifecycle plugin installation.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (const organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Check if plugin_installations table exists for this tenant
        const pluginTableExists = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'plugin_installations'
          );`,
          { transaction, type: Sequelize.QueryTypes.SELECT }
        );

        if (!pluginTableExists[0].exists) {
          console.log(`plugin_installations table does not exist for tenant ${tenantHash}. Skipping.`);
          continue;
        }

        // Check if lifecycle is enabled via feature_settings (default true)
        let lifecycleEnabled = true;
        const featureTableExists = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'feature_settings'
          );`,
          { transaction, type: Sequelize.QueryTypes.SELECT }
        );

        if (featureTableExists[0].exists) {
          const settings = await queryInterface.sequelize.query(
            `SELECT lifecycle_enabled FROM "${tenantHash}".feature_settings WHERE id = 1;`,
            { transaction, type: Sequelize.QueryTypes.SELECT }
          );
          if (settings.length > 0) {
            lifecycleEnabled = settings[0].lifecycle_enabled;
          }
        }

        if (lifecycleEnabled) {
          await queryInterface.sequelize.query(
            `INSERT INTO "${tenantHash}".plugin_installations
              (plugin_key, status, created_at, updated_at)
            VALUES
              ('model-lifecycle', 'installed', NOW(), NOW())
            ON CONFLICT (plugin_key) DO NOTHING;`,
            { transaction }
          );
          console.log(`Installed model-lifecycle plugin for tenant ${tenantHash}`);
        } else {
          console.log(`Lifecycle disabled for tenant ${tenantHash}, skipping plugin installation`);
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

      for (const organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        const pluginTableExists = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'plugin_installations'
          );`,
          { transaction, type: Sequelize.QueryTypes.SELECT }
        );

        if (pluginTableExists[0].exists) {
          await queryInterface.sequelize.query(
            `DELETE FROM "${tenantHash}".plugin_installations WHERE plugin_key = 'model-lifecycle';`,
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
