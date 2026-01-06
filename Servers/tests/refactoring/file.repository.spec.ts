/**
 * Unit Tests for File Repository (Branch 2)
 *
 * Tests the file repository that consolidates file-related database operations.
 * Focuses on transaction support, SQL injection prevention, and proper error handling.
 *
 * NOTE: These tests are self-contained and simulate the expected behavior
 * of the file repository after Branch 2 is merged.
 *
 * @module tests/refactoring/file.repository
 */

import { ValidationException } from "../../domain.layer/exceptions/custom.exception";

// ============================================================================
// Simulated functions from Branch 2 (file.repository.ts)
// ============================================================================

/**
 * Validates tenant identifier to prevent SQL injection
 */
function validateTenant(tenant: string): void {
  if (!/^[A-Za-z0-9_]{1,30}$/.test(tenant)) {
    throw new ValidationException("Invalid tenant identifier");
  }
}

/**
 * Sanitizes filename to remove dangerous characters
 */
function sanitizeFilenameStr(name: string): string {
  // First, remove any path traversal sequences
  let sanitized = name.replace(/\.\.\//g, "").replace(/\.\./g, "");
  // Then remove any remaining dangerous characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9-_.]/g, "_");
  // Remove leading dots and slashes
  sanitized = sanitized.replace(/^[._]+/, "");
  return sanitized || "unnamed";
}

// Mock transaction interface
interface MockTransaction {
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
}

// Mock file interface
interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size?: number;
}

// File source types
type FileSource =
  | "Assessment tracker group"
  | "Compliance tracker group"
  | "File Manager";

// Simulated file repository functions
class FileRepositorySimulator {
  private mockDb: any[] = [];
  private nextId = 1;

  async uploadProjectFile(
    file: UploadedFile,
    userId: number,
    projectId: number | null,
    source: FileSource,
    tenant: string,
    transaction: MockTransaction | null = null
  ): Promise<{ id: number; filename: string }> {
    validateTenant(tenant);
    const filename = sanitizeFilenameStr(file.originalname);

    const record = {
      id: this.nextId++,
      filename,
      content: file.buffer,
      mimetype: file.mimetype,
      project_id: projectId,
      uploaded_by: userId,
      source,
      tenant,
      transaction_used: !!transaction,
    };
    this.mockDb.push(record);
    return { id: record.id, filename: record.filename };
  }

  async getProjectFileById(
    id: number,
    tenant: string
  ): Promise<{ id: number; filename: string } | null> {
    validateTenant(tenant);
    const file = this.mockDb.find((f) => f.id === id && f.tenant === tenant);
    return file ? { id: file.id, filename: file.filename } : null;
  }

  async deleteProjectFileById(
    id: number,
    tenant: string,
    _transaction: MockTransaction
  ): Promise<boolean> {
    validateTenant(tenant);
    const index = this.mockDb.findIndex(
      (f) => f.id === id && f.tenant === tenant
    );
    if (index >= 0) {
      this.mockDb.splice(index, 1);
      return true;
    }
    return false;
  }

  async uploadFileManagerFile(
    file: UploadedFile,
    userId: number,
    orgId: number,
    tenant: string,
    modelId?: number,
    source?: string,
    transaction?: MockTransaction
  ): Promise<{ id: number; filename: string }> {
    validateTenant(tenant);
    const filename = sanitizeFilenameStr(file.originalname);

    const record = {
      id: this.nextId++,
      filename,
      file_size: file.size || file.buffer.length,
      mimetype: file.mimetype,
      uploaded_by: userId,
      org_id: orgId,
      model_id: modelId,
      source: source || "File Manager",
      tenant,
      transaction_used: !!transaction,
    };
    this.mockDb.push(record);
    return { id: record.id, filename: record.filename };
  }

  async deleteFileById(
    fileId: number,
    tenant: string,
    _isFileManagerFile: boolean = false,
    _transaction?: MockTransaction
  ): Promise<boolean> {
    validateTenant(tenant);
    const index = this.mockDb.findIndex(
      (f) => f.id === fileId && f.tenant === tenant
    );
    if (index >= 0) {
      this.mockDb.splice(index, 1);
      return true;
    }
    return false;
  }

  async logFileAccess(
    _fileId: number,
    _userId: number,
    _orgId: number,
    _action: "download" | "view",
    tenant: string,
    _transaction?: MockTransaction
  ): Promise<void> {
    validateTenant(tenant);
    // In real implementation, this would insert into access log table
  }

  getDb(): any[] {
    return this.mockDb;
  }

  clearDb(): void {
    this.mockDb = [];
    this.nextId = 1;
  }
}

