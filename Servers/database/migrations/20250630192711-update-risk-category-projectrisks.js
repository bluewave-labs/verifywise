'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        `ALTER TABLE projectrisks ADD COLUMN risk_category_temp TEXT[];`,
        `UPDATE projectrisks SET risk_category_temp = Array[risk_category::Text];`,
        `ALTER TABLE projectrisks DROP COLUMN risk_category;`,
        `ALTER TABLE projectrisks RENAME COLUMN risk_category_temp TO risk_category;`,
      ]
      for (const query of queries) {
        await queryInterface.sequelize.query(query, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        `ALTER TABLE projectrisks ADD COLUMN risk_category_temp enum_projectrisks_risk_category;`,
        `UPDATE projectrisks SET risk_category_temp = CASE 
          WHEN array_length(risk_category, 1) > 0 THEN risk_category[1]::enum_projectrisks_risk_category 
          ELSE NULL 
        END;`,
        `ALTER TABLE projectrisks DROP COLUMN risk_category;`,
        `ALTER TABLE projectrisks RENAME COLUMN risk_category_temp TO risk_category;`,
      ]
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
