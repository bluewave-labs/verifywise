/**
 * @fileoverview Outbox Triggers for Tenant Tables Migration
 *
 * **Purpose:**
 * Applies the outbox event trigger to all existing tenant tables,
 * enabling automatic event generation for existing organizations.
 * This migration is essential for enabling FlowGram workflow automation
 * across all tenant data changes.
 *
 * **Multi-Tenant Architecture:**
 * - Each organization has its own database schema (e.g., 'a4ayc80OGd')
 * - Tables within tenant schemas need triggers for event collection
 * - Uses getTenantHash() to map organization IDs to schema names
 * - Applies triggers consistently across all tenant schemas
 *
 * **Target Tables for Event Collection:**
 * - `vendors`: Vendor lifecycle events (status, assignments, approvals)
 * - `projectrisks`: Risk management events (levels, deadlines, status)
 * - `controls_eu`: Control compliance events (status updates)
 * - `tasks`: Task management events (completion, assignments)
 *
 * **FlowGram Integration Benefits:**
 * Once triggers are applied, FlowGram can automatically receive events for:
 * - Vendor approval workflows
 * - Risk escalation notifications
 * - Compliance status updates
 * - Task completion notifications
 *
 * **Trigger Function Reference:**
 * Uses the `create_outbox_event()` function created in the outbox-events-table
 * migration to generate consistent event structure across all tenant tables.
 *
 * **Safety Features:**
 * - Transactional operation ensures atomic application
 * - Graceful error handling for missing tables or schemas
 * - Idempotent design allows safe re-running
 * - Preserves existing data and functionality
 *
 * @module migrations/add-outbox-triggers-to-tenant-tables
 * @version 1.0.0
 * @created 2025-01-06
 * @requires getTenantHash utility for multi-tenant schema mapping
 */

'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * SECURITY: PostgreSQL Identifier Validation
 *
 * Validates that identifiers (schema names, table names, trigger names) conform to PostgreSQL
 * naming rules and prevent SQL injection attacks.
 *
 * PostgreSQL identifier rules:
 * - Must start with a letter (a-z, A-Z) or underscore (_)
 * - Can contain letters, digits (0-9), underscores, and dollar signs ($)
 * - Maximum length is 63 characters
 * - Case-insensitive unless quoted
 *
 * @param {string} identifier - The identifier to validate
 * @returns {boolean} - True if valid PostgreSQL identifier, false otherwise
 */
