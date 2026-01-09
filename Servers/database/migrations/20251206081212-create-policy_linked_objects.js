'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`,
        { transaction }
      );

      for (let org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".policy_linked_objects (
            id SERIAL PRIMARY KEY,
            policy_id INTEGER NOT NULL,
            object_id INTEGER NOT NULL,
            object_type VARCHAR(50) NOT NULL CHECK (object_type IN ('control', 'risk', 'evidence')),
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (policy_id)
              REFERENCES "${tenantHash}".policy_manager(id)
              ON DELETE CASCADE
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
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`,
        { transaction }
      );

      for (let org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".policy_linked_objects;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
