'use strict';

function getClausesStruct() {
  const { Annex } = require("../../dist/structures/ISO-42001/annex/annex.struct");
  let annex = [], annexCategories = [];
  for (let ann of Annex) {
    annex.push({
      title: ann.title,
      annex_no: ann.annex_no,
    });
    for (let category of ann.annexcategories) {
      annexCategories.push({
        sub_id: category.sub_id,
        title: category.title,
        order_no: category.order_no,
        description: category.description,
        guidance: category.guidance,
      });
    }
  }
  return {
    annex,
    annexCategories
  }
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        `CREATE TABLE annex_struct_iso (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          annex_no INT NOT NULL,
          framework_id INT,
          FOREIGN KEY (framework_id) REFERENCES frameworks(id) ON DELETE CASCADE
        );`,
        `CREATE TABLE annexcategories_struct_iso (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          guidance TEXT,
          sub_id INT,
          order_no INT NOT NULL,
          annex_id INT,
          FOREIGN KEY (annex_id) REFERENCES annex_struct_iso(id) ON DELETE CASCADE
        );`,
        `CREATE TYPE enum_annexcategories_iso_status AS ENUM ('Not started', 'Draft', 'In progress', 'Awaiting review', 'Awaiting approval', 'Implemented', 'Audited', 'Needs rework');`,
        `CREATE TABLE annexcategories_iso(
          id SERIAL PRIMARY KEY,
          is_applicable BOOLEAN DEFAULT FALSE,
          justification_for_exclusion TEXT,
          implementation_description TEXT,
          evidence_links JSONB,
          status enum_annexcategories_iso_status DEFAULT 'Not started',
          owner INT,
          reviewer INT,
          approver INT,
          due_date DATE,
          auditor_feedback TEXT,
          projects_frameworks_id INT,
          annexcategory_meta_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_demo BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (annexcategory_meta_id) REFERENCES annexcategories_struct_iso(id) ON DELETE CASCADE,
          FOREIGN KEY (projects_frameworks_id) REFERENCES projects_frameworks(id) ON DELETE CASCADE,
          FOREIGN KEY (owner) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (reviewer) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (approver) REFERENCES users(id) ON DELETE SET NULL
        );`,
        `CREATE TABLE annexcategories_iso__risks(
          annexcategory_id INT,
          projects_risks_id INT PRIMARY KEY,
          FOREIGN KEY (annexcategory_id) REFERENCES annexcategories_iso(id) ON DELETE CASCADE,
          FOREIGN KEY (projects_risks_id) REFERENCES projectrisks(id) ON DELETE CASCADE
        );`
      ];
      for (const query of queries) {
        await queryInterface.sequelize.query(query, { transaction });
      }
      const { annex, annexCategories } = getClausesStruct();
      const annexStructInsert = annex.map(ann => {
        return `('${ann.title}', ${ann.annex_no}, ${2})`;
      }).join(',');
      const annexStruct = await queryInterface.sequelize.query(
        `INSERT INTO annex_struct_iso (title, annex_no, framework_id) VALUES ${annexStructInsert} RETURNING id;`,
        { transaction }
      );

      let annexCategoriesStructInsert = annexCategories.map(category => {
        return `('${category.title}', '${category.description}', '${category.guidance}', ${category.sub_id}, ${category.order_no}`;
      });
      let aCtr = 0;
      let acCtr = 0;
      [8, 2, 5, 9, 6, 4, 3].forEach(async (skip) => {
        for (let i = 0; i < skip; i++) {
          annexCategoriesStructInsert[acCtr] = annexCategoriesStructInsert[acCtr].concat(`, ${annexStruct[0][aCtr].id})`);
          acCtr++;
        }
        aCtr++;
      });
      annexCategoriesStructInsert = annexCategoriesStructInsert.join(', ');
      await queryInterface.sequelize.query(
        `INSERT INTO annexcategories_struct_iso (title, description, guidance, sub_id, order_no, annex_id) VALUES ${annexCategoriesStructInsert} RETURNING id;`,
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
        `DROP TABLE IF EXISTS annexcategories_iso__risks CASCADE;`,
        `DROP TABLE IF EXISTS annexcategories_iso CASCADE;`,
        `DROP TYPE IF EXISTS enum_annexcategories_iso_status CASCADE;`,
        `DROP TABLE IF EXISTS annexcategories_struct_iso CASCADE;`,
        `DROP TABLE IF EXISTS annex_struct_iso CASCADE;`
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
