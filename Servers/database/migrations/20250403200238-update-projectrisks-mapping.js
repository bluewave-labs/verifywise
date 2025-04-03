'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const queries = [
      "ALTER TABLE projectrisks DROP CONSTRAINT projectrisks_risk_approval_fkey;",
      "ALTER TABLE projectrisks ADD CONSTRAINT projectrisks_risk_approval_fkey FOREIGN KEY (risk_approval) REFERENCES users (id);",
      "ALTER TABLE projectrisks DROP CONSTRAINT projectrisks_risk_owner_fkey;",
      "ALTER TABLE projectrisks ADD CONSTRAINT projectrisks_risk_owner_fkey FOREIGN KEY (risk_owner) REFERENCES users (id);"
    ]
    try {
      for (let query of queries) {
        await queryInterface.sequelize.query(
          query, { transaction }
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const queries = [
      "ALTER TABLE projectrisks DROP CONSTRAINT projectrisks_risk_approval_fkey;",
      "ALTER TABLE projectrisks ADD CONSTRAINT projectrisks_risk_approval_fkey FOREIGN KEY (risk_approval) REFERENCES controls (id);",
      "ALTER TABLE projectrisks DROP CONSTRAINT projectrisks_risk_owner_fkey;",
      "ALTER TABLE projectrisks ADD CONSTRAINT projectrisks_risk_owner_fkey FOREIGN KEY (risk_owner) REFERENCES controls (id);"
    ]
    try {
      for (let query of queries) {
        await queryInterface.sequelize.query(
          query, { transaction }
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
