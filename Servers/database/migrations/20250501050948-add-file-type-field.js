'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (let query of [
        "ALTER TABLE files ADD COLUMN type VARCHAR(255) NOT NULL DEFAULT 'application/pdf';",
        "ALTER TABLE files ALTER COLUMN type DROP DEFAULT;",
      ]) {
        await queryInterface.sequelize.query(query, { transaction });
      }
      // update evidence files and feedback files
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query("ALTER TABLE files DROP COLUMN type;", { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
