'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Create outbox_events table in public schema
      await queryInterface.createTable('outbox_events', {
        id: {
          type: Sequelize.BIGINT,
          autoIncrement: true,
          primaryKey: true,
        },
        tenant: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Tenant identifier for multi-tenant isolation'
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
      }, { transaction });

      // Create indexes for optimal performance
      await queryInterface.addIndex('outbox_events', {
        fields: ['tenant', 'available_at'],
        where: {
          processed_at: null
        },
        name: 'idx_outbox_tenant_available_unprocessed',
        transaction
      });

      await queryInterface.addIndex('outbox_events', {
        fields: ['event_type', 'aggregate_type'],
        name: 'idx_outbox_event_aggregate_type',
        transaction
      });

      await queryInterface.addIndex('outbox_events', {
        fields: ['created_at'],
        name: 'idx_outbox_created_at_cleanup',
        transaction
      });

      await queryInterface.addIndex('outbox_events', {
        fields: ['attempts', 'max_attempts'],
        where: {
          processed_at: null
        },
        name: 'idx_outbox_failed_events',
        transaction
      });

      // Create the trigger function for creating outbox events
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

            -- Build dedupe key: tenant:table:id:operation:data_hash
            dedupe_key := tenant_name || ':' || TG_TABLE_NAME || ':' ||
                          COALESCE(NEW.id::text, OLD.id::text) || ':' || TG_OP || ':' ||
                          md5(COALESCE(row_to_json(NEW)::text, '') || COALESCE(row_to_json(OLD)::text, ''));

            -- Build event payload with comprehensive data
            event_payload := jsonb_build_object(
                'operation', TG_OP,
                'table', TG_TABLE_NAME,
                'timestamp', NOW(),
                'schema', tenant_name,
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

            -- Insert to outbox with conflict handling for deduplication
            INSERT INTO public.outbox_events (
                tenant,
                event_type,
                aggregate_id,
                aggregate_type,
                payload,
                dedupe_key
            ) VALUES (
                tenant_name,
                event_type_name,
                COALESCE(NEW.id::text, OLD.id::text),
                TG_TABLE_NAME,
                event_payload,
                dedupe_key
            ) ON CONFLICT (dedupe_key) DO NOTHING;

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

      // Drop the table (indexes will be dropped automatically)
      await queryInterface.dropTable('outbox_events', { transaction });

      await transaction.commit();
      console.log('✅ Outbox events infrastructure removed successfully');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to remove outbox events infrastructure:', error);
      throw error;
    }
  }
};
