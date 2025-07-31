'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    queryInterface.sequelize.query(`
  CREATE TABLE IF NOT EXISTS "policies" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    
    CONSTRAINT fk_author FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT fk_last_updated_by FOREIGN KEY ("last_updated_by") REFERENCES "users"("id") ON DELETE SET NULL
  );
    `)
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
