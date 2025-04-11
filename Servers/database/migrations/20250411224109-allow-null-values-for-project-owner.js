'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        "ALTER TABLE projects ALTER COLUMN owner DROP NOT NULL, ALTER COLUMN last_updated_by DROP NOT NULL;",
        "ALTER TABLE vendors ALTER COLUMN assignee DROP NOT NULL, ALTER COLUMN reviewer DROP NOT NULL;",
        "ALTER TABLE projectrisks ALTER COLUMN risk_owner DROP NOT NULL, ALTER COLUMN risk_approval DROP NOT NULL;",
        "ALTER TABLE vendorrisks ALTER COLUMN action_owner DROP NOT NULL;",
        "ALTER TABLE files ALTER COLUMN uploaded_by DROP NOT NULL;",
      ];
      await Promise.all(
        queries.map(query => queryInterface.sequelize.query(query, { transaction }))
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
      const [results] = await queryInterface.sequelize.query(
        `SELECT id FROM users LIMIT 1;`,
        { transaction }
      );
      const fallbackUserId = results[0].id;
      const queries = [
        { table: "projects", fields: ["owner", "last_updated_by"] },
        { table: "vendors", fields: ["assignee", "reviewer"] },
        { table: "projectrisks", fields: ["risk_owner", "risk_approval"] },
        { table: "vendorrisks", fields: ["action_owner"] },
        { table: "files", fields: ["uploaded_by"] },
      ];
      await Promise.all(
        queries.map(async ({ table, fields }) => {
          await Promise.all(
            fields.map(async field => {
              await queryInterface.sequelize.query(
                `UPDATE ${table} SET ${field} = ${fallbackUserId} WHERE ${field} IS NULL;`,
                { transaction }
              );
            })
          );
          return await queryInterface.sequelize.query(
            `ALTER TABLE ${table} ${fields.map(field => `ALTER COLUMN ${field} SET NOT NULL`).join(", ")};`,
            { transaction }
          );
        })
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
