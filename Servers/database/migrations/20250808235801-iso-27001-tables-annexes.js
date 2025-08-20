'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

function getClausesStruct() {
  const { ISO27001Annex } = require("../../dist/structures/ISO-27001/annexes/iso27001.annex.struct");
  let annex = [], annexControls = [];
  for (let ann of ISO27001Annex) {
    annex.push({
      title: ann.category_name,
      arrangement: ann.arrangement,
      order_no: ann.index,
    });
    for (let control of ann.controls) {
      annexControls.push({
        title: control.title,
        order_no: control.index,
        requirement_summary: control.requirement_summary,
        key_questions: control.key_questions,
        evidence_examples: control.evidence_examples,
      });
    }
  }
  return {
    annex,
    annexControls
  }
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        `CREATE TABLE public.annex_struct_iso27001 (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          arrangement VARCHAR(5) NOT NULL,
          order_no INT NOT NULL,
          framework_id INT,
          FOREIGN KEY (framework_id) REFERENCES public.frameworks(id) ON DELETE CASCADE
        );`,
        `CREATE TABLE public.annexcontrols_struct_iso27001 (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          order_no INT NOT NULL,
          requirement_summary TEXT,
          key_questions TEXT[],
          evidence_examples TEXT[],
          annex_id INT,
          FOREIGN KEY (annex_id) REFERENCES public.annex_struct_iso27001(id) ON DELETE CASCADE
        );`,
        // `CREATE TYPE enum_annexcontrols_iso_status AS ENUM ('Not started', 'Draft', 'In progress', 'Awaiting review', 'Awaiting approval', 'Implemented', 'Audited', 'Needs rework');`,
      ];
      for (const query of queries) {
        await queryInterface.sequelize.query(query, { transaction });
      }
      const { annex, annexControls } = getClausesStruct();
      const annexStructInsert = annex.map(ann => {
        return `('${ann.title}', '${ann.arrangement}', ${ann.order_no}, ${3})`;
      }).join(',');
      const annexStruct = await queryInterface.sequelize.query(
        `INSERT INTO public.annex_struct_iso27001 (title, arrangement, order_no, framework_id) VALUES ${annexStructInsert} RETURNING id;`,
        { transaction }
      );

      let annexControlsStructInsert = annexControls.map(control => {
        return `('${control.title}', '${control.requirement_summary.replace(/'/g, "''")}', 
        ARRAY[${control.key_questions.map(q => `'${q.replace(/'/g, "''")}'`).join(', ')}], 
        ARRAY[${control.evidence_examples.map(q => `'${q.replace(/'/g, "''")}'`).join(', ')}], 
        ${control.order_no}`;
      });
      let aCtr = 0;
      let acCtr = 0;
      [36, 8, 14, 35].forEach(async (skip) => {
        for (let i = 0; i < skip; i++) {
          annexControlsStructInsert[acCtr] = annexControlsStructInsert[acCtr].concat(`, ${annexStruct[0][aCtr].id})`);
          acCtr++;
        }
        aCtr++;
      });
      annexControlsStructInsert = annexControlsStructInsert.join(', ');
      await queryInterface.sequelize.query(
        `INSERT INTO public.annexcontrols_struct_iso27001 (title, requirement_summary, key_questions, evidence_examples, order_no, annex_id) VALUES ${annexControlsStructInsert} RETURNING id;`,
        { transaction }
      );

      const organizations = await queryInterface.sequelize.query(`SELECT id FROM public.organizations;`, { transaction })
      if (organizations[0].length !== 0) {
        const tenantHash = getTenantHash(organizations[0][0].id);
        for (let query of [
          `CREATE TABLE "${tenantHash}".annexcontrols_iso27001(
            id SERIAL PRIMARY KEY,
            implementation_description TEXT,
            evidence_links JSONB,
            status enum_annexcategories_iso_status DEFAULT 'Not started',
            owner INT,
            reviewer INT,
            approver INT,
            due_date DATE,
            auditor_feedback TEXT,
            projects_frameworks_id INT,
            annexcontrol_meta_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_demo BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (annexcontrol_meta_id) REFERENCES public.annexcontrols_struct_iso27001(id) ON DELETE CASCADE,
            FOREIGN KEY (projects_frameworks_id) REFERENCES "${tenantHash}".projects_frameworks(id) ON DELETE CASCADE,
            FOREIGN KEY (owner) REFERENCES public.users(id) ON DELETE SET NULL,
            FOREIGN KEY (reviewer) REFERENCES public.users(id) ON DELETE SET NULL,
            FOREIGN KEY (approver) REFERENCES public.users(id) ON DELETE SET NULL
          );`,
          `CREATE TABLE "${tenantHash}".annexcontrols_iso27001__risks(
            annexcontrol_id INT,
            projects_risks_id INT PRIMARY KEY,
            FOREIGN KEY (annexcontrol_id) REFERENCES "${tenantHash}".annexcontrols_iso27001(id) ON DELETE CASCADE,
            FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".projectrisks(id) ON DELETE CASCADE
          );`
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        }
      }

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
      const organizations = await queryInterface.sequelize.query(`SELECT id FROM public.organizations;`, { transaction })
      if (organizations[0].length !== 0) {
        const tenantHash = getTenantHash(organizations[0][0].id);
        await Promise.all([
          `DROP TABLE IF EXISTS "${tenantHash}".annexcontrols_iso27001__risks CASCADE;`,
          `DROP TABLE IF EXISTS "${tenantHash}".annexcontrols_iso27001 CASCADE;`
        ].map(query => queryInterface.sequelize.query(query, { transaction })));
      }
      const queries = [
        `DROP TABLE IF EXISTS public.annexcontrols_struct_iso27001 CASCADE;`,
        `DROP TABLE IF EXISTS public.annex_struct_iso27001 CASCADE;`
      ];
      for (const query of queries) {
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
