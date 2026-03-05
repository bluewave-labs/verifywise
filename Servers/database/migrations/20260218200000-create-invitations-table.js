'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".invitations (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            name VARCHAR(255),
            surname VARCHAR(255),
            role_id INT REFERENCES public.roles(id),
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            invited_by INT REFERENCES public.users(id),
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `, { transaction });

        // Partial unique index for upsert via ON CONFLICT
        await queryInterface.sequelize.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_pending_email
          ON "${tenantHash}".invitations (email)
          WHERE status = 'pending';
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(`
          DROP INDEX IF EXISTS "${tenantHash}".idx_invitations_pending_email;
        `, { transaction });
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".invitations;
        `, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
