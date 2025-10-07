/**
 * @fileoverview Outbox Events Table Migration
 *
 * Creates the core infrastructure for the Outbox + LISTEN/NOTIFY pattern
 * used for reliable event-driven workflows in VerifyWise.
 *
 * **Purpose:**
 * - Capture database changes as events for downstream processing (FlowGram)
 * - Ensure reliable event delivery with retry logic and dead letter handling
 * - Support multi-tenant isolation and deduplication
 * - Provide foundation for workflow automation without coupling
 *
 * **Key Features:**
 * - Multi-tenant event isolation using schema-based tenancy
 * - Automatic event creation via PostgreSQL triggers
 * - Built-in retry logic with exponential backoff
 * - Event deduplication to prevent duplicate processing
 * - Rich event payload with old/new data and change detection
 * - Performance-optimized indexes for high-volume operations
 * - PostgreSQL LISTEN/NOTIFY for real-time event processing
 *
 * **Integration Points:**
 * - FlowGram polling: Query unprocessed events for workflow automation
 * - Real-time processing: LISTEN to 'outbox_wakeup' notifications
 * - Monitoring: Built-in retry tracking and failure analysis
 *
 * @module migrations/outbox-events-table
 * @version 1.0.0
 * @created 2025-01-06
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      /**
       * STEP 1: Get all existing tenant schemas
       * Query organizations table to identify all tenant schemas
       */
      const organizations = await queryInterface.sequelize.query(`
        SELECT id FROM organizations;
      `, { transaction });

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      /**
       * OUTBOX EVENTS TABLE SCHEMA
       *
       * This table will be created in each tenant schema for proper isolation.
       * Note: No 'tenant' field needed - schema isolation provides that.
       */
      const tableSchema = {
        id: {
          type: Sequelize.BIGINT,
          autoIncrement: true,
          primaryKey: true,
        },
        event_type: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Type of event (e.g., vendors_update, risks_update)'
        },
        aggregate_id: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'ID of the entity that triggered the event'
        },
        aggregate_type: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Type of entity (e.g., vendors, risks, controls)'
        },
        payload: {
          type: Sequelize.JSONB,
          allowNull: false,
          comment: 'Event payload containing old_data, new_data, and metadata'
        },
        dedupe_key: {
          type: Sequelize.STRING(200),
          allowNull: true,
          unique: true,
          comment: 'Unique key to prevent duplicate event processing'
        },

        // Retry logic fields
        attempts: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false,
          comment: 'Number of processing attempts made'
        },
        max_attempts: {
          type: Sequelize.INTEGER,
          defaultValue: 3,
          allowNull: false,
          comment: 'Maximum number of processing attempts'
        },
        available_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          allowNull: false,
          comment: 'When this event becomes available for processing'
        },

        // Audit trail fields
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          allowNull: false,
        },
        processed_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When this event was successfully processed'
        },
      };

      /**
       * STEP 2: Create outbox_events table in each tenant schema
       */
      for (const org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        console.log(`Creating outbox_events table in tenant schema: ${tenantHash}`);

        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".outbox_events (
            id BIGSERIAL PRIMARY KEY,
            event_type VARCHAR(100) NOT NULL,
            aggregate_id VARCHAR(100) NOT NULL,
            aggregate_type VARCHAR(50) NOT NULL,
            payload JSONB NOT NULL,
            dedupe_key VARCHAR(200) UNIQUE,
            attempts INTEGER NOT NULL DEFAULT 0,
            max_attempts INTEGER NOT NULL DEFAULT 3,
            available_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP
          );
        `, { transaction });
      }

      /**
       * STEP 3: Create performance indexes for each tenant schema
       *
       * Optimized for the following query patterns:
       * 1. FlowGram polling: WHERE processed_at IS NULL ORDER BY available_at
       * 2. Event monitoring: WHERE event_type = ? AND aggregate_type = ?
       * 3. Cleanup operations: WHERE created_at < ? AND processed_at IS NOT NULL
       * 4. Failure analysis: WHERE attempts >= max_attempts AND processed_at IS NULL
       */
      for (const org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_outbox_available_unprocessed
          ON "${tenantHash}".outbox_events (available_at)
          WHERE processed_at IS NULL;
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_outbox_event_aggregate_type
          ON "${tenantHash}".outbox_events (event_type, aggregate_type);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_outbox_created_at_cleanup
          ON "${tenantHash}".outbox_events (created_at);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_outbox_failed_events
          ON "${tenantHash}".outbox_events (attempts, max_attempts)
          WHERE processed_at IS NULL;
        `, { transaction });
      }

      /**
       * OUTBOX EVENT TRIGGER FUNCTION
       *
       * PostgreSQL trigger function that automatically creates outbox events
       * whenever data changes in tenant tables (vendors, projectrisks, controls_eu, tasks).
       *
       * **Multi-Tenant Design:**
       * - Uses current_schema() to detect tenant context
       * - Each tenant has their own schema (e.g., 'a4ayc80OGd')
       * - Events are tagged with tenant for isolation
       *
       * **Event Generation:**
       * - Captures INSERT, UPDATE, DELETE operations
       * - Generates rich payload with old_data, new_data, changed_fields
       * - Creates deduplication key to prevent duplicate events
       * - Sends PostgreSQL notification for real-time processing
       *
       * **FlowGram Integration:**
       * - Events contain all data needed for workflow decisions
       * - changed_fields helps identify specific triggers (e.g., status changes)
       * - Tenant isolation ensures workflows only see relevant events
       */
      /**
       * STEP 4: Create trigger function that inserts into tenant-specific table
       */
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION create_outbox_event()
        RETURNS TRIGGER AS $$
        DECLARE
            tenant_name TEXT;
            event_payload JSONB;
            dedupe_key TEXT;
            event_type_name TEXT;
        BEGIN
            -- Extract tenant from current schema (multi-tenant support)
            tenant_name := current_schema();

            -- Skip if we're in public schema (system operations)
            IF tenant_name = 'public' THEN
                RETURN COALESCE(NEW, OLD);
            END IF;

            -- Build event type name
            event_type_name := TG_TABLE_NAME || '_' || lower(TG_OP);

            -- Build dedupe key: table:id:operation:data_hash (no tenant needed, schema provides isolation)
            dedupe_key := TG_TABLE_NAME || ':' ||
                          COALESCE(NEW.id::text, OLD.id::text) || ':' || TG_OP || ':' ||
                          md5(COALESCE(row_to_json(NEW)::text, '') || COALESCE(row_to_json(OLD)::text, ''));

            -- Build event payload with comprehensive data
            event_payload := jsonb_build_object(
                'operation', TG_OP,
                'table', TG_TABLE_NAME,
                'timestamp', NOW(),
                'old_data', CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
                'new_data', CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
                'changed_fields', CASE
                    WHEN TG_OP = 'UPDATE' THEN (
                        SELECT jsonb_object_agg(key, value)
                        FROM jsonb_each(row_to_json(NEW)::jsonb)
                        WHERE value IS DISTINCT FROM (row_to_json(OLD)::jsonb ->> key)::jsonb
                    )
                    ELSE NULL
                END
            );

            -- Insert to outbox in the current (tenant) schema
            EXECUTE format(
                'INSERT INTO %I.outbox_events (event_type, aggregate_id, aggregate_type, payload, dedupe_key)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (dedupe_key) DO NOTHING',
                tenant_name
            ) USING event_type_name, COALESCE(NEW.id::text, OLD.id::text), TG_TABLE_NAME, event_payload, dedupe_key;

            -- Wake up the event processors
            PERFORM pg_notify('outbox_wakeup', tenant_name || ':' || event_type_name);

            RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;
      `, { transaction });

      await transaction.commit();
      console.log('✅ Outbox events table and trigger function created successfully');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to create outbox events infrastructure:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Drop the trigger function
      await queryInterface.sequelize.query(`
        DROP FUNCTION IF EXISTS create_outbox_event() CASCADE;
      `, { transaction });

      // Get all tenant schemas
      const organizations = await queryInterface.sequelize.query(`
        SELECT id FROM organizations;
      `, { transaction });

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      // Drop the table from each tenant schema (indexes will be dropped automatically)
      for (const org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".outbox_events CASCADE;
        `, { transaction });

        console.log(`Dropped outbox_events from schema: ${tenantHash}`);
      }

      await transaction.commit();
      console.log('✅ Outbox events infrastructure removed successfully');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to remove outbox events infrastructure:', error);
      throw error;
    }
  }
};
