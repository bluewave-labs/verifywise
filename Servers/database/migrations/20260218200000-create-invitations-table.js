'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS invitations (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        surname VARCHAR(255),
        role_id INT REFERENCES roles(id),
        organization_id INT REFERENCES organizations(id),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        invited_by INT REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Partial unique index for upsert via ON CONFLICT
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_pending_email_org
      ON invitations (email, organization_id)
      WHERE status = 'pending';
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_invitations_pending_email_org;
    `);
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS invitations;
    `);
  }
};
