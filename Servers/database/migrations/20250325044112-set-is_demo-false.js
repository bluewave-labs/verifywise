'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await Promise.all([
      'roles', 'users', 'projects', 'projects_members', 'vendors', 'vendors_projects',
      'assessments', 'controlcategories', 'controls', 'subcontrols', 'projectrisks',
      'vendorrisks', 'projectscopes', 'topics', 'subtopics', 'questions', 'files',
    ].map(async (table) => {
      await queryInterface.sequelize.query(
        `UPDATE ${table} SET is_demo = false WHERE is_demo IS NULL;`
      );
      await queryInterface.changeColumn(table, 'is_demo', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }));
  },

  async down(queryInterface, Sequelize) {
    await Promise.all([
      'roles', 'users', 'projects', 'projects_members', 'vendors', 'vendors_projects',
      'assessments', 'controlcategories', 'controls', 'subcontrols', 'projectrisks',
      'vendorrisks', 'projectscopes', 'topics', 'subtopics', 'questions', 'files',
    ].map(async (table) => {
      await queryInterface.changeColumn(table, 'is_demo', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      });
      await queryInterface.sequelize.query(
        `UPDATE ${table} SET is_demo = NULL WHERE is_demo = false;`
      );
    }));
  }
};
