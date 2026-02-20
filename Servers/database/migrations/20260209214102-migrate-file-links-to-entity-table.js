'use strict';

/**
 * Migration to migrate existing file links from JSONB columns to file_entity_links table.
 *
 * This migrates data from:
 * - EU AI Act: answers_eu.evidence_files, subcontrols_eu.evidence_files/feedback_files
 * - ISO 27001: subclauses_iso27001.evidence_links, annexcontrols_iso27001.evidence_links
 * - ISO 42001: subclauses_iso.evidence_links, annexcategories_iso.evidence_links
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

        if (!tableExists[0].exists) {
          console.log(`Skipping tenant ${tenantHash}: file_entity_links table does not exist`);
          continue;
        }

        // Migrate EU AI Act answers (assessments)
        await migrateEUAnswers(queryInterface, tenantHash, transaction);

        // Migrate EU AI Act subcontrols
        await migrateEUSubcontrols(queryInterface, tenantHash, transaction);

        // Migrate ISO 27001 subclauses
        await migrateISO27001Subclauses(queryInterface, tenantHash, transaction);

        // Migrate ISO 27001 annex controls
        await migrateISO27001AnnexControls(queryInterface, tenantHash, transaction);

        // Migrate ISO 42001 subclauses
        await migrateISO42001Subclauses(queryInterface, tenantHash, transaction);

        // Migrate ISO 42001 annex categories
        await migrateISO42001AnnexCategories(queryInterface, tenantHash, transaction);

        // Migrate NIST AI RMF subcategories
        await migrateNISTSubcategories(queryInterface, tenantHash, transaction);

        console.log(`Completed migration for tenant ${tenantHash}`);
      }

      await transaction.commit();
      console.log('Data migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Data migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Down migration: Delete all migrated records from file_entity_links
    // The JSONB columns still contain the data, so no data loss
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

        if (!tableExists[0].exists) {
          continue;
        }

        // Clear all file_entity_links (the JSONB columns still have the data)
        await queryInterface.sequelize.query(
          `DELETE FROM "${tenantHash}".file_entity_links;`,
          { transaction }
        );

        console.log(`Cleared file_entity_links for tenant ${tenantHash}`);
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

async function migrateEUAnswers(queryInterface, tenantHash, transaction) {
  // Check if table exists
  const [tableExists] = await queryInterface.sequelize.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = :schema AND table_name = 'answers_eu'
    );`,
    { transaction, replacements: { schema: tenantHash } }
  );

  if (!tableExists[0].exists) {
    return;
  }

  // Get all answers with evidence_files
  const [answers] = await queryInterface.sequelize.query(
    `SELECT id, evidence_files FROM "${tenantHash}".answers_eu
     WHERE evidence_files IS NOT NULL AND evidence_files::text != '[]' AND evidence_files::text != 'null';`,
    { transaction }
  );

  let migratedCount = 0;
  let skippedCount = 0;
  for (const answer of answers) {
    const files = parseJsonbFiles(answer.evidence_files);
    for (const file of files) {
      const fileId = parseInt(file.id);
      if (isNaN(fileId)) continue;

      // Skip if file doesn't exist (orphaned reference)
      if (!(await fileExists(queryInterface, tenantHash, fileId, transaction))) {
        skippedCount++;
        continue;
      }

      await queryInterface.sequelize.query(
        `INSERT INTO "${tenantHash}".file_entity_links
          (file_id, framework_type, entity_type, entity_id, link_type, created_at)
         VALUES (:fileId, 'eu_ai_act', 'assessment', :entityId, 'evidence', NOW())
         ON CONFLICT (file_id, framework_type, entity_type, entity_id) DO NOTHING`,
        {
          transaction,
          replacements: { fileId, entityId: answer.id }
        }
      );
      migratedCount++;
    }
  }
  console.log(`  Migrated ${migratedCount} EU AI Act answer files for ${tenantHash}${skippedCount > 0 ? ` (skipped ${skippedCount} orphaned refs)` : ''}`);
}

async function migrateEUSubcontrols(queryInterface, tenantHash, transaction) {
  // Check if table exists
  const [tableExists] = await queryInterface.sequelize.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = :schema AND table_name = 'subcontrols_eu'
    );`,
    { transaction, replacements: { schema: tenantHash } }
  );

  if (!tableExists[0].exists) {
    return;
  }

  // Get all subcontrols with evidence or feedback files
  const [subcontrols] = await queryInterface.sequelize.query(
    `SELECT id, evidence_files, feedback_files FROM "${tenantHash}".subcontrols_eu
     WHERE (evidence_files IS NOT NULL AND evidence_files::text != '[]' AND evidence_files::text != 'null')
        OR (feedback_files IS NOT NULL AND feedback_files::text != '[]' AND feedback_files::text != 'null');`,
    { transaction }
  );

  let migratedCount = 0;
  let skippedCount = 0;
  for (const subcontrol of subcontrols) {
    // Migrate evidence files
    const evidenceFiles = parseJsonbFiles(subcontrol.evidence_files);
    for (const file of evidenceFiles) {
      const fileId = parseInt(file.id);
      if (isNaN(fileId)) continue;

      // Skip if file doesn't exist (orphaned reference)
      if (!(await fileExists(queryInterface, tenantHash, fileId, transaction))) {
        skippedCount++;
        continue;
      }

      await queryInterface.sequelize.query(
        `INSERT INTO "${tenantHash}".file_entity_links
          (file_id, framework_type, entity_type, entity_id, link_type, created_at)
         VALUES (:fileId, 'eu_ai_act', 'subcontrol', :entityId, 'evidence', NOW())
         ON CONFLICT (file_id, framework_type, entity_type, entity_id) DO NOTHING`,
        {
          transaction,
          replacements: { fileId, entityId: subcontrol.id }
        }
      );
      migratedCount++;
    }

    // Migrate feedback files
    const feedbackFiles = parseJsonbFiles(subcontrol.feedback_files);
    for (const file of feedbackFiles) {
      const fileId = parseInt(file.id);
      if (isNaN(fileId)) continue;

      // Skip if file doesn't exist (orphaned reference)
      if (!(await fileExists(queryInterface, tenantHash, fileId, transaction))) {
        skippedCount++;
        continue;
      }

      await queryInterface.sequelize.query(
        `INSERT INTO "${tenantHash}".file_entity_links
          (file_id, framework_type, entity_type, entity_id, link_type, created_at)
         VALUES (:fileId, 'eu_ai_act', 'subcontrol', :entityId, 'feedback', NOW())
         ON CONFLICT (file_id, framework_type, entity_type, entity_id) DO NOTHING`,
        {
          transaction,
          replacements: { fileId, entityId: subcontrol.id }
        }
      );
      migratedCount++;
    }
  }
  console.log(`  Migrated ${migratedCount} EU AI Act subcontrol files for ${tenantHash}${skippedCount > 0 ? ` (skipped ${skippedCount} orphaned refs)` : ''}`);
}

async function migrateISO27001Subclauses(queryInterface, tenantHash, transaction) {
  // Check if table exists
  const [tableExists] = await queryInterface.sequelize.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = :schema AND table_name = 'subclauses_iso27001'
    );`,
    { transaction, replacements: { schema: tenantHash } }
  );

  if (!tableExists[0].exists) {
    return;
  }

  // Get all subclauses with evidence_links
  const [subclauses] = await queryInterface.sequelize.query(
    `SELECT id, evidence_links FROM "${tenantHash}".subclauses_iso27001
     WHERE evidence_links IS NOT NULL AND evidence_links::text != '[]' AND evidence_links::text != 'null';`,
    { transaction }
  );

  let migratedCount = 0;
  let skippedCount = 0;
  for (const subclause of subclauses) {
    const files = parseJsonbFiles(subclause.evidence_links);
    for (const file of files) {
      const fileId = parseInt(file.id);
      if (isNaN(fileId)) continue;

      // Skip if file doesn't exist (orphaned reference)
      if (!(await fileExists(queryInterface, tenantHash, fileId, transaction))) {
        skippedCount++;
        continue;
      }

      await queryInterface.sequelize.query(
        `INSERT INTO "${tenantHash}".file_entity_links
          (file_id, framework_type, entity_type, entity_id, link_type, created_at)
         VALUES (:fileId, 'iso_27001', 'subclause', :entityId, 'evidence', NOW())
         ON CONFLICT (file_id, framework_type, entity_type, entity_id) DO NOTHING`,
        {
          transaction,
          replacements: { fileId, entityId: subclause.id }
        }
      );
      migratedCount++;
    }
  }
  console.log(`  Migrated ${migratedCount} ISO 27001 subclause files for ${tenantHash}${skippedCount > 0 ? ` (skipped ${skippedCount} orphaned refs)` : ''}`);
}

async function migrateISO27001AnnexControls(queryInterface, tenantHash, transaction) {
  // Check if table exists
  const [tableExists] = await queryInterface.sequelize.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = :schema AND table_name = 'annexcontrols_iso27001'
    );`,
    { transaction, replacements: { schema: tenantHash } }
  );

  if (!tableExists[0].exists) {
    return;
  }

  // Get all annex controls with evidence_links
  const [annexControls] = await queryInterface.sequelize.query(
    `SELECT id, evidence_links FROM "${tenantHash}".annexcontrols_iso27001
     WHERE evidence_links IS NOT NULL AND evidence_links::text != '[]' AND evidence_links::text != 'null';`,
    { transaction }
  );

  let migratedCount = 0;
  let skippedCount = 0;
  for (const annexControl of annexControls) {
    const files = parseJsonbFiles(annexControl.evidence_links);
    for (const file of files) {
      const fileId = parseInt(file.id);
      if (isNaN(fileId)) continue;

      // Skip if file doesn't exist (orphaned reference)
      if (!(await fileExists(queryInterface, tenantHash, fileId, transaction))) {
        skippedCount++;
        continue;
      }

      await queryInterface.sequelize.query(
        `INSERT INTO "${tenantHash}".file_entity_links
          (file_id, framework_type, entity_type, entity_id, link_type, created_at)
         VALUES (:fileId, 'iso_27001', 'annex_control', :entityId, 'evidence', NOW())
         ON CONFLICT (file_id, framework_type, entity_type, entity_id) DO NOTHING`,
        {
          transaction,
          replacements: { fileId, entityId: annexControl.id }
        }
      );
      migratedCount++;
    }
  }
  console.log(`  Migrated ${migratedCount} ISO 27001 annex control files for ${tenantHash}${skippedCount > 0 ? ` (skipped ${skippedCount} orphaned refs)` : ''}`);
}

async function migrateISO42001Subclauses(queryInterface, tenantHash, transaction) {
  // Check if table exists
  const [tableExists] = await queryInterface.sequelize.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = :schema AND table_name = 'subclauses_iso'
    );`,
    { transaction, replacements: { schema: tenantHash } }
  );

  if (!tableExists[0].exists) {
    return;
  }

  // Get all subclauses with evidence_links
  const [subclauses] = await queryInterface.sequelize.query(
    `SELECT id, evidence_links FROM "${tenantHash}".subclauses_iso
     WHERE evidence_links IS NOT NULL AND evidence_links::text != '[]' AND evidence_links::text != 'null';`,
    { transaction }
  );

  let migratedCount = 0;
  let skippedCount = 0;
  for (const subclause of subclauses) {
    const files = parseJsonbFiles(subclause.evidence_links);
    for (const file of files) {
      const fileId = parseInt(file.id);
      if (isNaN(fileId)) continue;

      // Skip if file doesn't exist (orphaned reference)
      if (!(await fileExists(queryInterface, tenantHash, fileId, transaction))) {
        skippedCount++;
        continue;
      }

      await queryInterface.sequelize.query(
        `INSERT INTO "${tenantHash}".file_entity_links
          (file_id, framework_type, entity_type, entity_id, link_type, created_at)
         VALUES (:fileId, 'iso_42001', 'subclause', :entityId, 'evidence', NOW())
         ON CONFLICT (file_id, framework_type, entity_type, entity_id) DO NOTHING`,
        {
          transaction,
          replacements: { fileId, entityId: subclause.id }
        }
      );
      migratedCount++;
    }
  }
  console.log(`  Migrated ${migratedCount} ISO 42001 subclause files for ${tenantHash}${skippedCount > 0 ? ` (skipped ${skippedCount} orphaned refs)` : ''}`);
}

async function migrateISO42001AnnexCategories(queryInterface, tenantHash, transaction) {
  // Check if table exists
  const [tableExists] = await queryInterface.sequelize.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = :schema AND table_name = 'annexcategories_iso'
    );`,
    { transaction, replacements: { schema: tenantHash } }
  );

  if (!tableExists[0].exists) {
    return;
  }

  // Get all annex categories with evidence_links
  const [annexCategories] = await queryInterface.sequelize.query(
    `SELECT id, evidence_links FROM "${tenantHash}".annexcategories_iso
     WHERE evidence_links IS NOT NULL AND evidence_links::text != '[]' AND evidence_links::text != 'null';`,
    { transaction }
  );

  let migratedCount = 0;
  let skippedCount = 0;
  for (const annexCategory of annexCategories) {
    const files = parseJsonbFiles(annexCategory.evidence_links);
    for (const file of files) {
      const fileId = parseInt(file.id);
      if (isNaN(fileId)) continue;

      // Skip if file doesn't exist (orphaned reference)
      if (!(await fileExists(queryInterface, tenantHash, fileId, transaction))) {
        skippedCount++;
        continue;
      }

      await queryInterface.sequelize.query(
        `INSERT INTO "${tenantHash}".file_entity_links
          (file_id, framework_type, entity_type, entity_id, link_type, created_at)
         VALUES (:fileId, 'iso_42001', 'annex_category', :entityId, 'evidence', NOW())
         ON CONFLICT (file_id, framework_type, entity_type, entity_id) DO NOTHING`,
        {
          transaction,
          replacements: { fileId, entityId: annexCategory.id }
        }
      );
      migratedCount++;
    }
  }
  console.log(`  Migrated ${migratedCount} ISO 42001 annex category files for ${tenantHash}${skippedCount > 0 ? ` (skipped ${skippedCount} orphaned refs)` : ''}`);
}

async function migrateNISTSubcategories(queryInterface, tenantHash, transaction) {
  // Check if table exists
  const [tableExists] = await queryInterface.sequelize.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = :schema AND table_name = 'nist_ai_rmf_subcategories'
    );`,
    { transaction, replacements: { schema: tenantHash } }
  );

  if (!tableExists[0].exists) {
    return;
  }

  // Get all subcategories with evidence_links
  const [subcategories] = await queryInterface.sequelize.query(
    `SELECT id, evidence_links FROM "${tenantHash}".nist_ai_rmf_subcategories
     WHERE evidence_links IS NOT NULL AND evidence_links::text != '[]' AND evidence_links::text != 'null';`,
    { transaction }
  );

  let migratedCount = 0;
  let skippedCount = 0;
  for (const subcategory of subcategories) {
    const files = parseJsonbFiles(subcategory.evidence_links);
    for (const file of files) {
      const fileId = parseInt(file.id);
      if (isNaN(fileId)) continue;

      // Skip if file doesn't exist (orphaned reference)
      if (!(await fileExists(queryInterface, tenantHash, fileId, transaction))) {
        skippedCount++;
        continue;
      }

      await queryInterface.sequelize.query(
        `INSERT INTO "${tenantHash}".file_entity_links
          (file_id, framework_type, entity_type, entity_id, link_type, created_at)
         VALUES (:fileId, 'nist_ai', 'subcategory', :entityId, 'evidence', NOW())
         ON CONFLICT (file_id, framework_type, entity_type, entity_id) DO NOTHING`,
        {
          transaction,
          replacements: { fileId, entityId: subcategory.id }
        }
      );
      migratedCount++;
    }
  }
  console.log(`  Migrated ${migratedCount} NIST AI RMF subcategory files for ${tenantHash}${skippedCount > 0 ? ` (skipped ${skippedCount} orphaned refs)` : ''}`);
}

function parseJsonbFiles(jsonbValue) {
  if (!jsonbValue) return [];

  try {
    // If it's already an array, return it
    if (Array.isArray(jsonbValue)) return jsonbValue;

    // If it's a string, parse it
    if (typeof jsonbValue === 'string') {
      const parsed = JSON.parse(jsonbValue);
      return Array.isArray(parsed) ? parsed : [];
    }

    // If it's an object (single file), wrap in array
    if (typeof jsonbValue === 'object') {
      return [jsonbValue];
    }

    return [];
  } catch (e) {
    console.warn('Failed to parse JSONB files:', e);
    return [];
  }
}

/**
 * Check if a file exists in the files table
 * Returns true if file exists, false otherwise
 */
async function fileExists(queryInterface, tenantHash, fileId, transaction) {
  const [result] = await queryInterface.sequelize.query(
    `SELECT EXISTS (SELECT 1 FROM "${tenantHash}".files WHERE id = :fileId) AS exists;`,
    { transaction, replacements: { fileId } }
  );
  return result[0].exists;
}
