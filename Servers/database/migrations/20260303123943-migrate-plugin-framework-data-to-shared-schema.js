'use strict';

/**
 * Plugin Framework Data Migration - Tenant to Shared Schema
 *
 * This migration moves existing plugin framework data from tenant schemas
 * to the shared public schema using the struct/impl split:
 *   - Struct tables (shared, no org_id): definitions, level1/2/3_struct
 *   - Per-org tables: custom_frameworks, projects, level2/3_impl, risks
 *
 * For custom framework tables, tenant level1/2/3 data goes into _struct tables,
 * and impl data gets remapped level2_id/level3_id pointing to struct IDs.
 *
 * Non-framework plugin tables (slack, mlflow, intake) use generic migration.
 */

const { getTenantHash } = require('../../dist/tools/getTenantHash');

function toPgArray(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return '{}';
  const escaped = arr.map((item) => {
    const escapedItem = String(item).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${escapedItem}"`;
  });
  return `{${escaped.join(',')}}`;
}

// ============================================================
// CONFIGURATION
// ============================================================

const MIGRATION_KEY = 'plugin_framework_tenant_to_shared_schema_v1';

// Non-framework tables to migrate generically (with organization_id)
const GENERIC_TABLE_ORDER = [
  'slack_webhooks',
  'mlflow_integrations',
  'mlflow_model_records',
  'intake_forms',
  'intake_submissions',
];

// FK mappings for generic tables
const GENERIC_FK_MAPPINGS = {
  intake_submissions: {
    form_id: 'intake_forms',
    original_submission_id: 'intake_submissions',
  },
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

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

async function getTableColumns(queryInterface, schemaName, tableName, transaction) {
  const [results] = await queryInterface.sequelize.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = :schemaName AND table_name = :tableName
     ORDER BY ordinal_position`,
    { replacements: { schemaName, tableName }, transaction }
  );
  return results.map(r => r.column_name);
}

async function getRowCount(queryInterface, schemaName, tableName, transaction) {
  const exists = await tableExists(queryInterface, schemaName, tableName, transaction);
  if (!exists) return 0;
  const [results] = await queryInterface.sequelize.query(
    `SELECT COUNT(*) as count FROM "${schemaName}"."${tableName}"`,
    { transaction }
  );
  return parseInt(results[0]?.count || 0, 10);
}

// ============================================================
// MIGRATION STATUS TRACKING
// ============================================================

async function ensureMigrationStatusTable(queryInterface, transaction) {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS public.plugin_framework_migration_status (
      migration_key VARCHAR(255) PRIMARY KEY,
      status VARCHAR(50) NOT NULL,
      organizations_migrated INTEGER DEFAULT 0,
      organizations_total INTEGER DEFAULT 0,
      current_organization_id INTEGER,
      current_table VARCHAR(255),
      error_message TEXT,
      rows_migrated INTEGER DEFAULT 0,
      started_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `, { transaction });
}

async function getMigrationStatus(queryInterface, transaction) {
  const [results] = await queryInterface.sequelize.query(
    `SELECT * FROM public.plugin_framework_migration_status WHERE migration_key = :key`,
    { replacements: { key: MIGRATION_KEY }, transaction }
  );
  return results[0] || null;
}

async function updateMigrationStatus(queryInterface, status, data = {}, transaction) {
  const existing = await getMigrationStatus(queryInterface, transaction);

  if (existing) {
    const updates = ['updated_at = NOW()'];
    const replacements = { key: MIGRATION_KEY };

    if (status) { updates.push('status = :status'); replacements.status = status; }
    if (data.organizations_migrated !== undefined) { updates.push('organizations_migrated = :om'); replacements.om = data.organizations_migrated; }
    if (data.organizations_total !== undefined) { updates.push('organizations_total = :ot'); replacements.ot = data.organizations_total; }
    if (data.current_organization_id !== undefined) { updates.push('current_organization_id = :coid'); replacements.coid = data.current_organization_id; }
    if (data.current_table !== undefined) { updates.push('current_table = :ct'); replacements.ct = data.current_table; }
    if (data.error_message !== undefined) { updates.push('error_message = :em'); replacements.em = data.error_message; }
    if (data.rows_migrated !== undefined) { updates.push('rows_migrated = :rm'); replacements.rm = data.rows_migrated; }
    if (status === 'completed') { updates.push('completed_at = NOW()'); }

    await queryInterface.sequelize.query(
      `UPDATE public.plugin_framework_migration_status SET ${updates.join(', ')} WHERE migration_key = :key`,
      { replacements, transaction }
    );
  } else {
    await queryInterface.sequelize.query(`
      INSERT INTO public.plugin_framework_migration_status
      (migration_key, status, organizations_migrated, organizations_total, started_at, created_at, updated_at)
      VALUES (:key, :status, :om, :ot, NOW(), NOW(), NOW())
    `, {
      replacements: {
        key: MIGRATION_KEY,
        status: status || 'pending',
        om: data.organizations_migrated || 0,
        ot: data.organizations_total || 0,
      },
      transaction,
    });
  }
}

