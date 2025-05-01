'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (let query of [
        "ALTER TABLE files ADD COLUMN type VARCHAR(255) NOT NULL DEFAULT 'application/pdf';",
        "ALTER TABLE files ALTER COLUMN type DROP DEFAULT;",
      ]) {
        await queryInterface.sequelize.query(query, { transaction });
      }

      const queries = [
        {
          getFiles: "SELECT id, evidence_files FROM questions WHERE jsonb_array_length(evidence_files) > 0;",
          updateFiles: "UPDATE files SET type = 'application/pdf' WHERE id = :id;",
          updateRecords: "UPDATE questions SET evidence_files = :files WHERE id = :id;",
          type: 'application/pdf',
          field: 'evidence_files'
        },
        {
          getFiles: "SELECT id, evidence_files FROM subcontrols WHERE jsonb_array_length(evidence_files) > 0;",
          updateFiles: "UPDATE files SET type = 'application/pdf' WHERE id = :id;",
          updateRecords: "UPDATE subcontrols SET evidence_files = :files WHERE id = :id;",
          type: 'application/pdf',
          field: 'evidence_files'
        },
        {
          getFiles: "SELECT id, feedback_files FROM subcontrols WHERE jsonb_array_length(feedback_files) > 0;",
          updateFiles: "UPDATE files SET type = 'application/pdf' WHERE id = :id;",
          updateRecords: "UPDATE subcontrols SET feedback_files = :files WHERE id = :id;",
          type: 'application/pdf',
          field: 'feedback_files'
        }
      ];

      await Promise.all(queries.map(async (query) => {
        const { getFiles, updateFiles, updateRecords, type, field } = query;
        const [rows] = await queryInterface.sequelize.query(getFiles, { transaction });
        for (let row of rows) {
          for (let f of row[field]) {
            await queryInterface.sequelize.query(
              updateFiles,
              { replacements: { id: f.id }, transaction }
            );
            if (!f.type) {
              f['type'] = type;
            }
          }
          await queryInterface.sequelize.query(
            updateRecords,
            { replacements: { files: JSON.stringify(row[field]), id: row.id }, transaction }
          );
        }
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

          // Remove "type" key from each file object
          const cleanedFiles = files.map(file => {
            const { type, ...rest } = file;
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
      await queryInterface.sequelize.query("ALTER TABLE files DROP COLUMN type;", { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
