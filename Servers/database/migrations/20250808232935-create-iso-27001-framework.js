'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS is_organizational BOOLEAN DEFAULT FALSE;`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `INSERT INTO frameworks (id, name, description, is_organizational) VALUES
        (3, 'ISO 27001', 'ISO 27001 is an internationally recognized standard that provides a framework for establishing, implementing, maintaining, and improving an Information Security Management System (ISMS).', TRUE);`,
        { transaction }
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `DELETE FROM frameworks WHERE name = 'ISO 27001';`
    );
  }
};
