/**
 * Test Database Connection and Utilities
 *
 * Provides database connection for integration tests using the
 * verifywise_refactor_tests database with test_tenant schema.
 *
 * @module tests/integration/testDb
 */

import { Sequelize, QueryTypes, Transaction } from "sequelize";

// Test database configuration
const TEST_DB_CONFIG = {
  database: "verifywise_refactor_tests",
  username: process.env.DB_USER || "gorkemcetin",
  password: process.env.DB_PASSWORD || "",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  dialect: "postgres" as const,
  logging: false,
};

// Test tenant name (must match regex ^[A-Za-z0-9_]{1,30}$)
export const TEST_TENANT = "test_tenant";

// Singleton connection
let testSequelize: Sequelize | null = null;

/**
 * Gets or creates a connection to the test database
 */
export async function getTestDb(): Promise<Sequelize> {
  if (!testSequelize) {
    testSequelize = new Sequelize(
      TEST_DB_CONFIG.database,
      TEST_DB_CONFIG.username,
      TEST_DB_CONFIG.password,
      {
        host: TEST_DB_CONFIG.host,
        port: TEST_DB_CONFIG.port,
        dialect: TEST_DB_CONFIG.dialect,
        logging: TEST_DB_CONFIG.logging,
      }
    );

    // Test connection
    await testSequelize.authenticate();
  }
  return testSequelize;
}

/**
 * Closes the test database connection
 */
export async function closeTestDb(): Promise<void> {
  if (testSequelize) {
    await testSequelize.close();
    testSequelize = null;
  }
}

/**
 * Cleans up test data from all tables in test_tenant schema
 */
export async function cleanupTestData(): Promise<void> {
  const db = await getTestDb();

  const tables = [
    "vendor_change_history",
    "policy_change_history",
    "project_risk_change_history",
    "vendor_risk_change_history",
    "use_case_change_history",
    "file_access_logs",
    "files",
    "file_manager",
    "projects",
  ];

  for (const table of tables) {
    await db.query(`TRUNCATE TABLE ${TEST_TENANT}.${table} RESTART IDENTITY CASCADE`, {
      type: QueryTypes.RAW,
    });
  }
}

/**
 * Creates a database transaction for testing
 */
export async function createTestTransaction(): Promise<Transaction> {
  const db = await getTestDb();
  return db.transaction();
}

/**
 * Inserts a test project and returns its ID
 */
export async function createTestProject(
  name: string = "Test Project",
  isDemo: boolean = false
): Promise<number> {
  const db = await getTestDb();
  const result = await db.query(
    `INSERT INTO ${TEST_TENANT}.projects (name, is_demo) VALUES (:name, :is_demo) RETURNING id`,
    {
      replacements: { name, is_demo: isDemo },
      type: QueryTypes.INSERT,
    }
  );
  return (result[0] as any)[0].id;
}

/**
 * Gets all records from a change history table
 */
export async function getChangeHistoryRecords(
  entityType: "vendor" | "policy" | "risk" | "vendor_risk" | "use_case"
): Promise<any[]> {
  const db = await getTestDb();
  const tableMap: Record<string, string> = {
    vendor: "vendor_change_history",
    policy: "policy_change_history",
    risk: "project_risk_change_history",
    vendor_risk: "vendor_risk_change_history",
    use_case: "use_case_change_history",
  };

  const result = await db.query(
    `SELECT * FROM ${TEST_TENANT}.${tableMap[entityType]} ORDER BY id DESC`,
    { type: QueryTypes.SELECT }
  );
  return result;
}

/**
 * Gets count of records in a table
 */
export async function getTableCount(tableName: string): Promise<number> {
  const db = await getTestDb();
  const result = await db.query(
    `SELECT COUNT(*) as count FROM ${TEST_TENANT}.${tableName}`,
    { type: QueryTypes.SELECT }
  );
  return parseInt((result[0] as any).count, 10);
}
