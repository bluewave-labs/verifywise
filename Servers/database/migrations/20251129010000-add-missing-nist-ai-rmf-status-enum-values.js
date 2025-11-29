'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration to add missing enum values to enum_nist_ai_rmf_subcategories_status for all tenants
 * 
 * This migration adds the missing status values ('Draft', 'Awaiting review', 'Awaiting approval')
 * to the enum type for all existing tenants. These values are required by the application but
 * were missing from the original enum definition.
 * 
 * Note: PostgreSQL doesn't support ALTER TYPE ... ADD VALUE inside a transaction block,
 * so we need to commit each ALTER TYPE statement separately.
 * 
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔧 Adding missing enum values to enum_nist_ai_rmf_subcategories_status for all tenants...');

      // Get all organizations
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`
      );

      if (organizations[0].length === 0) {
        console.log('⚠️  No organizations found. Skipping enum update.');
        return;
      }

      const missingValues = ['Draft', 'Awaiting review', 'Awaiting approval'];
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      for (const org of organizations[0]) {
        try {
          const tenantHash = getTenantHash(org.id);

          // Check if the enum type exists in tenant schema or public schema
          // Old migrations created it in public, new code creates it in tenant schema
          const enumInTenant = await queryInterface.sequelize.query(
            `SELECT 1 FROM pg_type t
             JOIN pg_namespace n ON t.typnamespace = n.oid
             WHERE n.nspname = '${tenantHash}'
             AND t.typname = 'enum_nist_ai_rmf_subcategories_status';`
          );

          const enumInPublic = await queryInterface.sequelize.query(
            `SELECT 1 FROM pg_type t
             JOIN pg_namespace n ON t.typnamespace = n.oid
             WHERE n.nspname = 'public'
             AND t.typname = 'enum_nist_ai_rmf_subcategories_status';`
          );

          let enumSchema = null;
          if (enumInTenant[0] && enumInTenant[0].length > 0) {
            enumSchema = tenantHash;
          } else if (enumInPublic[0] && enumInPublic[0].length > 0) {
            enumSchema = 'public';
          } else {
            console.log(`⚠️  Skipping ${tenantHash}: enum type does not exist in tenant or public schema`);
            skippedCount++;
            continue;
          }

          // Check which values already exist
          const existingValues = await queryInterface.sequelize.query(
            `SELECT e.enumlabel 
             FROM pg_enum e
             JOIN pg_type t ON e.enumtypid = t.oid
             JOIN pg_namespace n ON t.typnamespace = n.oid
             WHERE n.nspname = '${enumSchema}'
             AND t.typname = 'enum_nist_ai_rmf_subcategories_status'
             ORDER BY e.enumsortorder;`
          );

          const existingLabels = existingValues[0].map(row => row.enumlabel);

          // Add missing values one by one (cannot be in transaction)
          for (const value of missingValues) {
            if (!existingLabels.includes(value)) {
              try {
                // Note: ALTER TYPE ... ADD VALUE cannot be in a transaction
                const enumTypeName = enumSchema === 'public' 
                  ? 'enum_nist_ai_rmf_subcategories_status'
                  : `"${enumSchema}".enum_nist_ai_rmf_subcategories_status`;
                
                await queryInterface.sequelize.query(
                  `ALTER TYPE ${enumTypeName} ADD VALUE IF NOT EXISTS '${value.replace(/'/g, "''")}';`
                );
                console.log(`  ✓ Added '${value}' to ${enumSchema}.enum_nist_ai_rmf_subcategories_status`);
              } catch (addValueError) {
                // IF NOT EXISTS might not be supported in all PostgreSQL versions
                // Try without it if the first attempt fails
                if (addValueError.message.includes('already exists') || addValueError.message.includes('IF NOT EXISTS')) {
                  console.log(`  ℹ️  '${value}' already exists in ${enumSchema}.enum_nist_ai_rmf_subcategories_status`);
                } else {
                  // Try without IF NOT EXISTS for older PostgreSQL versions
                  try {
                    const enumTypeName = enumSchema === 'public' 
                      ? 'enum_nist_ai_rmf_subcategories_status'
                      : `"${enumSchema}".enum_nist_ai_rmf_subcategories_status`;
                    
                    await queryInterface.sequelize.query(
                      `ALTER TYPE ${enumTypeName} ADD VALUE '${value.replace(/'/g, "''")}';`
                    );
                    console.log(`  ✓ Added '${value}' to ${enumSchema}.enum_nist_ai_rmf_subcategories_status`);
                  } catch (retryError) {
                    if (retryError.message.includes('already exists')) {
                      console.log(`  ℹ️  '${value}' already exists in ${enumSchema}.enum_nist_ai_rmf_subcategories_status`);
                    } else {
                      throw retryError;
                    }
                  }
                }
              }
            } else {
              console.log(`  ℹ️  '${value}' already exists in ${tenantHash}.enum_nist_ai_rmf_subcategories_status`);
            }
          }

          successCount++;

        } catch (tenantError) {
          errorCount++;
          console.error(`❌ Failed to update enum for tenant (org_id: ${org.id}):`, tenantError.message);
          // Continue with other tenants instead of failing entire migration
        }
      }

      console.log(`✅ Migration completed. Success: ${successCount}, Errors: ${errorCount}, Skipped: ${skippedCount}`);

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This would require recreating the enum type and updating all dependent columns
    // For safety, we skip the down migration
    console.log('ℹ️  Down migration skipped. Removing enum values requires recreating the enum type.');
  }
};

