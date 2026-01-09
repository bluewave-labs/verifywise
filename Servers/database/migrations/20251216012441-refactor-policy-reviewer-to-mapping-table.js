'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration: Refactor policy_manager assigned_reviewer_ids to mapping table
 *
 * This migration:
 * 1. Creates policy_manager__assigned_reviewer_ids mapping table
 * 2. Migrates existing data from INTEGER[] column to mapping table
 * 3. Removes the assigned_reviewer_ids column from policy_manager
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Get all organizations
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Step 1: Create policy_manager__assigned_reviewer_ids mapping table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".policy_manager__assigned_reviewer_ids (
            policy_manager_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            PRIMARY KEY (policy_manager_id, user_id),
            FOREIGN KEY (policy_manager_id)
              REFERENCES "${tenantHash}".policy_manager(id)
              ON DELETE CASCADE,
            FOREIGN KEY (user_id)
              REFERENCES public.users(id)
              ON DELETE CASCADE
          );
        `, { transaction });

        // Create indexes for better query performance
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_policy_reviewer_policy_id
          ON "${tenantHash}".policy_manager__assigned_reviewer_ids(policy_manager_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_policy_reviewer_user_id
          ON "${tenantHash}".policy_manager__assigned_reviewer_ids(user_id);
        `, { transaction });

        // Step 2: Migrate existing data from array column to mapping table
        const policies = await queryInterface.sequelize.query(
          `SELECT id, assigned_reviewer_ids
           FROM "${tenantHash}".policy_manager
           WHERE assigned_reviewer_ids IS NOT NULL
           AND array_length(assigned_reviewer_ids, 1) > 0;`,
          { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
        );

        // For each policy, insert reviewer mappings
        for (const policy of policies) {
          const reviewerIds = policy.assigned_reviewer_ids;

          if (reviewerIds && reviewerIds.length > 0) {
            for (const userId of reviewerIds) {
              await queryInterface.sequelize.query(
                `INSERT INTO "${tenantHash}".policy_manager__assigned_reviewer_ids
                 (policy_manager_id, user_id)
                 VALUES (:policyId, :userId)
                 ON CONFLICT (policy_manager_id, user_id) DO NOTHING;`,
                {
                  replacements: {
                    policyId: policy.id,
                    userId: userId,
                  },
                  transaction,
                }
              );
            }
          }
        }

        console.log(`Migrated ${policies.length} policies for tenant ${tenantHash}`);

        // Step 3: Remove the assigned_reviewer_ids column
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".policy_manager
           DROP COLUMN IF EXISTS assigned_reviewer_ids;`,
          { transaction }
        );

        console.log(`Removed assigned_reviewer_ids column for tenant ${tenantHash}`);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error in policy reviewer refactoring migration:', error);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Step 1: Add back the assigned_reviewer_ids column
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".policy_manager
           ADD COLUMN IF NOT EXISTS assigned_reviewer_ids INTEGER[];`,
          { transaction }
        );

        // Step 2: Restore data from mapping table back to array column
        const mappings = await queryInterface.sequelize.query(
          `SELECT policy_manager_id, array_agg(user_id) as reviewer_ids
           FROM "${tenantHash}".policy_manager__assigned_reviewer_ids
           GROUP BY policy_manager_id;`,
          { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
        );

        // Update each policy with reviewer array
        for (const mapping of mappings) {
          await queryInterface.sequelize.query(
            `UPDATE "${tenantHash}".policy_manager
             SET assigned_reviewer_ids = ARRAY[:reviewerIds]::INTEGER[]
             WHERE id = :policyId;`,
            {
              replacements: {
                policyId: mapping.policy_manager_id,
                reviewerIds: mapping.reviewer_ids,
              },
              transaction,
            }
          );
        }

        console.log(`Restored assigned_reviewer_ids column for tenant ${tenantHash}`);

        // Step 3: Drop the mapping table
        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${tenantHash}".policy_manager__assigned_reviewer_ids;`,
          { transaction }
        );

        console.log(`Dropped mapping table for tenant ${tenantHash}`);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
