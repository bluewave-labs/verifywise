'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

function getClausesStruct() {
  const { ISO27001Clause } = require("../../dist/structures/ISO-27001/clauses/iso27001.clause.struct");
  let clauses = [], subClauses = [];
  for (let clause of ISO27001Clause) {
    clauses.push({
      title: clause.title,
      arrangement: clause.arrangement,
    });
    for (let subClause of clause.subclauses) {
      subClauses.push({
        title: subClause.title,
        order_no: subClause.index,
        requirement_summary: subClause.requirement_summary,
        key_questions: subClause.key_questions,
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
        `CREATE TABLE public.clauses_struct_iso27001 (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          arrangement INT NOT NULL,
          framework_id INT,
          FOREIGN KEY (framework_id) REFERENCES public.frameworks(id) ON DELETE CASCADE
        );`,
        `CREATE TABLE subclauses_struct_iso27001 (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          order_no INT NOT NULL,
          requirement_summary TEXT,
          key_questions TEXT[],
          evidence_examples TEXT[],
          clause_id INT,
          FOREIGN KEY (clause_id) REFERENCES public.clauses_struct_iso27001(id) ON DELETE CASCADE
        );`
      ];
      for (let query of queries) {
        await queryInterface.sequelize.query(query, { transaction });
      }
      const { clauses, subClauses } = getClausesStruct();
      const clausesStructInsert = clauses.map(clause => {
        return `('${clause.title}', ${clause.arrangement}, ${3})`;
      }).join(', ');
      const clausesStruct = await queryInterface.sequelize.query(
        `INSERT INTO public.clauses_struct_iso27001 (title, arrangement, framework_id) VALUES ${clausesStructInsert} RETURNING id;`,
        { transaction }
      );

      let subClausesStructInsert = subClauses.map(subClause => {
        return `('${subClause.title}', ${subClause.order_no}, '${subClause.requirement_summary}', 
          ARRAY[${subClause.key_questions.map(q => `'${q.replace(/'/g, "''")}'`).join(', ')}], 
          ARRAY[${subClause.evidence_examples.map(q => `'${q.replace(/'/g, "''")}'`).join(', ')}]`;
      });
      let cCtr = 0;
      let scCtr = 0;
      [4, 3, 3, 5, 3, 3, 2].forEach((skip) => {
        for (let i = 0; i < skip; i++) {
          subClausesStructInsert[scCtr] = subClausesStructInsert[scCtr].concat(`, ${clausesStruct[0][cCtr].id})`);
          scCtr++;
        }
        cCtr++;
      });
      subClausesStructInsert = subClausesStructInsert.join(', ');
      await queryInterface.sequelize.query(
        `INSERT INTO public.subclauses_struct_iso27001 (title, order_no, requirement_summary, key_questions, evidence_examples, clause_id) VALUES ${subClausesStructInsert} RETURNING id;`,
        { transaction }
      );

      const organizations = await queryInterface.sequelize.query(`SELECT id FROM public.organizations;`, { transaction })
      if (organizations[0].length !== 0) {
        const tenantHash = getTenantHash(organizations[0][0].id);
        for (let query of [
          `CREATE TABLE "${tenantHash}".subclauses_iso27001(
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
            FOREIGN KEY (subclause_meta_id) REFERENCES public.subclauses_struct_iso27001(id) ON DELETE CASCADE,
            FOREIGN KEY (projects_frameworks_id) REFERENCES "${tenantHash}".projects_frameworks(id) ON DELETE CASCADE,
            FOREIGN KEY (owner) REFERENCES public.users(id) ON DELETE SET NULL,
            FOREIGN KEY (reviewer) REFERENCES public.users(id) ON DELETE SET NULL,
            FOREIGN KEY (approver) REFERENCES public.users(id) ON DELETE SET NULL
          );`,
          `CREATE TABLE "${tenantHash}".subclauses_iso27001__risks(
            subclause_id INT,
            projects_risks_id INT PRIMARY KEY,
            FOREIGN KEY (subclause_id) REFERENCES "${tenantHash}".subclauses_iso27001(id) ON DELETE CASCADE,
            FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".projectrisks(id) ON DELETE CASCADE
          );`]) {
          await queryInterface.sequelize.query(query, { transaction });
        }
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
      const organizations = await queryInterface.sequelize.query(`SELECT id FROM public.organizations;`, { transaction })
      if (organizations[0].length !== 0) {
        const tenantHash = getTenantHash(organizations[0][0].id);
        await Promise.all([
          `DROP TABLE IF EXISTS "${tenantHash}".subclauses_iso27001__risks CASCADE;`,
          `DROP TABLE IF EXISTS "${tenantHash}".subclauses_iso27001 CASCADE;`
        ].map(query => queryInterface.sequelize.query(query, { transaction })));
      }
      const queries = [
        `DROP TABLE IF EXISTS public.subclauses_struct_iso27001 CASCADE;`,
        `DROP TABLE IF EXISTS public.clauses_struct_iso27001 CASCADE;`
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
