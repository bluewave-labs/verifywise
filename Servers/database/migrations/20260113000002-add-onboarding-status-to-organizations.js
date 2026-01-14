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
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Step 1: Add column as nullable first
      await queryInterface.addColumn(
        'organizations',
        'onboarding_status',
        {
          type: Sequelize.STRING(20),
          allowNull: true,
        },
        { transaction }
      );

      // Step 2: Set all existing organizations to 'completed' (grandfathered)
      // This ensures existing orgs don't see the modal after upgrade
      await queryInterface.sequelize.query(
        `UPDATE organizations SET onboarding_status = 'completed' WHERE onboarding_status IS NULL;`,
        { transaction }
      );

      // Step 3: Make column NOT NULL with default 'pending' for new orgs
      await queryInterface.changeColumn(
        'organizations',
        'onboarding_status',
        {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'pending',
        },
        { transaction }
      );

      await transaction.commit();
      console.log('Successfully added onboarding_status column to organizations table');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('organizations', 'onboarding_status', {
        transaction,
      });

      await transaction.commit();
      console.log('Successfully removed onboarding_status column from organizations table');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
