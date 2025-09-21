'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- First, alter the price column to allow NULL values for custom pricing
      ALTER TABLE tiers ALTER COLUMN price DROP NOT NULL;

      -- Update Business tier to Growth pricing and features
      UPDATE tiers
      SET
        price = 799, -- Update from $299 to $799
        features = '{"seats": 0, "projects": 5, "frameworks": 2}' -- Update from 50 projects/unlimited frameworks to 5 projects/2 frameworks
      WHERE name = 'Business';

      -- Update Enterprise tier to null price (Custom pricing)
      UPDATE tiers
      SET price = NULL -- Custom pricing
      WHERE name = 'Enterprise';

      -- Note: Team tier remains at $139 for legacy support but is hidden in UI
      -- Note: Free tier remains unchanged
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Revert Business tier to original pricing and features
      UPDATE tiers
      SET
        price = 299,
        features = '{"seats": 0, "projects": 50, "frameworks": 0}'
      WHERE name = 'Business';

      -- Revert Enterprise tier to original pricing
      UPDATE tiers
      SET price = 799
      WHERE name = 'Enterprise';

      -- Restore NOT NULL constraint on price column
      ALTER TABLE tiers ALTER COLUMN price SET NOT NULL;
    `);
  }
};