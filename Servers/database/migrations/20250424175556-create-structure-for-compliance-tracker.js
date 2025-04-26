'use strict';
const { ControlCategories } = require("../../dist/structures/compliance-tracker/controlCategories.struct");

function getComplianceTrackerStruct() {
  let controlCategories = [], controls = [], subControls = []
  for (let controlCategory of ControlCategories) {
    controlCategories.push({
      title: controlCategory.title,
      order_no: controlCategory.order_no
    });
    for (let control of controlCategory.controls) {
      controls.push({
        title: control.title,
        description: control.description,
        order_no: control.order_no,
        implementation_details: control.implementation_details,
      });
      for (let subControl of control.subControls) {
        subControls.push({
          title: subControl.title,
          description: subControl.description,
          order_no: subControl.order_no
        });
      }
    }
  }
  return {
    controlCategories,
    controls,
    subControls
  }
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const euQueries = [
        `CREATE TABLE controlcategories_struct_eu (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          order_no INTEGER,
          is_demo BOOLEAN NOT NULL DEFAULT false,
          framework_id INTEGER NOT NULL,
          FOREIGN KEY (framework_id) REFERENCES frameworks(id) ON DELETE CASCADE);`,
        `CREATE TABLE controls_struct_eu (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          order_no INTEGER,
          control_category_id INTEGER NOT NULL,
          FOREIGN KEY (control_category_id) REFERENCES controlcategories_struct_eu(id) ON DELETE CASCADE);`,
        `CREATE TABLE subcontrols_struct_eu (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          order_no INTEGER,
          control_id INTEGER NOT NULL,
          FOREIGN KEY (control_id) REFERENCES controls_struct_eu(id) ON DELETE CASCADE);`,
        `CREATE TABLE controls_eu (
          id SERIAL PRIMARY KEY,
          status enum_controls_status,
          approver INTEGER,
          risk_review enum_controls_risk_review,
          owner INTEGER,
          reviewer INTEGER,
          due_date TIMESTAMP WITH TIME ZONE,
          implementation_details TEXT,
          is_demo BOOLEAN NOT NULL DEFAULT false,
          control_meta_id INTEGER,
          projects_frameworks_id INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          current_id_temp INT,
          FOREIGN KEY (approver) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (owner) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (reviewer) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (control_meta_id) REFERENCES controls_struct_eu(id) ON DELETE CASCADE,
          FOREIGN KEY (projects_frameworks_id) REFERENCES projects_frameworks(id) ON DELETE CASCADE);`,
        `CREATE TABLE subcontrols_eu (
          id SERIAL PRIMARY KEY,
          status enum_subcontrols_status,
          approver INTEGER,
          risk_review enum_subcontrols_risk_review,
          owner INTEGER,
          reviewer INTEGER,
          due_date TIMESTAMP WITH TIME ZONE,
          implementation_details TEXT,
          control_id INTEGER NOT NULL,
          subcontrol_meta_id INTEGER,
          is_demo boolean NOT NULL DEFAULT false,
          evidence_files JSONB,
          feedback_files JSONB,
          evidence_description TEXT,
          feedback_description TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          FOREIGN KEY (approver) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (owner) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (reviewer) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (control_id) REFERENCES controls_eu(id) ON DELETE CASCADE,
          FOREIGN KEY (subcontrol_meta_id) REFERENCES subcontrols_struct_eu(id) ON DELETE CASCADE);`,
        // ---------
      ];
      for (const query of euQueries) {
        await queryInterface.sequelize.query(query, { transaction });
      }

      const { controlCategories, controls, subControls } = getComplianceTrackerStruct();
      const controlCategoriesStructInsert = controlCategories.map((controlCategory) => {
        return `('${controlCategory.title}', ${controlCategory.order_no}, ${1})`;
      }).join(', ');
      const controlCategoriesStruct = await queryInterface.sequelize.query(`INSERT INTO controlcategories_struct_eu (title, order_no, framework_id) VALUES ${controlCategoriesStructInsert} RETURNING id;`, { transaction });

      let controlsStructInsert = controls.map((control) => {
        return `('${control.title}', '${control.description}', ${control.order_no}`;
      });
      let ccCtr = 0;
      let cCtr1 = 0;
      [2, 7, 3, 4, 9, 9, 10, 4, 7, 4, 5, 5, 5].forEach(skip => {
        for (let i = 0; i < skip; i++) {
          controlsStructInsert[cCtr1] = controlsStructInsert[cCtr1].concat(`, ${controlCategoriesStruct[0][ccCtr].id})`);
          cCtr1++;
        }
        ccCtr++;
      })
      controlsStructInsert = controlsStructInsert.join(', ');
      const controlsStruct = await queryInterface.sequelize.query(`
        INSERT INTO controls_struct_eu (title, description, order_no, control_category_id) VALUES ${controlsStructInsert} RETURNING id, description;`,
        { transaction }
      );

      let subControlsStructInsert = subControls.map((subControl) => {
        return `('${subControl.title}', '${subControl.description}', ${subControl.order_no}`;
      })
      let cCtr2 = 0;
      let scCtr = 0;
      [3, 2, 1, 1, 1, 2, 1, 1, 1, 3, 2, 2, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 4, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1].forEach(
        skip => {
          for (let i = 0; i < skip; i++) {
            subControlsStructInsert[scCtr] = subControlsStructInsert[scCtr].concat(`, ${controlsStruct[0][cCtr2].id})`);
            scCtr++;
          }
          cCtr2++;
        }
      )
      subControlsStructInsert = subControlsStructInsert.join(', ');
      const subControlsStruct = await queryInterface.sequelize.query(`
        INSERT INTO subcontrols_struct_eu (title, description, order_no, control_id) VALUES ${subControlsStructInsert} RETURNING id, title;`,
        { transaction }
      );

      // -----------------
      const controlsStructMap = new Map();
      controlsStruct[0].forEach((control) => {
        controlsStructMap.set(control.description, control.id);
      });

      const existingControls = await queryInterface.sequelize.query(
        `SELECT pf.id as pf_id, c.id AS id, c.description as description, c.status AS status, c.approver AS approver, c.risk_review AS risk_review, c.implementation_details AS implementation_details, c.owner AS owner, 
          c.reviewer AS reviewer, c.due_date AS due_date, c.is_demo AS is_demo, c.created_at AS created_at
	          FROM controls c JOIN controlcategories cc ON c.control_category_id = cc.id
			  	    JOIN projects_frameworks pf ON pf.project_id = cc.project_id;`,
        { transaction });
      const controlsInsert = existingControls[0].map((control) => {
        let description_ = control.description.replaceAll("''", "'");
        return `(
          ${control.status ? `'${control.status}'` : null}, 
          ${control.approver}, 
          ${control.risk_review ? `'${control.risk_review}'` : null}, 
          ${control.owner}, 
          ${control.reviewer}, 
          ${control.implementation_details ? `'${control.implementation_details}'` : null}, 
          ${control.due_date ? `'${new Date(control.due_date).toISOString()}'` : null}, 
          ${control.is_demo}, 
          ${control.pf_id}, 
          ${controlsStructMap.get(description_)}, 
          '${new Date(control.created_at).toISOString()}', 
          ${control.id})`;
      }).join(', ');
      const controlsEU = await queryInterface.sequelize.query(
        `INSERT INTO controls_eu (
          status, approver, risk_review, owner, reviewer, implementation_details, due_date, is_demo, projects_frameworks_id, control_meta_id, created_at, current_id_temp
        ) VALUES ${controlsInsert} RETURNING id, current_id_temp;`,
        { transaction }
      );

      const controlsIdMap = new Map();
      controlsEU[0].forEach((control) => {
        controlsIdMap.set(control.current_id_temp, control.id);
      });
      const subControlsStructMap = new Map();
      subControlsStruct[0].forEach((subControl) => {
        subControlsStructMap.set(subControl.title, subControl.id);
      });
      const existingSubControls = await queryInterface.sequelize.query(
        `SELECT title, status, approver, risk_review, owner, reviewer, due_date, implementation_details, 
          control_id, is_demo, evidence_files, feedback_files, evidence_description, feedback_description, created_at FROM subcontrols`,
        { transaction }
      );
      const subControlsInsert = existingSubControls[0].map((subControl) => {
        let title_ = subControl.title.replaceAll("''", "'");
        return `(
          ${subControl.status ? `'${subControl.status}'` : null}, 
          ${subControl.approver}, 
          ${subControl.risk_review ? `'${subControl.risk_review}'` : null} , 
          ${subControl.owner}, 
          ${subControl.reviewer}, 
          ${subControl.due_date ? `'${new Date(subControl.due_date).toISOString()}'` : null}, 
          ${subControl.implementation_details ? `'${subControl.implementation_details}'` : null}, 
          ${controlsIdMap.get(subControl.control_id)}, 
          ${subControlsStructMap.get(title_)}, 
          ${subControl.is_demo}, 
          ${subControl.evidence_files ? `'${JSON.stringify(subControl.evidence_files)}'` : null}, 
          ${subControl.feedback_filed ? `'${JSON.stringify(subControl.feedback_filed)}'` : null}, 
          ${subControl.evidence_description ? `'${subControl.evidence_description}'` : null},
          ${subControl.feedback_description ? `'${subControl.feedback_description}'` : null}, 
          '${new Date(subControl.created_at).toISOString()}')`;
      }).join(', ');
      await queryInterface.sequelize.query(
        `INSERT INTO subcontrols_eu (status, approver, risk_review, owner, reviewer, due_date, implementation_details, control_id, 
          subcontrol_meta_id, is_demo, evidence_files, feedback_files, evidence_description, feedback_description, created_at) VALUES ${subControlsInsert} RETURNING id;`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE controls_eu DROP COLUMN current_id_temp;`,
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
        'DROP TABLE IF EXISTS subcontrols_eu CASCADE;',
        'DROP TABLE IF EXISTS controls_eu CASCADE;',
        'DROP TABLE IF EXISTS subcontrols_struct_eu CASCADE;',
        'DROP TABLE IF EXISTS controls_struct_eu CASCADE;',
        'DROP TABLE IF EXISTS controlcategories_struct_eu CASCADE;'
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
