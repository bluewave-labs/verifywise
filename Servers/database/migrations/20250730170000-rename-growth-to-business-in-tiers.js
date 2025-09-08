'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Ensure the CHECK constraint allows 'Business'
      ALTER TABLE tiers DROP CONSTRAINT IF EXISTS tiers_name_check;

      -- Rename tier 'Growth' to 'Business'
      UPDATE tiers
      SET name = 'Business'
      WHERE LOWER(name) = 'growth';
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Temporarily allow both 'Growth' and 'Business' to revert safely
      ALTER TABLE tiers DROP CONSTRAINT IF EXISTS tiers_name_check;

      -- Revert name back to 'Growth' if needed
      UPDATE tiers
      SET name = 'Growth'
      WHERE LOWER(name) = 'business';

      -- Restore original constraint without 'Business'
      ALTER TABLE tiers DROP CONSTRAINT IF EXISTS tiers_name_check;
    `);
  }
};
