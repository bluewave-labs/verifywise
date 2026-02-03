'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Create enum types in public schema
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_dataset_status AS ENUM ('Draft', 'Active', 'Deprecated', 'Archived');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_dataset_type AS ENUM ('Training', 'Validation', 'Testing', 'Production', 'Reference');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_data_classification AS ENUM ('Public', 'Internal', 'Confidential', 'Restricted');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_dataset_change_action AS ENUM ('created', 'updated', 'deleted');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        // Create datasets table
        await queryInterface.sequelize.query(`
          CREATE TABLE "${tenantHash}".datasets (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            version VARCHAR(50) NOT NULL,
            owner VARCHAR(255) NOT NULL,
            type enum_dataset_type NOT NULL,
            function TEXT NOT NULL,
            source VARCHAR(255) NOT NULL,
            license VARCHAR(255) NULL,
            format VARCHAR(100) NULL,
            classification enum_data_classification NOT NULL,
            contains_pii BOOLEAN NOT NULL DEFAULT false,
            pii_types TEXT NULL,
            status enum_dataset_status NOT NULL DEFAULT 'Draft',
            status_date TIMESTAMP NOT NULL,
            known_biases TEXT NULL,
            bias_mitigation TEXT NULL,
            collection_method TEXT NULL,
            preprocessing_steps TEXT NULL,
            documentation_data JSONB NOT NULL DEFAULT '[]',
            is_demo BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `, { transaction });

        // Create indexes on datasets
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_datasets_name ON "${tenantHash}".datasets(name);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX idx_datasets_status ON "${tenantHash}".datasets(status);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX idx_datasets_type ON "${tenantHash}".datasets(type);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX idx_datasets_classification ON "${tenantHash}".datasets(classification);
        `, { transaction });

        // Create dataset_model_inventories junction table
        await queryInterface.sequelize.query(`
          CREATE TABLE "${tenantHash}".dataset_model_inventories (
            id SERIAL PRIMARY KEY,
            dataset_id INTEGER NOT NULL,
            model_inventory_id INTEGER NOT NULL,
            relationship_type VARCHAR(50) NOT NULL DEFAULT 'trained_on',
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            CONSTRAINT fk_dataset_model_inv_dataset FOREIGN KEY (dataset_id)
              REFERENCES "${tenantHash}".datasets(id) ON DELETE CASCADE,
            CONSTRAINT fk_dataset_model_inv_model FOREIGN KEY (model_inventory_id)
              REFERENCES "${tenantHash}".model_inventories(id) ON DELETE CASCADE,
            CONSTRAINT uq_dataset_model_inventory UNIQUE (dataset_id, model_inventory_id)
          );
        `, { transaction });

        // Create index on junction table
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_dataset_model_inv_dataset ON "${tenantHash}".dataset_model_inventories(dataset_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX idx_dataset_model_inv_model ON "${tenantHash}".dataset_model_inventories(model_inventory_id);
        `, { transaction });

        // Create dataset_projects junction table
        await queryInterface.sequelize.query(`
          CREATE TABLE "${tenantHash}".dataset_projects (
            id SERIAL PRIMARY KEY,
            dataset_id INTEGER NOT NULL,
            project_id INTEGER NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            CONSTRAINT fk_dataset_project_dataset FOREIGN KEY (dataset_id)
              REFERENCES "${tenantHash}".datasets(id) ON DELETE CASCADE,
            CONSTRAINT fk_dataset_project_project FOREIGN KEY (project_id)
              REFERENCES "${tenantHash}".projects(id) ON DELETE CASCADE,
            CONSTRAINT uq_dataset_project UNIQUE (dataset_id, project_id)
          );
        `, { transaction });

        // Create index on junction table
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_dataset_project_dataset ON "${tenantHash}".dataset_projects(dataset_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX idx_dataset_project_project ON "${tenantHash}".dataset_projects(project_id);
        `, { transaction });

        // Create dataset_change_histories table
        await queryInterface.sequelize.query(`
          CREATE TABLE "${tenantHash}".dataset_change_histories (
            id SERIAL PRIMARY KEY,
            dataset_id INTEGER NOT NULL,
            action enum_dataset_change_action NOT NULL,
            field_name VARCHAR(100) NULL,
            old_value TEXT NULL,
            new_value TEXT NULL,
            changed_by_user_id INTEGER NULL,
            changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
            CONSTRAINT fk_dataset_change_history_dataset FOREIGN KEY (dataset_id)
              REFERENCES "${tenantHash}".datasets(id) ON DELETE CASCADE,
            CONSTRAINT fk_dataset_change_history_user FOREIGN KEY (changed_by_user_id)
              REFERENCES public.users(id) ON DELETE SET NULL
          );
        `, { transaction });

        // Create indexes on change history table
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_dataset_change_history_dataset_id ON "${tenantHash}".dataset_change_histories(dataset_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX idx_dataset_change_history_changed_at ON "${tenantHash}".dataset_change_histories(changed_at);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX idx_dataset_change_history_composite ON "${tenantHash}".dataset_change_histories(dataset_id, changed_at DESC);
        `, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        // Drop tables in reverse order of creation (due to foreign keys)
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".dataset_change_histories;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".dataset_projects;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".dataset_model_inventories;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".datasets;
        `, { transaction });
      }

      // Drop enum types
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_dataset_change_action;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_data_classification;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_dataset_type;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_dataset_status;
      `, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
