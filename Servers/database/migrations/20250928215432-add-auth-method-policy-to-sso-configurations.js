'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('sso_configurations', 'auth_method_policy', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'both',
      validate: {
        isIn: {
          args: [['sso_only', 'password_only', 'both']],
          msg: 'Auth method policy must be one of: sso_only, password_only, both'
        }
      },
      comment: 'Controls which authentication methods are allowed for this organization: sso_only, password_only, or both'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('sso_configurations', 'auth_method_policy');
  }
};
