'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        `ALTER TABLE public.users
          ADD COLUMN IF NOT EXISTS sso_provider enum_sso_configuration_providers,
          ADD COLUMN IF NOT EXISTS sso_user_id VARCHAR(255);`,
        // `ALTER TABLE public.users
        //   ADD CONSTRAINT unique_sso_provider_user_id UNIQUE (sso_provider, sso_user_id);`,
        `ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;`,
        `ALTER TABLE public.users
          ADD CONSTRAINT users_auth_exclusive_check
          CHECK ((sso_user_id IS NULL) <> (password_hash IS NULL));`
      ]
      await Promise.all(queries.map(query => queryInterface.sequelize.query(query, { transaction })));
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        `ALTER TABLE public.users
          DROP CONSTRAINT IF EXISTS users_auth_exclusive_check;`,
        // `ALTER TABLE public.users
        //   DROP CONSTRAINT IF EXISTS unique_sso_provider_user_id;`,
        `ALTER TABLE public.users
          DROP COLUMN IF EXISTS sso_provider,
          DROP COLUMN IF EXISTS sso_user_id;`,
        `ALTER TABLE public.users ALTER COLUMN password_hash SET NOT NULL;`
      ]
      await Promise.all(queries.map(query => queryInterface.sequelize.query(query, { transaction })));
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
