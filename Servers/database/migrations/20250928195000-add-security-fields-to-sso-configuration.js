'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Check if the table exists before modifying it
      const tableExists = await queryInterface.showAllTables().then(tables =>
        tables.includes('sso_configurations')
      );

      if (!tableExists) {
        console.log('sso_configurations table does not exist, skipping migration');
        await transaction.commit();
        return;
      }

      // Check if columns already exist before adding them
      const tableDescription = await queryInterface.describeTable('sso_configurations', { transaction });

      // Add allowed_domains field if it doesn't exist
      if (!tableDescription.allowed_domains) {
        await queryInterface.addColumn('sso_configurations', 'allowed_domains', {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: true,
          comment: 'List of allowed email domains for this SSO configuration. NULL means no restrictions.'
        }, { transaction });
      }

      // Add default_role_id field if it doesn't exist
      if (!tableDescription.default_role_id) {
        await queryInterface.addColumn('sso_configurations', 'default_role_id', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 2, // Default to Reviewer role
          references: {
            model: 'roles',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          comment: 'Default role ID assigned to new users created via SSO. Defaults to Reviewer (ID: 2).'
        }, { transaction });

        // Add index for performance only if column was added
        await queryInterface.addIndex('sso_configurations', ['default_role_id'], {
          name: 'idx_sso_config_default_role',
          transaction
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeIndex('sso_configurations', 'idx_sso_config_default_role', { transaction });
      await queryInterface.removeColumn('sso_configurations', 'default_role_id', { transaction });
      await queryInterface.removeColumn('sso_configurations', 'allowed_domains', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};