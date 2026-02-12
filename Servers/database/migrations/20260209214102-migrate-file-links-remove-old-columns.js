'use strict';

/**
 * Migration to:
 * 1. Extract evidence links from JSONB columns in entity tables
 * 2. Insert them into the centralized file_entity_links table
 * 3. Remove deprecated columns from files table
 *
 * Source tables and their JSONB columns:
 * - answers_eu.evidence_files -> eu_ai_act / assessment
 * - subcontrols_eu.evidence_files -> eu_ai_act / subcontrol
 * - subcontrols_eu.feedback_files -> eu_ai_act / subcontrol (link_type: 'feedback')
 * - subclauses_iso27001.evidence_links -> iso_27001 / subclause
 * - subclauses_iso.evidence_links -> iso_42001 / subclause
 * - annexcategories_iso.evidence_links -> iso_42001 / annex_category
 * - annexcontrols_iso27001.evidence_links -> iso_27001 / annex_control
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

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Check if file_entity_links table exists
        const [linksTableExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = :schema
            AND table_name = 'file_entity_links'
          );`,
          { transaction, replacements: { schema: tenantHash } }
        );

        if (!linksTableExists[0].exists) {
          console.log(`Skipping tenant ${tenantHash}: file_entity_links table does not exist`);
          continue;
        }

        // Helper function to check if table exists
        const tableExists = async (tableName) => {
          const [result] = await queryInterface.sequelize.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = :schema AND table_name = :table
            );`,
            { transaction, replacements: { schema: tenantHash, table: tableName } }
          );
          return result[0].exists;
        };

        // Helper function to extract and insert file links from JSONB
        const migrateJsonbLinks = async (query, framework, entityType, linkType = 'evidence') => {
          const [rows] = await queryInterface.sequelize.query(query, { transaction });

          for (const row of rows) {
            const files = row.files || [];
            for (const file of files) {
              const fileId = parseInt(file.id, 10);
              if (isNaN(fileId)) continue;

              // Check if file exists before inserting (skip orphaned references)
              const [fileExists] = await queryInterface.sequelize.query(`
                SELECT EXISTS (
                  SELECT 1 FROM "${tenantHash}".files WHERE id = :fileId
                ) AS exists;
              `, { transaction, replacements: { fileId } });

              if (!fileExists[0].exists) {
                console.log(`Skipping orphaned file reference: file_id=${fileId} (file no longer exists)`);
                continue;
              }

              await queryInterface.sequelize.query(`
                INSERT INTO "${tenantHash}".file_entity_links
                  (file_id, framework_type, entity_type, entity_id, project_id, link_type, created_at)
                VALUES
                  (:fileId, :framework, :entityType, :entityId, :projectId, :linkType, NOW())
                ON CONFLICT (file_id, framework_type, entity_type, entity_id) DO NOTHING
              `, {
                transaction,
                replacements: {
                  fileId,
                  framework,
                  entityType,
                  entityId: row.entity_id,
                  projectId: row.project_id || null,
                  linkType,
                }
              });
            }
          }
        };

        // 1. answers_eu.evidence_files -> eu_ai_act / assessment
        if (await tableExists('answers_eu')) {
          console.log(`Migrating answers_eu.evidence_files for ${tenantHash}`);
          await migrateJsonbLinks(`
            SELECT a.id AS entity_id, a.evidence_files AS files, ass.project_id
            FROM "${tenantHash}".answers_eu a
            JOIN "${tenantHash}".assessments ass ON a.assessment_id = ass.id
            WHERE a.evidence_files IS NOT NULL AND jsonb_array_length(a.evidence_files) > 0
          `, 'eu_ai_act', 'assessment');
        }

        // 2. subcontrols_eu.evidence_files -> eu_ai_act / subcontrol
        if (await tableExists('subcontrols_eu')) {
          console.log(`Migrating subcontrols_eu.evidence_files for ${tenantHash}`);
          await migrateJsonbLinks(`
            SELECT s.id AS entity_id, s.evidence_files AS files, pf.project_id
            FROM "${tenantHash}".subcontrols_eu s
            JOIN "${tenantHash}".controls_eu c ON s.control_id = c.id
            JOIN "${tenantHash}".projects_frameworks pf ON c.projects_frameworks_id = pf.id
            WHERE s.evidence_files IS NOT NULL AND jsonb_array_length(s.evidence_files) > 0
          `, 'eu_ai_act', 'subcontrol');

          // 2b. subcontrols_eu.feedback_files -> eu_ai_act / subcontrol (feedback)
          console.log(`Migrating subcontrols_eu.feedback_files for ${tenantHash}`);
          await migrateJsonbLinks(`
            SELECT s.id AS entity_id, s.feedback_files AS files, pf.project_id
            FROM "${tenantHash}".subcontrols_eu s
            JOIN "${tenantHash}".controls_eu c ON s.control_id = c.id
            JOIN "${tenantHash}".projects_frameworks pf ON c.projects_frameworks_id = pf.id
            WHERE s.feedback_files IS NOT NULL AND jsonb_array_length(s.feedback_files) > 0
          `, 'eu_ai_act', 'subcontrol', 'feedback');
        }

        // 3. subclauses_iso27001.evidence_links -> iso_27001 / subclause
        if (await tableExists('subclauses_iso27001')) {
          console.log(`Migrating subclauses_iso27001.evidence_links for ${tenantHash}`);
          await migrateJsonbLinks(`
            SELECT sc.id AS entity_id, sc.evidence_links AS files, pf.project_id
            FROM "${tenantHash}".subclauses_iso27001 sc
            JOIN "${tenantHash}".projects_frameworks pf ON sc.projects_frameworks_id = pf.id
            WHERE sc.evidence_links IS NOT NULL AND jsonb_array_length(sc.evidence_links) > 0
          `, 'iso_27001', 'subclause');
        }

        // 4. subclauses_iso.evidence_links -> iso_42001 / subclause
        if (await tableExists('subclauses_iso')) {
          console.log(`Migrating subclauses_iso.evidence_links for ${tenantHash}`);
          await migrateJsonbLinks(`
            SELECT sc.id AS entity_id, sc.evidence_links AS files, pf.project_id
            FROM "${tenantHash}".subclauses_iso sc
            JOIN "${tenantHash}".projects_frameworks pf ON sc.projects_frameworks_id = pf.id
            WHERE sc.evidence_links IS NOT NULL AND jsonb_array_length(sc.evidence_links) > 0
          `, 'iso_42001', 'subclause');
        }

        // 5. annexcategories_iso.evidence_links -> iso_42001 / annex_category
        if (await tableExists('annexcategories_iso')) {
          console.log(`Migrating annexcategories_iso.evidence_links for ${tenantHash}`);
          await migrateJsonbLinks(`
            SELECT ac.id AS entity_id, ac.evidence_links AS files, pf.project_id
            FROM "${tenantHash}".annexcategories_iso ac
            JOIN "${tenantHash}".projects_frameworks pf ON ac.projects_frameworks_id = pf.id
            WHERE ac.evidence_links IS NOT NULL AND jsonb_array_length(ac.evidence_links) > 0
          `, 'iso_42001', 'annex_category');
        }

        // 6. annexcontrols_iso27001.evidence_links -> iso_27001 / annex_control
        if (await tableExists('annexcontrols_iso27001')) {
          console.log(`Migrating annexcontrols_iso27001.evidence_links for ${tenantHash}`);
          await migrateJsonbLinks(`
            SELECT ac.id AS entity_id, ac.evidence_links AS files, pf.project_id
            FROM "${tenantHash}".annexcontrols_iso27001 ac
            JOIN "${tenantHash}".projects_frameworks pf ON ac.projects_frameworks_id = pf.id
            WHERE ac.evidence_links IS NOT NULL AND jsonb_array_length(ac.evidence_links) > 0
          `, 'iso_27001', 'annex_control');
        }

        console.log(`Completed migration for ${tenantHash}`);

        // Remove deprecated columns from files table
        const [filesTableExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = :schema AND table_name = 'files'
          );`,
          { transaction, replacements: { schema: tenantHash } }
        );

        if (filesTableExists[0].exists) {
          const columnsToRemove = ['question_id', 'controlCategory_id', 'parent_id', 'sub_id', 'meta_id', 'is_evidence'];

          for (const column of columnsToRemove) {
            const [columnExists] = await queryInterface.sequelize.query(`
              SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_schema = :schema AND table_name = 'files' AND column_name = :column
              );
            `, { transaction, replacements: { schema: tenantHash, column } });

            if (columnExists[0].exists) {
              await queryInterface.sequelize.query(`
                ALTER TABLE "${tenantHash}".files DROP COLUMN "${column}";
              `, { transaction });
              console.log(`Dropped column ${column} from ${tenantHash}.files`);
            }
          }
        }
      }

      await transaction.commit();
      console.log('Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
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

        // Re-add the deprecated columns to files table
        const [filesTableExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = :schema AND table_name = 'files'
          );`,
          { transaction, replacements: { schema: tenantHash } }
        );

        if (filesTableExists[0].exists) {
          await queryInterface.sequelize.query(`
            ALTER TABLE "${tenantHash}".files
              ADD COLUMN IF NOT EXISTS question_id INTEGER,
              ADD COLUMN IF NOT EXISTS "controlCategory_id" INTEGER,
              ADD COLUMN IF NOT EXISTS parent_id INTEGER,
              ADD COLUMN IF NOT EXISTS sub_id INTEGER,
              ADD COLUMN IF NOT EXISTS meta_id INTEGER,
              ADD COLUMN IF NOT EXISTS is_evidence BOOLEAN DEFAULT FALSE;
          `, { transaction });
          console.log(`Re-added deprecated columns to ${tenantHash}.files`);
        }

        // Clear file_entity_links (data came from JSONB columns which still exist)
        const [linksTableExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = :schema AND table_name = 'file_entity_links'
          );`,
          { transaction, replacements: { schema: tenantHash } }
        );

        if (linksTableExists[0].exists) {
          await queryInterface.sequelize.query(`
            TRUNCATE TABLE "${tenantHash}".file_entity_links;
          `, { transaction });
          console.log(`Cleared file_entity_links for ${tenantHash}`);
        }
      }

      await transaction.commit();
      console.log('Rollback completed');
    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
