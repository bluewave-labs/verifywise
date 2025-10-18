'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Get all existing organizations
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      );
      
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        
        // Check if schema exists before proceeding
        const [schemaExists] = await queryInterface.sequelize.query(
          `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${tenantHash}';`,
          { transaction }
        );
        
        if (schemaExists.length === 0) {
          console.log(`Schema ${tenantHash} does not exist, skipping...`);
          continue;
        }
        
        // Add soft delete columns to risks table (project risks)
        try {
          await queryInterface.addColumn(
            { tableName: 'risks', schema: tenantHash },
            'is_deleted',
            {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false
            },
            { transaction }
          );
          
          await queryInterface.addColumn(
            { tableName: 'risks', schema: tenantHash },
            'updated_at',
            {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.fn('NOW')
            },
            { transaction }
          );
          
          await queryInterface.addColumn(
            { tableName: 'risks', schema: tenantHash },
            'deleted_at',
            {
              type: Sequelize.DATE,
              allowNull: true
            },
            { transaction }
          );
          
          console.log(`Added soft delete columns to ${tenantHash}.risks`);
        } catch (error) {
          console.log(`Error updating risks table for ${tenantHash}: ${error.message}`);
        }
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
      // Get all existing organizations
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      );
      
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        
        // Check if schema exists before proceeding
        const [schemaExists] = await queryInterface.sequelize.query(
          `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${tenantHash}';`,
          { transaction }
        );
        
        if (schemaExists.length === 0) {
          continue;
        }
        
        // Remove soft delete columns from risks table
        try {
          await queryInterface.removeColumn(
            { tableName: 'risks', schema: tenantHash },
            'is_deleted',
            { transaction }
          );
          
          await queryInterface.removeColumn(
            { tableName: 'risks', schema: tenantHash },
            'updated_at',
            { transaction }
          );
          
          await queryInterface.removeColumn(
            { tableName: 'risks', schema: tenantHash },
            'deleted_at',
            { transaction }
          );
        } catch (error) {
          console.log(`Error removing columns from risks table for ${tenantHash}: ${error.message}`);
        }
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};