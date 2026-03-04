/**
 * Migrate Tenant Data to Shared Schema
 *
 * This script migrates data from old tenant schemas (e.g., "abc123".projects)
 * to the new shared public schema (projects with organization_id).
 *
 * USAGE:
 *   npm run migrate:shared-schema
 *   OR automatically on server startup
 *
 * PREREQUISITES:
 *   1. Run database migrations first: npx sequelize db:migrate
 *   2. Backup your database before running this script
 *
 * WHAT THIS SCRIPT DOES:
 *   1. Finds all organizations with tenant schemas
 *   2. For each tenant, copies data from tenant schema to public schema
 *   3. Remaps all foreign key references using in-memory mapping
 *   4. Validates row counts match
 *   5. Drops tenant schemas after successful migration (configurable)
 */

import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";
import { createHash } from "crypto";
import {
  FK_MAPPINGS,
  STRUCT_REFERENCES,
  SKIP_TABLES,
  MIGRATION_KEY,
  BATCH_SIZE,
  getAllTablesInOrder,
  IdMapping,
  ValidationReport,
  MigrationResult,
} from "./migrationConfig";

// ============================================================
// COLUMN TYPE MAPPINGS
// ============================================================

/**
 * PostgreSQL ARRAY columns in the PUBLIC schema that should NOT be JSON.stringify'd
 * These need to stay as JavaScript arrays for Sequelize to convert properly
 *
 * NOTE: Only include columns where BOTH tenant and public schemas use ARRAY type.
 * If public schema has JSONB but tenant has ARRAY, the array needs to be stringified.
 */
const POSTGRES_ARRAY_COLUMNS: Record<string, string[]> = {
  answers_eu: ['dropdown_options'],
  evidence_hub: ['mapped_model_ids'],
  nist_ai_rmf_subcategories: ['tags'],
  policy_manager: ['tags'],
  risks: ['risk_category'],
  // NOTE: shadow_ai_tools.domains is ARRAY in tenant but JSONB in public - handled by stringify
};

/**
 * Check if a column is a PostgreSQL ARRAY type (not JSONB)
 */
const isPostgresArrayColumn = (tableName: string, columnName: string): boolean => {
  return POSTGRES_ARRAY_COLUMNS[tableName]?.includes(columnName) || false;
};

/**
 * Junction tables that don't have an 'id' column
 * These use composite primary keys (e.g., vendor_id + project_id)
 * They don't need ID mapping - they only have FK references that get remapped
 *
 * NOTE: Tables that ARE referenced by other tables via *_id columns MUST have 'id':
 * - projects_risks HAS id (referenced by *__risks tables via projects_risks_id)
 * - approval_workflow_steps HAS id (referenced by approval_step_approvers)
 * - approval_request_steps HAS id (referenced by approval_request_step_approvals)
 */
const TABLES_WITHOUT_ID: string[] = [
  // Pure junction tables - only have FK columns, no references from other tables
  'vendors_projects',
  'projects_members',
  'frameworks_risks',
  'policy_manager__assigned_reviewer_ids',
  'llm_evals_org_members',
  // All *__risks junction tables (they reference projects_risks_id but aren't referenced themselves)
  'controls_eu__risks',
  'annexcategories_iso__risks',
  'subclauses_iso__risks',
  'subclauses_iso27001__risks',
  'annexcontrols_iso27001__risks',
  'nist_ai_rmf_subcategories__risks',
  'subcontrols_eu__risks',
  'answers_eu__risks',
];

/**
 * Check if a table has an 'id' column (dynamic check against database)
 */
async function checkTableHasIdColumn(
  schemaName: string,
  tableName: string,
  transaction?: Transaction
): Promise<boolean> {
  // First check static list for performance
  if (TABLES_WITHOUT_ID.includes(tableName)) {
    return false;
  }

  // Then verify against database
  const result = await sequelize.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = :schemaName
        AND table_name = :tableName
        AND column_name = 'id'
    ) as exists`,
    { replacements: { schemaName, tableName }, type: QueryTypes.SELECT, transaction }
  );
  return (result[0] as any).exists;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Generate tenant hash from organization ID (same as getTenantHash)
 */
const getTenantHash = (orgId: number): string => {
  const hash = createHash("sha256").update(orgId.toString()).digest("base64");
  return hash.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
};

/**
 * Check if a schema exists
 */
async function schemaExists(
  schemaName: string,
  transaction?: Transaction
): Promise<boolean> {
  const result = await sequelize.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.schemata WHERE schema_name = :schemaName
    ) as exists`,
    { replacements: { schemaName }, type: QueryTypes.SELECT, transaction }
  );
  return (result[0] as any).exists;
}

/**
 * Check if a table exists in a schema
 */
async function tableExists(
  schemaName: string,
  tableName: string,
  transaction?: Transaction
): Promise<boolean> {
  const result = await sequelize.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = :schemaName AND table_name = :tableName
    ) as exists`,
    { replacements: { schemaName, tableName }, type: QueryTypes.SELECT, transaction }
  );
  return (result[0] as any).exists;
}

/**
 * Get row count from a table
 */
async function getRowCount(
  schemaName: string,
  tableName: string,
  transaction?: Transaction,
  organizationId?: number
): Promise<number> {
  const exists = await tableExists(schemaName, tableName, transaction);
  if (!exists) return 0;

  let query = `SELECT COUNT(*) as count FROM "${schemaName}"."${tableName}"`;
  const replacements: any = {};

  if (organizationId !== undefined && schemaName === "public") {
    query += ` WHERE organization_id = :organizationId`;
    replacements.organizationId = organizationId;
  }

  const result = await sequelize.query(query, {
    type: QueryTypes.SELECT,
    transaction,
    replacements,
  });
  return parseInt((result[0] as any).count, 10);
}

/**
 * Get column names for a table (excluding 'id' and 'organization_id')
 */
async function getTableColumns(
  schemaName: string,
  tableName: string,
  transaction?: Transaction
): Promise<string[]> {
  const result = await sequelize.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = :schemaName AND table_name = :tableName
     ORDER BY ordinal_position`,
    { replacements: { schemaName, tableName }, type: QueryTypes.SELECT, transaction }
  );

  return (result as any[])
    .map((r) => r.column_name)
    .filter((col) => col !== "id" && col !== "organization_id");
}

/**
 * Check if public table has organization_id column
 */
