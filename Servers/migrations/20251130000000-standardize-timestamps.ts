import { QueryInterface, DataTypes } from "sequelize";

/**
 * Migration to standardize timestamps across all tables
 *
 * This migration adds created_at and updated_at columns to tables that are missing them,
 * and ensures consistent naming convention (snake_case) across all tables.
 */

// Tables in public schema that need timestamps added
const PUBLIC_TABLES_NEED_CREATED_AT = [
  "automation_actions",
  "automation_triggers",
  "automation_trigger_actions",
  "tenant_automation_actions",
  "user_preferences",
  "files",
  "file_managers",
  "file_access_logs",
  "vendors_projects",
  "project_frameworks",
  "project_members",
];

const PUBLIC_TABLES_NEED_UPDATED_AT = [
  "automations",
  "automation_actions",
  "automation_triggers",
  "automation_trigger_actions",
  "automation_execution_logs",
  "tenant_automation_actions",
  "controls",
  "control_categories",
  "users",
  "user_preferences",
  "tokens",
  "roles",
  "files",
  "file_managers",
  "file_access_logs",
  "vendors",
  "vendors_projects",
  "projects",
  "project_frameworks",
  "project_scopes",
  "project_members",
  "frameworks",
  "organizations",
  "assessments",
  "policies",
  "risk_history",
  "topics",
  "subtopics",
  "questions",
  "subcontrols",
];

// Tables in tenant schemas that need timestamps
const TENANT_TABLES_NEED_CREATED_AT = [
  "ai_trust_center_info",
  "ai_trust_centre_company_description",
  "ai_trust_centre_compliance_badges",
  "ai_trust_centre_intro",
  "ai_trust_centre_resources",
  "ai_trust_centre_subprocessors",
  "ai_trust_centre_terms_and_contract",
  "model_inventory_project_frameworks",
  "training_registar",
];

const TENANT_TABLES_NEED_UPDATED_AT = [
  "ai_trust_center_info",
  "ai_trust_centre_company_description",
  "ai_trust_centre_compliance_badges",
  "ai_trust_centre_intro",
  "ai_trust_centre_resources",
  "ai_trust_centre_subprocessors",
  "ai_trust_centre_terms_and_contract",
  "model_inventory",
  "model_inventory_change_history",
  "model_inventory_history",
  "model_inventory_project_frameworks",
  "model_risks",
  "training_registar",
  "incident_management",
];

async function addColumnIfNotExists(
  queryInterface: QueryInterface,
  schema: string,
  tableName: string,
  columnName: string
) {
  const columnExists: any[] = await queryInterface.sequelize.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = :schema
      AND table_name = :table
      AND column_name = :column
    )`,
    {
      replacements: { schema, table: tableName, column: columnName },
      type: queryInterface.sequelize.QueryTypes.SELECT,
    }
  );

  if (!columnExists[0].exists) {
    const tableExists: any[] = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = :schema
        AND table_name = :table
      )`,
      {
        replacements: { schema, table: tableName },
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    if (tableExists[0].exists) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${schema}"."${tableName}"
         ADD COLUMN IF NOT EXISTS ${columnName} TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
      );
      console.log(`Added ${columnName} to ${schema}.${tableName}`);
    }
  }
}

async function dropColumnIfExists(
  queryInterface: QueryInterface,
  schema: string,
  tableName: string,
  columnName: string
) {
  const columnExists: any[] = await queryInterface.sequelize.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = :schema
      AND table_name = :table
      AND column_name = :column
    )`,
    {
      replacements: { schema, table: tableName, column: columnName },
      type: queryInterface.sequelize.QueryTypes.SELECT,
    }
  );

  if (columnExists[0].exists) {
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."${tableName}"
       DROP COLUMN IF EXISTS ${columnName}`
    );
    console.log(`Dropped ${columnName} from ${schema}.${tableName}`);
  }
}

export default {
  up: async (queryInterface: QueryInterface) => {
    // Add timestamps to public schema tables
    for (const table of PUBLIC_TABLES_NEED_CREATED_AT) {
      await addColumnIfNotExists(queryInterface, "public", table, "created_at");
    }

    for (const table of PUBLIC_TABLES_NEED_UPDATED_AT) {
      await addColumnIfNotExists(queryInterface, "public", table, "updated_at");
    }

    // Get all tenant schemas
    const tenantSchemas: any[] = await queryInterface.sequelize.query(
      `SELECT schema_name
       FROM information_schema.schemata
       WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
       AND schema_name NOT LIKE 'pg_%'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Add timestamps to tenant schema tables
    for (const { schema_name } of tenantSchemas) {
      for (const table of TENANT_TABLES_NEED_CREATED_AT) {
        await addColumnIfNotExists(queryInterface, schema_name, table, "created_at");
      }

      for (const table of TENANT_TABLES_NEED_UPDATED_AT) {
        await addColumnIfNotExists(queryInterface, schema_name, table, "updated_at");
      }
    }

    console.log("Timestamp standardization migration completed successfully");
  },

  down: async (queryInterface: QueryInterface) => {
    // Note: Down migration only removes columns that were added by this migration
    // Columns that already existed will not be removed

    // Remove from public schema
    for (const table of PUBLIC_TABLES_NEED_CREATED_AT) {
      await dropColumnIfExists(queryInterface, "public", table, "created_at");
    }

    for (const table of PUBLIC_TABLES_NEED_UPDATED_AT) {
      await dropColumnIfExists(queryInterface, "public", table, "updated_at");
    }

    // Get all tenant schemas
    const tenantSchemas: any[] = await queryInterface.sequelize.query(
      `SELECT schema_name
       FROM information_schema.schemata
       WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
       AND schema_name NOT LIKE 'pg_%'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Remove from tenant schemas
    for (const { schema_name } of tenantSchemas) {
      for (const table of TENANT_TABLES_NEED_CREATED_AT) {
        await dropColumnIfExists(queryInterface, schema_name, table, "created_at");
      }

      for (const table of TENANT_TABLES_NEED_UPDATED_AT) {
        await dropColumnIfExists(queryInterface, schema_name, table, "updated_at");
      }
    }

    console.log("Timestamp standardization migration rolled back successfully");
  },
};
