/**
 * Migration script: Add agent_primitives and agent_discovery_sync_log tables
 * to all existing tenant schemas.
 *
 * Run: npx ts-node Servers/scripts/addAgentDiscoveryTables.ts
 */
import { sequelize } from "../database/db";
import { getTenantHash } from "../tools/getTenantHash";
import { getAllOrganizationsQuery } from "../utils/organization.utils";

async function addAgentDiscoveryTables() {
  console.log("Starting agent discovery table migration...");

  const organizations = await getAllOrganizationsQuery();
  console.log(`Found ${organizations.length} organization(s) to migrate.`);

  for (const org of organizations) {
    const tenantHash = getTenantHash(org.id!);
    console.log(`Migrating tenant ${tenantHash} (org ${org.id})...`);

    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "${tenantHash}".agent_primitives (
          id SERIAL PRIMARY KEY,
          source_system VARCHAR(100) NOT NULL,
          primitive_type VARCHAR(50) NOT NULL,
          external_id VARCHAR(255) NOT NULL,
          display_name VARCHAR(255) NOT NULL,
          owner_id VARCHAR(255),
          permissions JSONB NOT NULL DEFAULT '[]',
          permission_categories JSONB NOT NULL DEFAULT '[]',
          last_activity TIMESTAMP,
          metadata JSONB NOT NULL DEFAULT '{}',
          review_status VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
          reviewed_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMP,
          linked_model_inventory_id INTEGER,
          is_stale BOOLEAN NOT NULL DEFAULT false,
          is_manual BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          CONSTRAINT agent_primitives_source_external_unique UNIQUE (source_system, external_id)
        );
      `);

      await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_agent_primitives_source ON "${tenantHash}".agent_primitives(source_system);`);
      await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_agent_primitives_status ON "${tenantHash}".agent_primitives(review_status);`);
      await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_agent_primitives_type ON "${tenantHash}".agent_primitives(primitive_type);`);
      await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_agent_primitives_stale ON "${tenantHash}".agent_primitives(is_stale);`);
      await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_agent_primitives_created ON "${tenantHash}".agent_primitives(created_at DESC);`);

      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "${tenantHash}".agent_discovery_sync_log (
          id SERIAL PRIMARY KEY,
          source_system VARCHAR(100) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'running',
          primitives_found INTEGER NOT NULL DEFAULT 0,
          primitives_created INTEGER NOT NULL DEFAULT 0,
          primitives_updated INTEGER NOT NULL DEFAULT 0,
          primitives_stale_flagged INTEGER NOT NULL DEFAULT 0,
          error_message TEXT,
          started_at TIMESTAMP NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMP,
          triggered_by VARCHAR(20) NOT NULL DEFAULT 'scheduled'
        );
      `);

      console.log(`  ✅ Tenant ${tenantHash} migrated successfully.`);
    } catch (error) {
      console.error(`  ❌ Failed to migrate tenant ${tenantHash}:`, error);
    }
  }

  console.log("Agent discovery table migration complete.");
}

if (require.main === module) {
  addAgentDiscoveryTables()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { addAgentDiscoveryTables };
