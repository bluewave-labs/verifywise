'use strict';

function getClausesStruct() {
  const { Clauses } = require("../../dist/structures/ISO-42001/clauses/clauses.struct");
  let clauses = [], subClauses = [];
  for (let clause of Clauses) {
    clauses.push({
      title: clause.title,
      clause_no: clause.clause_no,
    });
    for (let subClause of clause.subclauses) {
      subClauses.push({
        title: subClause.title,
        order_no: subClause.order_no,
        summary: subClause.summary,
        questions: subClause.questions,
        evidence_examples: subClause.evidence_examples,
      });
    }
  }
  return {
    clauses,
    subClauses
  }
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        `CREATE TABLE clauses_struct_iso (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          clause_no INT NOT NULL,
          framework_id INT,
          FOREIGN KEY (framework_id) REFERENCES frameworks(id) ON DELETE CASCADE
        );`,
        `CREATE TABLE subclauses_struct_iso (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          order_no INT NOT NULL,
          summary TEXT,
          questions TEXT[],
          evidence_examples TEXT[],
          clause_id INT,
          FOREIGN KEY (clause_id) REFERENCES clauses_struct_iso(id) ON DELETE CASCADE
        );`,
        `CREATE TYPE enum_subclauses_iso_status AS ENUM ('Not started', 'Draft', 'In progress', 'Awaiting review', 'Awaiting approval', 'Implemented', 'Audited', 'Needs rework');`,
        `CREATE TABLE subclauses_iso(
          id SERIAL PRIMARY KEY,
          implementation_description TEXT,
          evidence_links JSONB,
          status enum_subclauses_iso_status DEFAULT 'Not started',
          owner INT,
          reviewer INT,
          approver INT,
          due_date DATE,
          auditor_feedback TEXT,
          subclause_meta_id INT,
          projects_frameworks_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_demo BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (subclause_meta_id) REFERENCES subclauses_struct_iso(id) ON DELETE CASCADE,
          FOREIGN KEY (projects_frameworks_id) REFERENCES projects_frameworks(id) ON DELETE CASCADE,
          FOREIGN KEY (owner) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (reviewer) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (approver) REFERENCES users(id) ON DELETE SET NULL
        );`
      ];
      for (let query of queries) {
        await queryInterface.sequelize.query(query, { transaction });
      }
      const { clauses, subClauses } = getClausesStruct();
      const clausesStructInsert = clauses.map(clause => {
        return `('${clause.title}', ${clause.clause_no}, ${2})`;
      }).join(', ');
      const clausesStruct = await queryInterface.sequelize.query(
        `INSERT INTO clauses_struct_iso (title, clause_no, framework_id) VALUES ${clausesStructInsert} RETURNING id;`,
        { transaction }
      );

      let subClausesStructInsert = subClauses.map(subClause => {
        return `('${subClause.title}', ${subClause.order_no}, '${subClause.summary}', 
          ARRAY[${subClause.questions.map(q => `'${q.replace(/'/g, "''")}'`).join(', ')}], 
          ARRAY[${subClause.evidence_examples.map(q => `'${q.replace(/'/g, "''")}'`).join(', ')}]`;
      });
      let cCtr = 0;
      let scCtr = 0;
      [4, 3, 2, 5, 5, 3, 2].forEach((skip) => {
        for (let i = 0; i < skip; i++) {
          subClausesStructInsert[scCtr] = subClausesStructInsert[scCtr].concat(`, ${clausesStruct[0][cCtr].id})`);
          scCtr++;
        }
        cCtr++;
      });
      subClausesStructInsert = subClausesStructInsert.join(', ');
      await queryInterface.sequelize.query(
        `INSERT INTO subclauses_struct_iso (title, order_no, summary, questions, evidence_examples, clause_id) VALUES ${subClausesStructInsert} RETURNING id;`,
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
        `DROP TABLE IF EXISTS subclauses_iso CASCADE;`,
        `DROP TYPE IF EXISTS enum_subclauses_iso_status CASCADE;`,
        `DROP TABLE IF EXISTS subclauses_struct_iso CASCADE;`,
        `DROP TABLE IF EXISTS clauses_struct_iso CASCADE;`
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
