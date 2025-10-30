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
        await queryInterface.sequelize.query(
          `CREATE TABLE "${tenantHash}".event_logs (
            id SERIAL PRIMARY KEY,
            event_type public.enum_event_logs_event_type NOT NULL,
            description TEXT,
            user_id INTEGER,
            timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_event_logs_user FOREIGN KEY (user_id)
              REFERENCES public.users (id)
              ON UPDATE CASCADE
              ON DELETE SET NULL
          );`, { transaction });
      }
      const rows = await queryInterface.sequelize.query(
        `SELECT e.*, u.organization_id FROM public.event_logs AS e INNER JOIN users u ON e.user_id = u.id`, { transaction }
      );
      const map = new Map();
      for (let row of rows[0]) {
        const tenantHash = getTenantHash(row.organization_id);
        if (!map.has(tenantHash)) {
          map.set(tenantHash, []);
        }
        map.get(tenantHash).push(row);
      }
      for (let [tenantHash, rows] of map) {
        let insert = '';
        for (let row of rows) {
          insert += `('${row.event_type}', ${row.description ? `'${row.description.replace(/'/g, "''")}'` : null}, ${row.user_id}, '${row.timestamp.toISOString()}'),`;
        }
        insert = insert.slice(0, -1);
        if (insert.length > 0) {
          await queryInterface.sequelize.query(
            `INSERT INTO "${tenantHash}".event_logs (event_type, description, user_id, timestamp) VALUES ${insert};`, { transaction }
          );
        }
      }
      // await queryInterface.dropTable('event_logs', { transaction });
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
