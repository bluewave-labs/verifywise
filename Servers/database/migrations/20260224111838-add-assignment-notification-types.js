'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new notification type enum values for assignment notifications
    // NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction in PostgreSQL

    const newValues = [
      'assignment_owner',
      'assignment_reviewer',
      'assignment_approver',
      'assignment_member',
      'assignment_assignee',
      'assignment_action_owner',
      'assignment_risk_owner'
    ];

    // Get all organizations
    const [organizations] = await queryInterface.sequelize.query(
      `SELECT id FROM public.organizations;`
    );

    if (organizations.length === 0) {
      console.log('No organizations found, skipping migration');
      return;
    }

    // Process each tenant
    for (const org of organizations) {
      const tenantHash = getTenantHash(org.id);

      for (const value of newValues) {
        try {
          // Check if value already exists
          const [existing] = await queryInterface.sequelize.query(
            `SELECT 1 FROM pg_enum
             WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_notification_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = '${tenantHash}'))
             AND enumlabel = '${value}'`
          );

          if (existing.length === 0) {
            // Value doesn't exist, add it (must be outside transaction)
            await queryInterface.sequelize.query(
              `ALTER TYPE "${tenantHash}".enum_notification_type ADD VALUE '${value}';`
            );
            console.log(`Added '${value}' to ${tenantHash}.enum_notification_type`);
          }
        } catch (error) {
          // Value might already exist or enum might not exist
          console.log(`Note for ${tenantHash}: ${error.message}`);
        }
      }

      console.log(`Processed tenant ${tenantHash}`);
    }

    console.log('Migration completed: Added assignment notification types');
  },

  async down(queryInterface, Sequelize) {
    // PostgreSQL doesn't support removing enum values directly
    // To revert, you would need to recreate the enum type
    console.log('Note: Cannot remove enum values in PostgreSQL. Manual intervention required if needed.');
  }
};
