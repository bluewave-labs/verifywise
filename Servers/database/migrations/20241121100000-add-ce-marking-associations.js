'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all tenant schemas
    const schemas = await queryInterface.sequelize.query(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
       AND schema_name NOT LIKE 'pg_%'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const { schema_name } of schemas) {
      // Create ce_marking_policies association table
      await queryInterface.createTable(
        'ce_marking_policies',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          ce_marking_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'ce_markings',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          policy_id: {
            type: Sequelize.INTEGER,
            allowNull: false
          },
          linked_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          },
          linked_by: {
            type: Sequelize.INTEGER,
            allowNull: false
          }
        },
        {
          schema: schema_name
        }
      );

      // Create ce_marking_evidences association table
      await queryInterface.createTable(
        'ce_marking_evidences',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          ce_marking_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'ce_markings',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          file_id: {
            type: Sequelize.INTEGER,
            allowNull: false
          },
          linked_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          },
          linked_by: {
            type: Sequelize.INTEGER,
            allowNull: false
          }
        },
        {
          schema: schema_name
        }
      );

      // Add indexes for performance
      await queryInterface.addIndex(
        { tableName: 'ce_marking_policies', schema: schema_name },
        ['ce_marking_id'],
        { name: `${schema_name}_ce_marking_policies_ce_marking_id_idx` }
      );

      await queryInterface.addIndex(
        { tableName: 'ce_marking_policies', schema: schema_name },
        ['policy_id'],
        { name: `${schema_name}_ce_marking_policies_policy_id_idx` }
      );

      await queryInterface.addIndex(
        { tableName: 'ce_marking_policies', schema: schema_name },
        ['ce_marking_id', 'policy_id'],
        {
          name: `${schema_name}_ce_marking_policies_unique_idx`,
          unique: true
        }
      );

      await queryInterface.addIndex(
        { tableName: 'ce_marking_evidences', schema: schema_name },
        ['ce_marking_id'],
        { name: `${schema_name}_ce_marking_evidences_ce_marking_id_idx` }
      );

      await queryInterface.addIndex(
        { tableName: 'ce_marking_evidences', schema: schema_name },
        ['file_id'],
        { name: `${schema_name}_ce_marking_evidences_file_id_idx` }
      );

      await queryInterface.addIndex(
        { tableName: 'ce_marking_evidences', schema: schema_name },
        ['ce_marking_id', 'file_id'],
        {
          name: `${schema_name}_ce_marking_evidences_unique_idx`,
          unique: true
        }
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Get all tenant schemas
    const schemas = await queryInterface.sequelize.query(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
       AND schema_name NOT LIKE 'pg_%'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const { schema_name } of schemas) {
      await queryInterface.dropTable({ tableName: 'ce_marking_policies', schema: schema_name });
      await queryInterface.dropTable({ tableName: 'ce_marking_evidences', schema: schema_name });
    }
  }
};