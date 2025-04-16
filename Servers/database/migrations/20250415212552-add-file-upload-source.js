'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        "CREATE TYPE enum_files_source AS ENUM ('Assessment tracker group', 'Compliance tracker group');",
        { transaction }
      );
      await queryInterface.sequelize.query(
        "ALTER TABLE files ADD COLUMN source enum_files_source;",
        { transaction }
      );

      const queries = [
        {
          getFiles: "SELECT id, evidence_files FROM questions WHERE jsonb_array_length(evidence_files) > 0;",
          updateFiles: "UPDATE files SET source = 'Assessment tracker group' WHERE id = :id;",
          updateRecords: "UPDATE questions SET evidence_files = :files WHERE id = :id;",
          source: 'Assessment tracker group',
          field: 'evidence_files'
        },
        {
          getFiles: "SELECT id, evidence_files FROM subcontrols WHERE jsonb_array_length(evidence_files) > 0;",
          updateFiles: "UPDATE files SET source = 'Compliance tracker group' WHERE id = :id;",
          updateRecords: "UPDATE subcontrols SET evidence_files = :files WHERE id = :id;",
          source: 'Compliance tracker group',
          field: 'evidence_files'
        },
        {
          getFiles: "SELECT id, feedback_files FROM subcontrols WHERE jsonb_array_length(feedback_files) > 0;",
          updateFiles: "UPDATE files SET source = 'Compliance tracker group' WHERE id = :id;",
          updateRecords: "UPDATE subcontrols SET feedback_files = :files WHERE id = :id;",
          source: 'Compliance tracker group',
          field: 'feedback_files'
        }
      ];

      await Promise.all(queries.map(async (query) => {
        const { getFiles, updateFiles, updateRecords, source, field } = query;
        const [rows] = await queryInterface.sequelize.query(getFiles, { transaction });
        for (let row of rows) {
          for (let f of row[field]) {
            await queryInterface.sequelize.query(
              updateFiles,
              { replacements: { id: f.id }, transaction }
            );
            f['source'] = source;
          }
          await queryInterface.sequelize.query(
            updateRecords,
            { replacements: { files: JSON.stringify(row[field]), id: row.id }, transaction }
          );
        }
      }));

      await queryInterface.sequelize.query(
        "ALTER TABLE files ALTER COLUMN source SET NOT NULL;",
        { transaction }
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
      const queries = [
        {
          getFiles: "SELECT id, evidence_files FROM questions WHERE jsonb_array_length(evidence_files) > 0;",
          updateRecords: "UPDATE questions SET evidence_files = :files WHERE id = :id;",
          field: 'evidence_files'
        },
        {
          getFiles: "SELECT id, evidence_files FROM subcontrols WHERE jsonb_array_length(evidence_files) > 0;",
          updateRecords: "UPDATE subcontrols SET evidence_files = :files WHERE id = :id;",
          field: 'evidence_files'
        },
        {
          getFiles: "SELECT id, feedback_files FROM subcontrols WHERE jsonb_array_length(feedback_files) > 0;",
          updateRecords: "UPDATE subcontrols SET feedback_files = :files WHERE id = :id;",
          field: 'feedback_files'
        }
      ];

      for (const query of queries) {
        const { getFiles, updateRecords, field } = query;
        const [rows] = await queryInterface.sequelize.query(getFiles, { transaction });

        for (let row of rows) {
          const files = row[field] || [];

          // Remove "source" key from each file object
          const cleanedFiles = files.map(file => {
            const { source, ...rest } = file;
            return rest;
          });

          await queryInterface.sequelize.query(updateRecords, {
            replacements: {
              id: row.id,
              files: JSON.stringify(cleanedFiles)
            },
            transaction
          });
        }
      }

      await queryInterface.sequelize.query(
        "ALTER TABLE files ALTER COLUMN source DROP NOT NULL;", { transaction }
      );
      await queryInterface.sequelize.query(
        "ALTER TABLE files DROP COLUMN source;", { transaction }
      );
      await queryInterface.sequelize.query(
        "DROP TYPE enum_files_source;", { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
