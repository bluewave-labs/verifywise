'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('outbox_dead_letter', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      original_event_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'ID of the original event that failed'
      },
      tenant: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Tenant identifier for multi-tenant isolation'
      },
      event_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Type of event that failed'
      },
      aggregate_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'ID of the aggregate this event relates to'
      },
      aggregate_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Type of aggregate (vendors, risks, etc.)'
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Original event payload for potential replay'
      },
      failure_reason: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Error message explaining why the event failed'
      },
      failed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When the event was moved to dead letter queue'
      },
      retry_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of times this event was retried before failing'
      },
      original_created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When the original event was created'
      },
      first_attempted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the event was first attempted for processing'
      }
    });

    // Add indexes for efficient querying
    await queryInterface.addIndex('outbox_dead_letter', {
      fields: ['tenant', 'failed_at'],
      name: 'idx_dead_letter_tenant_failed_at'
    });

    await queryInterface.addIndex('outbox_dead_letter', {
      fields: ['event_type'],
      name: 'idx_dead_letter_event_type'
    });

    await queryInterface.addIndex('outbox_dead_letter', {
      fields: ['aggregate_type', 'aggregate_id'],
      name: 'idx_dead_letter_aggregate'
    });

    await queryInterface.addIndex('outbox_dead_letter', {
      fields: ['original_event_id'],
      name: 'idx_dead_letter_original_event_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('outbox_dead_letter');
  }
};