'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const transaction = await queryInterface.sequelize.transaction();
      const organizations = await queryInterface.sequelize.query(`SELECT id FROM public.organizations;`, { transaction })
      if (organizations[0].length !== 0) {
        const tenantHash = getTenantHash(organizations[0][0].id);
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".policy_manager (
            "id" SERIAL PRIMARY KEY,
            "title" VARCHAR(255) NOT NULL,
            "content_html" TEXT DEFAULT '',
            "status" VARCHAR(50) DEFAULT 'Draft',
            "tags" TEXT[],
            "next_review_date" TIMESTAMP,
            "author_id" INTEGER NOT NULL,
            "assigned_reviewer_ids" INTEGER[],
            "last_updated_by" INTEGER NOT NULL,
            "last_updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("author_id") REFERENCES public.users(id) ON DELETE CASCADE,
            FOREIGN KEY ("last_updated_by") REFERENCES public.users(id) ON DELETE SET NULL
          );
        `, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const transaction = await queryInterface.sequelize.transaction();
      const organizations = await queryInterface.sequelize.query(`SELECT id FROM public.organizations;`, { transaction })
      if (organizations[0].length !== 0) {
        const tenantHash = getTenantHash(organizations[0][0].id);
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".policy_manager;
        `, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
