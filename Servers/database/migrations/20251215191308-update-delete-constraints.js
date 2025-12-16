'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        (tenantHash) => `ALTER TABLE "${tenantHash}".files DROP CONSTRAINT files_project_id_fkey, ADD CONSTRAINT files_project_id_fkey FOREIGN KEY (project_id) REFERENCES "${tenantHash}".projects (id) ON DELETE SET NULL;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".vendorrisks DROP CONSTRAINT vendorrisks_vendor_id_fkey, ADD CONSTRAINT vendorrisks_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES "${tenantHash}".vendors (id) ON DELETE SET NULL;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".policy_manager DROP CONSTRAINT policy_manager_author_id_fkey, ADD CONSTRAINT policy_manager_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users (id) ON DELETE SET NULL;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".model_risks DROP CONSTRAINT model_risks_model_id_fkey, ADD CONSTRAINT model_risks_model_id_fkey FOREIGN KEY (model_id) REFERENCES "${tenantHash}".model_inventories(id) ON DELETE SET NULL;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".file_manager DROP CONSTRAINT file_manager_uploaded_by_fkey, ADD CONSTRAINT file_manager_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".share_links DROP CONSTRAINT share_links_created_by_fkey, ADD CONSTRAINT share_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".notes DROP CONSTRAINT notes_author_id_fkey, ADD CONSTRAINT notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;`,
      ]

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await Promise.all(
          queries.map((query) =>
            queryInterface.sequelize.query(
              query(tenantHash),
              { transaction }
            )
          )
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        (tenantHash) => `ALTER TABLE "${tenantHash}".files DROP CONSTRAINT files_project_id_fkey, ADD CONSTRAINT files_project_id_fkey FOREIGN KEY (project_id) REFERENCES "${tenantHash}".projects (id) ON DELETE CASCADE;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".vendorrisks DROP CONSTRAINT vendorrisks_vendor_id_fkey, ADD CONSTRAINT vendorrisks_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES "${tenantHash}".vendors (id) ON DELETE CASCADE;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".policy_manager DROP CONSTRAINT policy_manager_author_id_fkey, ADD CONSTRAINT policy_manager_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users (id) ON DELETE CASCADE;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".model_risks DROP CONSTRAINT model_risks_model_id_fkey, ADD CONSTRAINT model_risks_model_id_fkey FOREIGN KEY (model_id) REFERENCES "${tenantHash}".model_inventories(id) ON DELETE CASCADE;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".file_manager DROP CONSTRAINT file_manager_uploaded_by_fkey, ADD CONSTRAINT file_manager_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE CASCADE;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".share_links DROP CONSTRAINT share_links_created_by_fkey, ADD CONSTRAINT share_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".notes DROP CONSTRAINT notes_author_id_fkey, ADD CONSTRAINT notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;`,
      ]

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await Promise.all(
          queries.map((query) =>
            queryInterface.sequelize.query(
              query(tenantHash),
              { transaction }
            )
          )
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
