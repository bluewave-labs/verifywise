'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        // Create ce_marking_policies association table
        await queryInterface.sequelize.query(`CREATE TABLE "${tenantHash}".ce_marking_policies (
        id SERIAL PRIMARY KEY,
        ce_marking_id INTEGER NOT NULL,
        policy_id INTEGER NOT NULL,
        linked_at TIMESTAMP NOT NULL DEFAULT NOW(),
        linked_by INTEGER NOT NULL,
        CONSTRAINT fk_ce_marking_policies_ce_marking
          FOREIGN KEY (ce_marking_id)
          REFERENCES "${tenantHash}".ce_markings (id)
          ON UPDATE CASCADE
          ON DELETE CASCADE
        );`, { transaction })

        // Create ce_marking_evidences association table
        await queryInterface.sequelize.query(`CREATE TABLE "${tenantHash}".ce_marking_evidences (
          id SERIAL PRIMARY KEY,
          ce_marking_id INTEGER NOT NULL,
          file_id INTEGER NOT NULL,
          linked_at TIMESTAMP NOT NULL DEFAULT NOW(),
          linked_by INTEGER NOT NULL,
          CONSTRAINT fk_ce_marking_evidences_ce_marking
            FOREIGN KEY (ce_marking_id)
            REFERENCES "${tenantHash}".ce_markings (id)
            ON UPDATE CASCADE
            ON DELETE CASCADE
        );`, { transaction })
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Get all tenant schemas
      const schemas = await queryInterface.sequelize.query(
        `SELECT schema_name FROM information_schema.schemata
         WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
         AND schema_name NOT LIKE 'pg_%'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      for (const { schema_name } of schemas) {
        await queryInterface.dropTable({ tableName: 'ce_marking_policies', schema: schema_name }, { transaction });
        await queryInterface.dropTable({ tableName: 'ce_marking_evidences', schema: schema_name }, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};