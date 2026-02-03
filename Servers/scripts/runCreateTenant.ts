import { sequelize } from "../database/db";
import { createNewTenant } from "./createNewTenant";

const orgId = parseInt(process.argv[2] || "6");

async function run() {
  console.log(`Creating tenant for organization ID: ${orgId}`);
  const transaction = await sequelize.transaction();
  try {
    await createNewTenant(orgId, transaction);
    await transaction.commit();
    console.log("✅ Tenant created successfully!");
    process.exit(0);
  } catch (error: any) {
    await transaction.rollback();
    console.error("Error:", error.message);
    process.exit(1);
  }
}

run();
