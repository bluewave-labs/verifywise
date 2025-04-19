'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const queries = [
      `CREATE TYPE enum_vendors_review_status_temp AS ENUM (
        'Active', 'Under review', 'Not active', 'Not started', 'In review', 'Reviewed', 'Requires follow-up'
      );`,
      `ALTER TABLE vendors ALTER COLUMN review_status TYPE enum_vendors_review_status_temp USING review_status::text::enum_vendors_review_status_temp`,
      `UPDATE vendors SET review_status = 'Not started' WHERE review_status = 'Active';`,
      `UPDATE vendors SET review_status = 'In review' WHERE review_status = 'Under review';`,
      `UPDATE vendors SET review_status = 'Requires follow-up' WHERE review_status = 'Not active';`,
      `DROP TYPE IF EXISTS enum_vendors_review_status;`,
      `CREATE TYPE enum_vendors_review_status AS ENUM ('Not started', 'In review', 'Reviewed', 'Requires follow-up');`,
      `ALTER TABLE vendors ALTER COLUMN review_status TYPE enum_vendors_review_status USING review_status::text::enum_vendors_review_status`,
      `DROP TYPE enum_vendors_review_status_temp;`
    ]
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const query of queries) {
        await queryInterface.sequelize.query(query, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const queries = [
      `CREATE TYPE enum_vendors_review_status_temp AS ENUM (
        'Active', 'Under review', 'Not active', 'Not started', 'In review', 'Reviewed', 'Requires follow-up'
      );`,
      `ALTER TABLE vendors ALTER COLUMN review_status TYPE enum_vendors_review_status_temp USING review_status::text::enum_vendors_review_status_temp`,
      `UPDATE vendors SET review_status = 'Active' WHERE review_status = 'Not started';`,
      `UPDATE vendors SET review_status = 'Under review' WHERE review_status = 'In review';`,
      `UPDATE vendors SET review_status = 'Under review' WHERE review_status = 'Reviewed';`,
      `UPDATE vendors SET review_status = 'Not active' WHERE review_status = 'Requires follow-up';`,
      `DROP TYPE IF EXISTS enum_vendors_review_status;`,
      `CREATE TYPE enum_vendors_review_status AS ENUM ('Active', 'Under review', 'Not active');`,
      `ALTER TABLE vendors ALTER COLUMN review_status TYPE enum_vendors_review_status USING review_status::text::enum_vendors_review_status`,
      `DROP TYPE enum_vendors_review_status_temp;`
    ]
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const query of queries) {
        await queryInterface.sequelize.query(query, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
