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
    /**
     * Create event_acknowledgments table for user-specific event processing tracking
     */
    await queryInterface.createTable('event_acknowledgments', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        comment: 'Unique identifier for each acknowledgment record'
      },
      event_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'outbox_events',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Reference to the outbox event being acknowledged'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID of the user who processed this event'
      },
      tenant: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Tenant hash for multi-tenant isolation (matches outbox_events.tenant)'
      },
      processor: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'flowgram.ai',
        comment: 'System/service that processed the event (e.g., flowgram.ai, manual, etc.)'
      },
      status: {
        type: Sequelize.ENUM('processed', 'failed', 'skipped', 'in_progress'),
        allowNull: false,
        defaultValue: 'processed',
        comment: 'Processing status of the event for this user'
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Timestamp when the event was processed'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional processing metadata (workflow_id, result details, error info, etc.)'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    /**
     * Create indexes for performance and constraints
     */

    // Unique constraint: Each user can only acknowledge an event once
    await queryInterface.addConstraint('event_acknowledgments', {
      fields: ['event_id', 'user_id'],
      type: 'unique',
      name: 'unique_event_user_acknowledgment'
    });

    // Index for efficient querying by user and tenant
    await queryInterface.addIndex('event_acknowledgments', {
      fields: ['user_id', 'tenant'],
      name: 'idx_event_ack_user_tenant'
    });

    // Index for efficient querying by event_id (foreign key)
    await queryInterface.addIndex('event_acknowledgments', {
      fields: ['event_id'],
      name: 'idx_event_ack_event_id'
    });

    // Index for querying by tenant and status
    await queryInterface.addIndex('event_acknowledgments', {
      fields: ['tenant', 'status'],
      name: 'idx_event_ack_tenant_status'
    });

    // Index for time-based queries and cleanup
    await queryInterface.addIndex('event_acknowledgments', {
      fields: ['processed_at'],
      name: 'idx_event_ack_processed_at'
    });

    // Index for processor-based analytics
    await queryInterface.addIndex('event_acknowledgments', {
      fields: ['processor', 'status'],
      name: 'idx_event_ack_processor_status'
    });

    console.log('✅ Event acknowledgments table created successfully');
    console.log('📋 Features enabled:');
    console.log('   - User-specific event processing tracking');
    console.log('   - Multi-tenant event isolation');
    console.log('   - Flexible processing status tracking');
    console.log('   - Audit trail with metadata support');
    console.log('   - Optimized indexes for performance');
  },

  async down(queryInterface, Sequelize) {
    /**
     * Drop the event_acknowledgments table and all related indexes
     */
    await queryInterface.dropTable('event_acknowledgments');
    console.log('🗑️  Event acknowledgments table dropped');
  }
};
