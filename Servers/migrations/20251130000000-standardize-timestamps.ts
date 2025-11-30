import { QueryInterface, DataTypes, Transaction } from "sequelize";

/**
 * Migration to standardize timestamps across all tables
 *
 * This migration adds created_at and updated_at columns to tables that are missing them,
 * and ensures consistent naming convention (snake_case) across all tables.
 *
 * IMPORTANT: This migration is wrapped in a transaction for safety.
 * All table names are verified against actual model definitions.
 */

// Tables in public schema that need created_at added
// Table names verified against model tableName definitions
const PUBLIC_TABLES_NEED_CREATED_AT = [
  "automation_actions",
  "automation_triggers",
  "automation_triggers_actions", // Fixed: was "automation_trigger_actions"
  "user_preferences",
  "files",
  "file_manager", // Fixed: was "file_managers" (singular in model)
  "file_access_logs",
  "vendor_projects", // Fixed: was "vendors_projects" (singular in model)
  "project_frameworks",
  "project_members",
  // Added missing tables:
  "tasks",
  "task_assignees",
  "tiers",
  "subscriptions",
  "slack_webhooks",
  "project_risks",
];

const PUBLIC_TABLES_NEED_UPDATED_AT = [
  "automations",
  "automation_actions",
  "automation_triggers",
  "automation_triggers_actions", // Fixed: was "automation_trigger_actions"
  "automation_execution_logs",
  "controls",
  "control_categories",
  "users",
  "user_preferences",
  "tokens",
  "roles",
  "files",
  "file_manager", // Fixed: was "file_managers"
  "file_access_logs",
  "vendors",
  "vendor_projects", // Fixed: was "vendors_projects"
  "projects",
  "project_frameworks",
  "project_scopes",
  "project_members",
  "frameworks",
  "organizations",
  "assessments",
  "policy_manager", // Fixed: was "policies"
  "risk_history",
  "topics",
  "subtopics",
  "questions",
  "subcontrols",
  // Added missing tables:
  "tasks",
  "task_assignees",
  "tiers",
  "subscriptions",
  "slack_webhooks",
  "project_risks",
  "vendor_risks",
];

// Tables in tenant schemas that need timestamps
// Table names verified against model tableName definitions
const TENANT_TABLES_NEED_CREATED_AT = [
  "ai_trust_center_info", // Using "center" to match model
  "ai_trust_center_company_description", // Fixed: was "centre"
  "ai_trust_center_compliance_badges", // Fixed: was "centre"
  "ai_trust_center_intro", // Fixed: was "centre"
  "ai_trust_center_resources", // Fixed: was "centre"
  "ai_trust_center_subprocessors", // Fixed: was "centre"
  "ai_trust_center_terms_and_contact", // Fixed: was "centre" and "contract"
  "model_inventories_projects_frameworks", // Fixed: was "model_inventory_project_frameworks"
  "trainingregistar", // Fixed: was "training_registar" (no underscore in model)
  // Added missing tables:
  "mlflow_integrations",
  "mlflow_model_records",
  "evidence_hub",
];

const TENANT_TABLES_NEED_UPDATED_AT = [
  "ai_trust_center_info", // Using "center" to match model
  "ai_trust_center_company_description", // Fixed: was "centre"
  "ai_trust_center_compliance_badges", // Fixed: was "centre"
  "ai_trust_center_intro", // Fixed: was "centre"
  "ai_trust_center_resources", // Fixed: was "centre"
  "ai_trust_center_subprocessors", // Fixed: was "centre"
  "ai_trust_center_terms_and_contact", // Fixed: was "centre" and "contract"
  "model_inventories", // Fixed: was "model_inventory" (plural in model)
  "model_inventory_change_history",
  "model_inventory_history",
  "model_inventories_projects_frameworks", // Fixed: was "model_inventory_project_frameworks"
  "model_risks",
  "trainingregistar", // Fixed: was "training_registar"
  "ai_incident_managements", // Fixed: was "incident_management"
  // Added missing tables:
  "mlflow_integrations",
  "mlflow_model_records",
  "evidence_hub",
];

