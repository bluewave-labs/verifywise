'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const transaction = await queryInterface.sequelize.transaction();
      const organizations = await queryInterface.sequelize.query(`SELECT id FROM public.organizations;`, { transaction })
      for (let i = 1; i < organizations[0].length; i++) {
        const organization = organizations[0][i];
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(
          `CREATE TABLE "${tenantHash}".subclauses_iso__risks (
            subclause_id INTEGER NOT NULL,
            projects_risks_id INTEGER NOT NULL,
            PRIMARY KEY (subclause_id, projects_risks_id),
            FOREIGN KEY (subclause_id) REFERENCES "${tenantHash}".subclauses_iso(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".projectrisks(id) ON DELETE CASCADE ON UPDATE CASCADE
          );`, { transaction }
        );

        await Promise.all([
          `CREATE TABLE "${tenantHash}".controls_eu__risks (
            control_id INTEGER NOT NULL,
            projects_risks_id INTEGER NOT NULL,
            PRIMARY KEY (control_id, projects_risks_id),
            FOREIGN KEY (control_id) REFERENCES "${tenantHash}".controls_eu(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".projectrisks(id) ON DELETE CASCADE ON UPDATE CASCADE
          );`,
          `CREATE TABLE "${tenantHash}".answers_eu__risks (
            answer_id INTEGER NOT NULL,
            projects_risks_id INTEGER NOT NULL,
            PRIMARY KEY (answer_id, projects_risks_id),
            FOREIGN KEY (answer_id) REFERENCES "${tenantHash}".answers_eu(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".projectrisks(id) ON DELETE CASCADE ON UPDATE CASCADE
          );`
        ].map(async (query) => {
          await queryInterface.sequelize.query(query, { transaction });
        }));

        await queryInterface.sequelize.query(
          `CREATE OR REPLACE FUNCTION "${tenantHash}".check_only_one_organizational_project()
            RETURNS TRIGGER AS $$
            BEGIN
              -- If this row is being set to TRUE...
              IF NEW.is_organizational = TRUE THEN
                -- Count other rows (exclude the row we're updating/inserting)
                IF EXISTS (
                  SELECT 1
                  FROM "${tenantHash}".projects
                  WHERE is_organizational = TRUE
                    AND (TG_OP = 'INSERT' OR id <> NEW.id)
                ) THEN
                  RAISE EXCEPTION 'Only one project can have is_organizational = TRUE';
                END IF;
              END IF;
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;`,
          { transaction });
        const queries = [
          `ALTER TABLE "${tenantHash}".projects ALTER COLUMN ai_risk_classification DROP NOT NULL;`,
          `ALTER TABLE "${tenantHash}".projects ALTER COLUMN type_of_high_risk_role DROP NOT NULL;`,
          `ALTER TABLE "${tenantHash}".projects ALTER COLUMN goal DROP NOT NULL;`,
          `ALTER TABLE "${tenantHash}".projects ADD COLUMN is_organizational BOOLEAN DEFAULT FALSE;`,
          `CREATE TRIGGER "trg_${tenantHash}_ensure_one_organizational_project"
            BEFORE INSERT OR UPDATE ON "${tenantHash}".projects
            FOR EACH ROW
            EXECUTE FUNCTION "${tenantHash}".check_only_one_organizational_project();`,
        ]
        await Promise.all(queries.map(query => queryInterface.sequelize.query(query, { transaction })));

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

        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".policy_manager (
            "id" SERIAL PRIMARY KEY,
            "title" VARCHAR(255) NOT NULL,
            "content_html" TEXT DEFAULT '',
            "status" VARCHAR(50) DEFAULT 'Draft',
            "tags" TEXT[] NOT NULL,
            "next_review_date" TIMESTAMP NOT NULL,
            "author_id" INTEGER NOT NULL NOT NULL,
            "assigned_reviewer_ids" INTEGER[],
            "last_updated_by" INTEGER NOT NULL,
            "last_updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("author_id") REFERENCES public.users(id) ON DELETE CASCADE,
            FOREIGN KEY ("last_updated_by") REFERENCES public.users(id) ON DELETE SET NULL
          );
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) { }
};