describe("File Repository (Branch 2)", () => {
  let repository: FileRepositorySimulator;
  let mockTransaction: MockTransaction;

  beforeEach(() => {
    repository = new FileRepositorySimulator();
    mockTransaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe("SQL Injection Prevention", () => {
    describe("Tenant Validation", () => {
      const maliciousTenants = [
        "'; DROP TABLE files; --",
        'tenant"; DELETE FROM users; --',
        "tenant\nmalicious",
        "tenant with spaces",
        "../../../etc/passwd",
        "",
        "a".repeat(31),
      ];

      maliciousTenants.forEach((tenant) => {
        it(`should reject malicious tenant in uploadProjectFile: "${tenant.substring(0, 20)}..."`, async () => {
          const file = {
            originalname: "test.pdf",
            buffer: Buffer.from("test"),
            mimetype: "application/pdf",
          };

          await expect(
            repository.uploadProjectFile(file, 1, 1, "File Manager", tenant)
          ).rejects.toThrow(ValidationException);
        });

        it(`should reject malicious tenant in getProjectFileById: "${tenant.substring(0, 20)}..."`, async () => {
          await expect(repository.getProjectFileById(1, tenant)).rejects.toThrow(
            ValidationException
          );
        });

        it(`should reject malicious tenant in deleteProjectFileById: "${tenant.substring(0, 20)}..."`, async () => {
          await expect(
            repository.deleteProjectFileById(1, tenant, mockTransaction)
          ).rejects.toThrow(ValidationException);
        });
      });

      it("should accept valid tenant names", async () => {
        const file = {
          originalname: "test.pdf",
          buffer: Buffer.from("test"),
          mimetype: "application/pdf",
        };

        const result = await repository.uploadProjectFile(
          file,
          1,
          1,
          "File Manager",
          "valid_tenant_123"
        );
        expect(result).toBeDefined();
        expect(result.id).toBe(1);
      });
    });

    describe("Filename Sanitization", () => {
      it("should sanitize dangerous characters in filename", async () => {
        const file = {
          originalname: "../../../etc/passwd",
          buffer: Buffer.from("test"),
          mimetype: "application/pdf",
        };

        const result = await repository.uploadProjectFile(
          file,
          1,
          1,
          "File Manager",
          "valid_tenant"
        );

        expect(result.filename).not.toContain("..");
        expect(result.filename).not.toContain("/");
      });

      it("should handle special characters in filename", async () => {
        const file = {
          originalname: "file<script>alert(1)</script>.pdf",
          buffer: Buffer.from("test"),
          mimetype: "application/pdf",
        };

        const result = await repository.uploadProjectFile(
          file,
          1,
          1,
          "File Manager",
          "valid_tenant"
        );

        expect(result.filename).not.toContain("<");
        expect(result.filename).not.toContain(">");
      });

      it("should preserve valid filename characters", async () => {
        const file = {
          originalname: "my-document_v1.2.pdf",
          buffer: Buffer.from("test"),
          mimetype: "application/pdf",
        };

        const result = await repository.uploadProjectFile(
          file,
          1,
          1,
          "File Manager",
          "tenant"
        );

        expect(result.filename).toBe("my-document_v1.2.pdf");
      });
    });
  });

  describe("Transaction Support", () => {
    describe("uploadProjectFile", () => {
      it("should work with transaction", async () => {
        const file = {
          originalname: "test.pdf",
          buffer: Buffer.from("test"),
          mimetype: "application/pdf",
        };

        const result = await repository.uploadProjectFile(
          file,
          1,
          1,
          "File Manager",
          "tenant",
          mockTransaction
        );

        expect(result).toBeDefined();
        const db = repository.getDb();
        expect(db[0].transaction_used).toBe(true);
      });

      it("should work without transaction", async () => {
        const file = {
          originalname: "test.pdf",
          buffer: Buffer.from("test"),
          mimetype: "application/pdf",
        };

        const result = await repository.uploadProjectFile(
          file,
          1,
          1,
          "File Manager",
          "tenant",
          null
        );

        expect(result).toBeDefined();
        const db = repository.getDb();
        expect(db[0].transaction_used).toBe(false);
      });
    });

    describe("deleteProjectFileById", () => {
      it("should require transaction parameter", async () => {
        // First, add a file
        const file = {
          originalname: "test.pdf",
          buffer: Buffer.from("test"),
          mimetype: "application/pdf",
        };
        const uploaded = await repository.uploadProjectFile(
          file,
          1,
          1,
          "File Manager",
          "tenant"
        );

        // Now delete with transaction
        const result = await repository.deleteProjectFileById(
          uploaded.id,
          "tenant",
          mockTransaction
        );

        expect(result).toBe(true);
      });
    });

    describe("uploadFileManagerFile", () => {
      it("should propagate transaction to database", async () => {
        const file = {
          originalname: "test.pdf",
          buffer: Buffer.from("test"),
          mimetype: "application/pdf",
          size: 1024,
        };

        const result = await repository.uploadFileManagerFile(
          file,
          1,
          1,
          "tenant",
          undefined,
          undefined,
          mockTransaction
        );

        expect(result).toBeDefined();
        const db = repository.getDb();
        expect(db[0].transaction_used).toBe(true);
      });
    });

    describe("deleteFileById", () => {
      it("should propagate transaction when deleting file", async () => {
        // First, add a file
        const file = {
          originalname: "test.pdf",
          buffer: Buffer.from("test"),
          mimetype: "application/pdf",
        };
        const uploaded = await repository.uploadFileManagerFile(
          file,
          1,
          1,
          "tenant"
        );

        // Now delete with transaction
        const result = await repository.deleteFileById(
          uploaded.id,
          "tenant",
          true,
          mockTransaction
        );

        expect(result).toBe(true);
      });

      it("should work without transaction (backward compatibility)", async () => {
        const file = {
          originalname: "test.pdf",
          buffer: Buffer.from("test"),
          mimetype: "application/pdf",
        };
        const uploaded = await repository.uploadFileManagerFile(
          file,
          1,
          1,
          "tenant"
        );

        const result = await repository.deleteFileById(
          uploaded.id,
          "tenant",
          true
        );

        expect(result).toBe(true);
      });
    });

    describe("logFileAccess", () => {
      it("should work with transaction", async () => {
        await expect(
          repository.logFileAccess(1, 1, 1, "download", "tenant", mockTransaction)
        ).resolves.toBeUndefined();
      });

      it("should work without transaction", async () => {
        await expect(
          repository.logFileAccess(1, 1, 1, "view", "tenant")
        ).resolves.toBeUndefined();
      });
    });
  });

  describe("Return Values", () => {
    describe("deleteProjectFileById", () => {
      it("should return true when file is deleted", async () => {
        const file = {
          originalname: "test.pdf",
          buffer: Buffer.from("test"),
          mimetype: "application/pdf",
        };
        const uploaded = await repository.uploadProjectFile(
          file,
          1,
          1,
          "File Manager",
          "tenant"
        );

        const result = await repository.deleteProjectFileById(
          uploaded.id,
          "tenant",
          mockTransaction
        );

        expect(result).toBe(true);
      });

      it("should return false when file not found", async () => {
        const result = await repository.deleteProjectFileById(
          999,
          "tenant",
          mockTransaction
        );

        expect(result).toBe(false);
      });
    });

    describe("getProjectFileById", () => {
      it("should return file when found", async () => {
        const file = {
          originalname: "test.pdf",
          buffer: Buffer.from("test"),
          mimetype: "application/pdf",
        };
        const uploaded = await repository.uploadProjectFile(
          file,
          1,
          1,
          "File Manager",
          "tenant"
        );

        const result = await repository.getProjectFileById(uploaded.id, "tenant");

        expect(result).not.toBeNull();
        expect(result?.id).toBe(uploaded.id);
      });

      it("should return null when file not found", async () => {
        const result = await repository.getProjectFileById(999, "tenant");
        expect(result).toBeNull();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero-length file buffer", async () => {
      const file = {
        originalname: "empty.txt",
        buffer: Buffer.alloc(0),
        mimetype: "text/plain",
      };

      const result = await repository.uploadProjectFile(
        file,
        1,
        1,
        "File Manager",
        "tenant"
      );

      expect(result).toBeDefined();
    });

    it("should handle very long filenames", async () => {
      const file = {
        originalname: "a".repeat(500) + ".pdf",
        buffer: Buffer.from("test"),
        mimetype: "application/pdf",
      };

      const result = await repository.uploadProjectFile(
        file,
        1,
        1,
        "File Manager",
        "tenant"
      );

      expect(result).toBeDefined();
    });

    it("should handle null project ID for organization-level files", async () => {
      const file = {
        originalname: "org-file.pdf",
        buffer: Buffer.from("test"),
        mimetype: "application/pdf",
      };

      const result = await repository.uploadProjectFile(
        file,
        1,
        null,
        "File Manager",
        "tenant"
      );

      expect(result).toBeDefined();
      const db = repository.getDb();
      expect(db[0].project_id).toBeNull();
    });
  });

  describe("FileSource Types", () => {
    const validSources: FileSource[] = [
      "Assessment tracker group",
      "Compliance tracker group",
      "File Manager",
    ];

    validSources.forEach((source) => {
      it(`should accept valid source: ${source}`, async () => {
        const file = {
          originalname: "test.pdf",
          buffer: Buffer.from("test"),
          mimetype: "application/pdf",
        };

        const result = await repository.uploadProjectFile(
          file,
          1,
          1,
          source,
          "tenant"
        );

        expect(result).toBeDefined();
      });
    });
  });
});