async function addColumnIfNotExists(
  queryInterface: QueryInterface,
  schema: string,
  tableName: string,
  columnName: string,
  transaction: Transaction
) {
  try {
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
        transaction,
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
          transaction,
        }
      );

      if (tableExists[0].exists) {
        // Add column with DEFAULT NOW() and NOT NULL constraint
        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema}"."${tableName}"
           ADD COLUMN IF NOT EXISTS "${columnName}" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`,
          { transaction }
        );
        console.log(`Added ${columnName} to ${schema}.${tableName}`);
      } else {
        console.log(`Table ${schema}.${tableName} does not exist, skipping`);
      }
    } else {
      console.log(`Column ${columnName} already exists in ${schema}.${tableName}`);
    }
  } catch (error) {
    console.error(`Error adding ${columnName} to ${schema}.${tableName}:`, error);
    throw error;
  }
}

async function dropColumnIfExists(
  queryInterface: QueryInterface,
  schema: string,
  tableName: string,
  columnName: string,
  transaction: Transaction
) {
  try {
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
        transaction,
      }
    );

    if (columnExists[0].exists) {
      // Check if this column was added by this migration (has default NOW())
      // To be safe, we only drop columns that have the default value pattern
      const columnInfo: any[] = await queryInterface.sequelize.query(
        `SELECT column_default
         FROM information_schema.columns
         WHERE table_schema = :schema
         AND table_name = :table
         AND column_name = :column`,
        {
          replacements: { schema, table: tableName, column: columnName },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      // Only drop if it looks like it was added by this migration
      const columnDefault = columnInfo[0]?.column_default || "";
      if (columnDefault.includes("now()")) {
        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema}"."${tableName}"
           DROP COLUMN IF EXISTS "${columnName}"`,
          { transaction }
        );
        console.log(`Dropped ${columnName} from ${schema}.${tableName}`);
      } else {
        console.log(`Preserved ${columnName} in ${schema}.${tableName} (not added by this migration)`);
      }
    }
  } catch (error) {
    console.error(`Error processing ${columnName} in ${schema}.${tableName}:`, error);
    throw error;
  }
}

export default {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log("Starting timestamp standardization migration...");

      // Add timestamps to public schema tables
      for (const table of PUBLIC_TABLES_NEED_CREATED_AT) {
        await addColumnIfNotExists(queryInterface, "public", table, "created_at", transaction);
      }

      for (const table of PUBLIC_TABLES_NEED_UPDATED_AT) {
        await addColumnIfNotExists(queryInterface, "public", table, "updated_at", transaction);
      }

      // Get all tenant schemas
      const tenantSchemas: any[] = await queryInterface.sequelize.query(
        `SELECT schema_name
         FROM information_schema.schemata
         WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
         AND schema_name NOT LIKE 'pg_%'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      // Add timestamps to tenant schema tables
      for (const { schema_name } of tenantSchemas) {
        console.log(`Processing tenant schema: ${schema_name}`);

        for (const table of TENANT_TABLES_NEED_CREATED_AT) {
          await addColumnIfNotExists(queryInterface, schema_name, table, "created_at", transaction);
        }

        for (const table of TENANT_TABLES_NEED_UPDATED_AT) {
          await addColumnIfNotExists(queryInterface, schema_name, table, "updated_at", transaction);
        }
      }

      await transaction.commit();
      console.log("Timestamp standardization migration completed successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Migration failed, rolling back:", error);
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log("Rolling back timestamp standardization migration...");
      console.log("WARNING: This will remove timestamp columns added by this migration.");

      // Remove from public schema
      for (const table of PUBLIC_TABLES_NEED_CREATED_AT) {
        await dropColumnIfExists(queryInterface, "public", table, "created_at", transaction);
      }

      for (const table of PUBLIC_TABLES_NEED_UPDATED_AT) {
        await dropColumnIfExists(queryInterface, "public", table, "updated_at", transaction);
      }

      // Get all tenant schemas
      const tenantSchemas: any[] = await queryInterface.sequelize.query(
        `SELECT schema_name
         FROM information_schema.schemata
         WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
         AND schema_name NOT LIKE 'pg_%'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      // Remove from tenant schemas
      for (const { schema_name } of tenantSchemas) {
        console.log(`Rolling back tenant schema: ${schema_name}`);

        for (const table of TENANT_TABLES_NEED_CREATED_AT) {
          await dropColumnIfExists(queryInterface, schema_name, table, "created_at", transaction);
        }

        for (const table of TENANT_TABLES_NEED_UPDATED_AT) {
          await dropColumnIfExists(queryInterface, schema_name, table, "updated_at", transaction);
        }
      }

      await transaction.commit();
      console.log("Timestamp standardization migration rolled back successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Rollback failed:", error);
      throw error;
    }
  },
};
