'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE feature_settings
        ADD COLUMN IF NOT EXISTS audit_ledger_enabled BOOLEAN NOT NULL DEFAULT true;
      `, { transaction });

      await transaction.commit();
      console.log('Added audit_ledger_enabled to feature_settings');
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
        ALTER TABLE feature_settings
        DROP COLUMN IF EXISTS audit_ledger_enabled;
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