// ============================================================
// GENERIC TABLE MIGRATION (for non-framework tables)
// ============================================================

async function migrateGenericTable(queryInterface, orgId, tenantHash, tableName, idMapping, transaction) {
  const sourceExists = await tableExists(queryInterface, tenantHash, tableName, transaction);
  if (!sourceExists) return 0;

  const targetExists = await tableExists(queryInterface, 'public', tableName, transaction);
  if (!targetExists) return 0;

  const sourceCount = await getRowCount(queryInterface, tenantHash, tableName, transaction);
  if (sourceCount === 0) return 0;

  const sourceColumns = await getTableColumns(queryInterface, tenantHash, tableName, transaction);
  if (sourceColumns.length === 0) return 0;

  const fkMappings = GENERIC_FK_MAPPINGS[tableName] || {};
  if (!idMapping[tableName]) idMapping[tableName] = {};

  const [rows] = await queryInterface.sequelize.query(
    `SELECT * FROM "${tenantHash}"."${tableName}" ORDER BY id`,
    { transaction }
  );

  let migratedCount = 0;

  for (const row of rows) {
    const oldId = row.id;
    const insertData = {};

    for (const col of sourceColumns) {
      if (col === 'id') continue;
      let value = row[col];
      if (fkMappings[col] && value !== null && value !== undefined) {
        const newValue = idMapping[fkMappings[col]]?.[String(value)];
        if (newValue !== null && newValue !== undefined) value = newValue;
      }
      insertData[col] = value;
    }

    insertData.organization_id = orgId;

    const columns = Object.keys(insertData);
    const columnList = columns.map(c => `"${c}"`).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const values = columns.map(c => insertData[c]);

    try {
      const [insertResult] = await queryInterface.sequelize.query(
        `INSERT INTO public."${tableName}" (${columnList}) VALUES (${placeholders}) RETURNING id`,
        { bind: values, transaction }
      );
      const newId = insertResult[0]?.id;
      if (newId != null && oldId != null) idMapping[tableName][String(oldId)] = newId;
      migratedCount++;
    } catch (error) {
      if (error.message && (error.message.includes('duplicate key') || error.message.includes('unique constraint'))) {
        migratedCount++;
      } else {
        throw error;
      }
    }
  }

  if (migratedCount > 0) console.log(`    ✓ ${tableName}: ${migratedCount} rows`);
  return migratedCount;
}

// ============================================================
// CUSTOM FRAMEWORK MIGRATION (struct/impl split)
// ============================================================

/**
 * Migrate custom framework data from a tenant schema to public schema.
 *
 * Flow:
 * 1. Read tenant's custom_frameworks → create definitions (deduplicated) + per-org records
 * 2. Read tenant's level1/2/3 → insert into _struct tables (deduplicated by plugin_key)
 * 3. Read tenant's level2/3_impl → insert with remapped struct IDs
 * 4. Read tenant's risk tables → insert with remapped impl IDs
 * 5. Migrate file_entity_links
 *
 * Struct deduplication: If a definition for a plugin_key already exists (from another org),
 * reuse the existing struct data. Only the first org's level1/2/3 populates struct tables.
 */
