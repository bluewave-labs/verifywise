'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE users ADD COLUMN organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
      `, { transaction });
      const users = await queryInterface.sequelize.query(`
        SELECT id FROM users;
      `, { transaction });
      const organizationId = await queryInterface.sequelize.query(`
        SELECT id FROM organizations LIMIT 1;
      `, { transaction });
      await Promise.all(users[0].map(user => {
        return queryInterface.sequelize.query(`
          UPDATE users SET organization_id = ${organizationId[0][0].id} WHERE id = ${user.id};
        `, { transaction });
      }));
      await queryInterface.sequelize.query(`
        ALTER TABLE users ALTER COLUMN organization_id SET NOT NULL;
      `, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE users DROP COLUMN organization_id;
      `, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
