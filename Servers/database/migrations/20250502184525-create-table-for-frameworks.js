"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const frameworkQueries = [
        `CREATE TABLE frameworks(
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );`,
        `CREATE TABLE projects_frameworks(
          id SERIAL UNIQUE,
          project_id INT NOT NULL,
          framework_id INT NOT NULL,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (framework_id) REFERENCES frameworks(id) ON DELETE CASCADE,
          PRIMARY KEY (project_id, framework_id),
          is_demo BOOLEAN DEFAULT FALSE
        );`,
      ];
      for (const query of frameworkQueries) {
        await queryInterface.sequelize.query(query, { transaction });
      }
      const frameworksQuery = await queryInterface.sequelize.query(
        `
          INSERT INTO frameworks (name, description) VALUES
          (
            'EU AI Act',
            'The EU AI Act is a proposed regulation by the European Commission to create a legal framework for artificial intelligence in the EU. It aims to ensure AI systems are safe, transparent, and respect fundamental rights while fostering innovation and competitiveness.'
          ) RETURNING id;
        `,
        { transaction }
      );
      const framework_id = frameworksQuery[0][0].id;
      const projectsQuery = await queryInterface.sequelize.query(
        `
          SELECT id FROM projects;
        `,
        { transaction }
      );
      const prjectsFrameworksInsert = projectsQuery[0].map((project) => {
        return `(${project.id}, ${framework_id})`;
      });
      if (prjectsFrameworksInsert.length > 0) {
        const projectsFrameworksInsertString =
          prjectsFrameworksInsert.join(", ");
        await queryInterface.sequelize.query(
          `INSERT INTO projects_frameworks (project_id, framework_id) VALUES ${projectsFrameworksInsertString};`,
          { transaction }
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
    try {
      const queries = [
        "DROP TABLE IF EXISTS projects_frameworks CASCADE;",
        "DROP TABLE IF EXISTS frameworks CASCADE;",
      ];
      for (const query of queries) {
        await queryInterface.sequelize.query(query, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