async function migrateCustomFrameworkData(queryInterface, orgId, tenantHash, globalStructMap, transaction) {
  let totalMigrated = 0;

  // --- Step 1: custom_frameworks → definitions + per-org records ---
  const hasCF = await tableExists(queryInterface, tenantHash, 'custom_frameworks', transaction);
  if (!hasCF) {
    console.log(`    ⊘ custom_frameworks: not found in tenant schema`);
    return totalMigrated;
  }

  const [tenantFrameworks] = await queryInterface.sequelize.query(
    `SELECT * FROM "${tenantHash}".custom_frameworks ORDER BY id`,
    { transaction }
  );

  if (tenantFrameworks.length === 0) return totalMigrated;

  // ID mappings for this org
  const fwIdMap = {};       // old framework_id → new public custom_frameworks.id
  const l1IdMap = {};       // old level1_id → new struct level1_id
  const l2IdMap = {};       // old level2_id → new struct level2_id
  const l3IdMap = {};       // old level3_id → new struct level3_id
  const projFwIdMap = {};   // old custom_framework_projects.id → new
  const l2ImplIdMap = {};   // old level2_impl.id → new
  const l3ImplIdMap = {};   // old level3_impl.id → new

  for (const fw of tenantFrameworks) {
    const pluginKey = fw.plugin_key;
    if (!pluginKey) continue;

    // 1a. Ensure definition exists (shared, no org_id)
    let defId;
    if (globalStructMap.definitions[pluginKey]) {
      defId = globalStructMap.definitions[pluginKey];
    } else {
      // Check if definition already exists in DB
      const [existingDef] = await queryInterface.sequelize.query(
        `SELECT id FROM public.custom_framework_definitions WHERE plugin_key = :pluginKey LIMIT 1`,
        { replacements: { pluginKey }, transaction }
      );

      if (existingDef.length > 0) {
        defId = existingDef[0].id;
      } else {
        const [insertedDef] = await queryInterface.sequelize.query(
          `INSERT INTO public.custom_framework_definitions
           (plugin_key, name, description, version, is_organizational, hierarchy_type,
            level_1_name, level_2_name, level_3_name, file_source, created_at, updated_at)
           VALUES (:pluginKey, :name, :description, :version, :isOrg, :hierarchyType,
                   :l1Name, :l2Name, :l3Name, :fileSource, :createdAt, :updatedAt)
           RETURNING id`,
          {
            replacements: {
              pluginKey,
              name: fw.name,
              description: fw.description,
              version: fw.version || '1.0.0',
              isOrg: fw.is_organizational || false,
              hierarchyType: fw.hierarchy_type || 'two_level',
              l1Name: fw.level_1_name || 'Category',
              l2Name: fw.level_2_name || 'Control',
              l3Name: fw.level_3_name || null,
              fileSource: fw.file_source || null,
              createdAt: fw.created_at || new Date(),
              updatedAt: fw.updated_at || new Date(),
            },
            transaction,
          }
        );
        defId = insertedDef[0].id;
      }
      globalStructMap.definitions[pluginKey] = defId;
    }

    // 1b. Create per-org custom_frameworks record
    const [insertedFw] = await queryInterface.sequelize.query(
      `INSERT INTO public.custom_frameworks
       (organization_id, definition_id, plugin_key, name, description, version,
        is_organizational, hierarchy_type, level_1_name, level_2_name, level_3_name,
        file_source, created_at, updated_at)
       VALUES (:orgId, :defId, :pluginKey, :name, :description, :version,
               :isOrg, :hierarchyType, :l1Name, :l2Name, :l3Name,
               :fileSource, :createdAt, :updatedAt)
       RETURNING id`,
      {
        replacements: {
          orgId,
          defId,
          pluginKey,
          name: fw.name,
          description: fw.description,
          version: fw.version || '1.0.0',
          isOrg: fw.is_organizational || false,
          hierarchyType: fw.hierarchy_type || 'two_level',
          l1Name: fw.level_1_name || 'Category',
          l2Name: fw.level_2_name || 'Control',
          l3Name: fw.level_3_name || null,
          fileSource: fw.file_source || null,
          createdAt: fw.created_at || new Date(),
          updatedAt: fw.updated_at || new Date(),
        },
        transaction,
      }
    );
    fwIdMap[fw.id] = insertedFw[0].id;
    totalMigrated++;

    // --- Step 2: Populate struct tables (only if not already done for this plugin_key) ---
    const needsStruct = !globalStructMap.structPopulated[pluginKey];

    if (needsStruct) {
      // 2a. Level 1
      const hasL1 = await tableExists(queryInterface, tenantHash, 'custom_framework_level1', transaction);
      if (hasL1) {
        const [l1Rows] = await queryInterface.sequelize.query(
          `SELECT * FROM "${tenantHash}".custom_framework_level1 WHERE framework_id = :fwId ORDER BY order_no, id`,
          { replacements: { fwId: fw.id }, transaction }
        );

        for (const l1 of l1Rows) {
          const [inserted] = await queryInterface.sequelize.query(
            `INSERT INTO public.custom_framework_level1_struct
             (definition_id, title, description, order_no, metadata, created_at)
             VALUES (:defId, :title, :description, :orderNo, :metadata::jsonb, :createdAt)
             RETURNING id`,
            {
              replacements: {
                defId,
                title: l1.title,
                description: l1.description,
                orderNo: l1.order_no || 1,
                metadata: JSON.stringify(l1.metadata || {}),
                createdAt: l1.created_at || new Date(),
              },
              transaction,
            }
          );
          l1IdMap[l1.id] = inserted[0].id;

          // Store in global struct map by position for other orgs to use
          if (!globalStructMap.level1[pluginKey]) globalStructMap.level1[pluginKey] = {};
          globalStructMap.level1[pluginKey][l1.order_no || 1] = inserted[0].id;
          totalMigrated++;
        }

        // 2b. Level 2
        const hasL2 = await tableExists(queryInterface, tenantHash, 'custom_framework_level2', transaction);
        if (hasL2) {
          const oldL1Ids = Object.keys(l1IdMap).map(Number);
          if (oldL1Ids.length > 0) {
            const [l2Rows] = await queryInterface.sequelize.query(
              `SELECT * FROM "${tenantHash}".custom_framework_level2 WHERE level1_id IN (:l1Ids) ORDER BY level1_id, order_no, id`,
              { replacements: { l1Ids: oldL1Ids }, transaction }
            );

            for (const l2 of l2Rows) {
              const newL1Id = l1IdMap[l2.level1_id];
              if (!newL1Id) continue;

              const [inserted] = await queryInterface.sequelize.query(
                `INSERT INTO public.custom_framework_level2_struct
                 (level1_id, title, description, order_no, summary, questions, evidence_examples, metadata, created_at)
                 VALUES (:l1Id, :title, :description, :orderNo, :summary, :questions::text[], :evidenceExamples::text[], :metadata::jsonb, :createdAt)
                 RETURNING id`,
                {
                  replacements: {
                    l1Id: newL1Id,
                    title: l2.title,
                    description: l2.description,
                    orderNo: l2.order_no || 1,
                    summary: l2.summary || null,
                    questions: toPgArray(l2.questions),
                    evidenceExamples: toPgArray(l2.evidence_examples),
                    metadata: JSON.stringify(l2.metadata || {}),
                    createdAt: l2.created_at || new Date(),
                  },
                  transaction,
                }
              );
              l2IdMap[l2.id] = inserted[0].id;

              // Store in global struct map by position
              const l1Order = Object.entries(l1IdMap).find(([old]) => Number(old) === l2.level1_id);
              const l1OrderNo = l1Order ? (tenantFrameworks.length > 0 ? l2.level1_id : 1) : 1;
              if (!globalStructMap.level2[pluginKey]) globalStructMap.level2[pluginKey] = {};
              // Use composite key: l1_struct_id + order_no
              globalStructMap.level2[pluginKey][`${newL1Id}-${l2.order_no || 1}`] = inserted[0].id;
              totalMigrated++;
            }

            // 2c. Level 3
            const hasL3 = await tableExists(queryInterface, tenantHash, 'custom_framework_level3', transaction);
            if (hasL3) {
              const oldL2Ids = Object.keys(l2IdMap).map(Number);
              if (oldL2Ids.length > 0) {
                const [l3Rows] = await queryInterface.sequelize.query(
                  `SELECT * FROM "${tenantHash}".custom_framework_level3 WHERE level2_id IN (:l2Ids) ORDER BY level2_id, order_no, id`,
                  { replacements: { l2Ids: oldL2Ids }, transaction }
                );

                for (const l3 of l3Rows) {
                  const newL2Id = l2IdMap[l3.level2_id];
                  if (!newL2Id) continue;

                  const [inserted] = await queryInterface.sequelize.query(
                    `INSERT INTO public.custom_framework_level3_struct
                     (level2_id, title, description, order_no, summary, questions, evidence_examples, metadata, created_at)
                     VALUES (:l2Id, :title, :description, :orderNo, :summary, :questions::text[], :evidenceExamples::text[], :metadata::jsonb, :createdAt)
                     RETURNING id`,
                    {
                      replacements: {
                        l2Id: newL2Id,
                        title: l3.title,
                        description: l3.description,
                        orderNo: l3.order_no || 1,
                        summary: l3.summary || null,
                        questions: toPgArray(l3.questions),
                        evidenceExamples: toPgArray(l3.evidence_examples),
                        metadata: JSON.stringify(l3.metadata || {}),
                        createdAt: l3.created_at || new Date(),
                      },
                      transaction,
                    }
                  );
                  l3IdMap[l3.id] = inserted[0].id;

                  if (!globalStructMap.level3[pluginKey]) globalStructMap.level3[pluginKey] = {};
                  globalStructMap.level3[pluginKey][`${newL2Id}-${l3.order_no || 1}`] = inserted[0].id;
                  totalMigrated++;
                }
              }
            }
          }
        }
      }

      globalStructMap.structPopulated[pluginKey] = true;
    } else {
      // Struct already populated by another org - build l1/l2/l3 ID maps via position matching
      const hasL1 = await tableExists(queryInterface, tenantHash, 'custom_framework_level1', transaction);
      if (hasL1) {
        const [l1Rows] = await queryInterface.sequelize.query(
          `SELECT * FROM "${tenantHash}".custom_framework_level1 WHERE framework_id = :fwId ORDER BY order_no, id`,
          { replacements: { fwId: fw.id }, transaction }
        );

        // Match by order_no to get struct IDs
        for (const l1 of l1Rows) {
          const structL1Id = globalStructMap.level1[pluginKey]?.[l1.order_no || 1];
          if (structL1Id) l1IdMap[l1.id] = structL1Id;
        }

        const hasL2 = await tableExists(queryInterface, tenantHash, 'custom_framework_level2', transaction);
        if (hasL2) {
          const oldL1Ids = Object.keys(l1IdMap).map(Number);
          if (oldL1Ids.length > 0) {
            const [l2Rows] = await queryInterface.sequelize.query(
              `SELECT * FROM "${tenantHash}".custom_framework_level2 WHERE level1_id IN (:l1Ids) ORDER BY level1_id, order_no, id`,
              { replacements: { l1Ids: oldL1Ids }, transaction }
            );

            for (const l2 of l2Rows) {
              const newL1Id = l1IdMap[l2.level1_id];
              if (!newL1Id) continue;
              const structL2Id = globalStructMap.level2[pluginKey]?.[`${newL1Id}-${l2.order_no || 1}`];
              if (structL2Id) l2IdMap[l2.id] = structL2Id;
            }

            const hasL3 = await tableExists(queryInterface, tenantHash, 'custom_framework_level3', transaction);
            if (hasL3) {
              const oldL2Ids = Object.keys(l2IdMap).map(Number);
              if (oldL2Ids.length > 0) {
                const [l3Rows] = await queryInterface.sequelize.query(
                  `SELECT * FROM "${tenantHash}".custom_framework_level3 WHERE level2_id IN (:l2Ids) ORDER BY level2_id, order_no, id`,
                  { replacements: { l2Ids: oldL2Ids }, transaction }
                );

                for (const l3 of l3Rows) {
                  const newL2Id = l2IdMap[l3.level2_id];
                  if (!newL2Id) continue;
                  const structL3Id = globalStructMap.level3[pluginKey]?.[`${newL2Id}-${l3.order_no || 1}`];
                  if (structL3Id) l3IdMap[l3.id] = structL3Id;
                }
              }
            }
          }
        }
      }
    }
  }

  // --- Step 3: custom_framework_projects ---
  const hasCFP = await tableExists(queryInterface, tenantHash, 'custom_framework_projects', transaction);
  if (hasCFP) {
    const [projRows] = await queryInterface.sequelize.query(
      `SELECT * FROM "${tenantHash}".custom_framework_projects ORDER BY id`,
      { transaction }
    );

    for (const proj of projRows) {
      const newFwId = fwIdMap[proj.framework_id];
      if (!newFwId) continue;

      try {
        const [inserted] = await queryInterface.sequelize.query(
          `INSERT INTO public.custom_framework_projects
           (organization_id, framework_id, project_id, created_at)
           VALUES (:orgId, :fwId, :projectId, :createdAt)
           RETURNING id`,
          {
            replacements: {
              orgId,
              fwId: newFwId,
              projectId: proj.project_id,
              createdAt: proj.created_at || new Date(),
            },
            transaction,
          }
        );
        projFwIdMap[proj.id] = inserted[0].id;
        totalMigrated++;
      } catch (error) {
        if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
          // Already exists - find and map
          const [existing] = await queryInterface.sequelize.query(
            `SELECT id FROM public.custom_framework_projects
             WHERE organization_id = :orgId AND framework_id = :fwId AND project_id = :projectId LIMIT 1`,
            { replacements: { orgId, fwId: newFwId, projectId: proj.project_id }, transaction }
          );
          if (existing[0]?.id) projFwIdMap[proj.id] = existing[0].id;
          totalMigrated++;
        } else {
          throw error;
        }
      }
    }

    if (Object.keys(projFwIdMap).length > 0) {
      console.log(`    ✓ custom_framework_projects: ${Object.keys(projFwIdMap).length} rows`);
    }
  }

  // --- Step 4: custom_framework_level2_impl ---
  const hasL2Impl = await tableExists(queryInterface, tenantHash, 'custom_framework_level2_impl', transaction);
  if (hasL2Impl) {
    const [implRows] = await queryInterface.sequelize.query(
      `SELECT * FROM "${tenantHash}".custom_framework_level2_impl ORDER BY id`,
      { transaction }
    );

    for (const impl of implRows) {
      const newL2Id = l2IdMap[impl.level2_id];
      const newProjFwId = projFwIdMap[impl.project_framework_id];
      if (!newL2Id || !newProjFwId) continue;

      const [inserted] = await queryInterface.sequelize.query(
        `INSERT INTO public.custom_framework_level2_impl
         (organization_id, level2_id, project_framework_id, status, owner, reviewer, approver,
          due_date, implementation_details, evidence_links, feedback_links, auditor_feedback,
          is_demo, created_at, updated_at)
         VALUES (:orgId, :l2Id, :projFwId, :status, :owner, :reviewer, :approver,
                 :dueDate, :implDetails, :evidenceLinks::jsonb, :feedbackLinks::jsonb, :auditorFeedback,
                 :isDemo, :createdAt, :updatedAt)
         RETURNING id`,
        {
          replacements: {
            orgId,
            l2Id: newL2Id,
            projFwId: newProjFwId,
            status: impl.status || 'Not started',
            owner: impl.owner || null,
            reviewer: impl.reviewer || null,
            approver: impl.approver || null,
            dueDate: impl.due_date || null,
            implDetails: impl.implementation_details || null,
            evidenceLinks: JSON.stringify(impl.evidence_links || []),
            feedbackLinks: JSON.stringify(impl.feedback_links || []),
            auditorFeedback: impl.auditor_feedback || null,
            isDemo: impl.is_demo || false,
            createdAt: impl.created_at || new Date(),
            updatedAt: impl.updated_at || new Date(),
          },
          transaction,
        }
      );
      l2ImplIdMap[impl.id] = inserted[0].id;
      totalMigrated++;
    }

    if (Object.keys(l2ImplIdMap).length > 0) {
      console.log(`    ✓ custom_framework_level2_impl: ${Object.keys(l2ImplIdMap).length} rows`);
    }
  }

  // --- Step 5: custom_framework_level3_impl ---
  const hasL3Impl = await tableExists(queryInterface, tenantHash, 'custom_framework_level3_impl', transaction);
  if (hasL3Impl) {
    const [implRows] = await queryInterface.sequelize.query(
      `SELECT * FROM "${tenantHash}".custom_framework_level3_impl ORDER BY id`,
      { transaction }
    );

    for (const impl of implRows) {
      const newL3Id = l3IdMap[impl.level3_id];
      const newL2ImplId = l2ImplIdMap[impl.level2_impl_id];
      if (!newL3Id || !newL2ImplId) continue;

      const [inserted] = await queryInterface.sequelize.query(
        `INSERT INTO public.custom_framework_level3_impl
         (organization_id, level3_id, level2_impl_id, status, owner, reviewer, approver,
          due_date, implementation_details, evidence_links, feedback_links, auditor_feedback,
          is_demo, created_at, updated_at)
         VALUES (:orgId, :l3Id, :l2ImplId, :status, :owner, :reviewer, :approver,
                 :dueDate, :implDetails, :evidenceLinks::jsonb, :feedbackLinks::jsonb, :auditorFeedback,
                 :isDemo, :createdAt, :updatedAt)
         RETURNING id`,
        {
          replacements: {
            orgId,
            l3Id: newL3Id,
            l2ImplId: newL2ImplId,
            status: impl.status || 'Not started',
            owner: impl.owner || null,
            reviewer: impl.reviewer || null,
            approver: impl.approver || null,
            dueDate: impl.due_date || null,
            implDetails: impl.implementation_details || null,
            evidenceLinks: JSON.stringify(impl.evidence_links || []),
            feedbackLinks: JSON.stringify(impl.feedback_links || []),
            auditorFeedback: impl.auditor_feedback || null,
            isDemo: impl.is_demo || false,
            createdAt: impl.created_at || new Date(),
            updatedAt: impl.updated_at || new Date(),
          },
          transaction,
        }
      );
      l3ImplIdMap[impl.id] = inserted[0].id;
      totalMigrated++;
    }

    if (Object.keys(l3ImplIdMap).length > 0) {
      console.log(`    ✓ custom_framework_level3_impl: ${Object.keys(l3ImplIdMap).length} rows`);
    }
  }

  // --- Step 6: Risk tables ---
  const hasL2Risks = await tableExists(queryInterface, tenantHash, 'custom_framework_level2_risks', transaction);
  if (hasL2Risks) {
    const [riskRows] = await queryInterface.sequelize.query(
      `SELECT * FROM "${tenantHash}".custom_framework_level2_risks`,
      { transaction }
    );

    let riskCount = 0;
    for (const risk of riskRows) {
      const newImplId = l2ImplIdMap[risk.level2_impl_id];
      if (!newImplId) continue;

      try {
        await queryInterface.sequelize.query(
          `INSERT INTO public.custom_framework_level2_risks (organization_id, level2_impl_id, risk_id)
           VALUES (:orgId, :implId, :riskId)
           ON CONFLICT (level2_impl_id, risk_id) DO NOTHING`,
          { replacements: { orgId, implId: newImplId, riskId: risk.risk_id }, transaction }
        );
        riskCount++;
      } catch (e) { /* ignore duplicates */ }
    }
    if (riskCount > 0) console.log(`    ✓ custom_framework_level2_risks: ${riskCount} rows`);
    totalMigrated += riskCount;
  }

  const hasL3Risks = await tableExists(queryInterface, tenantHash, 'custom_framework_level3_risks', transaction);
  if (hasL3Risks) {
    const [riskRows] = await queryInterface.sequelize.query(
      `SELECT * FROM "${tenantHash}".custom_framework_level3_risks`,
      { transaction }
    );

    let riskCount = 0;
    for (const risk of riskRows) {
      const newImplId = l3ImplIdMap[risk.level3_impl_id];
      if (!newImplId) continue;

      try {
        await queryInterface.sequelize.query(
          `INSERT INTO public.custom_framework_level3_risks (organization_id, level3_impl_id, risk_id)
           VALUES (:orgId, :implId, :riskId)
           ON CONFLICT (level3_impl_id, risk_id) DO NOTHING`,
          { replacements: { orgId, implId: newImplId, riskId: risk.risk_id }, transaction }
        );
        riskCount++;
      } catch (e) { /* ignore duplicates */ }
    }
    if (riskCount > 0) console.log(`    ✓ custom_framework_level3_risks: ${riskCount} rows`);
    totalMigrated += riskCount;
  }

  // --- Step 7: file_entity_links ---
  const hasFEL = await tableExists(queryInterface, tenantHash, 'file_entity_links', transaction);
  if (hasFEL) {
    const [felRows] = await queryInterface.sequelize.query(
      `SELECT * FROM "${tenantHash}".file_entity_links
       WHERE entity_type IN ('level2', 'level3', 'level2_impl', 'level3_impl')
       ORDER BY id`,
      { transaction }
    );

    const filesMap = {};
    let felCount = 0;

    for (const row of felRows) {
      let newFileId = row.file_id;

      // Try to find file in public schema
      if (filesMap[row.file_id]) {
        newFileId = filesMap[row.file_id];
      } else {
        const [existingFile] = await queryInterface.sequelize.query(
          `SELECT id FROM public.files WHERE id = :fileId AND organization_id = :orgId LIMIT 1`,
          { replacements: { fileId: row.file_id, orgId }, transaction }
        );

        if (existingFile.length > 0) {
          newFileId = existingFile[0].id;
          filesMap[row.file_id] = newFileId;
        } else {
          // Migrate file from tenant
          const [tenantFile] = await queryInterface.sequelize.query(
            `SELECT * FROM "${tenantHash}".files WHERE id = :fileId LIMIT 1`,
            { replacements: { fileId: row.file_id }, transaction }
          );

          if (tenantFile.length === 0) continue;
          const file = tenantFile[0];

          try {
            const [inserted] = await queryInterface.sequelize.query(
              `INSERT INTO public.files
               (organization_id, project_id, filename, file_path, type, size, source, uploaded_by, uploaded_time, updated_at)
               VALUES (:orgId, :projectId, :filename, :filePath, :fileType, :size, :source, :uploadedBy, :uploadedTime, :updatedAt)
               RETURNING id`,
              {
                replacements: {
                  orgId,
                  projectId: file.project_id,
                  filename: file.filename,
                  filePath: file.file_path,
                  fileType: file.type,
                  size: file.size,
                  source: file.source,
                  uploadedBy: file.uploaded_by,
                  uploadedTime: file.uploaded_time || new Date(),
                  updatedAt: file.updated_at || new Date(),
                },
                transaction,
              }
            );
            newFileId = inserted[0].id;
            filesMap[row.file_id] = newFileId;
          } catch (fileError) {
            console.log(`    ⚠ Could not migrate file ${row.file_id}: ${fileError.message}`);
            continue;
          }
        }
      }

      // Remap entity_id based on entity_type
      let newEntityId = row.entity_id;
      if (row.entity_type === 'level2') {
        newEntityId = l2IdMap[row.entity_id] || row.entity_id;
      } else if (row.entity_type === 'level3') {
        newEntityId = l3IdMap[row.entity_id] || row.entity_id;
      } else if (row.entity_type === 'level2_impl') {
        newEntityId = l2ImplIdMap[row.entity_id] || row.entity_id;
      } else if (row.entity_type === 'level3_impl') {
        newEntityId = l3ImplIdMap[row.entity_id] || row.entity_id;
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
              fileId: newFileId,
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
        felCount++;
      } catch (error) {
        if (!error.message?.includes('duplicate key')) {
          console.log(`    ⚠ file_entity_links error: ${error.message}`);
        }
      }
    }

    if (felCount > 0) console.log(`    ✓ file_entity_links: ${felCount} rows`);
    totalMigrated += felCount;
  }

  return totalMigrated;
}

