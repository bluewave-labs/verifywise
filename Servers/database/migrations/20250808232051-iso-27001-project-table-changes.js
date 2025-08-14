'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(`SELECT id FROM organizations;`, { transaction })
      if (organizations[0].length !== 0) {
        const tenantHash = getTenantHash(organizations[0][0].id);
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
        // await queryInterface.sequelize.query(
        //   `CREATE OR REPLACE FUNCTION public.check_iso27001_projects_fields_framework_fields()
        //     RETURNS TRIGGER AS $$
        //     BEGIN
        //       -- Check if the project has framework_id = 3
        //       IF EXISTS (
        //         SELECT 1
        //         FROM "${tenantHash}".projects_frameworks pf
        //         WHERE pf.project_id = NEW.id
        //           AND pf.framework_id = 3
        //       ) THEN
        //         -- Validate that required fields are NULL
        //         IF NEW.ai_risk_classification IS NOT NULL
        //           OR NEW.type_of_high_risk_role IS NOT NULL
        //           OR NEW.goal IS NOT NULL THEN
        //             RAISE EXCEPTION
        //               'Project % uses framework 3, so ai_risk_classification, type_of_high_risk_role, and goal must be be NULL', NEW.id;
        //         END IF;
        //       END IF;

        //       RETURN NEW;
        //     END;
        //     $$ LANGUAGE plpgsql;

        //     CREATE TRIGGER trg_iso27001_projects_fields_framework_fields
        //       BEFORE INSERT OR UPDATE ON "${tenantHash}".projects
        //       FOR EACH ROW
        //         EXECUTE FUNCTION public.check_iso27001_projects_fields_framework_fields();`,
        //   { transaction }
        // )
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
      const organizations = await queryInterface.sequelize.query(`SELECT id FROM organizations;`, { transaction })
      if (organizations[0].length !== 0) {
        const tenantHash = getTenantHash(organizations[0][0].id);
        const queries = [
          `ALTER TABLE "${tenantHash}".projects ALTER COLUMN ai_risk_classification SET NOT NULL;`,
          `ALTER TABLE "${tenantHash}".projects ALTER COLUMN type_of_high_risk_role SET NOT NULL;`,
          `ALTER TABLE "${tenantHash}".projects ALTER COLUMN goal SET NOT NULL;`,
          `DROP TRIGGER IF EXISTS trg_ensure_one_organizational_project ON "${tenantHash}".projects;`,
          `DROP FUNCTION IF EXISTS "${tenantHash}".check_only_one_organizational_project();`
        ];
        await Promise.all(queries.map(query => queryInterface.sequelize.query(query, { transaction })));
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
