'use strict';

/**
 * Migration: Add onboarding_status column to organizations table
 *
 * This column tracks whether the organization creator has seen the setup modal.
 * - 'pending': New org, modal should be shown to creator on first login
 * - 'completed': Modal has been seen/dismissed, don't show again
 *
 * Existing organizations are set to 'completed' to prevent modal from showing
 * after server upgrade (grandfathered).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column already exists (idempotent)
    const [columns] = await queryInterface.sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'onboarding_status';
    `, { type: Sequelize.QueryTypes.SELECT });

    if (columns) {
      console.log('onboarding_status column already exists in organizations table, skipping');
      return;
    }

    // Step 1: Add column as nullable using raw SQL
    await queryInterface.sequelize.query(`
      ALTER TABLE public.organizations
      ADD COLUMN onboarding_status VARCHAR(20);
    `);

    // Step 2: Set all existing organizations to 'completed' (grandfathered)
    await queryInterface.sequelize.query(`
      UPDATE public.organizations
      SET onboarding_status = 'completed'
      WHERE onboarding_status IS NULL;
    `);

    // Step 3: Make column NOT NULL with default
    await queryInterface.sequelize.query(`
      ALTER TABLE public.organizations
      ALTER COLUMN onboarding_status SET NOT NULL,
      ALTER COLUMN onboarding_status SET DEFAULT 'pending';
    `);

    console.log('Successfully added onboarding_status column to organizations table');
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE public.organizations
      DROP COLUMN IF EXISTS onboarding_status;
    `);

    console.log('Successfully removed onboarding_status column from organizations table');
  },
};