async function hasOrganizationIdColumn(
  tableName: string,
  transaction?: Transaction
): Promise<boolean> {
  const result = await sequelize.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = :tableName
        AND column_name = 'organization_id'
    ) as exists`,
    { replacements: { tableName }, type: QueryTypes.SELECT, transaction }
  );
  return (result[0] as any).exists;
}

// ============================================================
// GENERIC TABLE MIGRATION
// ============================================================

/**
 * Migrate a single table from tenant schema to public schema
 */
async function migrateTable(
  orgId: number,
  tenantHash: string,
  tableName: string,
  idMapping: IdMapping,
  transaction: Transaction
): Promise<{ sourceCount: number; migratedCount: number }> {
  // Check if source table exists
  const sourceExists = await tableExists(tenantHash, tableName, transaction);
  if (!sourceExists) {
    return { sourceCount: 0, migratedCount: 0 };
  }

  // Check if target table exists in public schema
  const targetExists = await tableExists("public", tableName, transaction);
  if (!targetExists) {
    console.log(`    ⊘ ${tableName}: target table doesn't exist in public schema`);
    return { sourceCount: 0, migratedCount: 0 };
  }

  // Get row count
  const sourceCount = await getRowCount(tenantHash, tableName, transaction);
  if (sourceCount === 0) {
    return { sourceCount: 0, migratedCount: 0 };
  }

  // Get columns that exist in BOTH source (tenant) and target (public) tables
  // This handles schema mismatches where tenant has extra columns
  const sourceColumns = await getTableColumns(tenantHash, tableName, transaction);
  const targetColumns = await getTableColumns("public", tableName, transaction);

  // DEBUG: Print columns for critical tables
  if (tableName === 'files' || tableName === 'vendorrisks') {
    console.log(`    DEBUG ${tableName} sourceColumns: ${sourceColumns.join(', ')}`);
    console.log(`    DEBUG ${tableName} targetColumns: ${targetColumns.join(', ')}`);
  }

  const targetColumnSet = new Set(targetColumns);
  const commonColumns = sourceColumns.filter(col => targetColumnSet.has(col));

  // Debug logging for column detection
  if (sourceColumns.length !== commonColumns.length) {
    const skippedCols = sourceColumns.filter(col => !targetColumnSet.has(col));
    console.log(`    ℹ️  ${tableName}: skipping columns not in public schema: ${skippedCols.join(', ')}`);
  }

  // DEBUG: Print final common columns for critical tables
  if (tableName === 'files' || tableName === 'vendorrisks') {
    console.log(`    DEBUG ${tableName} commonColumns: ${commonColumns.join(', ')}`);
  }

  if (commonColumns.length === 0) {
    console.log(`    ⊘ ${tableName}: no common columns between tenant and public schema`);
    return { sourceCount: 0, migratedCount: 0 };
  }

  // Check if target has organization_id
  const hasOrgId = await hasOrganizationIdColumn(tableName, transaction);

  // Get FK mappings for this table
  const fkMappings = FK_MAPPINGS[tableName] || {};

  // Check if this table references struct tables (meta_id columns shouldn't be remapped)
  const isStructReference = STRUCT_REFERENCES.includes(tableName);

  // Check if this table has an id column (dynamic check against source schema)
  const hasIdColumn = await checkTableHasIdColumn(tenantHash, tableName, transaction);

  // Initialize mapping for this table (only if it has an id column)
  if (hasIdColumn && !idMapping[tableName]) {
    idMapping[tableName] = {};
  }

  // Fetch all rows from source in batches
  let offset = 0;
  let migratedCount = 0;

  while (offset < sourceCount) {
    // Fetch batch - use ORDER BY 1 for tables without id column
    const orderClause = hasIdColumn ? 'ORDER BY id' : 'ORDER BY 1';
    const rows = (await sequelize.query(
      `SELECT * FROM "${tenantHash}"."${tableName}" ${orderClause} LIMIT :limit OFFSET :offset`,
      {
        replacements: { limit: BATCH_SIZE, offset },
        type: QueryTypes.SELECT,
        transaction,
      }
    )) as any[];

    if (rows.length === 0) break;

    // Process each row
    for (const row of rows) {
      const oldId = hasIdColumn ? row.id : null;
      const insertData: Record<string, any> = {};

      // Copy columns, applying FK mappings where needed
      for (const col of commonColumns) {
        let value = row[col];

        // Apply FK mapping if this column references another migrated table
        if (fkMappings[col] && value !== null && value !== undefined) {
          const sourceTable = fkMappings[col];

          // Skip remapping for struct references (meta_id columns point to public struct tables)
          if (isStructReference && col.endsWith("_meta_id")) {
            // Keep original value - it references public schema struct data
            insertData[col] = value;
          } else if (idMapping[sourceTable] && idMapping[sourceTable][value]) {
            // Remap to new ID
            insertData[col] = idMapping[sourceTable][value];
          } else {
            // FK target not found - orphaned reference (referenced row was deleted)
            // Set to NULL to avoid FK constraint violation
            console.log(`    ⚠️ ${tableName}.${col}: orphaned FK ${value} → NULL (${sourceTable} row was deleted)`);
            insertData[col] = null;
          }
        } else {
          insertData[col] = value;
        }
      }

      // Build INSERT statement
      const targetColumns = hasOrgId
        ? ["organization_id", ...commonColumns]
        : commonColumns;

      // Helper to serialize values based on column type
      // - PostgreSQL ARRAY columns: keep as JavaScript array
      // - JSONB columns: stringify objects AND arrays
      const serializeValue = (columnName: string, val: any): any => {
        if (val === null || val === undefined) return val;
        if (val instanceof Date) return val;

        // Check if this is a PostgreSQL ARRAY column (not JSONB)
        if (isPostgresArrayColumn(tableName, columnName)) {
          // Keep as JavaScript array - Sequelize handles conversion to PG array
          return val;
        }

        // For JSONB columns and other object types, stringify
        if (typeof val === 'object') {
          return JSON.stringify(val);
        }

        return val;
      };

      const targetValues = hasOrgId
        ? [orgId, ...commonColumns.map((c) => serializeValue(c, insertData[c]))]
        : commonColumns.map((c) => serializeValue(c, insertData[c]));

      const placeholders = targetValues.map((_, i) => `$${i + 1}`).join(", ");
      const columnList = targetColumns.map((c) => `"${c}"`).join(", ");

      // DEBUG: Print INSERT statement for first row of critical tables
      if ((tableName === 'files' || tableName === 'vendorrisks') && offset === 0 && migratedCount === 0) {
        console.log(`    DEBUG ${tableName} INSERT columnList: ${columnList}`);
        console.log(`    DEBUG ${tableName} INSERT values count: ${targetValues.length}`);
      }

      try {
        if (hasIdColumn) {
          // Table has id column - use RETURNING id for mapping
          const [insertResult] = await sequelize.query(
            `INSERT INTO public."${tableName}" (${columnList})
             VALUES (${placeholders})
             RETURNING id`,
            {
              bind: targetValues,
              type: QueryTypes.SELECT,  // Use SELECT to get RETURNING results
              transaction,
            }
          );

          const newId = (insertResult as any)?.id;
          if (newId !== undefined && oldId !== null) {
            idMapping[tableName][oldId] = newId;
          }
          migratedCount++;
        } else {
          // Junction table without id column - just insert, no ID mapping needed
          await sequelize.query(
            `INSERT INTO public."${tableName}" (${columnList})
             VALUES (${placeholders})`,
            {
              bind: targetValues,
              type: QueryTypes.INSERT,
              transaction,
            }
          );
          migratedCount++;
        }
      } catch (error) {
        // Handle unique constraint violations (might be duplicate from previous partial migration)
        const err = error as any;
        if (err.name === "SequelizeUniqueConstraintError" || err.code === "23505") {
          if (hasIdColumn) {
            // Try to find existing row and add to mapping
            const existing = await sequelize.query(
              `SELECT id FROM public."${tableName}"
               WHERE organization_id = :orgId
               ORDER BY id
               LIMIT 1 OFFSET :offset`,
              {
                replacements: { orgId, offset: migratedCount },
                type: QueryTypes.SELECT,
                transaction,
              }
            );
            if (existing.length > 0 && oldId !== null) {
              idMapping[tableName][oldId] = (existing[0] as any).id;
              migratedCount++;
            }
          } else {
            // Junction table - duplicate row, just skip it
            // This is fine - the row already exists from a previous partial migration
          }
        } else {
          throw error;
        }
      }
    }

    offset += BATCH_SIZE;
  }

  if (migratedCount > 0) {
    console.log(`    ✓ ${tableName}: ${migratedCount} rows`);
  }

  return { sourceCount, migratedCount };
}

