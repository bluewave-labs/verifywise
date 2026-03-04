'use strict';

/**
 * NIST AI RMF Data Migration - Tenant to Shared Schema
 *
 * Migrates existing NIST AI RMF data from tenant schemas to public schema.
 * Maps old subcategory_meta_id to new struct IDs based on function + subcategory_id.
 */

const { getTenantHash } = require('../../dist/tools/getTenantHash');

async function schemaExists(queryInterface, schemaName, transaction) {
  const [results] = await queryInterface.sequelize.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = :schemaName)`,
    { replacements: { schemaName }, transaction }
  );
  return results[0]?.exists || false;
}

async function tableExists(queryInterface, schemaName, tableName, transaction) {
  const [results] = await queryInterface.sequelize.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = :schemaName AND table_name = :tableName
    )`,
    { replacements: { schemaName, tableName }, transaction }
  );
  return results[0]?.exists || false;
}

async function getNewStructMapping(queryInterface, transaction) {
  const exists = await tableExists(queryInterface, 'public', 'nist_ai_rmf_subcategories_struct', transaction);
  if (!exists) return {};

  const [results] = await queryInterface.sequelize.query(
    `SELECT id, function, subcategory_id FROM public.nist_ai_rmf_subcategories_struct`,
    { transaction }
  );

  const mapping = {};
  for (const row of results) {
    const key = `${row.function}-${row.subcategory_id}`;
    mapping[key] = row.id;
  }
  return mapping;
}

