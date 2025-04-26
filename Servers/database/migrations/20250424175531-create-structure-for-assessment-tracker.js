'use strict';

function getAssessmentTrackerStruct() {
  const { Topics } = require("../../dist/structures/assessment-tracker/topics.struct");
  let topics = [], subTopics = [], questions = []
  for (let topic of Topics) {
    topics.push({
      title: topic.title,
      order_no: topic.order_no
    });
    for (let subTopic of topic.subtopics) {
      subTopics.push({
        title: subTopic.title,
        order_no: subTopic.order_no,
      });
      for (let question of subTopic.questions) {
        questions.push({
          question: question.question,
          hint: question.hint,
          priority_level: question.priority_level,
          answer_type: question.answer_type,
          input_type: question.input_type,
          evidence_required: question.evidence_required,
          is_required: question.isrequired,
        });
      }
    }
  }
  return {
    topics,
    subTopics,
    questions
  }
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `ALTER TABLE assessments ADD COLUMN projects_frameworks_id INT,
          ADD CONSTRAINT assessments_projects_frameworks_id_fkey FOREIGN KEY (projects_frameworks_id) REFERENCES projects_frameworks(id) ON DELETE CASCADE;`,
        { transaction }
      );
      const assessments = await queryInterface.sequelize.query(
        `SELECT a.id as assessment_id, pf.id as projects_frameworks_id 
          FROM assessments a JOIN projects_frameworks pf ON a.project_id = pf.project_id;`,
        { transaction }
      );
      for (let assessment of assessments[0]) {
        await queryInterface.sequelize.query(
          `UPDATE assessments SET projects_frameworks_id = ${assessment.projects_frameworks_id} WHERE id = ${assessment.assessment_id};`,
          { transaction }
        );
      };
      for (let query of [
        `ALTER TABLE assessments ALTER COLUMN project_id DROP NOT NULL;`,
        `ALTER TABLE assessments ALTER COLUMN projects_frameworks_id SET NOT NULL;`,
      ]) {
        await queryInterface.sequelize.query(query, { transaction });
      };

      const queries = [
        `CREATE TABLE topics_struct_eu (
          id SERIAL PRIMARY KEY,
          title TEXT,
          order_no INT,
          is_demo BOOLEAN NOT NULL DEFAULT false,
          framework_id INTEGER NOT NULL,
          FOREIGN KEY (framework_id) REFERENCES frameworks(id) ON DELETE CASCADE);`,
        `CREATE TABLE subtopics_struct_eu (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          order_no INTEGER,
          topic_id INTEGER NOT NULL,
          is_demo BOOLEAN NOT NULL DEFAULT false,
          FOREIGN KEY (topic_id) REFERENCES topics_struct_eu(id) ON DELETE CASCADE);`,
        `CREATE TABLE questions_struct_eu (
          id SERIAL PRIMARY KEY,
          order_no INTEGER,
          question TEXT NOT NULL,
          hint TEXT NOT NULL,
          priority_level enum_questions_priority_level NOT NULL,
          answer_type VARCHAR(255) NOT NULL,
          input_type VARCHAR(255) NOT NULL,
          evidence_required BOOLEAN NOT NULL,
          is_required BOOLEAN NOT NULL,
          subtopic_id INTEGER NOT NULL,
          is_demo BOOLEAN NOT NULL DEFAULT false,
          FOREIGN KEY (subtopic_id) REFERENCES subtopics_struct_eu(id) ON DELETE CASCADE);`,
        `CREATE TABLE answers_eu(
          id SERIAL PRIMARY KEY,
          assessment_id INT NOT NULL,
          question_id INT NOT NULL,
          answer TEXT,
          evidence_files JSONB,
          dropdown_options TEXT[],
          status enum_status_questions DEFAULT 'Not started'::enum_status_questions,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions_struct_eu(id) ON DELETE CASCADE);`,
      ]
      for (const query of queries) {
        await queryInterface.sequelize.query(query, { transaction });
      }

      const { topics, subTopics, questions } = getAssessmentTrackerStruct();
      const topicsStructInsert = topics.map((topic) => {
        return `('${topic.title}', ${topic.order_no}, ${1})`;
      }).join(', ');
      const topicsStruct = await queryInterface.sequelize.query(`INSERT INTO topics_struct_eu (title, order_no, framework_id) VALUES ${topicsStructInsert} RETURNING id;`, { transaction });

      let subTopicsStructInsert = subTopics.map((subTopic) => {
        return `('${subTopic.title}', ${subTopic.order_no}`;
      })
      let tCtr = 0;
      let stCtr1 = 0;
      [2, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1].forEach(skip => {
        for (let i = 0; i < skip; i++) {
          subTopicsStructInsert[stCtr1] = subTopicsStructInsert[stCtr1].concat(`, ${topicsStruct[0][tCtr].id})`);
          stCtr1++;
        }
        tCtr++;
      });
      subTopicsStructInsert = subTopicsStructInsert.join(', ');
      const subTopicsStruct = await queryInterface.sequelize.query(`
        INSERT INTO subtopics_struct_eu (title, order_no, topic_id) VALUES ${subTopicsStructInsert} RETURNING id;`,
        { transaction }
      );

      let questionsStructInsert = questions.map((question) => {
        return `('${question.question}', '${question.hint}', '${question.priority_level}', '${question.answer_type}', '${question.input_type}', ${question.evidence_required}, ${question.is_required}`;
      })
      let stCtr2 = 0;
      let qCtr = 0;
      [4, 4, 3, 4, 8, 8, 3, 4, 4, 3, 2, 2, 3, 3, 3, 3, 4, 3, 2].forEach(skip => {
        for (let i = 0; i < skip; i++) {
          questionsStructInsert[qCtr] = questionsStructInsert[qCtr].concat(`, ${subTopicsStruct[0][stCtr2].id})`);
          qCtr++;
        }
        stCtr2++;
      });
      questionsStructInsert = questionsStructInsert.join(', ');
      const questionStruct = await queryInterface.sequelize.query(`
        INSERT INTO questions_struct_eu (question, hint, priority_level, answer_type, input_type, evidence_required, is_required, subtopic_id) VALUES ${questionsStructInsert} RETURNING id, question;`,
        { transaction }
      );

      const questionsStructMap = new Map();
      questionStruct[0].forEach((question) => {
        questionsStructMap.set(question.question, question.id);
      });

      const questionAnswers = await queryInterface.sequelize.query(
        `SELECT 
          q.question as question, q.answer AS answer, q.evidence_files AS evidence_files, q.dropdown_options AS dropdown_options,
            q.status AS status, q.created_at AS created_at, t.assessment_id AS assessment_id
              FROM questions q JOIN subtopics st ON q.subtopic_id = st.id JOIN topics t ON st.topic_id = t.id;`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      const answersInsert = questionAnswers.map((question) => {
        let question_ = question.question.replaceAll("''", "'");
        if (question_.includes("What are the legal bases for processing")) {
          question_ = "What are the legal bases for processing personal and sensitive data? What measures are in place to ensure that the processing logic remains consistent with the original purpose for which consent was obtained, and that data is deleted after the stipulated period?"
        } else if (question_.includes("How is human oversight empowered")) {
          question_ = "How is human oversight empowered to stop or alter the AI system's operations, ensuring the ability to intervene throughout its lifecycle and mitigate fundamental rights risks?"
        }
        return `(
          ${question.assessment_id}, 
          ${questionsStructMap.get(question_)}, 
          ${question.answer ? `'${question.answer.replace(/'/g, "''")}'` : null}, 
          ${question.evidence_files ? `'${JSON.stringify(question.evidence_files)}'` : null}, 
          ${question.dropdown_options?.length ? `'${question.dropdown_options}'` : null}, 
          '${question.status}', 
          '${new Date(question.created_at).toISOString()}')`;
      }).join(', ');
      await queryInterface.sequelize.query(
        `INSERT INTO answers_eu (
          assessment_id, question_id, answer, evidence_files, dropdown_options, status, created_at
        ) VALUES ${answersInsert};`,
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
      const projectIdsProjectFrameworks = await queryInterface.sequelize.query(
        `SELECT pf.project_id AS project_id, a.id AS assessment_id FROM 
          assessments a JOIN projects_frameworks pf ON a.projects_frameworks_id = pf.id WHERE a.project_id IS NULL;`,
        { transaction }
      );
      await Promise.all(
        projectIdsProjectFrameworks[0].map(async (assessment) => {
          await queryInterface.sequelize.query(
            `UPDATE assessments SET project_id = ${assessment.project_id} WHERE id = ${assessment.assessment_id};`,
            { transaction }
          );
        })
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE assessments ALTER COLUMN project_id SET NOT NULL;`,
        { transaction }
      );
      // migrate the data from the new column to the old column
      const queries = [
        `ALTER TABLE assessments DROP COLUMN projects_frameworks_id;`,
        'DROP TABLE IF EXISTS answers_eu CASCADE;',
        'DROP TABLE IF EXISTS questions_struct_eu CASCADE;',
        'DROP TABLE IF EXISTS topics_struct_eu CASCADE;',
        'DROP TABLE IF EXISTS subtopics_struct_eu CASCADE;',
      ];

      for (const query of queries) {
        await queryInterface.sequelize.query(query, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
