"use strict";

function getComplianceTrackerStruct() {
  const { ControlCategories } = require("../../dist/structures/EU-AI-Act/compliance-tracker/controlCategories.struct");
  let controlCategories = [], controls = [], subControls = []
  for (let controlCategory of ControlCategories) {
    controlCategories.push({
      title: controlCategory.title,
      order_no: controlCategory.order_no,
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
          order_no: subControl.order_no,
        });
      }
    }
  }
  return {
    controlCategories,
    controls,
    subControls,
  };
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

      const { controlCategories, controls, subControls } =
        getComplianceTrackerStruct();
      const controlCategoriesStructInsert = controlCategories
        .map((controlCategory) => {
          return `('${controlCategory.title}', ${
            controlCategory.order_no
          }, ${1})`;
        })
        .join(", ");
      const controlCategoriesStruct = await queryInterface.sequelize.query(
        `INSERT INTO controlcategories_struct_eu (title, order_no, framework_id) VALUES ${controlCategoriesStructInsert} RETURNING id;`,
        { transaction }
      );

      let controlsStructInsert = controls.map((control) => {
        return `('${control.title}', '${control.description}', ${control.order_no}`;
      });
      let ccCtr = 0;
      let cCtr1 = 0;
      [2, 7, 3, 4, 9, 9, 10, 4, 7, 4, 5, 5, 5].forEach((skip) => {
        for (let i = 0; i < skip; i++) {
          controlsStructInsert[cCtr1] = controlsStructInsert[cCtr1].concat(
            `, ${controlCategoriesStruct[0][ccCtr].id})`
          );
          cCtr1++;
        }
        ccCtr++;
      });
      controlsStructInsert = controlsStructInsert.join(", ");
      const controlsStruct = await queryInterface.sequelize.query(
        `
        INSERT INTO controls_struct_eu (title, description, order_no, control_category_id) VALUES ${controlsStructInsert} RETURNING id, title, order_no;`,
        { transaction }
      );

      let subControlsStructInsert = subControls.map((subControl) => {
        return `('${subControl.title}', '${subControl.description}', ${subControl.order_no}`;
      });
      let cCtr2 = 0;
      let scCtr = 0;
      [
        3, 2, 1, 1, 1, 2, 1, 1, 1, 3, 2, 2, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 2, 1, 2, 6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1,
        2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 4, 1, 1, 2, 1, 1, 1, 1, 2,
        1, 1,
      ].forEach((skip) => {
        for (let i = 0; i < skip; i++) {
          subControlsStructInsert[scCtr] = subControlsStructInsert[
            scCtr
          ].concat(`, ${controlsStruct[0][cCtr2].id})`);
          scCtr++;
        }
        cCtr2++;
      });
      subControlsStructInsert = subControlsStructInsert.join(", ");
      const subControlsStruct = await queryInterface.sequelize.query(
        `
        INSERT INTO subcontrols_struct_eu (title, description, order_no, control_id) VALUES ${subControlsStructInsert} RETURNING id, title;`,
        { transaction }
      );

      // -----------------
      const controlsStructMap = new Map();
      controlsStruct[0].forEach((control) => {
        controlsStructMap.set(
          `${control.title} && ${control.order_no}`,
          control.id
        );
      });

      const existingControls = await queryInterface.sequelize.query(
        `SELECT pf.id as pf_id, c.id AS id, c.status AS status, c.approver AS approver, c.risk_review AS risk_review, c.implementation_details AS implementation_details, c.owner AS owner, 
          c.reviewer AS reviewer, c.due_date AS due_date, c.is_demo AS is_demo, c.created_at AS created_at, c.title as title, c.order_no AS order_no
	          FROM controls c JOIN controlcategories cc ON c.control_category_id = cc.id
			  	    JOIN projects_frameworks pf ON pf.project_id = cc.project_id;`,
        { transaction }
      );
      const controlsInsert = existingControls[0]
        .map((control) => {
          // THIS WAS BUG IN MY DB WHERE THE TITLE WAS SET SAME AS THE DESCRIPTION
          if (
            control.title ===
            "Maintain accurate records of AI system activities, including modifications and third-party involvements."
          ) {
            control.title = "AI System Scope and Impact Definition";
          }
          return `(
          ${control.status ? `'${control.status}'` : null}, 
          ${control.approver}, 
          ${control.risk_review ? `'${control.risk_review}'` : null}, 
          ${control.owner}, 
          ${control.reviewer}, 
          ${
            control.implementation_details
              ? `'${control.implementation_details}'`
              : null
          }, 
          ${
            control.due_date
              ? `'${new Date(control.due_date).toISOString()}'`
              : null
          }, 
          ${control.is_demo}, 
          ${control.pf_id}, 
          ${controlsStructMap.get(`${control.title} && ${control.order_no}`)}, 
          '${new Date(control.created_at).toISOString()}', 
          ${control.id})`;
      });
      if (controlsInsert.length > 0) {
        const controlsInsertString = controlsInsert.join(', ');
        const controlsEU = await queryInterface.sequelize.query(
          `INSERT INTO controls_eu (
            status, approver, risk_review, owner, reviewer, implementation_details, due_date, is_demo, projects_frameworks_id, control_meta_id, created_at, current_id_temp
          ) VALUES ${controlsInsertString} RETURNING id, current_id_temp;`,
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
        const subControlsInsertString = existingSubControls[0].map((subControl) => {
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
            ${subControl.feedback_files ? `'${JSON.stringify(subControl.feedback_files)}'` : null}, 
            ${subControl.evidence_description ? `'${subControl.evidence_description}'` : null},
            ${subControl.feedback_description ? `'${subControl.feedback_description}'` : null}, 
            '${new Date(subControl.created_at).toISOString()}')`;
        }).join(', ');
        await queryInterface.sequelize.query(
          `INSERT INTO subcontrols_eu (status, approver, risk_review, owner, reviewer, due_date, implementation_details, control_id, 
            subcontrol_meta_id, is_demo, evidence_files, feedback_files, evidence_description, feedback_description, created_at) VALUES ${subControlsInsertString} RETURNING id;`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `ALTER TABLE controls_eu DROP COLUMN current_id_temp;`,
          { transaction }
        );
      }
      for (let query of [
        "DELETE FROM subcontrols WHERE 1=1;",
        "DELETE FROM controls WHERE 1=1;",
        "DELETE FROM controlcategories WHERE 1=1;",
      ]) {
        await queryInterface.sequelize.query(query, { transaction });
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
      // for (let query of [
      //   "DELETE FROM subcontrols WHERE 1=1;",
      //   "DELETE FROM controls WHERE 1=1;",
      //   "DELETE FROM controlcategories WHERE 1=1;",
      // ]) {
      //   await queryInterface.sequelize.query(query, { transaction });
      // }

      const allCompliances = await queryInterface.sequelize.query(
        `SELECT 
          ccs.id AS ccs_id, ccs.title AS ccs_title, ccs.order_no AS ccs_order_no, ccs.framework_id AS ccs_framework_id,
          cs.id AS cs_id, cs.title AS cs_title, cs.description AS cs_description, cs.order_no AS cs_order_no, cs.control_category_id AS cs_control_category_id,
          c.id AS c_id, c.status AS c_status, c.approver AS c_approver, c.risk_review AS c_risk_review, c.implementation_details AS c_implementation_details,
          c.owner AS c_owner, c.reviewer AS c_reviewer, c.due_date AS c_due_date, c.is_demo AS c_is_demo, c.projects_frameworks_id AS c_projects_frameworks_id, c.created_at AS c_created_at,
          sc.id AS sc_id, sc.status AS sc_status, sc.approver AS sc_approver, sc.risk_review AS sc_risk_review, sc.implementation_details AS sc_implementation_details,
          sc.owner AS sc_owner, sc.reviewer AS sc_reviewer, sc.due_date AS sc_due_date, sc.is_demo AS sc_is_demo, sc.control_id AS sc_control_id,
          sc.subcontrol_meta_id AS sc_subcontrol_meta_id, sc.evidence_files AS sc_evidence_files, sc.feedback_files AS sc_feedback_files, sc.evidence_description AS sc_evidence_description,
          sc.feedback_description AS sc_feedback_description, sc.created_at AS sc_created_at,
          scs.id AS scs_id, scs.title AS scs_title, scs.description AS scs_description, scs.order_no AS scs_order_no,
          pf.project_id AS pf_project_id
        FROM controlcategories_struct_eu ccs JOIN controls_struct_eu cs ON ccs.id = cs.control_category_id
          JOIN controls_eu c ON cs.id = c.control_meta_id 
          JOIN subcontrols_eu sc ON c.id = sc.control_id
          JOIN subcontrols_struct_eu scs ON scs.id = sc.subcontrol_meta_id
          JOIN projects_frameworks pf ON pf.id = c.projects_frameworks_id
          ORDER BY c.projects_frameworks_id, ccs.id, cs.id, scs.id;`
      );

      let ctr = 0;
      let controlCategoryId = null;
      let controlId = null;
      while (ctr < allCompliances[0].length) {
        const record = allCompliances[0][ctr];
        if (!controlCategoryId) {
          const result = await queryInterface.sequelize.query(
            `INSERT INTO controlcategories (title, order_no, project_id, created_at) VALUES (
              '${record.ccs_title.replace(/'/g, "''")}', ${
              record.ccs_order_no
            }, ${record.pf_project_id}, '${new Date(
              record.c_created_at
            ).toISOString()}'
            ) RETURNING id;`,
            { transaction }
          );
          controlCategoryId = result[0][0].id;
        }

        if (!controlId) {
          const result = await queryInterface.sequelize.query(
            `INSERT INTO controls (title, description, order_no, control_category_id, status, approver, risk_review, implementation_details, owner, reviewer, due_date, is_demo, created_at) VALUES (
              '${record.cs_title.replace(
                /'/g,
                "''"
              )}', '${record.cs_description.replace(/'/g, "''")}', ${
              record.cs_order_no
            }, ${controlCategoryId}, ${
              record.c_status ? `'${record.c_status}'` : null
            }, 
              ${record.c_approver}, ${
              record.c_risk_review ? `'${record.c_risk_review}'` : null
            }, ${
              record.c_implementation_details
                ? `'${record.c_implementation_details}'`
                : null
            }, ${record.c_owner}, 
              ${record.c_reviewer}, ${
              record.c_due_date
                ? `'${new Date(record.c_due_date).toISOString()}'`
                : null
            }, ${record.c_is_demo}, '${new Date(
              record.c_created_at
            ).toISOString()}'
            ) RETURNING id;`,
            { transaction }
          );
          controlId = result[0][0].id;
        }

        await queryInterface.sequelize.query(
          `INSERT INTO subcontrols (title, description, order_no, status, approver, risk_review, implementation_details, owner, reviewer, due_date, control_id, is_demo, evidence_files, feedback_files, evidence_description, feedback_description, created_at) VALUES (
            '${record.scs_title.replace(
              /'/g,
              "''"
            )}', '${record.scs_description.replace(/'/g, "''")}', ${
            record.scs_order_no
          }, ${record.sc_status ? `'${record.sc_status}'` : null}, ${
            record.sc_approver
          }, ${record.sc_risk_review ? `'${record.sc_risk_review}'` : null}, 
            ${
              record.sc_implementation_details
                ? `'${record.sc_implementation_details}'`
                : null
            }, ${record.sc_owner}, ${record.sc_reviewer}, ${
            record.sc_due_date
              ? `'${new Date(record.sc_due_date).toISOString()}'`
              : null
          }, ${controlId}, 
            ${record.sc_is_demo}, ${
            record.sc_evidence_files
              ? `'${JSON.stringify(record.sc_evidence_files)}'`
              : null
          }, ${
            record.sc_feedback_files
              ? `'${JSON.stringify(record.sc_feedback_files)}'`
              : null
          }, 
            ${
              record.sc_evidence_description
                ? `'${record.sc_evidence_description}'`
                : null
            }, ${
            record.sc_feedback_description
              ? `'${record.sc_feedback_description}'`
              : null
          }, '${new Date(record.sc_created_at).toISOString()}'
          );`,
          { transaction }
        );

        if (record.ccs_id !== allCompliances[0][ctr + 1]?.ccs_id) {
          controlCategoryId = null;
        }
        if (record.cs_id !== allCompliances[0][ctr + 1]?.cs_id) {
          controlId = null;
        }
        ctr++;
      }

      const queries = [
        "DROP TABLE IF EXISTS subcontrols_eu CASCADE;",
        "DROP TABLE IF EXISTS controls_eu CASCADE;",
        "DROP TABLE IF EXISTS subcontrols_struct_eu CASCADE;",
        "DROP TABLE IF EXISTS controls_struct_eu CASCADE;",
        "DROP TABLE IF EXISTS controlcategories_struct_eu CASCADE;",
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
