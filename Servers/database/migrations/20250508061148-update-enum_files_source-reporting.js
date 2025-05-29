'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (let query of [
        `ALTER TYPE enum_files_source ADD VALUE 'Project risks report';`,
        `ALTER TYPE enum_files_source ADD VALUE 'Compliance tracker report';`,
        `ALTER TYPE enum_files_source ADD VALUE 'Assessment tracker report';`,
        `ALTER TYPE enum_files_source ADD VALUE 'Vendors and risks report';`,
        `ALTER TYPE enum_files_source ADD VALUE 'All reports';`,
        `ALTER TYPE enum_files_source ADD VALUE 'Annexes report';`,
        `ALTER TYPE enum_files_source ADD VALUE 'Clause report';`,
      ]) {
        await queryInterface.sequelize.query(query, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {}
};
