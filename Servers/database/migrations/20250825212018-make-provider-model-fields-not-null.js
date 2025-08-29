"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Update any remaining NULL values with placeholder data
      await queryInterface.sequelize.query(`
        UPDATE model_inventories 
        SET 
          provider = COALESCE(provider, 'Unknown Provider'),
          model = COALESCE(model, 'Unknown Model')
        WHERE provider IS NULL OR model IS NULL;
      `, { transaction });

      // Now make the columns NOT NULL
      await queryInterface.changeColumn("model_inventories", "provider", {
        type: Sequelize.STRING,
        allowNull: false,
      }, { transaction });

      await queryInterface.changeColumn("model_inventories", "model", {
        type: Sequelize.STRING,
        allowNull: false,
      }, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE model_inventories ALTER COLUMN approver TYPE integer USING approver::integer;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE model_inventories ADD CONSTRAINT fk_model_inventories_approver
        FOREIGN KEY (approver) REFERENCES public.users(id);
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Make the columns nullable again
      await queryInterface.changeColumn("model_inventories", "provider", {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });

      await queryInterface.changeColumn("model_inventories", "model", {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE model_inventories DROP CONSTRAINT fk_model_inventories_approver;
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE model_inventories ALTER COLUMN approver TYPE varchar(255) USING approver::varchar;
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
