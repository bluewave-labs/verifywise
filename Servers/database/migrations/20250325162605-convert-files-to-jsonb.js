'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        ["questions", "evidence_files"],
        ["subcontrols", "evidence_files"],
        ["subcontrols", "feedback_files"]
      ].map(async ([table, column]) => {
        await queryInterface.addColumn(
          table,
          `${column}_temp`,
          { type: Sequelize.JSONB, allowNull: true },
          { transaction }
        );
        await queryInterface.sequelize.query(
          `UPDATE ${table} SET ${column}_temp = 
            CASE
              WHEN ${column} IS NULL THEN '[]'::jsonb
              ELSE (
                SELECT jsonb_agg(${column}::jsonb)
                FROM unnest(${column}) AS ${column}
              )
            END;`,
          { transaction }
        );
        await queryInterface.removeColumn(table, column, { transaction });
        await queryInterface.renameColumn(table, `${column}_temp`, column, { transaction });
      }));
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        ["questions", "evidence_files"],
        ["subcontrols", "evidence_files"],
        ["subcontrols", "feedback_files"]
      ].map(async ([table, column]) => {
        await queryInterface.addColumn(
          table,
          `${column}_temp`,
          { type: Sequelize.ARRAY(Sequelize.TEXT), allowNull: true },
          { transaction }
        );
        await queryInterface.sequelize.query(
          `UPDATE ${table} as q SET ${column}_temp = COALESCE(
            ARRAY(
              SELECT jsonb_array_elements_text(${column})
              FROM ${table}
              WHERE ${table}.id = q.id
            ),
            '{}'::TEXT[]
          );`,
          { transaction }
        );
        await queryInterface.removeColumn(table, column, { transaction });
        await queryInterface.renameColumn(table, `${column}_temp`, column, { transaction });
      }));
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
