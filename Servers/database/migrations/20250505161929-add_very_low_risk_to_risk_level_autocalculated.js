'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   try{
    await queryInterface.sequelize.query(
      `ALTER TYPE enum_projectrisks_risk_level_autocalculated ADD VALUE 'Very low risk';`
     )
   } catch(error){
    throw error;
   }
   
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    const transaction = await queryInterface.sequelize.transaction();
    const queries =[
      "create type enum_project_risk_level as enum ('No risk','Low risk','Medium risk','High risk','Very high risk');",
      "update projectrisks set risk_level_autocalculated = 'No risk' where risk_level_autocalculated = 'Very low risk';",
      "alter table projectrisks alter column risk_level_autocalculated type enum_project_risk_level USING risk_level_autocalculated::text::enum_project_risk_level;",
      "drop type enum_projectrisks_risk_level_autocalculated;",
      "alter type enum_project_risk_level rename to enum_projectrisks_risk_level_autocalculated;"
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
