'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "questions",
        "evidence_files_temp",
        { type: Sequelize.JSONB, allowNull: true },
        { transaction }
      );
      await queryInterface.sequelize.query(
        `UPDATE questions SET evidence_files_temp = 
          CASE
            WHEN evidence_files IS NULL THEN '[]'::jsonb
            ELSE evidence_files::jsonb
          END;`,
        { transaction }
      );
      await queryInterface.removeColumn("questions", "evidence_files", { transaction });
      await queryInterface.renameColumn("questions", "evidence_files_temp", "evidence_files", { transaction });

      await queryInterface.addColumn(
        "subcontrols",
        "evidence_files_temp",
        { type: Sequelize.JSONB, allowNull: true },
        { transaction }
      );
      await queryInterface.sequelize.query(
        `UPDATE subcontrols SET evidence_files_temp = CASE
            WHEN evidence_files IS NULL THEN '[]'::jsonb
            ELSE evidence_files::jsonb
          END;`,
        { transaction }
      );
      await queryInterface.removeColumn("subcontrols", "evidence_files", { transaction });
      await queryInterface.renameColumn("subcontrols", "evidence_files_temp", "evidence_files", { transaction });

      await queryInterface.addColumn(
        "subcontrols",
        "feedback_files_temp",
        { type: Sequelize.JSONB, allowNull: true },
        { transaction }
      );
      await queryInterface.sequelize.query(
        `UPDATE subcontrols SET feedback_files_temp = CASE
            WHEN feedback_files IS NULL THEN '[]'::jsonb
            ELSE feedback_files::jsonb
          END;`,
        { transaction }
      );
      await queryInterface.removeColumn("subcontrols", "feedback_files", { transaction });
      await queryInterface.renameColumn("subcontrols", "feedback_files_temp", "feedback_files", { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "questions",
        "evidence_files_temp",
        { type: Sequelize.TEXT, allowNull: true },
        { transaction }
      );
      await queryInterface.sequelize.query(
        `UPDATE questions SET evidence_files_temp = evidence_files::TEXT;`,
        { transaction }
      );
      await queryInterface.removeColumn("questions", "evidence_files", { transaction });
      await queryInterface.renameColumn("questions", "evidence_files_temp", "evidence_files", { transaction });

      await queryInterface.addColumn(
        "subcontrols",
        "evidence_files_temp",
        { type: Sequelize.TEXT, allowNull: true },
        { transaction }
      );
      await queryInterface.sequelize.query(
        `UPDATE subcontrols SET evidence_files_temp = evidence_files::TEXT;`,
        { transaction }
      );
      await queryInterface.removeColumn("subcontrols", "evidence_files", { transaction });
      await queryInterface.renameColumn("subcontrols", "evidence_files_temp", "evidence_files", { transaction });

      await queryInterface.addColumn(
        "subcontrols",
        "feedback_files_temp",
        { type: Sequelize.TEXT, allowNull: true },
        { transaction }
      );
      await queryInterface.sequelize.query(
        `UPDATE subcontrols SET feedback_files_temp = feedback_files::TEXT;`,
        { transaction }
      );
      await queryInterface.removeColumn("subcontrols", "feedback_files", { transaction });
      await queryInterface.renameColumn("subcontrols", "feedback_files_temp", "feedback_files", { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
