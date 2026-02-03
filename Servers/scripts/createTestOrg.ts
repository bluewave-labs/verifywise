/**
 * Script to create a test organization with tenant schema for testing the onboarding modal
 * Run with: npx ts-node scripts/createTestOrg.ts
 */

import { sequelize } from "../database/db";
import { createNewTenant } from "./createNewTenant";
import bcrypt from "bcrypt";

async function createTestOrganization() {
  const transaction = await sequelize.transaction();

  try {
    // 1. Create organization with pending onboarding status
    const [orgResults] = await sequelize.query(
      `INSERT INTO organizations (name, logo, created_at, updated_at, onboarding_status, slug)
       VALUES ('Test Organization', '', NOW(), NOW(), 'pending', 'test-org-' || floor(random() * 10000)::text)
       RETURNING id, name, slug, onboarding_status`,
      { transaction }
    );

    const orgResult = (orgResults as any[])[0];
    const orgId = orgResult.id;
    console.log("Created organization:", orgResult);

    // 2. Create tenant schema
    console.log("Creating tenant schema for org:", orgId);
    await createNewTenant(orgId, transaction);
    console.log("Tenant schema created successfully");

    // 3. Create admin user (org creator)
    const passwordHash = await bcrypt.hash("Test123!", 10);
    const [adminResults] = await sequelize.query(
      `INSERT INTO users (name, surname, email, password_hash, role_id, organization_id, created_at, is_demo)
       VALUES ('Test', 'Admin', 'testadmin@test.com', :passwordHash, 1, :orgId, NOW(), false)
       RETURNING id, name, surname, email, role_id, organization_id`,
      { replacements: { passwordHash, orgId }, transaction }
    );
    console.log("Created admin user:", (adminResults as any[])[0]);

    // 4. Create editor user (not org creator - created later)
    const [editorResults] = await sequelize.query(
      `INSERT INTO users (name, surname, email, password_hash, role_id, organization_id, created_at, is_demo)
       VALUES ('Test', 'Editor', 'testeditor@test.com', :passwordHash, 3, :orgId, NOW() + interval '1 minute', false)
       RETURNING id, name, surname, email, role_id, organization_id`,
      { replacements: { passwordHash, orgId }, transaction }
    );
    console.log("Created editor user:", (editorResults as any[])[0]);

    await transaction.commit();
    console.log("\n✅ Test organization created successfully!");
    console.log("\nTest credentials:");
    console.log("  Admin: testadmin@test.com / Test123!");
    console.log("  Editor: testeditor@test.com / Test123!");

    process.exit(0);
  } catch (error: any) {
    await transaction.rollback();
    console.error("Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createTestOrganization();
