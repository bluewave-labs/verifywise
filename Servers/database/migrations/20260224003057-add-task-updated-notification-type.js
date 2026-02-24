"use strict";
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get all organizations
    const organizations = await queryInterface.sequelize.query(
      `SELECT id FROM organizations;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const org of organizations) {
      const tenantHash = getTenantHash(org.id);

      // ALTER TYPE ADD VALUE cannot run inside a transaction
      // Use IF NOT EXISTS to make it idempotent
      try {
        await queryInterface.sequelize.query(
          `ALTER TYPE "${tenantHash}".enum_notification_type ADD VALUE IF NOT EXISTS 'task_updated';`
        );
        console.log(`Added task_updated to enum_notification_type for tenant: ${tenantHash}`);
      } catch (error) {
        // Value might already exist
        console.log(`Skipping ${tenantHash}: ${error.message}`);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // PostgreSQL doesn't support removing values from enums easily
    console.log("Skipping down migration - cannot remove enum values in PostgreSQL");
  },
};
