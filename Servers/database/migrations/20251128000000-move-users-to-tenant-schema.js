'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔄 Starting user migration to tenant schemas...');
      
      // Get all organizations
      const organizations = await queryInterface.sequelize.query(`
        SELECT id FROM organizations ORDER BY id;
      `, { transaction, type: Sequelize.QueryTypes.SELECT });

      console.log(`📊 Found ${organizations.length} organizations to process`);

      for (const org of organizations) {
        const tenantHash = getTenantHash(org.id);
        console.log(`🏢 Processing organization ${org.id} -> tenant ${tenantHash}`);

        // Create users table in tenant schema
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            surname VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role_id INTEGER NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP WITH TIME ZONE,
            is_demo BOOLEAN DEFAULT FALSE,
            profile_photo_id INTEGER REFERENCES "${tenantHash}".files(id) ON DELETE SET NULL
          );
        `, { transaction });

        console.log(`✅ Created users table in tenant ${tenantHash}`);

        // Copy users belonging to this organization
        const usersToMove = await queryInterface.sequelize.query(`
          SELECT id, name, surname, email, password_hash, role_id, created_at, last_login, is_demo, profile_photo_id
          FROM public.users 
          WHERE organization_id = :orgId;
        `, { 
          transaction, 
          type: Sequelize.QueryTypes.SELECT,
          replacements: { orgId: org.id }
        });

        console.log(`👥 Moving ${usersToMove.length} users to tenant ${tenantHash}`);

        // Insert users into tenant schema
        for (const user of usersToMove) {
          await queryInterface.sequelize.query(`
            INSERT INTO "${tenantHash}".users (
              id, name, surname, email, password_hash, role_id, created_at, last_login, is_demo, profile_photo_id
            ) VALUES (
              :id, :name, :surname, :email, :password_hash, :role_id, :created_at, :last_login, :is_demo, :profile_photo_id
            );
          `, {
            transaction,
            replacements: {
              id: user.id,
              name: user.name,
              surname: user.surname,
              email: user.email,
              password_hash: user.password_hash,
              role_id: user.role_id,
              created_at: user.created_at,
              last_login: user.last_login,
              is_demo: user.is_demo,
              profile_photo_id: user.profile_photo_id
            }
          });
        }

        // Reset sequence to maintain ID continuity
        if (usersToMove.length > 0) {
          const maxId = Math.max(...usersToMove.map(u => u.id));
          await queryInterface.sequelize.query(`
            SELECT setval('"${tenantHash}".users_id_seq', :maxId);
          `, { 
            transaction,
            replacements: { maxId }
          });
        }

        // Update foreign key references in tenant tables to point to tenant users
        const tablesToUpdate = [
          'projects_members',
          'task_assignees' // If it exists
        ];

        for (const tableName of tablesToUpdate) {
          // Check if table exists in tenant schema
          const tableExists = await queryInterface.sequelize.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = '${tenantHash}' 
              AND table_name = '${tableName}'
            );
          `, { transaction, type: Sequelize.QueryTypes.SELECT });

          if (tableExists[0].exists) {
            console.log(`🔗 Updating ${tableName} foreign keys in tenant ${tenantHash}`);
            
            // Drop old foreign key constraint if exists
            await queryInterface.sequelize.query(`
              ALTER TABLE "${tenantHash}".${tableName} 
              DROP CONSTRAINT IF EXISTS ${tableName}_user_id_fkey;
            `, { transaction });

            // Add new foreign key constraint pointing to tenant users
            await queryInterface.sequelize.query(`
              ALTER TABLE "${tenantHash}".${tableName}
              ADD CONSTRAINT ${tableName}_user_id_fkey 
              FOREIGN KEY (user_id) REFERENCES "${tenantHash}".users(id) ON DELETE CASCADE;
            `, { transaction });
          }
        }

        console.log(`✅ Completed migration for organization ${org.id}`);
      }

      // Drop organization_id column from public.users since it's no longer needed
      console.log('🗑️ Dropping organization_id column from public.users');
      await queryInterface.sequelize.query(`
        ALTER TABLE public.users DROP COLUMN IF EXISTS organization_id;
      `, { transaction });

      // Clean up public.users table (remove all users as they're now in tenant schemas)
      console.log('🧹 Cleaning up public.users table');
      await queryInterface.sequelize.query(`
        DELETE FROM public.users;
      `, { transaction });

      await transaction.commit();
      console.log('✅ User migration to tenant schemas completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error during user migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔄 Rolling back user migration from tenant schemas...');
      
      // Get all organizations
      const organizations = await queryInterface.sequelize.query(`
        SELECT id FROM organizations ORDER BY id;
      `, { transaction, type: Sequelize.QueryTypes.SELECT });

      // Add organization_id column back to public.users
      await queryInterface.sequelize.query(`
        ALTER TABLE public.users 
        ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
      `, { transaction });

      for (const org of organizations) {
        const tenantHash = getTenantHash(org.id);
        console.log(`🏢 Rolling back organization ${org.id} -> tenant ${tenantHash}`);

        // Check if users table exists in tenant schema
        const tableExists = await queryInterface.sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = '${tenantHash}' 
            AND table_name = 'users'
          );
        `, { transaction, type: Sequelize.QueryTypes.SELECT });

        if (tableExists[0].exists) {
          // Move users back to public schema
          const tenantUsers = await queryInterface.sequelize.query(`
            SELECT id, name, surname, email, password_hash, role_id, created_at, last_login, is_demo, profile_photo_id
            FROM "${tenantHash}".users;
          `, { transaction, type: Sequelize.QueryTypes.SELECT });

          for (const user of tenantUsers) {
            await queryInterface.sequelize.query(`
              INSERT INTO public.users (
                id, name, surname, email, password_hash, role_id, created_at, last_login, is_demo, profile_photo_id, organization_id
              ) VALUES (
                :id, :name, :surname, :email, :password_hash, :role_id, :created_at, :last_login, :is_demo, :profile_photo_id, :organization_id
              ) ON CONFLICT (id) DO NOTHING;
            `, {
              transaction,
              replacements: {
                ...user,
                organization_id: org.id
              }
            });
          }

          // Drop users table from tenant schema
          await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS "${tenantHash}".users CASCADE;
          `, { transaction });
        }
      }

      await transaction.commit();
      console.log('✅ Rollback completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error during rollback:', error);
      throw error;
    }
  }
};