// ============================================================
// ORGANIZATION MIGRATION
// ============================================================

async function migrateOrganization(queryInterface, orgId, tenantHash, globalStructMap, transaction) {
  console.log(`\n  Migrating organization ${orgId} (${tenantHash})...`);

  const exists = await schemaExists(queryInterface, tenantHash, transaction);
  if (!exists) {
    console.log(`    ⊘ No tenant schema found, skipping`);
    return { success: true, rowsMigrated: 0 };
  }

  let totalRowsMigrated = 0;

  // Migrate custom framework tables (struct/impl split)
  totalRowsMigrated += await migrateCustomFrameworkData(
    queryInterface, orgId, tenantHash, globalStructMap, transaction
  );

  // Migrate non-framework tables generically
  const genericIdMapping = {};
  for (const tableName of GENERIC_TABLE_ORDER) {
    await updateMigrationStatus(queryInterface, 'in_progress', {
      current_organization_id: orgId,
      current_table: tableName,
    }, transaction);

    totalRowsMigrated += await migrateGenericTable(
      queryInterface, orgId, tenantHash, tableName, genericIdMapping, transaction
    );
  }

  console.log(`  ✓ Organization ${orgId} migrated (${totalRowsMigrated} rows)`);
  return { success: true, rowsMigrated: totalRowsMigrated };
}

