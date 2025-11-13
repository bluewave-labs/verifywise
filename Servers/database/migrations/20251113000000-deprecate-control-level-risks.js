'use strict';

/**
 * Migration: Deprecate control-level risks in controls_eu__risks table
 *
 * Context: As of November 2025, control-level risk associations have been removed
 * from the EU AI Act controls modal. Risk associations are now managed exclusively
 * at the subcontrol level. This migration adds a table comment to document this
 * deprecation for future reference.
 *
 * Impact:
 * - Existing data in controls_eu__risks remains in database but is not used
 * - No code reads from or writes to this table anymore
 * - Consider cleanup in future migration if/when subcontrol risks are implemented
 *
 * Related: Commit 8d492d50d - "Simplify EU AI Act controls modal"
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      COMMENT ON TABLE controls_eu__risks IS
      'DEPRECATED as of Nov 2025: Control-level risks removed. This table is no longer used.
       Risk associations are now managed at subcontrol level only.
       Existing data preserved for potential future migration or historical reference.';
    `);

    console.log('✓ Added deprecation comment to controls_eu__risks table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      COMMENT ON TABLE controls_eu__risks IS NULL;
    `);

    console.log('✓ Removed deprecation comment from controls_eu__risks table');
  }
};
