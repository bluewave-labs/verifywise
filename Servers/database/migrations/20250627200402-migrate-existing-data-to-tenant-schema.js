'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organization_id = await queryInterface.sequelize.query(`
        SELECT id FROM organizations LIMIT 1;
      `, { transaction });
      if (organization_id[0].length !== 0) {
        const tenantHash = getTenantHash(organization_id[0][0].id);
        await queryInterface.sequelize.query(`
        CREATE SCHEMA IF NOT EXISTS "${tenantHash}";
      `, { transaction });

        await Promise.all([
          `ALTER TABLE projects SET SCHEMA "${tenantHash}";`,
          `ALTER TABLE vendors SET SCHEMA "${tenantHash}";`,
          `ALTER TABLE model_files SET SCHEMA "${tenantHash}";`,
          `ALTER TABLE trainingregistar SET SCHEMA "${tenantHash}";`,
        ].map(query => queryInterface.sequelize.query(query, { transaction })));

        for (let query of [
          `ALTER TABLE projects_members DROP CONSTRAINT IF EXISTS projects_members_project_id_fkey;`,
          `ALTER TABLE projects_members ADD CONSTRAINT projects_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES "${tenantHash}".projects(id) ON DELETE CASCADE;`,
          `ALTER TABLE projects_members SET SCHEMA "${tenantHash}";`,
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        };

        for (let query of [
          `ALTER TABLE vendors_projects DROP CONSTRAINT IF EXISTS vendors_projects_project_id_fkey;`,
          `ALTER TABLE vendors_projects DROP CONSTRAINT IF EXISTS vendors_projects_vendor_id_fkey;`,
          `ALTER TABLE vendors_projects ADD CONSTRAINT vendors_projects_project_id_fkey FOREIGN KEY (project_id) REFERENCES "${tenantHash}".projects(id) ON DELETE CASCADE;`,
          `ALTER TABLE vendors_projects ADD CONSTRAINT vendors_projects_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES "${tenantHash}".vendors(id) ON DELETE CASCADE;`,
          `ALTER TABLE vendors_projects SET SCHEMA "${tenantHash}";`,
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        };

        for (let query of [
          `ALTER TABLE projectrisks DROP CONSTRAINT IF EXISTS projectrisks_project_id_fkey;`,
          `ALTER TABLE projectrisks ADD CONSTRAINT projectrisks_project_id_fkey FOREIGN KEY (project_id) REFERENCES "${tenantHash}".projects(id) ON DELETE CASCADE;`,
          `ALTER TABLE projectrisks SET SCHEMA "${tenantHash}";`,
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        };

        for (let query of [
          `ALTER TABLE files DROP CONSTRAINT IF EXISTS files_project_id_fkey;`,
          `ALTER TABLE files ADD CONSTRAINT files_project_id_fkey FOREIGN KEY (project_id) REFERENCES "${tenantHash}".projects(id) ON DELETE CASCADE;`,
          `ALTER TABLE files SET SCHEMA "${tenantHash}";`,
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        };

        for (let query of [
          `ALTER TABLE projects_frameworks DROP CONSTRAINT IF EXISTS projects_frameworks_project_id_fkey;`,
          `ALTER TABLE projects_frameworks ADD CONSTRAINT projects_frameworks_project_id_fkey FOREIGN KEY (project_id) REFERENCES "${tenantHash}".projects(id) ON DELETE CASCADE;`,
          `ALTER TABLE projects_frameworks SET SCHEMA "${tenantHash}";`,
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        };

        for (let query of [
          `ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_project_id_fkey;`,
          `ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_projects_frameworks_id_fkey;`,
          `ALTER TABLE assessments ADD CONSTRAINT assessments_project_id_fkey FOREIGN KEY (project_id) REFERENCES "${tenantHash}".projects(id) ON DELETE CASCADE;`,
          `ALTER TABLE assessments ADD CONSTRAINT assessments_projects_frameworks_id_fkey FOREIGN KEY (projects_frameworks_id) REFERENCES "${tenantHash}".projects_frameworks(id) ON DELETE CASCADE;`,
          `ALTER TABLE assessments SET SCHEMA "${tenantHash}";`,
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        };

        for (let query of [
          `ALTER TABLE projectscopes DROP CONSTRAINT IF EXISTS projectscopes_assessment_id_fkey;`,
          `ALTER TABLE projectscopes ADD CONSTRAINT projectscopes_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES "${tenantHash}".assessments(id) ON DELETE CASCADE;`,
          `ALTER TABLE projectscopes SET SCHEMA "${tenantHash}";`,
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        };

        for (let query of [
          `ALTER TABLE vendorrisks DROP CONSTRAINT IF EXISTS vendorrisks_vendor_id_fkey;`,
          `ALTER TABLE vendorrisks ADD CONSTRAINT vendorrisks_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES "${tenantHash}".vendors(id) ON DELETE CASCADE;`,
          `ALTER TABLE vendorrisks SET SCHEMA "${tenantHash}";`,
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        };

        for (let query of [
          `ALTER TABLE model_data DROP CONSTRAINT IF EXISTS model_data_model_id_fkey;`,
          `ALTER TABLE model_data ADD CONSTRAINT model_data_model_id_fkey FOREIGN KEY (model_id) REFERENCES "${tenantHash}".model_files(id) ON DELETE CASCADE;`,
          `ALTER TABLE model_data SET SCHEMA "${tenantHash}";`,
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        };

        for (let query of [
          `ALTER TABLE fairness_runs DROP CONSTRAINT IF EXISTS fairness_runs_data_id_fkey;`,
          `ALTER TABLE fairness_runs ADD CONSTRAINT fairness_runs_data_id_fkey FOREIGN KEY (data_id) REFERENCES "${tenantHash}".model_data(id) ON DELETE CASCADE;`,
          `ALTER TABLE fairness_runs SET SCHEMA "${tenantHash}";`,
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        };

        for (let query of [
          `ALTER TABLE controls_eu DROP CONSTRAINT IF EXISTS controls_eu_control_meta_id_fkey;`,
          `ALTER TABLE controls_eu DROP CONSTRAINT IF EXISTS controls_eu_projects_frameworks_id_fkey;`,
          `ALTER TABLE controls_eu ADD CONSTRAINT controls_eu_control_meta_id_fkey FOREIGN KEY (control_meta_id) REFERENCES public.controls_struct_eu(id) ON DELETE CASCADE;`,
          `ALTER TABLE controls_eu ADD CONSTRAINT controls_eu_projects_frameworks_id_fkey FOREIGN KEY (projects_frameworks_id) REFERENCES "${tenantHash}".projects_frameworks(id) ON DELETE CASCADE;`,
          `ALTER TABLE controls_eu SET SCHEMA "${tenantHash}";`,
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        };

        for (let query of [
          `ALTER TABLE subcontrols_eu DROP CONSTRAINT IF EXISTS subcontrols_eu_control_id_fkey;`,
          `ALTER TABLE subcontrols_eu DROP CONSTRAINT IF EXISTS subcontrols_eu_subcontrol_meta_id_fkey;`,
          `ALTER TABLE subcontrols_eu ADD CONSTRAINT subcontrols_eu_control_id_fkey FOREIGN KEY (control_id) REFERENCES "${tenantHash}".controls_eu(id) ON DELETE CASCADE;`,
          `ALTER TABLE subcontrols_eu ADD CONSTRAINT subcontrols_eu_subcontrol_meta_id_fkey FOREIGN KEY (subcontrol_meta_id) REFERENCES public.subcontrols_struct_eu(id) ON DELETE CASCADE;`,
          `ALTER TABLE subcontrols_eu SET SCHEMA "${tenantHash}";`,
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        };

        for (let query of [
          `ALTER TABLE answers_eu DROP CONSTRAINT IF EXISTS answers_eu_assessment_id_fkey;`,
          `ALTER TABLE answers_eu DROP CONSTRAINT IF EXISTS answers_eu_question_id_fkey;`,
          `ALTER TABLE answers_eu ADD CONSTRAINT answers_eu_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES "${tenantHash}".assessments(id) ON DELETE CASCADE;`,
          `ALTER TABLE answers_eu ADD CONSTRAINT answers_eu_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions_struct_eu(id) ON DELETE CASCADE;`,
          `ALTER TABLE answers_eu SET SCHEMA "${tenantHash}";`,
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        };

        for (let query of [
          `ALTER TABLE subclauses_iso DROP CONSTRAINT IF EXISTS subclauses_iso_projects_frameworks_id_fkey;`,
          `ALTER TABLE subclauses_iso DROP CONSTRAINT IF EXISTS subclauses_iso_subclause_meta_id_fkey;`,
          `ALTER TABLE subclauses_iso ADD CONSTRAINT subclauses_iso_projects_frameworks_id_fkey FOREIGN KEY (projects_frameworks_id) REFERENCES "${tenantHash}".projects_frameworks(id) ON DELETE CASCADE;`,
          `ALTER TABLE subclauses_iso ADD CONSTRAINT subclauses_iso_subclause_meta_id_fkey FOREIGN KEY (subclause_meta_id) REFERENCES public.subclauses_struct_iso(id) ON DELETE CASCADE;`,
          `ALTER TABLE subclauses_iso SET SCHEMA "${tenantHash}";`,
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        };

        for (let query of [
          `ALTER TABLE annexcategories_iso DROP CONSTRAINT IF EXISTS annexcategories_iso_annexcategory_meta_id_fkey;`,
          `ALTER TABLE annexcategories_iso DROP CONSTRAINT IF EXISTS annexcategories_iso_projects_frameworks_id_fkey;`,
          `ALTER TABLE annexcategories_iso ADD CONSTRAINT annexcategories_iso_annexcategory_meta_id_fkey FOREIGN KEY (annexcategory_meta_id) REFERENCES public.annexcategories_struct_iso(id) ON DELETE CASCADE;`,
          `ALTER TABLE annexcategories_iso ADD CONSTRAINT annexcategories_iso_projects_frameworks_id_fkey FOREIGN KEY (projects_frameworks_id) REFERENCES "${tenantHash}".projects_frameworks(id) ON DELETE CASCADE;`,
          `ALTER TABLE annexcategories_iso SET SCHEMA "${tenantHash}";`,
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        };

        for (let query of [
          `ALTER TABLE annexcategories_iso__risks DROP CONSTRAINT IF EXISTS annexcategories_iso__risks_annexcategory_id_fkey;`,
          `ALTER TABLE annexcategories_iso__risks DROP CONSTRAINT IF EXISTS annexcategories_iso__risks_projects_risks_id_fkey;`,
          `ALTER TABLE annexcategories_iso__risks ADD CONSTRAINT annexcategories_iso__risks_annexcategory_id_fkey FOREIGN KEY (annexcategory_id) REFERENCES "${tenantHash}".annexcategories_iso(id) ON DELETE CASCADE;`,
          `ALTER TABLE annexcategories_iso__risks ADD CONSTRAINT annexcategories_iso__risks_projects_risks_id_fkey FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".projectrisks(id) ON DELETE CASCADE;`,
          `ALTER TABLE annexcategories_iso__risks SET SCHEMA "${tenantHash}";`,
        ]) {
          await queryInterface.sequelize.query(query, { transaction });
        };
      }

      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) { }
};