// ============================================================
// CUSTOM FRAMEWORK STRUCT/IMPL MIGRATION
// ============================================================

/**
 * Convert JS array to PostgreSQL array literal
 */
function toPgArray(arr: any[] | null | undefined): string {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return '{}';
  const escaped = arr.map((item) => {
    const escapedItem = String(item).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${escapedItem}"`;
  });
  return `{${escaped.join(',')}}`;
}

/**
 * Global struct map shared across orgs to avoid duplicating struct data.
 * Tracks which plugin_keys already have struct rows populated.
 */
interface GlobalStructMap {
  definitions: Record<string, number>;       // pluginKey → definition_id
  structPopulated: Record<string, boolean>;  // pluginKey → true
  level1: Record<string, Record<number, number>>;  // pluginKey → { order_no → struct_id }
  level2: Record<string, Record<string, number>>;  // pluginKey → { "l1StructId-orderNo" → struct_id }
  level3: Record<string, Record<string, number>>;  // pluginKey → { "l2StructId-orderNo" → struct_id }
}

/**
 * Migrate custom framework data from tenant schema to public schema
 * using the struct/impl split pattern.
 */
async function migrateCustomFrameworkData(
  orgId: number,
  tenantHash: string,
  globalStructMap: GlobalStructMap,
  transaction: Transaction
): Promise<number> {
  let totalMigrated = 0;

  // Check if tenant has custom_frameworks
  const hasCF = await tableExists(tenantHash, 'custom_frameworks', transaction);
  if (!hasCF) return 0;

  const tenantFrameworks = (await sequelize.query(
    `SELECT * FROM "${tenantHash}".custom_frameworks ORDER BY id`,
    { type: QueryTypes.SELECT, transaction }
  )) as any[];

  if (tenantFrameworks.length === 0) return 0;

  // ID mappings for this org
  const fwIdMap: Record<number, number> = {};
  const l1IdMap: Record<number, number> = {};
  const l2IdMap: Record<number, number> = {};
  const l3IdMap: Record<number, number> = {};
  const projFwIdMap: Record<number, number> = {};
  const l2ImplIdMap: Record<number, number> = {};
  const l3ImplIdMap: Record<number, number> = {};

  for (const fw of tenantFrameworks) {
    const pluginKey = fw.plugin_key;
    if (!pluginKey) continue;

    // 1a. Ensure definition exists (shared, no org_id)
    let defId: number;
    if (globalStructMap.definitions[pluginKey]) {
      defId = globalStructMap.definitions[pluginKey];
    } else {
      const existingDef = (await sequelize.query(
        `SELECT id FROM public.custom_framework_definitions WHERE plugin_key = :pluginKey LIMIT 1`,
        { replacements: { pluginKey }, type: QueryTypes.SELECT, transaction }
      )) as any[];

      if (existingDef.length > 0) {
        defId = existingDef[0].id;
      } else {
        const insertedDef = (await sequelize.query(
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
            type: QueryTypes.SELECT,
            transaction,
          }
        )) as any[];
        defId = insertedDef[0].id;
      }
      globalStructMap.definitions[pluginKey] = defId;
    }

    // 1b. Create per-org custom_frameworks record
    const insertedFw = (await sequelize.query(
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
          orgId, defId, pluginKey,
          name: fw.name, description: fw.description, version: fw.version || '1.0.0',
          isOrg: fw.is_organizational || false, hierarchyType: fw.hierarchy_type || 'two_level',
          l1Name: fw.level_1_name || 'Category', l2Name: fw.level_2_name || 'Control',
          l3Name: fw.level_3_name || null, fileSource: fw.file_source || null,
          createdAt: fw.created_at || new Date(), updatedAt: fw.updated_at || new Date(),
        },
        type: QueryTypes.SELECT, transaction,
      }
    )) as any[];
    fwIdMap[fw.id] = insertedFw[0].id;
    totalMigrated++;

    // 2. Populate struct tables (only if not already done for this plugin_key)
    const needsStruct = !globalStructMap.structPopulated[pluginKey];

    if (needsStruct) {
      const hasL1 = await tableExists(tenantHash, 'custom_framework_level1', transaction);
      if (hasL1) {
        const l1Rows = (await sequelize.query(
          `SELECT * FROM "${tenantHash}".custom_framework_level1 WHERE framework_id = :fwId ORDER BY order_no, id`,
          { replacements: { fwId: fw.id }, type: QueryTypes.SELECT, transaction }
        )) as any[];

        for (const l1 of l1Rows) {
          const inserted = (await sequelize.query(
            `INSERT INTO public.custom_framework_level1_struct
             (definition_id, title, description, order_no, metadata, created_at)
             VALUES (:defId, :title, :description, :orderNo, :metadata::jsonb, :createdAt)
             RETURNING id`,
            {
              replacements: {
                defId, title: l1.title, description: l1.description,
                orderNo: l1.order_no || 1, metadata: JSON.stringify(l1.metadata || {}),
                createdAt: l1.created_at || new Date(),
              },
              type: QueryTypes.SELECT, transaction,
            }
          )) as any[];
          l1IdMap[l1.id] = inserted[0].id;
          if (!globalStructMap.level1[pluginKey]) globalStructMap.level1[pluginKey] = {};
          globalStructMap.level1[pluginKey][l1.order_no || 1] = inserted[0].id;
          totalMigrated++;
        }

        const hasL2 = await tableExists(tenantHash, 'custom_framework_level2', transaction);
        if (hasL2) {
          const oldL1Ids = Object.keys(l1IdMap).map(Number);
          if (oldL1Ids.length > 0) {
            const l2Rows = (await sequelize.query(
              `SELECT * FROM "${tenantHash}".custom_framework_level2 WHERE level1_id IN (:l1Ids) ORDER BY level1_id, order_no, id`,
              { replacements: { l1Ids: oldL1Ids }, type: QueryTypes.SELECT, transaction }
            )) as any[];

            for (const l2 of l2Rows) {
              const newL1Id = l1IdMap[l2.level1_id];
              if (!newL1Id) continue;
              const inserted = (await sequelize.query(
                `INSERT INTO public.custom_framework_level2_struct
                 (level1_id, title, description, order_no, summary, questions, evidence_examples, metadata, created_at)
                 VALUES (:l1Id, :title, :description, :orderNo, :summary, :questions::text[], :evidenceExamples::text[], :metadata::jsonb, :createdAt)
                 RETURNING id`,
                {
                  replacements: {
                    l1Id: newL1Id, title: l2.title, description: l2.description,
                    orderNo: l2.order_no || 1, summary: l2.summary || null,
                    questions: toPgArray(l2.questions), evidenceExamples: toPgArray(l2.evidence_examples),
                    metadata: JSON.stringify(l2.metadata || {}), createdAt: l2.created_at || new Date(),
                  },
                  type: QueryTypes.SELECT, transaction,
                }
              )) as any[];
              l2IdMap[l2.id] = inserted[0].id;
              if (!globalStructMap.level2[pluginKey]) globalStructMap.level2[pluginKey] = {};
              globalStructMap.level2[pluginKey][`${newL1Id}-${l2.order_no || 1}`] = inserted[0].id;
              totalMigrated++;
            }

            const hasL3 = await tableExists(tenantHash, 'custom_framework_level3', transaction);
            if (hasL3) {
              const oldL2Ids = Object.keys(l2IdMap).map(Number);
              if (oldL2Ids.length > 0) {
                const l3Rows = (await sequelize.query(
                  `SELECT * FROM "${tenantHash}".custom_framework_level3 WHERE level2_id IN (:l2Ids) ORDER BY level2_id, order_no, id`,
                  { replacements: { l2Ids: oldL2Ids }, type: QueryTypes.SELECT, transaction }
                )) as any[];

                for (const l3 of l3Rows) {
                  const newL2Id = l2IdMap[l3.level2_id];
                  if (!newL2Id) continue;
                  const inserted = (await sequelize.query(
                    `INSERT INTO public.custom_framework_level3_struct
                     (level2_id, title, description, order_no, summary, questions, evidence_examples, metadata, created_at)
                     VALUES (:l2Id, :title, :description, :orderNo, :summary, :questions::text[], :evidenceExamples::text[], :metadata::jsonb, :createdAt)
                     RETURNING id`,
                    {
                      replacements: {
                        l2Id: newL2Id, title: l3.title, description: l3.description,
                        orderNo: l3.order_no || 1, summary: l3.summary || null,
                        questions: toPgArray(l3.questions), evidenceExamples: toPgArray(l3.evidence_examples),
                        metadata: JSON.stringify(l3.metadata || {}), createdAt: l3.created_at || new Date(),
                      },
                      type: QueryTypes.SELECT, transaction,
                    }
                  )) as any[];
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
      // Struct already populated — build ID maps via position matching
      const hasL1 = await tableExists(tenantHash, 'custom_framework_level1', transaction);
      if (hasL1) {
        const l1Rows = (await sequelize.query(
          `SELECT * FROM "${tenantHash}".custom_framework_level1 WHERE framework_id = :fwId ORDER BY order_no, id`,
          { replacements: { fwId: fw.id }, type: QueryTypes.SELECT, transaction }
        )) as any[];
        for (const l1 of l1Rows) {
          const structId = globalStructMap.level1[pluginKey]?.[l1.order_no || 1];
          if (structId) l1IdMap[l1.id] = structId;
        }

        const hasL2 = await tableExists(tenantHash, 'custom_framework_level2', transaction);
        if (hasL2) {
          const oldL1Ids = Object.keys(l1IdMap).map(Number);
          if (oldL1Ids.length > 0) {
            const l2Rows = (await sequelize.query(
              `SELECT * FROM "${tenantHash}".custom_framework_level2 WHERE level1_id IN (:l1Ids) ORDER BY level1_id, order_no, id`,
              { replacements: { l1Ids: oldL1Ids }, type: QueryTypes.SELECT, transaction }
            )) as any[];
            for (const l2 of l2Rows) {
              const newL1Id = l1IdMap[l2.level1_id];
              if (!newL1Id) continue;
              const structId = globalStructMap.level2[pluginKey]?.[`${newL1Id}-${l2.order_no || 1}`];
              if (structId) l2IdMap[l2.id] = structId;
            }

            const hasL3 = await tableExists(tenantHash, 'custom_framework_level3', transaction);
            if (hasL3) {
              const oldL2Ids = Object.keys(l2IdMap).map(Number);
              if (oldL2Ids.length > 0) {
                const l3Rows = (await sequelize.query(
                  `SELECT * FROM "${tenantHash}".custom_framework_level3 WHERE level2_id IN (:l2Ids) ORDER BY level2_id, order_no, id`,
                  { replacements: { l2Ids: oldL2Ids }, type: QueryTypes.SELECT, transaction }
                )) as any[];
                for (const l3 of l3Rows) {
                  const newL2Id = l2IdMap[l3.level2_id];
                  if (!newL2Id) continue;
                  const structId = globalStructMap.level3[pluginKey]?.[`${newL2Id}-${l3.order_no || 1}`];
                  if (structId) l3IdMap[l3.id] = structId;
                }
              }
            }
          }
        }
      }
    }
  }

  // 3. custom_framework_projects
  const hasCFP = await tableExists(tenantHash, 'custom_framework_projects', transaction);
  if (hasCFP) {
    const projRows = (await sequelize.query(
      `SELECT * FROM "${tenantHash}".custom_framework_projects ORDER BY id`,
      { type: QueryTypes.SELECT, transaction }
    )) as any[];

    for (const proj of projRows) {
      const newFwId = fwIdMap[proj.framework_id];
      if (!newFwId) continue;
      try {
        const inserted = (await sequelize.query(
          `INSERT INTO public.custom_framework_projects
           (organization_id, framework_id, project_id, created_at)
           VALUES (:orgId, :fwId, :projectId, :createdAt)
           RETURNING id`,
          {
            replacements: { orgId, fwId: newFwId, projectId: proj.project_id, createdAt: proj.created_at || new Date() },
            type: QueryTypes.SELECT, transaction,
          }
        )) as any[];
        projFwIdMap[proj.id] = inserted[0].id;
        totalMigrated++;
      } catch (error: any) {
        if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
          const existing = (await sequelize.query(
            `SELECT id FROM public.custom_framework_projects
             WHERE organization_id = :orgId AND framework_id = :fwId AND project_id = :projectId LIMIT 1`,
            { replacements: { orgId, fwId: newFwId, projectId: proj.project_id }, type: QueryTypes.SELECT, transaction }
          )) as any[];
          if (existing[0]?.id) projFwIdMap[proj.id] = existing[0].id;
          totalMigrated++;
        } else throw error;
      }
    }
    if (Object.keys(projFwIdMap).length > 0) console.log(`    ✓ custom_framework_projects: ${Object.keys(projFwIdMap).length} rows`);
  }

  // 4. level2_impl
  const hasL2Impl = await tableExists(tenantHash, 'custom_framework_level2_impl', transaction);
  if (hasL2Impl) {
    const implRows = (await sequelize.query(
      `SELECT * FROM "${tenantHash}".custom_framework_level2_impl ORDER BY id`,
      { type: QueryTypes.SELECT, transaction }
    )) as any[];

    for (const impl of implRows) {
      const newL2Id = l2IdMap[impl.level2_id];
      const newProjFwId = projFwIdMap[impl.project_framework_id];
      if (!newL2Id || !newProjFwId) continue;
      const inserted = (await sequelize.query(
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
            orgId, l2Id: newL2Id, projFwId: newProjFwId,
            status: impl.status || 'Not started', owner: impl.owner || null,
            reviewer: impl.reviewer || null, approver: impl.approver || null,
            dueDate: impl.due_date || null, implDetails: impl.implementation_details || null,
            evidenceLinks: JSON.stringify(impl.evidence_links || []),
            feedbackLinks: JSON.stringify(impl.feedback_links || []),
            auditorFeedback: impl.auditor_feedback || null, isDemo: impl.is_demo || false,
            createdAt: impl.created_at || new Date(), updatedAt: impl.updated_at || new Date(),
          },
          type: QueryTypes.SELECT, transaction,
        }
      )) as any[];
      l2ImplIdMap[impl.id] = inserted[0].id;
      totalMigrated++;
    }
    if (Object.keys(l2ImplIdMap).length > 0) console.log(`    ✓ custom_framework_level2_impl: ${Object.keys(l2ImplIdMap).length} rows`);
  }

  // 5. level3_impl
  const hasL3Impl = await tableExists(tenantHash, 'custom_framework_level3_impl', transaction);
  if (hasL3Impl) {
    const implRows = (await sequelize.query(
      `SELECT * FROM "${tenantHash}".custom_framework_level3_impl ORDER BY id`,
      { type: QueryTypes.SELECT, transaction }
    )) as any[];

    for (const impl of implRows) {
      const newL3Id = l3IdMap[impl.level3_id];
      const newL2ImplId = l2ImplIdMap[impl.level2_impl_id];
      if (!newL3Id || !newL2ImplId) continue;
      const inserted = (await sequelize.query(
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
            orgId, l3Id: newL3Id, l2ImplId: newL2ImplId,
            status: impl.status || 'Not started', owner: impl.owner || null,
            reviewer: impl.reviewer || null, approver: impl.approver || null,
            dueDate: impl.due_date || null, implDetails: impl.implementation_details || null,
            evidenceLinks: JSON.stringify(impl.evidence_links || []),
            feedbackLinks: JSON.stringify(impl.feedback_links || []),
            auditorFeedback: impl.auditor_feedback || null, isDemo: impl.is_demo || false,
            createdAt: impl.created_at || new Date(), updatedAt: impl.updated_at || new Date(),
          },
          type: QueryTypes.SELECT, transaction,
        }
      )) as any[];
      l3ImplIdMap[impl.id] = inserted[0].id;
      totalMigrated++;
    }
    if (Object.keys(l3ImplIdMap).length > 0) console.log(`    ✓ custom_framework_level3_impl: ${Object.keys(l3ImplIdMap).length} rows`);
  }

  // 6. Risk tables
  for (const [riskTable, implIdMap, implCol] of [
    ['custom_framework_level2_risks', l2ImplIdMap, 'level2_impl_id'],
    ['custom_framework_level3_risks', l3ImplIdMap, 'level3_impl_id'],
  ] as const) {
    const hasRisks = await tableExists(tenantHash, riskTable, transaction);
    if (!hasRisks) continue;
    const riskRows = (await sequelize.query(
      `SELECT * FROM "${tenantHash}"."${riskTable}"`,
      { type: QueryTypes.SELECT, transaction }
    )) as any[];

    let riskCount = 0;
    for (const risk of riskRows) {
      const newImplId = (implIdMap as Record<number, number>)[risk[implCol]];
      if (!newImplId) continue;
      try {
        await sequelize.query(
          `INSERT INTO public."${riskTable}" (organization_id, "${implCol}", risk_id)
           VALUES (:orgId, :implId, :riskId)
           ON CONFLICT ("${implCol}", risk_id) DO NOTHING`,
          { replacements: { orgId, implId: newImplId, riskId: risk.risk_id }, transaction }
        );
        riskCount++;
      } catch { /* ignore duplicates */ }
    }
    if (riskCount > 0) { console.log(`    ✓ ${riskTable}: ${riskCount} rows`); totalMigrated += riskCount; }
  }

  // 7. file_entity_links for custom frameworks
  const hasFEL = await tableExists(tenantHash, 'file_entity_links', transaction);
  if (hasFEL) {
    const felRows = (await sequelize.query(
      `SELECT * FROM "${tenantHash}".file_entity_links
       WHERE entity_type IN ('level2', 'level3', 'level2_impl', 'level3_impl')
       ORDER BY id`,
      { type: QueryTypes.SELECT, transaction }
    )) as any[];

    const filesMap: Record<number, number> = {};
    let felCount = 0;

    for (const row of felRows) {
      let newFileId = row.file_id;
      if (filesMap[row.file_id]) {
        newFileId = filesMap[row.file_id];
      } else {
        const existingFile = (await sequelize.query(
          `SELECT id FROM public.files WHERE id = :fileId AND organization_id = :orgId LIMIT 1`,
          { replacements: { fileId: row.file_id, orgId }, type: QueryTypes.SELECT, transaction }
        )) as any[];

        if (existingFile.length > 0) {
          newFileId = existingFile[0].id;
          filesMap[row.file_id] = newFileId;
        } else {
          const tenantFile = (await sequelize.query(
            `SELECT * FROM "${tenantHash}".files WHERE id = :fileId LIMIT 1`,
            { replacements: { fileId: row.file_id }, type: QueryTypes.SELECT, transaction }
          )) as any[];
          if (tenantFile.length === 0) continue;
          const file = tenantFile[0];
          try {
            const inserted = (await sequelize.query(
              `INSERT INTO public.files
               (organization_id, project_id, filename, file_path, type, size, source, uploaded_by, uploaded_time, updated_at)
               VALUES (:orgId, :projectId, :filename, :filePath, :fileType, :size, :source, :uploadedBy, :uploadedTime, :updatedAt)
               RETURNING id`,
              {
                replacements: {
                  orgId, projectId: file.project_id, filename: file.filename,
                  filePath: file.file_path, fileType: file.type, size: file.size,
                  source: file.source, uploadedBy: file.uploaded_by,
                  uploadedTime: file.uploaded_time || new Date(), updatedAt: file.updated_at || new Date(),
                },
                type: QueryTypes.SELECT, transaction,
              }
            )) as any[];
            newFileId = inserted[0].id;
            filesMap[row.file_id] = newFileId;
          } catch (fileError: any) {
            console.log(`    ⚠ Could not migrate file ${row.file_id}: ${fileError.message}`);
            continue;
          }
        }
      }

      let newEntityId = row.entity_id;
      if (row.entity_type === 'level2') newEntityId = l2IdMap[row.entity_id] || row.entity_id;
      else if (row.entity_type === 'level3') newEntityId = l3IdMap[row.entity_id] || row.entity_id;
      else if (row.entity_type === 'level2_impl') newEntityId = l2ImplIdMap[row.entity_id] || row.entity_id;
      else if (row.entity_type === 'level3_impl') newEntityId = l3ImplIdMap[row.entity_id] || row.entity_id;

      try {
        await sequelize.query(
          `INSERT INTO public.file_entity_links
           (organization_id, file_id, framework_type, entity_type, entity_id, project_id, link_type, created_by, created_at)
           VALUES (:orgId, :fileId, :frameworkType, :entityType, :entityId, :projectId, :linkType, :createdBy, :createdAt)
           ON CONFLICT (file_id, framework_type, entity_type, entity_id) DO NOTHING`,
          {
            replacements: {
              orgId, fileId: newFileId, frameworkType: row.framework_type,
              entityType: row.entity_type, entityId: newEntityId,
              projectId: row.project_id, linkType: row.link_type || 'evidence',
              createdBy: row.created_by, createdAt: row.created_at || new Date(),
            },
            transaction,
          }
        );
        felCount++;
      } catch (error: any) {
        if (!error.message?.includes('duplicate key')) {
          console.log(`    ⚠ file_entity_links error: ${error.message}`);
        }
      }
    }
    if (felCount > 0) { console.log(`    ✓ file_entity_links (custom framework): ${felCount} rows`); totalMigrated += felCount; }
  }

  if (totalMigrated > 0) console.log(`    ✓ custom_frameworks: ${tenantFrameworks.length} frameworks, ${totalMigrated} total rows`);
  return totalMigrated;
}

