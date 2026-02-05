'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      )
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Check if table exists in this tenant schema
        const [results] = await queryInterface.sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'deepeval_projects'
          );
        `);

        if (results[0].exists) {
          // Check if columns already exist
          const [columns] = await queryInterface.sequelize.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = '${tenantHash}'
          AND table_name = 'deepeval_projects'
          AND column_name = 'use_case';
        `, { transaction });

          if (columns.length > 0) {
            console.log(`use_case column already exists for tenant ${tenantHash}, skipping`);
            continue;
          }

          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".deepeval_projects ADD COLUMN use_case VARCHAR(50) DEFAULT 'chatbot';`, { transaction }
          )
        }
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
