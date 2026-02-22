'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration: Add task mapping fields (useCases, models, frameworks, vendors)
 *
 * Adds four new JSONB columns to the tasks table to support mapping tasks to:
 * - Use cases (project IDs)
 * - Models (model inventory IDs)
 * - Frameworks (compliance framework IDs)
 * - Vendors (vendor IDs)
 *
 * These fields store arrays of IDs for related entities.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get all existing organizations
    const [organizations] = await queryInterface.sequelize.query(
      `SELECT id FROM organizations`
    );

    // Add mapping columns to each tenant's tasks table
    for (const organization of organizations) {
      const tenantHash = getTenantHash(organization.id);
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".tasks
          ADD COLUMN IF NOT EXISTS use_cases JSONB DEFAULT '[]'::jsonb,
          ADD COLUMN IF NOT EXISTS models JSONB DEFAULT '[]'::jsonb,
          ADD COLUMN IF NOT EXISTS frameworks JSONB DEFAULT '[]'::jsonb,
          ADD COLUMN IF NOT EXISTS vendors JSONB DEFAULT '[]'::jsonb
        `);

        // Create indexes for better query performance on mapping fields
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS "${tenantHash}_tasks_use_cases_idx" 
          ON "${tenantHash}".tasks USING gin(use_cases)
        `);

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS "${tenantHash}_tasks_models_idx" 
          ON "${tenantHash}".tasks USING gin(models)
        `);

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS "${tenantHash}_tasks_frameworks_idx" 
          ON "${tenantHash}".tasks USING gin(frameworks)
        `);

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS "${tenantHash}_tasks_vendors_idx" 
          ON "${tenantHash}".tasks USING gin(vendors)
        `);

        console.log(`✓ Added mapping columns to ${tenantHash}.tasks`);
      } catch (e) {
        console.error(`Error migrating ${tenantHash}.tasks:`, e.message);
        // Continue with other tenants
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Get all existing organizations
    const [organizations] = await queryInterface.sequelize.query(
      `SELECT id FROM organizations`
    );

    // Remove mapping columns from each tenant's tasks table
    for (const organization of organizations) {
      const tenantHash = getTenantHash(organization.id);
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".tasks
          DROP COLUMN IF EXISTS vendors,
          DROP COLUMN IF EXISTS frameworks,
          DROP COLUMN IF EXISTS models,
          DROP COLUMN IF EXISTS use_cases
        `);

        console.log(`✓ Removed mapping columns from ${tenantHash}.tasks`);
      } catch (e) {
        console.error(`Error rolling back ${tenantHash}.tasks:`, e.message);
        // Continue with other tenants
      }
    }
  }
};