// ============================================================
// ORGANIZATION MIGRATION
// ============================================================

/**
 * Migrate all data for a single organization.
 * Accepts an external transaction — caller is responsible for commit/rollback.
 */
async function migrateOrganization(
  orgId: number,
  tenantHash: string,
  globalStructMap: GlobalStructMap,
  transaction: Transaction,
  dropSchemaAfter: boolean = false
): Promise<{
  success: boolean;
  error?: string;
  tableCounts: Record<string, { source: number; migrated: number }>;
}> {
  const tableCounts: Record<string, { source: number; migrated: number }> = {};

  console.log(`\n  Migrating organization ${orgId} (${tenantHash})...`);

  // Check if tenant schema exists
  const exists = await schemaExists(tenantHash, transaction);
  if (!exists) {
    console.log(`    ⊘ No tenant schema found, skipping`);
    return { success: true, tableCounts };
  }

  // Initialize ID mapping for this organization
  const idMapping: IdMapping = {};

  // Migrate custom framework tables first (struct/impl split)
  const cfMigrated = await migrateCustomFrameworkData(orgId, tenantHash, globalStructMap, transaction);
  if (cfMigrated > 0) {
    tableCounts['custom_frameworks (struct/impl)'] = { source: cfMigrated, migrated: cfMigrated };
  }

  // Get all tables in dependency order
  const allTables = getAllTablesInOrder();

  // Migrate each table in order
  for (const tableName of allTables) {
    // Skip tables that have dedicated migrations with special ID mapping
    if (SKIP_TABLES.includes(tableName)) {
      continue;
    }

    try {
      const result = await migrateTable(
        orgId,
        tenantHash,
        tableName,
        idMapping,
        transaction
      );
      tableCounts[tableName] = {
        source: result.sourceCount,
        migrated: result.migratedCount,
      };
    } catch (error) {
      console.error(`    ✗ ${tableName}: ${(error as Error).message}`);
      throw error;
    }
  }

  // Optionally drop tenant schema after successful migration
  if (dropSchemaAfter) {
    console.log(`    🗑️  Dropping tenant schema ${tenantHash}...`);
    await sequelize.query(`DROP SCHEMA IF EXISTS "${tenantHash}" CASCADE`, {
      transaction,
    });
  }

  console.log(`  ✓ Organization ${orgId} migrated successfully`);
  return { success: true, tableCounts };
}

