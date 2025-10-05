'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get all existing organizations to add triggers to their tenant schemas
      const organizations = await queryInterface.sequelize.query(`
        SELECT id FROM organizations;
      `, { transaction });

      // Tables to add triggers to (key tables for workflow automation)
      const targetTables = [
        'vendors',        // Vendor status changes
        'projectrisks',   // Risk status changes
        'controls_eu',    // Control status changes
        'tasks',          // Task status changes
      ];

      // Add triggers to all existing tenant schemas
      for (const org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        console.log(`Adding outbox triggers to tenant schema: ${tenantHash}`);

        for (const tableName of targetTables) {
          // Check if table exists in this tenant schema before adding trigger
          const tableExists = await queryInterface.sequelize.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = '${tenantHash}'
              AND table_name = '${tableName}'
            );
          `, { transaction });

          if (tableExists[0][0].exists) {
            const triggerName = `${tableName}_outbox_trigger`;

            // Add the trigger
            await queryInterface.sequelize.query(`
              CREATE TRIGGER "${triggerName}"
              AFTER INSERT OR UPDATE OR DELETE ON "${tenantHash}"."${tableName}"
              FOR EACH ROW EXECUTE FUNCTION create_outbox_event();
            `, { transaction });

            console.log(`✅ Added trigger ${triggerName} to ${tenantHash}.${tableName}`);
          } else {
            console.log(`⚠️ Table ${tableName} not found in schema ${tenantHash}, skipping`);
          }
        }
      }

      // Create a helper function to add triggers to new tenant schemas
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION add_outbox_triggers_to_schema(schema_name TEXT)
        RETURNS VOID AS $$
        DECLARE
            table_names TEXT[] := ARRAY['vendors', 'projectrisks', 'controls_eu', 'tasks'];
            table_name TEXT;
            trigger_name TEXT;
        BEGIN
            FOREACH table_name IN ARRAY table_names
            LOOP
                -- Check if table exists in the schema
                IF EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = schema_name
                    AND table_name = table_name
                ) THEN
                    trigger_name := table_name || '_outbox_trigger';

                    -- Drop trigger if it exists (for idempotency)
                    EXECUTE format('DROP TRIGGER IF EXISTS "%s" ON "%s"."%s"',
                                 trigger_name, schema_name, table_name);

                    -- Create the trigger
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

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get all existing organizations to remove triggers from their tenant schemas
      const organizations = await queryInterface.sequelize.query(`
        SELECT id FROM organizations;
      `, { transaction });

      // Tables to remove triggers from
      const targetTables = [
        'vendors',
        'projectrisks',
        'controls_eu',
        'tasks',
      ];

      // Remove triggers from all existing tenant schemas
      for (const org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        console.log(`Removing outbox triggers from tenant schema: ${tenantHash}`);

        for (const tableName of targetTables) {
          const triggerName = `${tableName}_outbox_trigger`;

          // Drop the trigger (ignore errors if doesn't exist)
          try {
            await queryInterface.sequelize.query(`
              DROP TRIGGER IF EXISTS "${triggerName}" ON "${tenantHash}"."${tableName}";
            `, { transaction });

            console.log(`✅ Removed trigger ${triggerName} from ${tenantHash}.${tableName}`);
          } catch (error) {
            console.log(`⚠️ Could not remove trigger ${triggerName}: ${error.message}`);
          }
        }
      }

      // Drop the helper function
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
