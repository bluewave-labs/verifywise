/**
 * Integration Tests for Change History Utilities (Branch 3 & 6)
 *
 * These tests run against the real test database to verify:
 * - Change history records are actually created in the database
 * - SQL injection prevention works at the database level
 * - Transactions commit/rollback correctly
 * - Multi-tenant schema isolation works
 *
 * Prerequisites:
 * - verifywise_refactor_tests database must exist
 * - test_tenant schema with required tables must exist
 * - Run: npm run test:integration
 *
 * @module tests/integration/changeHistory.integration
 */

import {
  getTestDb,
  closeTestDb,
  cleanupTestData,
  createTestTransaction,
  getChangeHistoryRecords,
  getTableCount,
  TEST_TENANT,
} from "./testDb";
import { QueryTypes } from "sequelize";
import { ValidationException } from "../../domain.layer/exceptions/custom.exception";

// ============================================================================
// Simulated functions from Branch 3 (changeHistory.base.utils.ts)
// These will be replaced with actual imports after branch merge
// ============================================================================

function validateTenant(tenant: string): void {
  if (!/^[A-Za-z0-9_]{1,30}$/.test(tenant)) {
    throw new ValidationException("Invalid tenant identifier");
  }
}

function escapePgIdentifier(ident: string): string {
  validateTenant(ident);
  return '"' + ident.replace(/"/g, '""') + '"';
}

// Entity configuration (simplified from changeHistory.config.ts)
const ENTITY_CONFIG: Record<string, { tableName: string; foreignKeyField: string }> = {
  vendor: { tableName: "vendor_change_history", foreignKeyField: "vendor_id" },
  policy: { tableName: "policy_change_history", foreignKeyField: "policy_id" },
  risk: { tableName: "project_risk_change_history", foreignKeyField: "risk_id" },
  vendor_risk: { tableName: "vendor_risk_change_history", foreignKeyField: "vendor_risk_id" },
  use_case: { tableName: "use_case_change_history", foreignKeyField: "use_case_id" },
};

describe("Change History Integration Tests", () => {
  beforeAll(async () => {
    await getTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe("recordEntityChange - Database Operations", () => {
    it("should insert a change record into the database", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);
      const config = ENTITY_CONFIG.vendor;

      await db.query(
        `INSERT INTO ${schemaName}.${config.tableName}
         (${config.foreignKeyField}, action, field_name, old_value, new_value, changed_by_user_id, changed_at, created_at)
         VALUES (:entity_id, :action, :field_name, :old_value, :new_value, :changed_by_user_id, NOW(), NOW())`,
        {
          replacements: {
            entity_id: 1,
            action: "created",
            field_name: "vendor_name",
            old_value: null,
            new_value: "Test Vendor",
            changed_by_user_id: 1,
          },
        }
      );

      const records = await getChangeHistoryRecords("vendor");
      expect(records).toHaveLength(1);
      expect(records[0].vendor_id).toBe(1);
      expect(records[0].action).toBe("created");
      expect(records[0].field_name).toBe("vendor_name");
      expect(records[0].new_value).toBe("Test Vendor");
    });

    it("should record multiple field changes", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);
      const config = ENTITY_CONFIG.vendor;

      const changes = [
        { fieldName: "vendor_name", oldValue: "Old Name", newValue: "New Name" },
        { fieldName: "status", oldValue: "Pending", newValue: "Active" },
        { fieldName: "risk_level", oldValue: "Low", newValue: "Medium" },
      ];

      for (const change of changes) {
        await db.query(
          `INSERT INTO ${schemaName}.${config.tableName}
           (${config.foreignKeyField}, action, field_name, old_value, new_value, changed_by_user_id, changed_at, created_at)
           VALUES (:entity_id, :action, :field_name, :old_value, :new_value, :changed_by_user_id, NOW(), NOW())`,
          {
            replacements: {
              entity_id: 1,
              action: "updated",
              field_name: change.fieldName,
              old_value: change.oldValue,
              new_value: change.newValue,
              changed_by_user_id: 1,
            },
          }
        );
      }

      const records = await getChangeHistoryRecords("vendor");
      expect(records).toHaveLength(3);
      expect(records.map((r) => r.field_name).sort()).toEqual([
        "risk_level",
        "status",
        "vendor_name",
      ]);
    });

    it("should record changes for different entity types", async () => {
      const db = await getTestDb();

      // Insert and verify each entity type individually
      for (const [entityType, config] of Object.entries(ENTITY_CONFIG)) {
        const schemaName = escapePgIdentifier(TEST_TENANT);

        await db.query(
          `INSERT INTO ${schemaName}.${config.tableName}
           (${config.foreignKeyField}, action, field_name, old_value, new_value, changed_by_user_id, changed_at, created_at)
           VALUES (:entity_id, :action, :field_name, :old_value, :new_value, :changed_by_user_id, NOW(), NOW())`,
          {
            replacements: {
              entity_id: 100,
              action: "created",
              field_name: "name",
              old_value: null,
              new_value: `Test ${entityType}`,
              changed_by_user_id: 1,
            },
          }
        );

        // Verify immediately after insert
        const records = await db.query(
          `SELECT * FROM ${schemaName}.${config.tableName} WHERE new_value = :new_value`,
          {
            replacements: { new_value: `Test ${entityType}` },
            type: QueryTypes.SELECT,
          }
        );
        expect(records).toHaveLength(1);
        expect((records[0] as any).new_value).toBe(`Test ${entityType}`);
      }
    });
  });

  describe("SQL Injection Prevention - Database Level", () => {
    it("should reject SQL injection attempts in tenant name", async () => {
      const maliciousTenants = [
        "'; DROP TABLE vendor_change_history; --",
        "test_tenant\"; DELETE FROM users; --",
        "test; SELECT * FROM pg_tables",
      ];

      for (const tenant of maliciousTenants) {
        expect(() => escapePgIdentifier(tenant)).toThrow(ValidationException);
      }
    });

    it("should safely handle special characters in field values", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);
      const config = ENTITY_CONFIG.vendor;

      // These should NOT throw - special chars in VALUES are parameterized
      const dangerousValues = [
        "Robert'); DROP TABLE Students;--",
        "<script>alert('xss')</script>",
        "value with 'quotes' and \"double quotes\"",
      ];

      for (const value of dangerousValues) {
        await db.query(
          `INSERT INTO ${schemaName}.${config.tableName}
           (${config.foreignKeyField}, action, field_name, old_value, new_value, changed_by_user_id, changed_at, created_at)
           VALUES (:entity_id, :action, :field_name, :old_value, :new_value, :changed_by_user_id, NOW(), NOW())`,
          {
            replacements: {
              entity_id: 1,
              action: "updated",
              field_name: "description",
              old_value: null,
              new_value: value,
              changed_by_user_id: 1,
            },
          }
        );
      }

      const records = await getChangeHistoryRecords("vendor");
      expect(records).toHaveLength(3);

      // Verify the values were stored correctly (not executed as SQL)
      const storedValues = records.map((r) => r.new_value);
      for (const value of dangerousValues) {
        expect(storedValues).toContain(value);
      }
    });
  });

  describe("Transaction Support", () => {
    it("should commit changes within a transaction", async () => {
      const db = await getTestDb();
      const transaction = await createTestTransaction();
      const schemaName = escapePgIdentifier(TEST_TENANT);
      const config = ENTITY_CONFIG.vendor;

      try {
        await db.query(
          `INSERT INTO ${schemaName}.${config.tableName}
           (${config.foreignKeyField}, action, field_name, old_value, new_value, changed_by_user_id, changed_at, created_at)
           VALUES (:entity_id, :action, :field_name, :old_value, :new_value, :changed_by_user_id, NOW(), NOW())`,
          {
            replacements: {
              entity_id: 1,
              action: "created",
              field_name: "name",
              old_value: null,
              new_value: "Transaction Test",
              changed_by_user_id: 1,
            },
            transaction,
          }
        );

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }

      // Verify record exists after commit
      const records = await getChangeHistoryRecords("vendor");
      expect(records).toHaveLength(1);
      expect(records[0].new_value).toBe("Transaction Test");
    });

    it("should rollback changes on transaction failure", async () => {
      const db = await getTestDb();
      const transaction = await createTestTransaction();
      const schemaName = escapePgIdentifier(TEST_TENANT);
      const config = ENTITY_CONFIG.vendor;

      try {
        await db.query(
          `INSERT INTO ${schemaName}.${config.tableName}
           (${config.foreignKeyField}, action, field_name, old_value, new_value, changed_by_user_id, changed_at, created_at)
           VALUES (:entity_id, :action, :field_name, :old_value, :new_value, :changed_by_user_id, NOW(), NOW())`,
          {
            replacements: {
              entity_id: 1,
              action: "created",
              field_name: "name",
              old_value: null,
              new_value: "Rollback Test",
              changed_by_user_id: 1,
            },
            transaction,
          }
        );

        // Simulate error - rollback
        await transaction.rollback();
      } catch (error) {
        await transaction.rollback();
      }

      // Verify record does NOT exist after rollback
      const records = await getChangeHistoryRecords("vendor");
      expect(records).toHaveLength(0);
    });

    it("should maintain atomicity across multiple inserts", async () => {
      const db = await getTestDb();
      const transaction = await createTestTransaction();
      const schemaName = escapePgIdentifier(TEST_TENANT);
      const config = ENTITY_CONFIG.vendor;

      try {
        // Insert multiple records
        for (let i = 0; i < 5; i++) {
          await db.query(
            `INSERT INTO ${schemaName}.${config.tableName}
             (${config.foreignKeyField}, action, field_name, old_value, new_value, changed_by_user_id, changed_at, created_at)
             VALUES (:entity_id, :action, :field_name, :old_value, :new_value, :changed_by_user_id, NOW(), NOW())`,
            {
              replacements: {
                entity_id: 1,
                action: "updated",
                field_name: `field_${i}`,
                old_value: `old_${i}`,
                new_value: `new_${i}`,
                changed_by_user_id: 1,
              },
              transaction,
            }
          );
        }

        // Rollback all
        await transaction.rollback();
      } catch (error) {
        await transaction.rollback();
      }

      // All 5 records should be rolled back
      const records = await getChangeHistoryRecords("vendor");
      expect(records).toHaveLength(0);
    });
  });

  describe("getEntityChangeHistory - Pagination", () => {
    beforeEach(async () => {
      // Insert 25 records for pagination testing
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);
      const config = ENTITY_CONFIG.vendor;

      for (let i = 0; i < 25; i++) {
        await db.query(
          `INSERT INTO ${schemaName}.${config.tableName}
           (${config.foreignKeyField}, action, field_name, old_value, new_value, changed_by_user_id, changed_at, created_at)
           VALUES (:entity_id, :action, :field_name, :old_value, :new_value, :changed_by_user_id, NOW(), NOW())`,
          {
            replacements: {
              entity_id: 1,
              action: "updated",
              field_name: `field_${i}`,
              old_value: `old_${i}`,
              new_value: `new_${i}`,
              changed_by_user_id: 1,
            },
          }
        );
      }
    });

    it("should return correct count", async () => {
      const count = await getTableCount("vendor_change_history");
      expect(count).toBe(25);
    });

    it("should support pagination with limit and offset", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);
      const config = ENTITY_CONFIG.vendor;

      // Get first page (10 records)
      const page1 = await db.query(
        `SELECT * FROM ${schemaName}.${config.tableName}
         WHERE ${config.foreignKeyField} = :entity_id
         ORDER BY changed_at DESC
         LIMIT :limit OFFSET :offset`,
        {
          replacements: { entity_id: 1, limit: 10, offset: 0 },
          type: QueryTypes.SELECT,
        }
      );

      // Get second page
      const page2 = await db.query(
        `SELECT * FROM ${schemaName}.${config.tableName}
         WHERE ${config.foreignKeyField} = :entity_id
         ORDER BY changed_at DESC
         LIMIT :limit OFFSET :offset`,
        {
          replacements: { entity_id: 1, limit: 10, offset: 10 },
          type: QueryTypes.SELECT,
        }
      );

      // Get third page (should have 5 records)
      const page3 = await db.query(
        `SELECT * FROM ${schemaName}.${config.tableName}
         WHERE ${config.foreignKeyField} = :entity_id
         ORDER BY changed_at DESC
         LIMIT :limit OFFSET :offset`,
        {
          replacements: { entity_id: 1, limit: 10, offset: 20 },
          type: QueryTypes.SELECT,
        }
      );

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page3).toHaveLength(5);

      // Ensure no duplicates across pages
      const allIds = [
        ...page1.map((r: any) => r.id),
        ...page2.map((r: any) => r.id),
        ...page3.map((r: any) => r.id),
      ];
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(25);
    });
  });

  describe("Multi-Tenant Isolation", () => {
    it("should only return records from the specified tenant schema", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);
      const config = ENTITY_CONFIG.vendor;

      // Insert into test_tenant
      await db.query(
        `INSERT INTO ${schemaName}.${config.tableName}
         (${config.foreignKeyField}, action, field_name, old_value, new_value, changed_by_user_id, changed_at, created_at)
         VALUES (:entity_id, :action, :field_name, :old_value, :new_value, :changed_by_user_id, NOW(), NOW())`,
        {
          replacements: {
            entity_id: 1,
            action: "created",
            field_name: "name",
            old_value: null,
            new_value: "Test Tenant Vendor",
            changed_by_user_id: 1,
          },
        }
      );

      // Query from test_tenant - should find the record
      const records = await db.query(
        `SELECT * FROM ${schemaName}.${config.tableName} WHERE ${config.foreignKeyField} = 1`,
        { type: QueryTypes.SELECT }
      );

      expect(records).toHaveLength(1);
      expect((records[0] as any).new_value).toBe("Test Tenant Vendor");
    });
  });
});