// ============================================================
// VALIDATION
// ============================================================

/**
 * Validate migration by comparing row counts
 */
async function validateMigration(
  organizations: { id: number; name: string }[]
): Promise<ValidationReport> {
  const report: ValidationReport = {
    organizations: {},
    summary: {
      total_source_rows: 0,
      total_migrated_rows: 0,
      all_matched: true,
    },
  };

  const allTables = getAllTablesInOrder();

  for (const org of organizations) {
    const tenantHash = getTenantHash(org.id);
    const orgReport: ValidationReport["organizations"][number] = {
      tenant_hash: tenantHash,
      tables: {},
    };

    for (const tableName of allTables) {
      const sourceCount = await getRowCount(tenantHash, tableName);
      const migratedCount = await getRowCount("public", tableName, undefined, org.id);

      const match = sourceCount === migratedCount;
      orgReport.tables[tableName] = {
        source_count: sourceCount,
        migrated_count: migratedCount,
        match,
      };

      report.summary.total_source_rows += sourceCount;
      report.summary.total_migrated_rows += migratedCount;

      if (!match && sourceCount > 0) {
        report.summary.all_matched = false;
      }
    }

    report.organizations[org.id] = orgReport;
  }

  return report;
}

// ============================================================
// MIGRATION STATUS TRACKING
// ============================================================

