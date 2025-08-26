'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      let created = new Set();
      const model_inventories_approver_org_ids = await queryInterface.sequelize.query(`
        SELECT mi.*, u.organization_id AS organization_id FROM
          public.model_inventories AS mi INNER JOIN public.users AS u
            ON mi.approver = u.id;
      `, { transaction });

      for (const row of model_inventories_approver_org_ids[0]) {
        const tenantHash = getTenantHash(row.organization_id);
        if (!created.has(tenantHash)) {
          await queryInterface.sequelize.query(`
          CREATE TABLE "${tenantHash}".model_inventories (
            id SERIAL PRIMARY KEY,
            provider_model VARCHAR(255) NOT NULL,
            version VARCHAR(255) NOT NULL,
            approver INTEGER NOT NULL,
            capabilities TEXT NOT NULL,
            security_assessment BOOLEAN NOT NULL DEFAULT false,
            status enum_model_inventories_status NOT NULL DEFAULT 'Pending'::enum_model_inventories_status,
            status_date TIMESTAMP WITH TIME ZONE NOT NULL,
            is_demo BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
            provider VARCHAR(255) NOT NULL,
            model VARCHAR(255) NOT NULL,
            CONSTRAINT fk_model_inventories_approver FOREIGN KEY (approver)
              REFERENCES public.users (id) MATCH SIMPLE
              ON UPDATE NO ACTION ON DELETE SET NULL
          );`, { transaction });
          created.add(tenantHash);
        }
        await queryInterface.sequelize.query(`
          INSERT INTO "${tenantHash}".model_inventories (
            provider_model,
            version,
            approver,
            capabilities,
            security_assessment,
            status,
            status_date,
            is_demo,
            created_at,
            updated_at,
            provider,
            model
          ) VALUES (
            :provider_model,
            :version,
            :approver,
            :capabilities,
            :security_assessment,
            :status,
            :status_date,
            :is_demo,
            :created_at,
            :updated_at,
            :provider,
            :model
          );`, { transaction, replacements: row }
        )
      }

      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS public.model_inventories;
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {

      await queryInterface.sequelize.query(`
        CREATE TABLE public.model_inventories (
          id SERIAL PRIMARY KEY,
          provider_model VARCHAR(255) NOT NULL,
          version VARCHAR(255) NOT NULL,
          approver INTEGER NOT NULL,
          capabilities TEXT NOT NULL,
          security_assessment BOOLEAN NOT NULL DEFAULT false,
          status enum_model_inventories_status NOT NULL DEFAULT 'Pending'::enum_model_inventories_status,
          status_date TIMESTAMP WITH TIME ZONE NOT NULL,
          is_demo BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
          provider VARCHAR(255) NOT NULL,
          model VARCHAR(255) NOT NULL,
          CONSTRAINT fk_model_inventories_approver FOREIGN KEY (approver)
            REFERENCES public.users (id) MATCH SIMPLE
            ON UPDATE NO ACTION ON DELETE SET NULL
        );`, { transaction });

      const organizations = await queryInterface.sequelize.query(`SELECT id FROM public.organizations;`, { transaction })

      for (const organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        const tenantData = await queryInterface.sequelize.query(`
          SELECT 
            provider_model,
            version,
            approver,
            capabilities,
            security_assessment,
            status,
            status_date,
            is_demo,
            created_at,
            updated_at,
            provider,
            model
          FROM "${tenantHash}".model_inventories;
        `, { transaction });

        for (const row of tenantData[0]) {
          await queryInterface.sequelize.query(`
            INSERT INTO public.model_inventories (
              provider_model,
              version,
              approver,
              capabilities,
              security_assessment,
              status,
              status_date,
              is_demo,
              created_at,
              updated_at,
              provider,
              model
            ) VALUES (
              :provider_model,
              :version,
              :approver,
              :capabilities,
              :security_assessment,
              :status,
              :status_date,
              :is_demo,
              :created_at,
              :updated_at,
              :provider,
              :model
            );
          `, { transaction, replacements: row });
        }

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".model_inventories;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
