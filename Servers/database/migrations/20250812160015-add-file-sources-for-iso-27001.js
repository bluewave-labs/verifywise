'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (let query of [
        `ALTER TYPE public.enum_files_source ADD VALUE 'Main clauses group';`,
        `ALTER TYPE public.enum_files_source ADD VALUE 'Annex controls group';`,
        `ALTER TYPE public.enum_files_source ADD VALUE 'ISO 27001 report';`
      ]) {
        await queryInterface.sequelize.query(query, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) { }
};
