'use strict';

function getLaw25Struct() {
  const { Law25Topics } = require("../../dist/structures/LAW-25/topics.struct");
  let topics = [], requirements = [];

  for (let topic of Law25Topics) {
    topics.push({
      topic_id: topic.id,
      order_no: topic.order,
      name: topic.name,
    });
    for (let requirement of topic.requirements) {
      requirements.push({
        requirement_id: requirement.id,
        order_no: requirement.order,
        name: requirement.name,
        summary: requirement.summary,
        key_questions: requirement.key_questions,
        evidence_examples: requirement.evidence_examples,
        topic_id: topic.id,
      });
    }
  }
  return {
    topics,
    requirements
  }
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Get framework ID for Law 25
      const [frameworkResult] = await queryInterface.sequelize.query(
        `SELECT id FROM frameworks WHERE name = 'Quebec Law 25';`,
        { transaction }
      );
      const frameworkId = frameworkResult[0]?.id || 5;

      const queries = [
        // Create topics structure table
        `CREATE TABLE topics_struct_law25 (
          id SERIAL PRIMARY KEY,
          topic_id VARCHAR(20) NOT NULL UNIQUE,
          order_no INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          framework_id INT,
          FOREIGN KEY (framework_id) REFERENCES frameworks(id) ON DELETE CASCADE
        );`,

        // Create requirements structure table
        `CREATE TABLE requirements_struct_law25 (
          id SERIAL PRIMARY KEY,
          requirement_id VARCHAR(20) NOT NULL UNIQUE,
          order_no INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          summary TEXT,
          key_questions TEXT[],
          evidence_examples TEXT[],
          topic_id INT,
          FOREIGN KEY (topic_id) REFERENCES topics_struct_law25(id) ON DELETE CASCADE
        );`,

        // Create status enum for Law 25 requirements
        `CREATE TYPE enum_requirements_law25_status AS ENUM ('Not started', 'Draft', 'In progress', 'Awaiting review', 'Awaiting approval', 'Implemented', 'Audited', 'Needs rework');`,

        // Create tenant-specific requirements table
        `CREATE TABLE requirements_law25 (
          id SERIAL PRIMARY KEY,
          implementation_description TEXT,
          evidence_links JSONB,
          status enum_requirements_law25_status DEFAULT 'Not started',
          owner INT,
          reviewer INT,
          approver INT,
          due_date DATE,
          auditor_feedback TEXT,
          requirement_meta_id INT,
          projects_frameworks_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_demo BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (requirement_meta_id) REFERENCES requirements_struct_law25(id) ON DELETE CASCADE,
          FOREIGN KEY (projects_frameworks_id) REFERENCES projects_frameworks(id) ON DELETE CASCADE,
          FOREIGN KEY (owner) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (reviewer) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (approver) REFERENCES users(id) ON DELETE SET NULL
        );`,

        // Create risks junction table for Law 25 requirements
        `CREATE TABLE requirements_law25__risks (
          id SERIAL PRIMARY KEY,
          requirement_id INT NOT NULL,
          projects_risks_id INT NOT NULL,
          FOREIGN KEY (requirement_id) REFERENCES requirements_law25(id) ON DELETE CASCADE
        );`
      ];

      for (let query of queries) {
        await queryInterface.sequelize.query(query, { transaction });
      }

      // Insert topics and requirements structure
      const { topics, requirements } = getLaw25Struct();

      // Insert topics
      const topicsInsert = topics.map(topic => {
        return `('${topic.topic_id}', ${topic.order_no}, '${topic.name.replace(/'/g, "''")}', ${frameworkId})`;
      }).join(', ');

      const topicsResult = await queryInterface.sequelize.query(
        `INSERT INTO topics_struct_law25 (topic_id, order_no, name, framework_id) VALUES ${topicsInsert} RETURNING id, topic_id;`,
        { transaction }
      );

      // Create a map of topic_id to database id
      const topicIdMap = {};
      for (let topic of topicsResult[0]) {
        topicIdMap[topic.topic_id] = topic.id;
      }

      // Insert requirements
      const requirementsInsert = requirements.map(req => {
        const topicDbId = topicIdMap[req.topic_id];
        return `('${req.requirement_id}', ${req.order_no}, '${req.name.replace(/'/g, "''")}', '${req.summary.replace(/'/g, "''")}',
          ARRAY[${req.key_questions.map(q => `'${q.replace(/'/g, "''")}'`).join(', ')}],
          ARRAY[${req.evidence_examples.map(e => `'${e.replace(/'/g, "''")}'`).join(', ')}], ${topicDbId})`;
      }).join(', ');

      await queryInterface.sequelize.query(
        `INSERT INTO requirements_struct_law25 (requirement_id, order_no, name, summary, key_questions, evidence_examples, topic_id) VALUES ${requirementsInsert};`,
        { transaction }
      );

      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        `DROP TABLE IF EXISTS requirements_law25__risks CASCADE;`,
        `DROP TABLE IF EXISTS requirements_law25 CASCADE;`,
        `DROP TYPE IF EXISTS enum_requirements_law25_status CASCADE;`,
        `DROP TABLE IF EXISTS requirements_struct_law25 CASCADE;`,
        `DROP TABLE IF EXISTS topics_struct_law25 CASCADE;`
      ];
      for (let query of queries) {
        await queryInterface.sequelize.query(query, { transaction });
      }
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