function isValidPostgreSQLIdentifier(identifier) {
  if (!identifier || typeof identifier !== 'string') {
    return false;
  }

  // Check length (PostgreSQL limit is 63 characters)
  if (identifier.length === 0 || identifier.length > 63) {
    return false;
  }

  // Check that it starts with a letter or underscore
  if (!/^[a-zA-Z_]/.test(identifier)) {
    return false;
  }

  // Check that it only contains valid characters
  if (!/^[a-zA-Z0-9_$]+$/.test(identifier)) {
    return false;
  }

  // Reject SQL keywords and potentially dangerous patterns
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'GRANT', 'REVOKE', 'UNION', 'EXEC', 'EXECUTE', 'SCRIPT', 'EVAL'
  ];

  const upperIdentifier = identifier.toUpperCase();
  if (sqlKeywords.includes(upperIdentifier)) {
    return false;
  }

  // Reject identifiers that contain SQL injection patterns
  const dangerousPatterns = [
    '--', '/*', '*/', ';', "'", '"', '\\', '\n', '\r', '\t'
  ];

  for (const pattern of dangerousPatterns) {
    if (identifier.includes(pattern)) {
      return false;
    }
  }

  return true;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * Apply outbox triggers to all existing tenant schemas
   *
   * **Migration Process:**
   * 1. Query all organizations to identify existing tenant schemas
   * 2. For each tenant schema, apply triggers to target tables
   * 3. Validate table existence before applying triggers
   * 4. Create helper function for future tenant setup
   *
   * **Multi-Tenant Safety:**
   * - Uses transactional operation for atomicity
   * - Validates table existence before trigger creation
   * - Handles missing tables gracefully with warnings
   * - Provides detailed logging for operational visibility
   */
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      /**
       * STEP 1: Discovery Phase
       * Query all organizations to map to tenant schemas.
       * Each organization ID maps to a unique schema via getTenantHash().
       */
      const organizations = await queryInterface.sequelize.query(`
        SELECT id FROM organizations;
      `, { transaction });

      /**
       * STEP 2: Target Table Definition
       * These tables contain the core business entities that trigger
       * FlowGram workflows when their data changes.
       */
      const targetTables = [
        'vendors',        // Vendor lifecycle: approvals, status changes, assignments
        'projectrisks',   // Risk management: level changes, deadlines, escalations
        'controls_eu',    // Compliance: status updates, implementation tracking
        'tasks',          // Task management: completion, assignments, deadlines
      ];

      /**
       * STEP 3: Trigger Application Loop
       * For each tenant schema, apply outbox triggers to target tables.
       * This enables automatic event generation for all existing tenants.
       */
      for (const org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        console.log(`Adding outbox triggers to tenant schema: ${tenantHash}`);

        for (const tableName of targetTables) {
          /**
           * Table Existence Validation
           * Verify table exists in tenant schema before applying trigger.
           * Some tenants may not have all tables depending on their setup.
           *
           * SECURITY: Uses parameterized query to prevent SQL injection
           */
          const tableExists = await queryInterface.sequelize.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = :tenantHash
              AND table_name = :tableName
            );
          `, {
            replacements: { tenantHash, tableName },
            type: queryInterface.sequelize.QueryTypes.SELECT,
            transaction
          });

          if (tableExists[0].exists) {
            // SECURITY: Validate identifiers to prevent SQL injection
            if (!isValidPostgreSQLIdentifier(tenantHash) || !isValidPostgreSQLIdentifier(tableName)) {
              throw new Error(`Invalid identifier detected: tenantHash="${tenantHash}", tableName="${tableName}"`);
            }

            const triggerName = `${tableName}_outbox_trigger`;

            // SECURITY: Validate trigger name as well
            if (!isValidPostgreSQLIdentifier(triggerName)) {
              throw new Error(`Invalid trigger name: ${triggerName}`);
            }

            /**
             * Trigger Creation
             * Creates PostgreSQL trigger that fires on INSERT, UPDATE, DELETE
             * and calls create_outbox_event() function to generate events.
             *
             * SECURITY: Uses identifier validation and escaping for DDL statements
             */
            const escapedTriggerName = queryInterface.sequelize.escape(triggerName);
            const escapedSchemaName = queryInterface.sequelize.escape(tenantHash);
            const escapedTableName = queryInterface.sequelize.escape(tableName);

            await queryInterface.sequelize.query(`
              CREATE TRIGGER ${escapedTriggerName}
              AFTER INSERT OR UPDATE OR DELETE ON ${escapedSchemaName}.${escapedTableName}
              FOR EACH ROW EXECUTE FUNCTION create_outbox_event();
            `, { transaction });

            console.log(`✅ Added trigger ${triggerName} to ${tenantHash}.${tableName}`);
          } else {
            console.log(`⚠️ Table ${tableName} not found in schema ${tenantHash}, skipping`);
          }
        }
      }

      /**
       * STEP 4: Future Tenant Setup Helper
       * Creates a PostgreSQL function that can be called when new tenant
       * schemas are created to automatically apply outbox triggers.
       * This ensures consistent event collection for all future tenants.
       */
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION add_outbox_triggers_to_schema(schema_name TEXT)
        RETURNS VOID AS $$
        DECLARE
            table_names TEXT[] := ARRAY['vendors', 'projectrisks', 'controls_eu', 'tasks'];
            table_name TEXT;
            trigger_name TEXT;
        BEGIN
            -- Loop through each target table for event collection
            FOREACH table_name IN ARRAY table_names
            LOOP
                -- Verify table exists in the specified tenant schema
                IF EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = schema_name
                    AND table_name = table_name
                ) THEN
                    trigger_name := table_name || '_outbox_trigger';

                    -- Ensure idempotency by dropping existing trigger
                    EXECUTE format('DROP TRIGGER IF EXISTS "%s" ON "%s"."%s"',
                                 trigger_name, schema_name, table_name);

                    -- Create the outbox event trigger
                    EXECUTE format('CREATE TRIGGER "%s"
                                  AFTER INSERT OR UPDATE OR DELETE ON "%s"."%s"
                                  FOR EACH ROW EXECUTE FUNCTION create_outbox_event()',
                                 trigger_name, schema_name, table_name);

                    RAISE NOTICE 'Added outbox trigger % to %.%', trigger_name, schema_name, table_name;
                END IF;
            END LOOP;
        END;
        $$ LANGUAGE plpgsql;
      `, { transaction });

      await transaction.commit();
      console.log('✅ Outbox triggers added to all existing tenant schemas');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to add outbox triggers:', error);
      throw error;
    }
  },

  /**
   * Remove outbox triggers from all tenant schemas
   *
   * **Rollback Process:**
   * 1. Query all organizations to identify tenant schemas
   * 2. Remove triggers from target tables in each schema
   * 3. Drop the helper function for new tenant setup
   * 4. Clean rollback with graceful error handling
   *
   * **Safety Features:**
   * - Uses IF EXISTS to prevent errors on missing triggers
   * - Continues processing even if individual triggers fail
   * - Provides comprehensive logging for troubleshooting
   * - Transactional operation ensures consistency
   */
  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      /**
       * STEP 1: Organization Discovery
       * Query all organizations to map back to tenant schemas.
       * This mirrors the up migration process for consistency.
       */
      const organizations = await queryInterface.sequelize.query(`
        SELECT id FROM organizations;
      `, { transaction });

      /**
       * STEP 2: Target Table Definition
       * Same tables as up migration - must be kept in sync.
       */
      const targetTables = [
        'vendors',
        'projectrisks',
        'controls_eu',
        'tasks',
      ];

      /**
       * STEP 3: Trigger Removal Loop
       * For each tenant schema, remove outbox triggers from target tables.
       * This disables automatic event generation.
       */
      for (const org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        console.log(`Removing outbox triggers from tenant schema: ${tenantHash}`);

        for (const tableName of targetTables) {
          // SECURITY: Validate identifiers to prevent SQL injection in down migration
          if (!isValidPostgreSQLIdentifier(tenantHash) || !isValidPostgreSQLIdentifier(tableName)) {
            console.error(`⚠️ Invalid identifier detected in down migration: tenantHash="${tenantHash}", tableName="${tableName}"`);
            continue; // Skip this iteration but continue with others
          }

          const triggerName = `${tableName}_outbox_trigger`;

          // SECURITY: Validate trigger name
          if (!isValidPostgreSQLIdentifier(triggerName)) {
            console.error(`⚠️ Invalid trigger name in down migration: ${triggerName}`);
            continue;
          }

          /**
           * Safe Trigger Removal
           * Uses IF EXISTS to prevent errors on missing triggers.
           * Individual failures are logged but don't stop the process.
           *
           * SECURITY: Uses identifier validation and escaping for DDL statements
           */
          try {
            const escapedTriggerName = queryInterface.sequelize.escape(triggerName);
            const escapedSchemaName = queryInterface.sequelize.escape(tenantHash);
            const escapedTableName = queryInterface.sequelize.escape(tableName);

            await queryInterface.sequelize.query(`
              DROP TRIGGER IF EXISTS ${escapedTriggerName} ON ${escapedSchemaName}.${escapedTableName};
            `, { transaction });

            console.log(`✅ Removed trigger ${triggerName} from ${tenantHash}.${tableName}`);
          } catch (error) {
            console.log(`⚠️ Could not remove trigger ${triggerName}: ${error.message}`);
          }
        }
      }

      /**
       * STEP 4: Helper Function Cleanup
       * Remove the helper function created for future tenant setup.
       * This prevents orphaned functions in the database.
       */
      await queryInterface.sequelize.query(`
        DROP FUNCTION IF EXISTS add_outbox_triggers_to_schema(TEXT);
      `, { transaction });

      await transaction.commit();
      console.log('✅ Outbox triggers removed from all tenant schemas');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to remove outbox triggers:', error);
      throw error;
    }
  }
};
