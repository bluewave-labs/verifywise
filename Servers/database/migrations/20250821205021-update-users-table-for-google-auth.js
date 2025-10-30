'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all(
        [
          `ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;`,
          `ALTER TABLE public.users ADD COLUMN google_id VARCHAR(255) DEFAULT NULL;`,
          `ALTER TABLE public.users ADD CONSTRAINT users_password_null_if_google_id_present_check CHECK (google_id IS NOT NULL OR password_hash IS NOT NULL)`
        ].map(query => queryInterface.sequelize.query(query, { transaction }))
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all(
        [
          `ALTER TABLE public.users ALTER COLUMN password_hash SET NOT NULL;`,
          `ALTER TABLE public.users DROP CONSTRAINT users_password_null_if_google_id_present_check;`,
          `ALTER TABLE public.users DROP COLUMN google_id;`,
        ].map(query => queryInterface.sequelize.query(query, { transaction }))
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
