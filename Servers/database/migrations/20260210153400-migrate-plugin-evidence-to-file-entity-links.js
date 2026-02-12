'use strict';

/**
 * Migration to move plugin framework evidence from JSON storage to file_entity_links table.
 *
 * This migrates data from:
 *   custom_framework_level2_impl.evidence_links (JSONB)
 *   custom_framework_level3_impl.evidence_links (JSONB)
 *
 * To:
 *   file_entity_links table with proper relational structure
 *
 * The framework_type is determined by joining back to custom_frameworks.plugin_key
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      let totalMigrated = 0;

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Check if required tables exist
        const [tablesExist] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = :schema
            AND table_name = 'custom_framework_level2_impl'
          ) as level2_exists,
          EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = :schema
            AND table_name = 'file_entity_links'
          ) as links_exists;`,
          {
            transaction,
            replacements: { schema: tenantHash }
          }
        );

        if (!tablesExist[0].level2_exists || !tablesExist[0].links_exists) {
          console.log(`Skipping tenant ${tenantHash}: required tables do not exist`);
          continue;
        }

        // Migrate level2_impl evidence_links
        const [level2Records] = await queryInterface.sequelize.query(`
          SELECT
            l2impl.id as impl_id,
            l2impl.evidence_links,
            cf.plugin_key
          FROM "${tenantHash}".custom_framework_level2_impl l2impl
          JOIN "${tenantHash}".custom_framework_projects cfp ON l2impl.project_framework_id = cfp.id
          JOIN "${tenantHash}".custom_frameworks cf ON cfp.framework_id = cf.id
          WHERE l2impl.evidence_links IS NOT NULL
            AND l2impl.evidence_links != '[]'::jsonb
            AND l2impl.evidence_links != 'null'::jsonb
            AND cf.plugin_key IS NOT NULL
        `, { transaction });

        for (const record of level2Records) {
          const evidenceLinks = record.evidence_links;
          if (!Array.isArray(evidenceLinks)) continue;

          for (const link of evidenceLinks) {
            const fileId = link.id;
            if (!fileId) continue;

            // Check if file exists
            const [fileExists] = await queryInterface.sequelize.query(
              `SELECT id FROM "${tenantHash}".files WHERE id = :fileId`,
              { transaction, replacements: { fileId } }
            );

            if (fileExists.length === 0) {
              console.log(`  Skipping file ${fileId} - does not exist`);
              continue;
            }

            // Insert into file_entity_links (ignore conflicts)
            await queryInterface.sequelize.query(`
              INSERT INTO "${tenantHash}".file_entity_links
                (file_id, framework_type, entity_type, entity_id, link_type, created_at)
              VALUES (:fileId, :frameworkType, 'level2_impl', :entityId, 'evidence', NOW())
              ON CONFLICT (file_id, framework_type, entity_type, entity_id) DO NOTHING
            `, {
              transaction,
              replacements: {
                fileId,
                frameworkType: record.plugin_key,
                entityId: record.impl_id
              }
            });
            totalMigrated++;
          }
        }

        console.log(`Migrated level2 evidence for ${tenantHash}: ${level2Records.length} records processed`);

        // Check if level3_impl table exists
        const [level3Exists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = :schema
            AND table_name = 'custom_framework_level3_impl'
          );`,
          {
            transaction,
            replacements: { schema: tenantHash }
          }
        );

        if (level3Exists[0].exists) {
          // Migrate level3_impl evidence_links
          const [level3Records] = await queryInterface.sequelize.query(`
            SELECT
              l3impl.id as impl_id,
              l3impl.evidence_links,
              cf.plugin_key
            FROM "${tenantHash}".custom_framework_level3_impl l3impl
            JOIN "${tenantHash}".custom_framework_level2_impl l2impl ON l3impl.level2_impl_id = l2impl.id
            JOIN "${tenantHash}".custom_framework_projects cfp ON l2impl.project_framework_id = cfp.id
            JOIN "${tenantHash}".custom_frameworks cf ON cfp.framework_id = cf.id
            WHERE l3impl.evidence_links IS NOT NULL
              AND l3impl.evidence_links != '[]'::jsonb
              AND l3impl.evidence_links != 'null'::jsonb
              AND cf.plugin_key IS NOT NULL
          `, { transaction });

          for (const record of level3Records) {
            const evidenceLinks = record.evidence_links;
            if (!Array.isArray(evidenceLinks)) continue;

            for (const link of evidenceLinks) {
              const fileId = link.id;
              if (!fileId) continue;

              // Check if file exists
              const [fileExists] = await queryInterface.sequelize.query(
                `SELECT id FROM "${tenantHash}".files WHERE id = :fileId`,
                { transaction, replacements: { fileId } }
              );

              if (fileExists.length === 0) continue;

              // Insert into file_entity_links (ignore conflicts)
              await queryInterface.sequelize.query(`
                INSERT INTO "${tenantHash}".file_entity_links
                  (file_id, framework_type, entity_type, entity_id, link_type, created_at)
                VALUES (:fileId, :frameworkType, 'level3_impl', :entityId, 'evidence', NOW())
                ON CONFLICT (file_id, framework_type, entity_type, entity_id) DO NOTHING
              `, {
                transaction,
                replacements: {
                  fileId,
                  frameworkType: record.plugin_key,
                  entityId: record.impl_id
                }
              });
              totalMigrated++;
            }
          }

          console.log(`Migrated level3 evidence for ${tenantHash}: ${level3Records.length} records processed`);
        }
      }

      await transaction.commit();
      console.log(`Migration completed successfully. Total file links migrated: ${totalMigrated}`);
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Down migration: Remove migrated file_entity_links for plugin frameworks
    // Note: This does NOT restore the JSON data - it only removes the links
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Check if file_entity_links table exists
        const [tableExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = :schema
            AND table_name = 'file_entity_links'
          );`,
          {
            transaction,
            replacements: { schema: tenantHash }
          }
        );

        if (!tableExists[0].exists) continue;

        // Get all plugin keys
        const [plugins] = await queryInterface.sequelize.query(`
          SELECT DISTINCT plugin_key
          FROM "${tenantHash}".custom_frameworks
          WHERE plugin_key IS NOT NULL
        `, { transaction });

        for (const plugin of plugins) {
          await queryInterface.sequelize.query(`
            DELETE FROM "${tenantHash}".file_entity_links
            WHERE framework_type = :pluginKey
              AND entity_type IN ('level2_impl', 'level3_impl')
          `, {
            transaction,
            replacements: { pluginKey: plugin.plugin_key }
          });
        }

        console.log(`Rolled back file_entity_links for ${tenantHash}`);
      }

      await transaction.commit();
      console.log('Rollback completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
