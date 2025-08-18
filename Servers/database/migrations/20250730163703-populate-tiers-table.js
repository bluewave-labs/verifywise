'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Insert tier data
      INSERT INTO tiers (name, price, features) VALUES
        ('Free', 0, '{"seats": 2, "projects": 1, "frameworks": 1}'),
        ('Team', 139, '{"seats": 0, "projects": 10, "frameworks": 0}'),
        ('Growth', 299, '{"seats": 0, "projects": 50, "frameworks": 0}'),
        ('Enterprise', 799, '{"seats": 0, "projects": 0, "frameworks": 0}');
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Remove all tier data
      DELETE FROM tiers WHERE name IN ('Free', 'Team', 'Growth', 'Enterprise');
    `);
  }
};