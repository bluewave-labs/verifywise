'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Update Free tier to new limits: 10 users, 10 projects, unlimited frameworks
      UPDATE tiers
      SET
        features = '{"seats": 10, "projects": 10, "frameworks": 0}',
        updated_at = NOW()
      WHERE name = 'Free';
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Revert Free tier to original limits: 2 users, 1 project, 1 framework
      UPDATE tiers
      SET
        features = '{"seats": 2, "projects": 1, "frameworks": 1}',
        updated_at = NOW()
      WHERE name = 'Free';
    `);
  }
};
