"use strict";
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration: Add _source column to projects table
 *
 * This column allows plugins to identify projects they created.
 * For example, jira-assets plugin sets _source = 'jira-assets' for imported use-cases.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get all existing organizations
    const [organizations] = await queryInterface.sequelize.query(
      `SELECT id FROM organizations`
    );

    // Add _source column to each tenant's projects table
    for (const organization of organizations) {
      const tenantHash = getTenantHash(organization.id);
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".projects
          ADD COLUMN IF NOT EXISTS _source VARCHAR(100)
        `);
      } catch (e) {
        // Table might not exist for this tenant, skip
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Get all existing organizations
    const [organizations] = await queryInterface.sequelize.query(
      `SELECT id FROM organizations`
    );

    // Remove _source column from each tenant's projects table
    for (const organization of organizations) {
      const tenantHash = getTenantHash(organization.id);
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".projects
          DROP COLUMN IF EXISTS _source
        `);
      } catch (e) {
        // Table might not exist, skip
      }
    }
  },
};