async function getOldStructMapping(queryInterface, tenantHash, transaction) {
  const structExists = await tableExists(queryInterface, tenantHash, 'nist_ai_rmf_subcategories_struct', transaction);
  if (!structExists) return null;

  const [columns] = await queryInterface.sequelize.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = :tenantHash AND table_name = 'nist_ai_rmf_subcategories_struct'`,
    { replacements: { tenantHash }, transaction }
  );

  const columnNames = columns.map(c => c.column_name);
  const hasFunction = columnNames.includes('function');
  const hasSubcategoryId = columnNames.includes('subcategory_id');

  if (!hasSubcategoryId) return null;

  let query;
  if (hasFunction) {
    query = `SELECT id, function, subcategory_id FROM "${tenantHash}".nist_ai_rmf_subcategories_struct`;
  } else if (columnNames.includes('category_id')) {
    const catExists = await tableExists(queryInterface, tenantHash, 'nist_ai_rmf_categories', transaction);
    const funcExists = await tableExists(queryInterface, tenantHash, 'nist_ai_rmf_functions', transaction);
    if (catExists && funcExists) {
      query = `
        SELECT s.id, f.function_id as function, s.subcategory_id
        FROM "${tenantHash}".nist_ai_rmf_subcategories_struct s
        LEFT JOIN "${tenantHash}".nist_ai_rmf_categories c ON s.category_id = c.id
        LEFT JOIN "${tenantHash}".nist_ai_rmf_functions f ON c.function_id = f.id
      `;
    } else {
      return null;
    }
  } else {
    return null;
  }

  try {
    const [results] = await queryInterface.sequelize.query(query, { transaction });
    const mapping = {};
    for (const row of results) {
      if (row.function && row.subcategory_id !== null) {
        mapping[row.id] = { function: row.function, subcategory_id: parseFloat(row.subcategory_id) };
      }
    }
    return mapping;
  } catch (error) {
    return null;
  }
}

async function migrateNistSubcategories(queryInterface, orgId, tenantHash, newStructMapping, idMapping, transaction) {
  const sourceExists = await tableExists(queryInterface, tenantHash, 'nist_ai_rmf_subcategories', transaction);
  if (!sourceExists) return 0;

  const targetExists = await tableExists(queryInterface, 'public', 'nist_ai_rmf_subcategories', transaction);
  if (!targetExists) return 0;

  const oldStructMapping = await getOldStructMapping(queryInterface, tenantHash, transaction);

  const [rows] = await queryInterface.sequelize.query(
    `SELECT * FROM "${tenantHash}".nist_ai_rmf_subcategories ORDER BY id`,
    { transaction }
  );

  if (rows.length === 0) return 0;

  // Initialize ID mapping for this table
  if (!idMapping['nist_ai_rmf_subcategories']) {
    idMapping['nist_ai_rmf_subcategories'] = {};
  }

  let migratedCount = 0;

  for (const row of rows) {
    const oldId = row.id;
    let newMetaId = null;

    if (row.subcategory_meta_id !== null && oldStructMapping) {
      const old = oldStructMapping[row.subcategory_meta_id];
      if (old) {
        newMetaId = newStructMapping[`${old.function}-${old.subcategory_id}`];
      }
    }

    if (newMetaId === null && row.subcategory_meta_id !== null) {
      if (Object.values(newStructMapping).includes(row.subcategory_meta_id)) {
        newMetaId = row.subcategory_meta_id;
      } else {
        continue;
      }
    }

    try {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM public.nist_ai_rmf_subcategories
         WHERE organization_id = :orgId AND subcategory_meta_id = :metaId AND projects_frameworks_id = :pfId LIMIT 1`,
        { replacements: { orgId, metaId: newMetaId, pfId: row.projects_frameworks_id }, transaction }
      );

      if (existing.length > 0) {
        // Store mapping for existing record
        idMapping['nist_ai_rmf_subcategories'][String(oldId)] = existing[0].id;
        migratedCount++;
        continue;
      }

      const [inserted] = await queryInterface.sequelize.query(
        `INSERT INTO public.nist_ai_rmf_subcategories
         (organization_id, implementation_description, status, owner, reviewer, approver, due_date,
          auditor_feedback, subcategory_meta_id, projects_frameworks_id, created_at, is_demo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        {
          bind: [orgId, row.implementation_description, row.status || 'Not started',
            row.owner, row.reviewer, row.approver, row.due_date, row.auditor_feedback,
            newMetaId, row.projects_frameworks_id, row.created_at || new Date(), row.is_demo || false],
          transaction
        }
      );

      // Store the ID mapping: old tenant ID -> new public ID
      if (inserted[0]?.id) {
        idMapping['nist_ai_rmf_subcategories'][String(oldId)] = inserted[0].id;
      }
      migratedCount++;
    } catch (error) {
      if (!error.message?.includes('duplicate key')) {
        console.log(`    ⚠ NIST row ${row.id}: ${error.message}`);
      }
    }
  }

  if (migratedCount > 0) console.log(`    ✓ nist_ai_rmf_subcategories: ${migratedCount} rows`);
  return migratedCount;
}

async function migrateNistRisks(queryInterface, orgId, tenantHash, idMapping, transaction) {
  const sourceExists = await tableExists(queryInterface, tenantHash, 'nist_ai_rmf_subcategories__risks', transaction);
  if (!sourceExists) return 0;

  const targetExists = await tableExists(queryInterface, 'public', 'nist_ai_rmf_subcategories__risks', transaction);
  if (!targetExists) return 0;

  const [rows] = await queryInterface.sequelize.query(
    `SELECT * FROM "${tenantHash}".nist_ai_rmf_subcategories__risks`,
    { transaction }
  );

  if (rows.length === 0) return 0;

  let migratedCount = 0;

  for (const row of rows) {
    // Map the old subcategory ID to the new one
    const newSubcatId = idMapping['nist_ai_rmf_subcategories']?.[String(row.nist_ai_rmf_subcategory_id)];

    if (!newSubcatId) {
      // Skip if we don't have a mapping - the subcategory wasn't migrated
      console.log(`    ⚠ nist_ai_rmf_subcategories__risks: skipping row, no mapping for subcategory_id ${row.nist_ai_rmf_subcategory_id}`);
      continue;
    }

    try {
      await queryInterface.sequelize.query(
        `INSERT INTO public.nist_ai_rmf_subcategories__risks
         (organization_id, nist_ai_rmf_subcategory_id, projects_risks_id)
         VALUES (:orgId, :subcatId, :riskId)
         ON CONFLICT (nist_ai_rmf_subcategory_id, projects_risks_id) DO NOTHING`,
        { replacements: { orgId, subcatId: newSubcatId, riskId: row.projects_risks_id }, transaction }
      );
      migratedCount++;
    } catch (error) {
      if (!error.message?.includes('duplicate key')) {
        console.log(`    ⚠ nist_ai_rmf_subcategories__risks: ${error.message}`);
      }
    }
  }

  if (migratedCount > 0) console.log(`    ✓ nist_ai_rmf_subcategories__risks: ${migratedCount} rows`);
  return migratedCount;
}

async function migrateNistFileEntityLinks(queryInterface, orgId, tenantHash, idMapping, transaction) {
  const sourceExists = await tableExists(queryInterface, tenantHash, 'file_entity_links', transaction);
  if (!sourceExists) return 0;

  const targetExists = await tableExists(queryInterface, 'public', 'file_entity_links', transaction);
  if (!targetExists) return 0;

  // Get NIST-related file_entity_links from tenant schema
  const [rows] = await queryInterface.sequelize.query(
    `SELECT * FROM "${tenantHash}".file_entity_links
     WHERE framework_type = 'nist_ai_rmf'
     ORDER BY id`,
    { transaction }
  );

  if (rows.length === 0) return 0;

  let migratedCount = 0;

  for (const row of rows) {
    // Map the old subcategory ID to the new one
    const newEntityId = idMapping['nist_ai_rmf_subcategories']?.[String(row.entity_id)];

    if (!newEntityId) {
      // Skip if we don't have a mapping - the subcategory wasn't migrated
      console.log(`    ⚠ file_entity_links (NIST): skipping, no mapping for entity_id ${row.entity_id}`);
      continue;
    }

    try {
      await queryInterface.sequelize.query(
        `INSERT INTO public.file_entity_links
         (organization_id, file_id, framework_type, entity_type, entity_id, project_id, link_type, created_by, created_at)
         VALUES (:orgId, :fileId, :frameworkType, :entityType, :entityId, :projectId, :linkType, :createdBy, :createdAt)
         ON CONFLICT (file_id, framework_type, entity_type, entity_id) DO NOTHING`,
        {
          replacements: {
            orgId,
            fileId: row.file_id,
            frameworkType: row.framework_type,
            entityType: row.entity_type,
            entityId: newEntityId,
            projectId: row.project_id,
            linkType: row.link_type || 'evidence',
            createdBy: row.created_by,
            createdAt: row.created_at || new Date(),
          },
          transaction,
        }
      );
      migratedCount++;
    } catch (error) {
      if (!error.message?.includes('duplicate key')) {
        console.log(`    ⚠ file_entity_links (NIST): ${error.message}`);
      }
    }
  }

  if (migratedCount > 0) console.log(`    ✓ file_entity_links (NIST): ${migratedCount} rows`);
  return migratedCount;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 Starting NIST AI RMF data migration...');

    const transaction = await queryInterface.sequelize.transaction();

    try {
      const structExists = await tableExists(queryInterface, 'public', 'nist_ai_rmf_subcategories_struct', transaction);
      if (!structExists) {
        console.log('⚠ New struct table not found - run seed migration first');
        await transaction.commit();
        return;
      }

      const newStructMapping = await getNewStructMapping(queryInterface, transaction);
      if (Object.keys(newStructMapping).length === 0) {
        console.log('⚠ New struct table is empty - run seed migration first');
        await transaction.commit();
        return;
      }

      // Drop FK constraint on projects_frameworks_id if it exists
      // (projects_frameworks table is not yet migrated to public schema)
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          ALTER TABLE public.nist_ai_rmf_subcategories
          DROP CONSTRAINT IF EXISTS nist_ai_rmf_subcategories_projects_frameworks_id_fkey;
        EXCEPTION WHEN undefined_table THEN
          NULL;
        END $$;
      `, { transaction });

      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations ORDER BY id`,
        { transaction }
      );

      if (organizations.length === 0) {
        console.log('⚠ No organizations found');
        await transaction.commit();
        return;
      }

      console.log(`  Found ${organizations.length} organizations`);

      let totalRows = 0;

      for (const org of organizations) {
        const tenantHash = getTenantHash(org.id);
        const exists = await schemaExists(queryInterface, tenantHash, transaction);
        if (!exists) continue;

        console.log(`\n  Org ${org.id} (${tenantHash})...`);

        // ID mapping for this organization: table -> { oldId: newId }
        const idMapping = {};

        totalRows += await migrateNistSubcategories(queryInterface, org.id, tenantHash, newStructMapping, idMapping, transaction);
        totalRows += await migrateNistRisks(queryInterface, org.id, tenantHash, idMapping, transaction);
        totalRows += await migrateNistFileEntityLinks(queryInterface, org.id, tenantHash, idMapping, transaction);
      }

      await transaction.commit();
      console.log(`\n✅ NIST migration completed! Total rows: ${totalRows}`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('NIST data migration rollback - data not deleted, tenant schemas preserved.');
  }
};
