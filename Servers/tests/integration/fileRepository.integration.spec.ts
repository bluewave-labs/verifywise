/**
 * Integration Tests for File Repository (Branch 2)
 *
 * These tests run against the real test database to verify:
 * - File uploads are actually stored in the database
 * - File metadata is correctly recorded
 * - Transaction support works for atomic file operations
 * - File access logging works correctly
 *
 * Prerequisites:
 * - verifywise_refactor_tests database must exist
 * - test_tenant schema with required tables must exist
 * - Run: npm run test:integration
 *
 * @module tests/integration/fileRepository.integration
 */

import {
  getTestDb,
  closeTestDb,
  cleanupTestData,
  createTestTransaction,
  createTestProject,
  getTableCount,
  TEST_TENANT,
} from "./testDb";
import { QueryTypes } from "sequelize";
import { ValidationException } from "../../domain.layer/exceptions/custom.exception";

// ============================================================================
// Simulated functions from Branch 2 (file.repository.ts)
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

function sanitizeFilename(name: string): string {
  let sanitized = name.replace(/\.\.\//g, "").replace(/\.\./g, "");
  sanitized = sanitized.replace(/[^a-zA-Z0-9-_.]/g, "_");
  sanitized = sanitized.replace(/^[._]+/, "");
  return sanitized || "unnamed";
}

describe("File Repository Integration Tests", () => {
  beforeAll(async () => {
    await getTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe("uploadProjectFile - Database Operations", () => {
    it("should insert a file record into the database", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);
      const projectId = await createTestProject("Test Project");

      const filename = sanitizeFilename("test-document.pdf");
      const content = Buffer.from("PDF content here");

      await db.query(
        `INSERT INTO ${schemaName}.files
         (filename, content, type, project_id, uploaded_by, uploaded_time, is_demo, source)
         VALUES (:filename, :content, :type, :project_id, :uploaded_by, NOW(), :is_demo, :source)`,
        {
          replacements: {
            filename,
            content,
            type: "application/pdf",
            project_id: projectId,
            uploaded_by: 1,
            is_demo: false,
            source: "File Manager",
          },
        }
      );

      const count = await getTableCount("files");
      expect(count).toBe(1);

      const records = await db.query(
        `SELECT * FROM ${schemaName}.files WHERE project_id = :project_id`,
        {
          replacements: { project_id: projectId },
          type: QueryTypes.SELECT,
        }
      );

      expect(records).toHaveLength(1);
      expect((records[0] as any).filename).toBe("test-document.pdf");
      expect((records[0] as any).source).toBe("File Manager");
    });

    it("should sanitize dangerous filenames", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);

      const dangerousNames = [
        { input: "../../../etc/passwd", expected: "etc_passwd" },
        { input: "file<script>.pdf", expected: "file_script_.pdf" },
        { input: "normal-file_v1.2.pdf", expected: "normal-file_v1.2.pdf" },
      ];

      for (const { input } of dangerousNames) {
        const filename = sanitizeFilename(input);

        await db.query(
          `INSERT INTO ${schemaName}.files
           (filename, content, type, uploaded_by, uploaded_time, is_demo, source)
           VALUES (:filename, :content, :type, :uploaded_by, NOW(), :is_demo, :source)`,
          {
            replacements: {
              filename,
              content: Buffer.from("test"),
              type: "application/pdf",
              uploaded_by: 1,
              is_demo: false,
              source: "File Manager",
            },
          }
        );
      }

      const records = await db.query(
        `SELECT filename FROM ${schemaName}.files ORDER BY id`,
        { type: QueryTypes.SELECT }
      );

      expect(records).toHaveLength(3);
      expect((records[0] as any).filename).toBe("etc_passwd");
      expect((records[1] as any).filename).toBe("file_script_.pdf");
      expect((records[2] as any).filename).toBe("normal-file_v1.2.pdf");
    });

    it("should handle null project_id for organization-level files", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);

      await db.query(
        `INSERT INTO ${schemaName}.files
         (filename, content, type, project_id, uploaded_by, uploaded_time, is_demo, source)
         VALUES (:filename, :content, :type, :project_id, :uploaded_by, NOW(), :is_demo, :source)`,
        {
          replacements: {
            filename: "org-level-file.pdf",
            content: Buffer.from("org content"),
            type: "application/pdf",
            project_id: null,
            uploaded_by: 1,
            is_demo: false,
            source: "File Manager",
          },
        }
      );

      const records = await db.query(
        `SELECT * FROM ${schemaName}.files WHERE project_id IS NULL`,
        { type: QueryTypes.SELECT }
      );

      expect(records).toHaveLength(1);
      expect((records[0] as any).filename).toBe("org-level-file.pdf");
    });
  });

  describe("uploadFileManagerFile - Database Operations", () => {
    it("should insert a file manager record", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);

      await db.query(
        `INSERT INTO ${schemaName}.file_manager
         (filename, size, mimetype, file_path, uploaded_by, upload_date, org_id, is_demo, model_id)
         VALUES (:filename, :size, :mimetype, :file_path, :uploaded_by, NOW(), :org_id, :is_demo, :model_id)`,
        {
          replacements: {
            filename: "managed-file.docx",
            size: 1024,
            mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            file_path: "/uploads/managed-file.docx",
            uploaded_by: 1,
            org_id: 1,
            is_demo: false,
            model_id: null,
          },
        }
      );

      const count = await getTableCount("file_manager");
      expect(count).toBe(1);

      const records = await db.query(
        `SELECT * FROM ${schemaName}.file_manager`,
        { type: QueryTypes.SELECT }
      );

      expect(records).toHaveLength(1);
      expect((records[0] as any).filename).toBe("managed-file.docx");
      expect((records[0] as any).size).toBe("1024"); // PostgreSQL returns bigint as string
    });

    it("should associate file with model when model_id is provided", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);

      await db.query(
        `INSERT INTO ${schemaName}.file_manager
         (filename, size, mimetype, file_path, uploaded_by, upload_date, org_id, is_demo, model_id)
         VALUES (:filename, :size, :mimetype, :file_path, :uploaded_by, NOW(), :org_id, :is_demo, :model_id)`,
        {
          replacements: {
            filename: "model-file.csv",
            size: 2048,
            mimetype: "text/csv",
            file_path: "/uploads/model-file.csv",
            uploaded_by: 1,
            org_id: 1,
            is_demo: false,
            model_id: 42,
          },
        }
      );

      const records = await db.query(
        `SELECT * FROM ${schemaName}.file_manager WHERE model_id = 42`,
        { type: QueryTypes.SELECT }
      );

      expect(records).toHaveLength(1);
      expect((records[0] as any).filename).toBe("model-file.csv");
    });
  });

  describe("deleteFileById - Database Operations", () => {
    it("should delete a file from the database", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);

      // First, insert a file
      const insertResult = await db.query(
        `INSERT INTO ${schemaName}.files
         (filename, content, type, uploaded_by, uploaded_time, is_demo, source)
         VALUES (:filename, :content, :type, :uploaded_by, NOW(), :is_demo, :source)
         RETURNING id`,
        {
          replacements: {
            filename: "to-delete.pdf",
            content: Buffer.from("delete me"),
            type: "application/pdf",
            uploaded_by: 1,
            is_demo: false,
            source: "File Manager",
          },
          type: QueryTypes.INSERT,
        }
      );

      const fileId = (insertResult[0] as any)[0].id;

      // Verify file exists
      let count = await getTableCount("files");
      expect(count).toBe(1);

      // Delete the file
      await db.query(
        `DELETE FROM ${schemaName}.files WHERE id = :id`,
        { replacements: { id: fileId } }
      );

      // Verify file is gone
      count = await getTableCount("files");
      expect(count).toBe(0);
    });

    it("should return false when deleting non-existent file", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);

      const result = await db.query(
        `DELETE FROM ${schemaName}.files WHERE id = :id RETURNING id`,
        {
          replacements: { id: 99999 },
          type: QueryTypes.DELETE,
        }
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("logFileAccess - Database Operations", () => {
    it("should log file download access", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);

      await db.query(
        `INSERT INTO ${schemaName}.file_access_logs
         (file_id, accessed_by, access_date, action, org_id)
         VALUES (:file_id, :accessed_by, NOW(), :action, :org_id)`,
        {
          replacements: {
            file_id: 1,
            accessed_by: 1,
            action: "download",
            org_id: 1,
          },
        }
      );

      const count = await getTableCount("file_access_logs");
      expect(count).toBe(1);

      const records = await db.query(
        `SELECT * FROM ${schemaName}.file_access_logs`,
        { type: QueryTypes.SELECT }
      );

      expect((records[0] as any).action).toBe("download");
    });

    it("should log file view access", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);

      await db.query(
        `INSERT INTO ${schemaName}.file_access_logs
         (file_id, accessed_by, access_date, action, org_id)
         VALUES (:file_id, :accessed_by, NOW(), :action, :org_id)`,
        {
          replacements: {
            file_id: 2,
            accessed_by: 1,
            action: "view",
            org_id: 1,
          },
        }
      );

      const records = await db.query(
        `SELECT * FROM ${schemaName}.file_access_logs WHERE action = 'view'`,
        { type: QueryTypes.SELECT }
      );

      expect(records).toHaveLength(1);
    });

    it("should log multiple accesses for same file", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);

      for (let i = 0; i < 5; i++) {
        await db.query(
          `INSERT INTO ${schemaName}.file_access_logs
           (file_id, accessed_by, access_date, action, org_id)
           VALUES (:file_id, :accessed_by, NOW(), :action, :org_id)`,
          {
            replacements: {
              file_id: 1,
              accessed_by: i + 1,
              action: i % 2 === 0 ? "download" : "view",
              org_id: 1,
            },
          }
        );
      }

      const records = await db.query(
        `SELECT * FROM ${schemaName}.file_access_logs WHERE file_id = 1`,
        { type: QueryTypes.SELECT }
      );

      expect(records).toHaveLength(5);
    });
  });

  describe("Transaction Support", () => {
    it("should commit file upload within transaction", async () => {
      const db = await getTestDb();
      const transaction = await createTestTransaction();
      const schemaName = escapePgIdentifier(TEST_TENANT);

      try {
        await db.query(
          `INSERT INTO ${schemaName}.files
           (filename, content, type, uploaded_by, uploaded_time, is_demo, source)
           VALUES (:filename, :content, :type, :uploaded_by, NOW(), :is_demo, :source)`,
          {
            replacements: {
              filename: "transaction-file.pdf",
              content: Buffer.from("transaction content"),
              type: "application/pdf",
              uploaded_by: 1,
              is_demo: false,
              source: "File Manager",
            },
            transaction,
          }
        );

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }

      const count = await getTableCount("files");
      expect(count).toBe(1);
    });

    it("should rollback file upload on transaction failure", async () => {
      const db = await getTestDb();
      const transaction = await createTestTransaction();
      const schemaName = escapePgIdentifier(TEST_TENANT);

      try {
        await db.query(
          `INSERT INTO ${schemaName}.files
           (filename, content, type, uploaded_by, uploaded_time, is_demo, source)
           VALUES (:filename, :content, :type, :uploaded_by, NOW(), :is_demo, :source)`,
          {
            replacements: {
              filename: "rollback-file.pdf",
              content: Buffer.from("will be rolled back"),
              type: "application/pdf",
              uploaded_by: 1,
              is_demo: false,
              source: "File Manager",
            },
            transaction,
          }
        );

        // Simulate error
        await transaction.rollback();
      } catch (error) {
        await transaction.rollback();
      }

      const count = await getTableCount("files");
      expect(count).toBe(0);
    });

    it("should maintain atomicity for file upload with access log", async () => {
      const db = await getTestDb();
      const transaction = await createTestTransaction();
      const schemaName = escapePgIdentifier(TEST_TENANT);

      try {
        // Insert file
        const insertResult = await db.query(
          `INSERT INTO ${schemaName}.files
           (filename, content, type, uploaded_by, uploaded_time, is_demo, source)
           VALUES (:filename, :content, :type, :uploaded_by, NOW(), :is_demo, :source)
           RETURNING id`,
          {
            replacements: {
              filename: "atomic-file.pdf",
              content: Buffer.from("atomic content"),
              type: "application/pdf",
              uploaded_by: 1,
              is_demo: false,
              source: "File Manager",
            },
            transaction,
            type: QueryTypes.INSERT,
          }
        );

        const fileId = (insertResult[0] as any)[0].id;

        // Log access
        await db.query(
          `INSERT INTO ${schemaName}.file_access_logs
           (file_id, accessed_by, access_date, action, org_id)
           VALUES (:file_id, :accessed_by, NOW(), :action, :org_id)`,
          {
            replacements: {
              file_id: fileId,
              accessed_by: 1,
              action: "upload",
              org_id: 1,
            },
            transaction,
          }
        );

        // Rollback both
        await transaction.rollback();
      } catch (error) {
        await transaction.rollback();
      }

      // Both should be rolled back
      const fileCount = await getTableCount("files");
      const logCount = await getTableCount("file_access_logs");

      expect(fileCount).toBe(0);
      expect(logCount).toBe(0);
    });
  });

  describe("SQL Injection Prevention", () => {
    it("should reject SQL injection in tenant name", () => {
      expect(() => escapePgIdentifier("'; DROP TABLE files; --")).toThrow(
        ValidationException
      );
    });

    it("should safely store binary content", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);

      // Binary content that looks like SQL
      const maliciousContent = Buffer.from(
        "'; DROP TABLE files; -- \x00\x01\x02\x03"
      );

      await db.query(
        `INSERT INTO ${schemaName}.files
         (filename, content, type, uploaded_by, uploaded_time, is_demo, source)
         VALUES (:filename, :content, :type, :uploaded_by, NOW(), :is_demo, :source)`,
        {
          replacements: {
            filename: "binary-file.bin",
            content: maliciousContent,
            type: "application/octet-stream",
            uploaded_by: 1,
            is_demo: false,
            source: "File Manager",
          },
        }
      );

      const records = await db.query(
        `SELECT content FROM ${schemaName}.files WHERE filename = 'binary-file.bin'`,
        { type: QueryTypes.SELECT }
      );

      expect(records).toHaveLength(1);
      // Content should be stored as-is, not executed
      expect((records[0] as any).content).toEqual(maliciousContent);
    });
  });

  describe("getFileAccessHistory - Pagination", () => {
    beforeEach(async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);

      // Insert 30 access logs
      for (let i = 0; i < 30; i++) {
        await db.query(
          `INSERT INTO ${schemaName}.file_access_logs
           (file_id, accessed_by, access_date, action, org_id)
           VALUES (:file_id, :accessed_by, NOW(), :action, :org_id)`,
          {
            replacements: {
              file_id: 1,
              accessed_by: 1,
              action: i % 2 === 0 ? "download" : "view",
              org_id: 1,
            },
          }
        );
      }
    });

    it("should return paginated access history", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);

      // Get count
      const countResult = await db.query(
        `SELECT COUNT(*) as count FROM ${schemaName}.file_access_logs WHERE file_id = 1`,
        { type: QueryTypes.SELECT }
      );
      const total = parseInt((countResult[0] as any).count, 10);
      expect(total).toBe(30);

      // Get first page
      const page1 = await db.query(
        `SELECT * FROM ${schemaName}.file_access_logs
         WHERE file_id = 1
         ORDER BY access_date DESC
         LIMIT 10 OFFSET 0`,
        { type: QueryTypes.SELECT }
      );

      expect(page1).toHaveLength(10);

      // Verify hasMore calculation
      const hasMore = 0 + page1.length < total;
      expect(hasMore).toBe(true);
    });

    it("should handle null count result", async () => {
      const db = await getTestDb();
      const schemaName = escapePgIdentifier(TEST_TENANT);

      // Query for non-existent file
      const countResult = await db.query(
        `SELECT COUNT(*) as count FROM ${schemaName}.file_access_logs WHERE file_id = 99999`,
        { type: QueryTypes.SELECT }
      );

      const countRow = countResult[0] as { count: string } | undefined;
      const total = countRow ? parseInt(countRow.count, 10) : 0;

      expect(total).toBe(0);
    });
  });
});
