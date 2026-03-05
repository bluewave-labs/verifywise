'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        UPDATE intake_forms
        SET risk_tier_system = 'eu_ai_act'
        WHERE risk_tier_system = 'generic';
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE intake_forms
        ALTER COLUMN risk_tier_system SET DEFAULT 'eu_ai_act';
      `, { transaction });

      await transaction.commit();
      console.log('Updated risk_tier_system default to eu_ai_act');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE intake_forms
        ALTER COLUMN risk_tier_system SET DEFAULT 'generic';
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
