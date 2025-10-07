/**
 * @fileoverview Event Acknowledgments Table Migration
 *
 * Creates the event_acknowledgments table to track which users have processed
 * specific outbox events. This enables user-specific event consumption where
 * multiple users can independently process the same event.
 *
 * **Purpose:**
 * - Track event processing per user (not globally)
 * - Enable multiple users to process same events independently
 * - Support Flowgram.ai workflow routing to different users
 * - Maintain audit trail of event processing
 *
 * **Schema Design:**
 * - Composite unique key (event_id, user_id) prevents duplicate processing per user
 * - Tenant isolation ensures users only see events from their organization
 * - Flexible status tracking (processed, failed, skipped, etc.)
 * - Metadata field for storing processing details and workflow information
 *
 * @created 2025-10-06
 */

'use strict';

const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      /**
       * Get all existing tenant schemas
       */
      const organizations = await queryInterface.sequelize.query(`
        SELECT id FROM organizations;
      `, { transaction });

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      /**
       * Create event_acknowledgments table in each tenant schema
       * Note: No 'tenant' field needed - schema isolation provides that
       */
      for (const org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        console.log(`Creating event_acknowledgments table in tenant schema: ${tenantHash}`);

        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".event_acknowledgments (
            id BIGSERIAL PRIMARY KEY,
            event_id BIGINT NOT NULL,
            user_id INTEGER NOT NULL,
            processor VARCHAR(100) NOT NULL DEFAULT 'flowgram.ai',
            status VARCHAR(20) NOT NULL DEFAULT 'processed',
            processed_at TIMESTAMP NOT NULL DEFAULT NOW(),
            metadata JSONB,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            FOREIGN KEY (event_id) REFERENCES "${tenantHash}".outbox_events(id) ON DELETE CASCADE ON UPDATE CASCADE
          );
        `, { transaction });
      }

      /**
       * Create indexes for performance and constraints in each tenant schema
       */
      for (const org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        // Unique constraint: Each user can only acknowledge an event once
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".event_acknowledgments
          ADD CONSTRAINT unique_event_user_acknowledgment UNIQUE (event_id, user_id);
        `, { transaction });

        // Index for efficient querying by user
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_event_ack_user_id
          ON "${tenantHash}".event_acknowledgments (user_id);
        `, { transaction });

        // Index for efficient querying by event_id (foreign key)
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_event_ack_event_id
          ON "${tenantHash}".event_acknowledgments (event_id);
        `, { transaction });

        // Index for querying by status
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_event_ack_status
          ON "${tenantHash}".event_acknowledgments (status);
        `, { transaction });

        // Index for time-based queries and cleanup
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_event_ack_processed_at
          ON "${tenantHash}".event_acknowledgments (processed_at);
        `, { transaction });

        // Index for processor-based analytics
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_event_ack_processor_status
          ON "${tenantHash}".event_acknowledgments (processor, status);
        `, { transaction });
      }

      await transaction.commit();
      console.log('✅ Event acknowledgments table created successfully in all tenant schemas');
      console.log('📋 Features enabled:');
      console.log('   - User-specific event processing tracking');
      console.log('   - Multi-tenant event isolation via schema separation');
      console.log('   - Flexible processing status tracking');
      console.log('   - Audit trail with metadata support');
      console.log('   - Optimized indexes for performance');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to create event_acknowledgments infrastructure:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      /**
       * Drop the event_acknowledgments table from each tenant schema
       */
      const organizations = await queryInterface.sequelize.query(`
        SELECT id FROM organizations;
      `, { transaction });

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".event_acknowledgments CASCADE;
        `, { transaction });

        console.log(`Dropped event_acknowledgments from schema: ${tenantHash}`);
      }

      await transaction.commit();
      console.log('🗑️  Event acknowledgments tables dropped from all tenant schemas');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to drop event_acknowledgments tables:', error);
      throw error;
    }
  }
};
