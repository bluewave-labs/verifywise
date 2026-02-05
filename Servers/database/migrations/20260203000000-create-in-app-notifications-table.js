"use strict";
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get all organizations to create tenant-specific tables
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      for (const org of organizations) {
        const tenantHash = getTenantHash(org.id);

        // Check if table already exists
        const tableExists = await queryInterface.sequelize.query(
          `SELECT to_regclass('"${tenantHash}".notifications');`,
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        if (tableExists[0].to_regclass) {
          console.log(`Table ${tenantHash}.notifications already exists, skipping`);
          continue;
        }

        // Create notification type enum
        await queryInterface.sequelize.query(
          `DO $$ BEGIN
            CREATE TYPE "${tenantHash}".enum_notification_type AS ENUM (
              'task_assigned',
              'task_completed',
              'review_requested',
              'review_approved',
              'review_rejected',
              'approval_requested',
              'approval_approved',
              'approval_rejected',
              'approval_complete',
              'policy_due_soon',
              'policy_overdue',
              'training_assigned',
              'training_completed',
              'vendor_review_due',
              'file_uploaded',
              'comment_added',
              'mention',
              'system'
            );
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;`,
          { transaction }
        );

        // Create entity type enum
        await queryInterface.sequelize.query(
          `DO $$ BEGIN
            CREATE TYPE "${tenantHash}".enum_notification_entity_type AS ENUM (
              'project',
              'task',
              'policy',
              'vendor',
              'model',
              'training',
              'file',
              'use_case',
              'risk',
              'assessment',
              'comment',
              'user'
            );
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;`,
          { transaction }
        );

        // Create notifications table
        await queryInterface.sequelize.query(
          `CREATE TABLE "${tenantHash}".notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            type "${tenantHash}".enum_notification_type NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            entity_type "${tenantHash}".enum_notification_entity_type NULL,
            entity_id INTEGER NULL,
            entity_name VARCHAR(255) NULL,
            action_url VARCHAR(500) NULL,
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            read_at TIMESTAMP WITH TIME ZONE NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by INTEGER NULL REFERENCES public.users(id) ON DELETE SET NULL,
            metadata JSONB NULL
          );`,
          { transaction }
        );

        // Create indexes for efficient queries
        await queryInterface.sequelize.query(
          `CREATE INDEX idx_notifications_user_id ON "${tenantHash}".notifications(user_id);`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `CREATE INDEX idx_notifications_user_unread ON "${tenantHash}".notifications(user_id, is_read) WHERE is_read = FALSE;`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `CREATE INDEX idx_notifications_created_at ON "${tenantHash}".notifications(created_at DESC);`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `CREATE INDEX idx_notifications_entity ON "${tenantHash}".notifications(entity_type, entity_id);`,
          { transaction }
        );

        console.log(`Created notifications table for tenant: ${tenantHash}`);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      for (const org of organizations) {
        const tenantHash = getTenantHash(org.id);

        // Drop indexes first
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${tenantHash}".idx_notifications_user_id;`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${tenantHash}".idx_notifications_user_unread;`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${tenantHash}".idx_notifications_created_at;`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${tenantHash}".idx_notifications_entity;`,
          { transaction }
        );

        // Drop table
        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${tenantHash}".notifications CASCADE;`,
          { transaction }
        );

        // Drop enum types
        await queryInterface.sequelize.query(
          `DROP TYPE IF EXISTS "${tenantHash}".enum_notification_type CASCADE;`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `DROP TYPE IF EXISTS "${tenantHash}".enum_notification_entity_type CASCADE;`,
          { transaction }
        );

        console.log(`Dropped notifications table for tenant: ${tenantHash}`);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