// ============================================================
// MAIN MIGRATION
// ============================================================

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   PLUGIN FRAMEWORK: MIGRATE TENANT DATA TO SHARED SCHEMA   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Ensure migration status table exists
      await ensureMigrationStatusTable(queryInterface, transaction);

      // 2. Check if migration already completed
      const status = await getMigrationStatus(queryInterface, transaction);
      if (status && status.status === 'completed') {
        console.log('✓ Migration already completed');
        await transaction.commit();
        return;
      }

      // 3. Get all organizations with framework plugin installations
      const [installations] = await queryInterface.sequelize.query(
        `SELECT DISTINCT pi.organization_id, o.name as org_name
         FROM plugin_installations pi
         JOIN organizations o ON o.id = pi.organization_id
         WHERE pi.status = 'installed'
         AND pi.plugin_key NOT IN ('mlflow', 'slack', 'azure-ai', 'jira-assets', 'dataset-bulk-upload', 'risk-import')
         ORDER BY pi.organization_id`,
        { transaction }
      );

      // Also check all orgs for tenant schemas with plugin data
      const [allOrgs] = await queryInterface.sequelize.query(
        `SELECT id, name FROM organizations ORDER BY id`,
        { transaction }
      );

      const orgIds = new Set();
      const orgsToMigrate = [];

      for (const inst of installations) {
        if (!orgIds.has(inst.organization_id)) {
          orgIds.add(inst.organization_id);
          orgsToMigrate.push({ id: inst.organization_id, name: inst.org_name });
        }
      }

      for (const org of allOrgs) {
        if (!orgIds.has(org.id)) {
          const tenantHash = getTenantHash(org.id);
          const hasSchema = await schemaExists(queryInterface, tenantHash, transaction);
          if (hasSchema) {
            const hasPluginData = await tableExists(queryInterface, tenantHash, 'custom_frameworks', transaction);
            if (hasPluginData) {
              const rowCount = await getRowCount(queryInterface, tenantHash, 'custom_frameworks', transaction);
              if (rowCount > 0) {
                orgIds.add(org.id);
                orgsToMigrate.push({ id: org.id, name: org.name });
              }
            }
          }
        }
      }

      if (orgsToMigrate.length === 0) {
        console.log('ℹ️  No organizations with plugin framework data found');
        await updateMigrationStatus(queryInterface, 'completed', {
          organizations_migrated: 0,
          organizations_total: 0,
        }, transaction);
        await transaction.commit();
        return;
      }

      console.log(`Found ${orgsToMigrate.length} organizations with plugin framework data to migrate.\n`);

      // 4. Initialize migration status
      await updateMigrationStatus(queryInterface, 'in_progress', {
        organizations_migrated: 0,
        organizations_total: orgsToMigrate.length,
      }, transaction);

      // Global struct map: tracks which plugin_keys have had their struct data populated
      const globalStructMap = {
        definitions: {},     // pluginKey → definition_id
        structPopulated: {}, // pluginKey → true (struct already populated)
        level1: {},          // pluginKey → { order_no → struct_id }
        level2: {},          // pluginKey → { "l1StructId-orderNo" → struct_id }
        level3: {},          // pluginKey → { "l2StructId-orderNo" → struct_id }
      };

      // 5. Migrate each organization
      let totalOrgsMigrated = 0;
      let totalRowsMigrated = 0;
      const errors = [];

      for (const org of orgsToMigrate) {
        const tenantHash = getTenantHash(org.id);

        try {
          const result = await migrateOrganization(queryInterface, org.id, tenantHash, globalStructMap, transaction);
          if (result.success) {
            totalOrgsMigrated++;
            totalRowsMigrated += result.rowsMigrated;
          }
        } catch (error) {
          console.log(`  ✗ Failed to migrate organization ${org.id}: ${error.message}`);
          errors.push(`Org ${org.id}: ${error.message}`);
        }

        await updateMigrationStatus(queryInterface, 'in_progress', {
          organizations_migrated: totalOrgsMigrated,
          rows_migrated: totalRowsMigrated,
        }, transaction);
      }

      // 6. Update final status
      const finalStatus = errors.length === 0 ? 'completed' : 'completed_with_errors';
      await updateMigrationStatus(queryInterface, finalStatus, {
        organizations_migrated: totalOrgsMigrated,
        rows_migrated: totalRowsMigrated,
        error_message: errors.length > 0 ? errors.join('; ') : null,
      }, transaction);

      await transaction.commit();

      // Print summary
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║                    MIGRATION COMPLETE                       ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log(`\n  ✓ Organizations migrated: ${totalOrgsMigrated}/${orgsToMigrate.length}`);
      console.log(`  ✓ Total rows migrated: ${totalRowsMigrated}`);

      if (errors.length > 0) {
        console.log(`\n  ⚠ Errors (${errors.length}):`);
        for (const err of errors) {
          console.log(`    - ${err}`);
        }
      }

      console.log('\n  📁 Old tenant schemas have been preserved.');
      console.log('     Run cleanup migration separately after verifying data.\n');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   PLUGIN FRAMEWORK: ROLLBACK NOT SUPPORTED                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('This migration copies data from tenant schemas to public schema.');
    console.log('The original tenant schemas are preserved and not modified.');
    console.log('');
    console.log('To "rollback", you can:');
    console.log('  1. Delete data from public.custom_framework_* tables');
    console.log('  2. Reset migration status in plugin_framework_migration_status');
    console.log('');
    console.log('The original data in tenant schemas remains intact.');
  }
};
