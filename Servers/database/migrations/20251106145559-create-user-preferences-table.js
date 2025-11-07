'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists
    const tableExists = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.user_preferences');`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tableExists[0].to_regclass) {
      console.log('Table user_preferences already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('user_preferences', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date_format: {
        type: Sequelize.ENUM('DD-MM-YYYY', 'MM-DD-YYYY', 'DD/MM/YY', 'MM/DD/YY'),
        allowNull: false,
        defaultValue: 'DD-MM-YYYY',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_preferences');
    // Also drop the ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_user_preferences_date_format";');
  }
};
