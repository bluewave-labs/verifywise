'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration: Remove "Art. 2.1 - Consent Principles" from Quebec Law 25 framework
 *
 * This migration removes the redundant consent principles article from the Quebec Law 25
 * framework for all tenants that have the quebec-law25 plugin installed.
 *
 * Tables affected:
 * - custom_framework_level2 (delete the article)
 * - custom_framework_level2_impl (cascade delete implementation records)
 *
 * After deletion, updates order_no for remaining articles in Chapter 2.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get all existing organizations
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (const organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        try {
          // Check if plugin_installations table exists in this schema
          const [pluginTableExists] = await queryInterface.sequelize.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = '${tenantHash}'
              AND table_name = 'plugin_installations'
            )`,
            { type: Sequelize.QueryTypes.SELECT, transaction }
          );

          if (!pluginTableExists.exists) {
            console.log(`[${tenantHash}] plugin_installations table does not exist, skipping...`);
            continue;
          }

          // Check if quebec-law25 plugin is installed
          const installedPlugins = await queryInterface.sequelize.query(
            `SELECT * FROM "${tenantHash}".plugin_installations
             WHERE plugin_key = 'quebec-law25'
             AND status = 'installed'
             LIMIT 1`,
            { type: Sequelize.QueryTypes.SELECT, transaction }
          );

          if (!installedPlugins || installedPlugins.length === 0) {
            console.log(`[${tenantHash}] quebec-law25 plugin not installed, skipping...`);
            continue;
          }

          // Check if custom_frameworks table exists
          const [frameworkTableExists] = await queryInterface.sequelize.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = '${tenantHash}'
              AND table_name = 'custom_frameworks'
            )`,
            { type: Sequelize.QueryTypes.SELECT, transaction }
          );

          if (!frameworkTableExists.exists) {
            console.log(`[${tenantHash}] custom_frameworks table does not exist, skipping...`);
            continue;
          }

          // Find the quebec-law25 framework
          const frameworks = await queryInterface.sequelize.query(
            `SELECT id FROM "${tenantHash}".custom_frameworks
             WHERE plugin_key = 'quebec-law25'`,
            { type: Sequelize.QueryTypes.SELECT, transaction }
          );

          if (!frameworks || frameworks.length === 0) {
            console.log(`[${tenantHash}] No quebec-law25 framework found, skipping...`);
            continue;
          }

          for (const framework of frameworks) {
            // Find Chapter 2 (Consent Requirements)
            const level1Items = await queryInterface.sequelize.query(
              `SELECT id FROM "${tenantHash}".custom_framework_level1
               WHERE framework_id = ${framework.id}
               AND title LIKE 'Chapter 2%'`,
              { type: Sequelize.QueryTypes.SELECT, transaction }
            );

            if (!level1Items || level1Items.length === 0) {
              console.log(`[${tenantHash}] No Chapter 2 found in framework ${framework.id}, skipping...`);
              continue;
            }

            for (const level1 of level1Items) {
              // Find and delete "Art. 2.1 - Consent Principles"
              const articleToDelete = await queryInterface.sequelize.query(
                `SELECT id FROM "${tenantHash}".custom_framework_level2
                 WHERE level1_id = ${level1.id}
                 AND title = 'Art. 2.1 - Consent Principles'`,
                { type: Sequelize.QueryTypes.SELECT, transaction }
              );

              if (!articleToDelete || articleToDelete.length === 0) {
                console.log(`[${tenantHash}] Art. 2.1 - Consent Principles not found in Chapter 2, skipping...`);
                continue;
              }

              // Delete the article (cascade will handle level2_impl)
              await queryInterface.sequelize.query(
                `DELETE FROM "${tenantHash}".custom_framework_level2
                 WHERE id = ${articleToDelete[0].id}`,
                { transaction }
              );

              console.log(`[${tenantHash}] Deleted Art. 2.1 - Consent Principles from framework ${framework.id}`);

              // Update order_no for remaining articles in Chapter 2
              // Art. 2.2 becomes order_no 1, Art. 2.3 becomes order_no 2, etc.
              await queryInterface.sequelize.query(
                `UPDATE "${tenantHash}".custom_framework_level2
                 SET order_no = order_no - 1
                 WHERE level1_id = ${level1.id}
                 AND order_no > 1`,
                { transaction }
              );

              console.log(`[${tenantHash}] Updated order_no for remaining articles in Chapter 2`);
            }
          }
        } catch (error) {
          console.error(`[${tenantHash}] Error processing:`, error.message);
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async () => {
    // Note: This migration removes data, so the down migration cannot fully restore it.
    // The article would need to be re-imported by reinstalling the plugin.
    console.log("Down migration: Art. 2.1 - Consent Principles cannot be automatically restored.");
    console.log("To restore, uninstall and reinstall the quebec-law25 plugin.");
  },
};