/**
 * Check if migration_status table exists
 */
async function migrationStatusTableExists(): Promise<boolean> {
  const result = await sequelize.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'migration_status'
    ) as exists`,
    { type: QueryTypes.SELECT }
  );
  return (result[0] as any).exists;
}

/**
 * Get migration status
 */
async function getMigrationStatus(): Promise<{
  status: string;
  organizations_migrated: number;
  organizations_total: number;
  current_organization_id: number | null;
  current_table: string | null;
} | null> {
  const result = await sequelize.query(
    `SELECT status, organizations_migrated, organizations_total, current_organization_id, current_table
     FROM migration_status WHERE migration_key = :key`,
    { replacements: { key: MIGRATION_KEY }, type: QueryTypes.SELECT }
  );
  return (result[0] as any) || null;
}

/**
 * Update migration status
 */
async function updateMigrationStatus(params: {
  status: string;
  organizations_migrated?: number;
  organizations_total?: number;
  current_organization_id?: number | null;
  current_table?: string | null;
  error_message?: string | null;
  validation_report?: any;
}): Promise<void> {
  const now = new Date().toISOString();
  const existing = await getMigrationStatus();

  if (existing) {
    const updates: string[] = ["status = :status", "updated_at = :now"];
    const replacements: any = { key: MIGRATION_KEY, status: params.status, now };

    if (params.organizations_migrated !== undefined) {
      updates.push("organizations_migrated = :organizations_migrated");
      replacements.organizations_migrated = params.organizations_migrated;
    }
    if (params.organizations_total !== undefined) {
      updates.push("organizations_total = :organizations_total");
      replacements.organizations_total = params.organizations_total;
    }
    if (params.current_organization_id !== undefined) {
      updates.push("current_organization_id = :current_organization_id");
      replacements.current_organization_id = params.current_organization_id;
    }
    if (params.current_table !== undefined) {
      updates.push("current_table = :current_table");
      replacements.current_table = params.current_table;
    }
    if (params.error_message !== undefined) {
      updates.push("error_message = :error_message");
      replacements.error_message = params.error_message;
    }
    if (params.validation_report !== undefined) {
      updates.push("validation_report = :validation_report::jsonb");
      replacements.validation_report = JSON.stringify(params.validation_report);
    }
    if (params.status === "completed") {
      updates.push("completed_at = :now");
    }

    await sequelize.query(
      `UPDATE migration_status SET ${updates.join(", ")} WHERE migration_key = :key`,
      { replacements }
    );
  } else {
    await sequelize.query(
      `INSERT INTO migration_status
       (migration_key, status, organizations_migrated, organizations_total, started_at, created_at, updated_at)
       VALUES (:key, :status, :organizations_migrated, :organizations_total, :now, :now, :now)`,
      {
        replacements: {
          key: MIGRATION_KEY,
          status: params.status,
          organizations_migrated: params.organizations_migrated || 0,
          organizations_total: params.organizations_total || 0,
          now,
        },
      }
    );
  }
}

// ============================================================
// MAIN MIGRATION FUNCTION
// ============================================================

/**
 * Run the full migration
 */
export async function migrateToSharedSchema(options: {
  dropSchemasAfter?: boolean;
  skipValidation?: boolean;
} = {}): Promise<MigrationResult> {
  const { dropSchemasAfter = true, skipValidation = false } = options;

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     MIGRATE TENANT DATA TO SHARED SCHEMA                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("Configuration:");
  console.log(`  - Drop schemas after migration: ${dropSchemasAfter}`);
  console.log(`  - Skip validation: ${skipValidation}`);
  console.log("");

  const errors: string[] = [];
  let organizationsMigrated = 0;
  let tablesProcessed = 0;
  let rowsMigrated = 0;

  try {
    // Get all organizations
    const organizations = (await sequelize.query(
      `SELECT id, name FROM organizations ORDER BY id`,
      { type: QueryTypes.SELECT }
    )) as { id: number; name: string }[];

    if (organizations.length === 0) {
      console.log("No organizations found.");
      return {
        success: true,
        status: "no_tenants",
        organizationsMigrated: 0,
        tablesProcessed: 0,
        rowsMigrated: 0,
        errors: [],
      };
    }

    console.log(`Found ${organizations.length} organizations to migrate.\n`);

    // Update migration status (outside transaction — tracking only)
    await updateMigrationStatus({
      status: "in_progress",
      organizations_migrated: 0,
      organizations_total: organizations.length,
    });

    // Single global transaction — if ANY org fails, everything rolls back
    const transaction = await sequelize.transaction();

    try {
      // Global struct map for custom framework deduplication across orgs
      const globalStructMap: GlobalStructMap = {
        definitions: {},
        structPopulated: {},
        level1: {},
        level2: {},
        level3: {},
      };

      // Migrate each organization within the same transaction
      for (const org of organizations) {
        const tenantHash = getTenantHash(org.id);

        await updateMigrationStatus({
          status: "in_progress",
          current_organization_id: org.id,
        });

        const result = await migrateOrganization(org.id, tenantHash, globalStructMap, transaction, dropSchemasAfter);

        if (result.success) {
          organizationsMigrated++;

          // Count tables and rows
          for (const [_table, counts] of Object.entries(result.tableCounts)) {
            if (counts.migrated > 0) {
              tablesProcessed++;
              rowsMigrated += counts.migrated;
            }
          }
        } else {
          // Any failure → abort the entire migration
          throw new Error(`Org ${org.id}: ${result.error}`);
        }

        await updateMigrationStatus({
          status: "in_progress",
          organizations_migrated: organizationsMigrated,
        });
      }

      // All orgs succeeded — commit the single transaction
      await transaction.commit();
      console.log("\n  ✓ Global transaction committed successfully");
    } catch (txError) {
      // Any failure → roll back ALL orgs
      await transaction.rollback();
      console.error("\n  ✗ Global transaction rolled back due to error:", txError);
      errors.push((txError as Error).message);
    }

    // Validate if requested (outside transaction, read-only)
    let validationReport: ValidationReport | undefined;
    if (!skipValidation && !dropSchemasAfter && errors.length === 0) {
      console.log("\n📊 Running validation...");
      validationReport = await validateMigration(organizations);
    }

    // Update final status
    const finalStatus = errors.length === 0 ? "completed" : "failed";
    await updateMigrationStatus({
      status: finalStatus,
      organizations_migrated: organizationsMigrated,
      error_message: errors.length > 0 ? errors.join("; ") : null,
      validation_report: validationReport,
    });

    // Print summary
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                    MIGRATION COMPLETE                       ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log(`\n  ✓ Organizations migrated: ${organizationsMigrated}/${organizations.length}`);
    console.log(`  ✓ Tables processed: ${tablesProcessed}`);
    console.log(`  ✓ Rows migrated: ${rowsMigrated}`);

    if (errors.length > 0) {
      console.log(`\n  ✗ Errors (${errors.length}):`);
      for (const err of errors) {
        console.log(`    - ${err}`);
      }
    }

    if (dropSchemasAfter && errors.length === 0) {
      console.log("\n  🗑️  Old tenant schemas have been dropped.");
    } else if (dropSchemasAfter && errors.length > 0) {
      console.log("\n  📁 Old tenant schemas preserved (migration had errors - schemas not dropped).");
    } else {
      console.log("\n  📁 Old tenant schemas have been preserved.");
    }

    return {
      success: errors.length === 0,
      status: errors.length === 0 ? "just_completed" : "failed",
      organizationsMigrated,
      tablesProcessed,
      rowsMigrated,
      validationReport,
      errors,
    };
  } catch (error) {
    const errorMessage = (error as Error).message;
    errors.push(errorMessage);

    await updateMigrationStatus({
      status: "failed",
      error_message: errorMessage,
    });

    return {
      success: false,
      status: "failed",
      organizationsMigrated,
      tablesProcessed,
      rowsMigrated,
      error: errorMessage,
      errors,
    };
  }
}

// ============================================================
// SERVER STARTUP INTEGRATION
// ============================================================

/**
 * Check and run migration on server startup
 * This is the main entry point for automatic migration
 */
export async function checkAndRunMigration(): Promise<MigrationResult> {
  // Check if migration_status table exists
  const tableExists = await migrationStatusTableExists();
  if (!tableExists) {
    console.log("ℹ️  migration_status table does not exist, skipping migration check");
    console.log("   Run database migrations first: npx sequelize db:migrate");
    return {
      success: true,
      status: "no_tenants",
      organizationsMigrated: 0,
      tablesProcessed: 0,
      rowsMigrated: 0,
      errors: [],
    };
  }

  // Check current migration status
  const migrationStatus = await getMigrationStatus();

  // If migration already completed, skip
  if (migrationStatus?.status === "completed") {
    return {
      success: true,
      status: "already_completed",
      organizationsMigrated: migrationStatus.organizations_migrated || 0,
      tablesProcessed: 0,
      rowsMigrated: 0,
      errors: [],
    };
  }

  // Get all organizations
  const organizations = (await sequelize.query(
    `SELECT id FROM organizations ORDER BY id`,
    { type: QueryTypes.SELECT }
  )) as { id: number }[];

  if (organizations.length === 0) {
    console.log("ℹ️  No organizations found, skipping migration");
    return {
      success: true,
      status: "no_tenants",
      organizationsMigrated: 0,
      tablesProcessed: 0,
      rowsMigrated: 0,
      errors: [],
    };
  }

  // Check if any tenant schemas exist
  let tenantsExist = false;
  for (const org of organizations) {
    const tenantHash = getTenantHash(org.id);
    const exists = await schemaExists(tenantHash);
    if (exists) {
      tenantsExist = true;
      break;
    }
  }

  if (!tenantsExist) {
    // Mark as completed since there's nothing to migrate
    await updateMigrationStatus({
      status: "completed",
      organizations_migrated: 0,
      organizations_total: organizations.length,
    });

    console.log("ℹ️  No tenant schemas found, marking migration as complete");
    return {
      success: true,
      status: "no_tenants",
      organizationsMigrated: 0,
      tablesProcessed: 0,
      rowsMigrated: 0,
      errors: [],
    };
  }

  // Run the migration
  console.log("\n🚀 Starting tenant-to-shared-schema migration...");
  return migrateToSharedSchema({
    dropSchemasAfter: true,  // Drop schemas after successful migration
    skipValidation: true,     // Skip validation since we're dropping schemas
  });
}

/**
 * Print validation report
 */
export function printValidationReport(report: ValidationReport): void {
  if (!report) return;

  console.log("\n📊 Migration Validation Report");
  console.log("================================");

  for (const [orgId, orgData] of Object.entries(report.organizations)) {
    const mismatchedTables = Object.entries(orgData.tables).filter(
      ([_, counts]) => !counts.match && counts.source_count > 0
    );

    if (mismatchedTables.length > 0) {
      console.log(`\nOrganization ${orgId} (${orgData.tenant_hash}):`);
      for (const [table, counts] of mismatchedTables) {
        console.log(
          `  ❌ ${table}: ${counts.source_count} source → ${counts.migrated_count} migrated`
        );
      }
    }
  }

  console.log("\n📈 Summary:");
  console.log(`   Total source rows: ${report.summary.total_source_rows}`);
  console.log(`   Total migrated rows: ${report.summary.total_migrated_rows}`);
  console.log(`   All matched: ${report.summary.all_matched ? "✅ Yes" : "❌ No"}`);
}

// ============================================================
// CLI ENTRY POINT
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const dropSchemas = !args.includes("--keep-schemas");
  const skipValidation = args.includes("--skip-validation") || dropSchemas;

  try {
    const result = await migrateToSharedSchema({
      dropSchemasAfter: dropSchemas,
      skipValidation,
    });

    if (result.validationReport) {
      printValidationReport(result.validationReport);
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("\nFatal error:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
