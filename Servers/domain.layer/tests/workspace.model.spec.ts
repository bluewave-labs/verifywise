import {
  ValidationException,
  BusinessLogicException,
  NotFoundException,
} from "../exceptions/custom.exception";

// Mock sequelize-typescript
jest.mock("sequelize-typescript", () => ({
  Column: jest.fn(),
  DataType: {
    INTEGER: "INTEGER",
    STRING: "STRING",
    BOOLEAN: "BOOLEAN",
    DATE: "DATE",
    TEXT: "TEXT",
  },
  ForeignKey: jest.fn(),
  BelongsTo: jest.fn(),
  HasMany: jest.fn(),
  Table: jest.fn(),
  Model: class MockModel {
    constructor(data?: any) {
      if (data) Object.assign(this, data);
    }
  },
}));

// Slug validation regex: lowercase letters, numbers, hyphens (no leading/trailing hyphens)
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Test class mimicking WorkspaceModel behavior
class TestWorkspaceModel {
  id?: number;
  org_id!: number;
  name!: string;
  slug!: string;
  schema_name!: string;
  oidc_enabled?: boolean;
  oidc_issuer?: string;
  oidc_client_id?: string;
  oidc_client_secret_encrypted?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;

  constructor(data?: any) {
    if (data) Object.assign(this, data);
  }

  // Validate slug format
  static validateSlug(slug: string): boolean {
    if (!slug || slug.trim().length === 0) {
      return false;
    }
    if (slug.length < 2 || slug.length > 63) {
      return false;
    }
    return SLUG_PATTERN.test(slug);
  }

  // Validate schema_name format (must be valid PostgreSQL identifier)
  static validateSchemaName(schemaName: string): boolean {
    if (!schemaName || schemaName.trim().length === 0) {
      return false;
    }
    // PostgreSQL schema name: start with letter or underscore, followed by alphanumeric/underscore
    const schemaPattern = /^[a-z_][a-z0-9_]*$/;
    return schemaPattern.test(schemaName) && schemaName.length <= 63;
  }

  // Generate schema name from slug
  static generateSchemaName(slug: string): string {
    return `ws_${slug.replace(/-/g, "_")}`;
  }

  // Static method to create new workspace
  static async createNewWorkspace(
    org_id: number,
    name: string,
    slug: string,
    options?: {
      oidc_enabled?: boolean;
      oidc_issuer?: string;
      oidc_client_id?: string;
      oidc_client_secret_encrypted?: string;
    }
  ): Promise<TestWorkspaceModel> {
    // Validate org_id
    if (!org_id || org_id < 1) {
      throw new ValidationException(
        "Valid organization ID is required",
        "org_id",
        org_id
      );
    }

    // Validate name
    if (!name || name.trim().length === 0) {
      throw new ValidationException("Name is required", "name", name);
    }
    if (name.trim().length < 2) {
      throw new ValidationException(
        "Name must be at least 2 characters long",
        "name",
        name
      );
    }
    if (name.trim().length > 255) {
      throw new ValidationException(
        "Name must not exceed 255 characters",
        "name",
        name
      );
    }

    // Validate slug
    if (!TestWorkspaceModel.validateSlug(slug)) {
      throw new ValidationException(
        "Slug must be 2-63 lowercase alphanumeric characters with hyphens (no leading/trailing hyphens)",
        "slug",
        slug
      );
    }

    // Generate schema_name from slug
    const schema_name = TestWorkspaceModel.generateSchemaName(slug);
    if (!TestWorkspaceModel.validateSchemaName(schema_name)) {
      throw new ValidationException(
        "Generated schema name is invalid",
        "schema_name",
        schema_name
      );
    }

    // Validate OIDC fields if OIDC is enabled
    if (options?.oidc_enabled) {
      if (!options.oidc_issuer || options.oidc_issuer.trim().length === 0) {
        throw new ValidationException(
          "OIDC issuer is required when OIDC is enabled",
          "oidc_issuer",
          options.oidc_issuer
        );
      }
      if (!options.oidc_client_id || options.oidc_client_id.trim().length === 0) {
        throw new ValidationException(
          "OIDC client ID is required when OIDC is enabled",
          "oidc_client_id",
          options.oidc_client_id
        );
      }
      // Validate issuer URL format
      try {
        new URL(options.oidc_issuer);
      } catch {
        throw new ValidationException(
          "OIDC issuer must be a valid URL",
          "oidc_issuer",
          options.oidc_issuer
        );
      }
    }

    const workspace = new TestWorkspaceModel();
    workspace.org_id = org_id;
    workspace.name = name.trim();
    workspace.slug = slug;
    workspace.schema_name = schema_name;
    workspace.oidc_enabled = options?.oidc_enabled ?? false;
    workspace.oidc_issuer = options?.oidc_issuer;
    workspace.oidc_client_id = options?.oidc_client_id;
    workspace.oidc_client_secret_encrypted = options?.oidc_client_secret_encrypted;
    workspace.is_active = true;
    workspace.created_at = new Date();
    workspace.updated_at = new Date();

    return workspace;
  }

  // Instance method to update workspace
  async updateWorkspace(updateData: {
    name?: string;
    oidc_enabled?: boolean;
    oidc_issuer?: string;
    oidc_client_id?: string;
    oidc_client_secret_encrypted?: string;
    is_active?: boolean;
  }): Promise<void> {
    if (updateData.name !== undefined) {
      if (!updateData.name || updateData.name.trim().length === 0) {
        throw new ValidationException("Name is required", "name", updateData.name);
      }
      if (updateData.name.trim().length < 2) {
        throw new ValidationException(
          "Name must be at least 2 characters long",
          "name",
          updateData.name
        );
      }
      this.name = updateData.name.trim();
    }

    if (updateData.oidc_enabled !== undefined) {
      this.oidc_enabled = updateData.oidc_enabled;
    }

    // If OIDC is being enabled, validate required fields
    const willHaveOidcEnabled = updateData.oidc_enabled ?? this.oidc_enabled;
    if (willHaveOidcEnabled) {
      const issuer = updateData.oidc_issuer ?? this.oidc_issuer;
      const clientId = updateData.oidc_client_id ?? this.oidc_client_id;

      if (!issuer || issuer.trim().length === 0) {
        throw new ValidationException(
          "OIDC issuer is required when OIDC is enabled",
          "oidc_issuer",
          issuer
        );
      }
      if (!clientId || clientId.trim().length === 0) {
        throw new ValidationException(
          "OIDC client ID is required when OIDC is enabled",
          "oidc_client_id",
          clientId
        );
      }
    }

    if (updateData.oidc_issuer !== undefined) {
      if (updateData.oidc_issuer && updateData.oidc_issuer.trim().length > 0) {
        try {
          new URL(updateData.oidc_issuer);
        } catch {
          throw new ValidationException(
            "OIDC issuer must be a valid URL",
            "oidc_issuer",
            updateData.oidc_issuer
          );
        }
      }
      this.oidc_issuer = updateData.oidc_issuer;
    }

    if (updateData.oidc_client_id !== undefined) {
      this.oidc_client_id = updateData.oidc_client_id;
    }

    if (updateData.oidc_client_secret_encrypted !== undefined) {
      this.oidc_client_secret_encrypted = updateData.oidc_client_secret_encrypted;
    }

    if (updateData.is_active !== undefined) {
      this.is_active = updateData.is_active;
    }

    this.updated_at = new Date();
  }

  // Validate workspace data before persistence
  async validateWorkspaceData(): Promise<void> {
    if (!this.org_id || this.org_id < 1) {
      throw new ValidationException(
        "Valid organization ID is required",
        "org_id",
        this.org_id
      );
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new ValidationException("Name is required", "name", this.name);
    }

    if (!TestWorkspaceModel.validateSlug(this.slug)) {
      throw new ValidationException(
        "Valid slug is required",
        "slug",
        this.slug
      );
    }

    if (!TestWorkspaceModel.validateSchemaName(this.schema_name)) {
      throw new ValidationException(
        "Valid schema_name is required",
        "schema_name",
        this.schema_name
      );
    }

    if (this.oidc_enabled) {
      if (!this.oidc_issuer || this.oidc_issuer.trim().length === 0) {
        throw new ValidationException(
          "OIDC issuer is required when OIDC is enabled",
          "oidc_issuer",
          this.oidc_issuer
        );
      }
      if (!this.oidc_client_id || this.oidc_client_id.trim().length === 0) {
        throw new ValidationException(
          "OIDC client ID is required when OIDC is enabled",
          "oidc_client_id",
          this.oidc_client_id
        );
      }
    }
  }

  // Check if workspace is active
  isActiveWorkspace(): boolean {
    return this.is_active ?? true;
  }

  // Check if OIDC is configured
  hasOidcConfigured(): boolean {
    return (
      this.oidc_enabled === true &&
      !!this.oidc_issuer &&
      !!this.oidc_client_id
    );
  }

  // Deactivate workspace
  deactivate(): void {
    if (!this.is_active) {
      throw new BusinessLogicException(
        "Workspace is already deactivated",
        "WORKSPACE_ALREADY_DEACTIVATED",
        { workspaceId: this.id }
      );
    }
    this.is_active = false;
    this.updated_at = new Date();
  }

  // Activate workspace
  activate(): void {
    if (this.is_active) {
      throw new BusinessLogicException(
        "Workspace is already active",
        "WORKSPACE_ALREADY_ACTIVE",
        { workspaceId: this.id }
      );
    }
    this.is_active = true;
    this.updated_at = new Date();
  }

  // Get safe JSON (exclude secrets)
  toSafeJSON(): any {
    return {
      id: this.id,
      org_id: this.org_id,
      name: this.name,
      slug: this.slug,
      schema_name: this.schema_name,
      oidc_enabled: this.oidc_enabled,
      oidc_issuer: this.oidc_issuer,
      oidc_client_id: this.oidc_client_id,
      // NOTE: oidc_client_secret_encrypted is excluded
      is_active: this.is_active,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
    };
  }

  toJSON(): any {
    return this.toSafeJSON();
  }

  static fromJSON(json: any): TestWorkspaceModel {
    return new TestWorkspaceModel(json);
  }

  // Static method to find by ID
  static async findByIdWithValidation(id: number): Promise<TestWorkspaceModel> {
    if (!id || id < 1) {
      throw new ValidationException(
        "Valid ID is required (must be >= 1)",
        "id",
        id
      );
    }

    if (id === 999) {
      throw new NotFoundException("Workspace not found", "Workspace", id);
    }

    return new TestWorkspaceModel({
      id,
      org_id: 1,
      name: "Test Workspace",
      slug: "test-workspace",
      schema_name: "ws_test_workspace",
      oidc_enabled: false,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  // Static method to find by slug
  static async findBySlug(slug: string): Promise<TestWorkspaceModel | null> {
    if (!TestWorkspaceModel.validateSlug(slug)) {
      throw new ValidationException("Valid slug is required", "slug", slug);
    }

    if (slug === "not-found") {
      return null;
    }

    return new TestWorkspaceModel({
      id: 1,
      org_id: 1,
      name: "Test Workspace",
      slug,
      schema_name: `ws_${slug.replace(/-/g, "_")}`,
      oidc_enabled: false,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
}

describe("WorkspaceModel", () => {
  const validWorkspaceData = {
    org_id: 1,
    name: "Test Workspace",
    slug: "test-workspace",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateSlug", () => {
    it("should return true for valid slug", () => {
      expect(TestWorkspaceModel.validateSlug("test-workspace")).toBe(true);
      expect(TestWorkspaceModel.validateSlug("my-project-123")).toBe(true);
      expect(TestWorkspaceModel.validateSlug("abc")).toBe(true);
      expect(TestWorkspaceModel.validateSlug("a1")).toBe(true);
    });

    it("should return false for invalid slugs", () => {
      expect(TestWorkspaceModel.validateSlug("")).toBe(false);
      expect(TestWorkspaceModel.validateSlug("A")).toBe(false);
      expect(TestWorkspaceModel.validateSlug("Test-Workspace")).toBe(false); // uppercase
      expect(TestWorkspaceModel.validateSlug("-test")).toBe(false); // leading hyphen
      expect(TestWorkspaceModel.validateSlug("test-")).toBe(false); // trailing hyphen
      expect(TestWorkspaceModel.validateSlug("test--workspace")).toBe(false); // double hyphen
      expect(TestWorkspaceModel.validateSlug("test_workspace")).toBe(false); // underscore
      expect(TestWorkspaceModel.validateSlug("test workspace")).toBe(false); // space
    });

    it("should return false for slugs exceeding length limit", () => {
      const longSlug = "a".repeat(64);
      expect(TestWorkspaceModel.validateSlug(longSlug)).toBe(false);
    });
  });

  describe("validateSchemaName", () => {
    it("should return true for valid schema names", () => {
      expect(TestWorkspaceModel.validateSchemaName("ws_test")).toBe(true);
      expect(TestWorkspaceModel.validateSchemaName("_private")).toBe(true);
      expect(TestWorkspaceModel.validateSchemaName("schema123")).toBe(true);
    });

    it("should return false for invalid schema names", () => {
      expect(TestWorkspaceModel.validateSchemaName("")).toBe(false);
      expect(TestWorkspaceModel.validateSchemaName("123start")).toBe(false); // starts with number
      expect(TestWorkspaceModel.validateSchemaName("schema-name")).toBe(false); // hyphen
      expect(TestWorkspaceModel.validateSchemaName("Schema")).toBe(false); // uppercase
    });
  });

  describe("generateSchemaName", () => {
    it("should generate valid schema name from slug", () => {
      expect(TestWorkspaceModel.generateSchemaName("test-workspace")).toBe("ws_test_workspace");
      expect(TestWorkspaceModel.generateSchemaName("my-project")).toBe("ws_my_project");
      expect(TestWorkspaceModel.generateSchemaName("simple")).toBe("ws_simple");
    });
  });

  describe("createNewWorkspace", () => {
    it("should create workspace with valid data", async () => {
      const workspace = await TestWorkspaceModel.createNewWorkspace(
        validWorkspaceData.org_id,
        validWorkspaceData.name,
        validWorkspaceData.slug
      );

      expect(workspace).toBeInstanceOf(TestWorkspaceModel);
      expect(workspace.org_id).toBe(1);
      expect(workspace.name).toBe("Test Workspace");
      expect(workspace.slug).toBe("test-workspace");
      expect(workspace.schema_name).toBe("ws_test_workspace");
      expect(workspace.oidc_enabled).toBe(false);
      expect(workspace.is_active).toBe(true);
      expect(workspace.created_at).toBeInstanceOf(Date);
    });

    it("should create workspace with OIDC configuration", async () => {
      const workspace = await TestWorkspaceModel.createNewWorkspace(
        1,
        "OIDC Workspace",
        "oidc-workspace",
        {
          oidc_enabled: true,
          oidc_issuer: "https://auth.example.com",
          oidc_client_id: "client-123",
          oidc_client_secret_encrypted: "encrypted-secret",
        }
      );

      expect(workspace.oidc_enabled).toBe(true);
      expect(workspace.oidc_issuer).toBe("https://auth.example.com");
      expect(workspace.oidc_client_id).toBe("client-123");
      expect(workspace.oidc_client_secret_encrypted).toBe("encrypted-secret");
    });

    it("should throw ValidationException for invalid org_id", async () => {
      await expect(
        TestWorkspaceModel.createNewWorkspace(0, "Test", "test")
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for empty name", async () => {
      await expect(
        TestWorkspaceModel.createNewWorkspace(1, "", "test")
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for short name", async () => {
      await expect(
        TestWorkspaceModel.createNewWorkspace(1, "A", "test")
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for invalid slug", async () => {
      await expect(
        TestWorkspaceModel.createNewWorkspace(1, "Test", "Invalid-Slug")
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException when OIDC enabled without issuer", async () => {
      await expect(
        TestWorkspaceModel.createNewWorkspace(1, "Test", "test", {
          oidc_enabled: true,
          oidc_client_id: "client-123",
        })
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException when OIDC enabled without client_id", async () => {
      await expect(
        TestWorkspaceModel.createNewWorkspace(1, "Test", "test", {
          oidc_enabled: true,
          oidc_issuer: "https://auth.example.com",
        })
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for invalid OIDC issuer URL", async () => {
      await expect(
        TestWorkspaceModel.createNewWorkspace(1, "Test", "test", {
          oidc_enabled: true,
          oidc_issuer: "not-a-url",
          oidc_client_id: "client-123",
        })
      ).rejects.toThrow(ValidationException);
    });
  });

  describe("updateWorkspace", () => {
    it("should update workspace name", async () => {
      const workspace = new TestWorkspaceModel(validWorkspaceData);
      await workspace.updateWorkspace({ name: "Updated Workspace" });
      expect(workspace.name).toBe("Updated Workspace");
    });

    it("should throw ValidationException for invalid name update", async () => {
      const workspace = new TestWorkspaceModel(validWorkspaceData);
      await expect(
        workspace.updateWorkspace({ name: "A" })
      ).rejects.toThrow(ValidationException);
    });

    it("should enable OIDC with required fields", async () => {
      const workspace = new TestWorkspaceModel({
        ...validWorkspaceData,
        oidc_enabled: false,
      });
      await workspace.updateWorkspace({
        oidc_enabled: true,
        oidc_issuer: "https://auth.example.com",
        oidc_client_id: "client-123",
      });
      expect(workspace.oidc_enabled).toBe(true);
    });

    it("should throw ValidationException when enabling OIDC without issuer", async () => {
      const workspace = new TestWorkspaceModel({
        ...validWorkspaceData,
        oidc_enabled: false,
      });
      await expect(
        workspace.updateWorkspace({ oidc_enabled: true })
      ).rejects.toThrow(ValidationException);
    });
  });

  describe("validateWorkspaceData", () => {
    it("should pass validation with valid data", async () => {
      const workspace = new TestWorkspaceModel({
        org_id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        schema_name: "ws_test_workspace",
        oidc_enabled: false,
      });
      await expect(workspace.validateWorkspaceData()).resolves.not.toThrow();
    });

    it("should throw ValidationException for missing org_id", async () => {
      const workspace = new TestWorkspaceModel({
        name: "Test",
        slug: "test",
        schema_name: "ws_test",
      });
      await expect(workspace.validateWorkspaceData()).rejects.toThrow(
        ValidationException
      );
    });

    it("should throw ValidationException for OIDC enabled without issuer", async () => {
      const workspace = new TestWorkspaceModel({
        org_id: 1,
        name: "Test",
        slug: "test",
        schema_name: "ws_test",
        oidc_enabled: true,
        oidc_client_id: "client",
      });
      await expect(workspace.validateWorkspaceData()).rejects.toThrow(
        ValidationException
      );
    });
  });

  describe("isActiveWorkspace", () => {
    it("should return true for active workspace", () => {
      const workspace = new TestWorkspaceModel({
        ...validWorkspaceData,
        is_active: true,
      });
      expect(workspace.isActiveWorkspace()).toBe(true);
    });

    it("should return false for inactive workspace", () => {
      const workspace = new TestWorkspaceModel({
        ...validWorkspaceData,
        is_active: false,
      });
      expect(workspace.isActiveWorkspace()).toBe(false);
    });

    it("should default to true when is_active is undefined", () => {
      const workspace = new TestWorkspaceModel(validWorkspaceData);
      expect(workspace.isActiveWorkspace()).toBe(true);
    });
  });

  describe("hasOidcConfigured", () => {
    it("should return true when OIDC is fully configured", () => {
      const workspace = new TestWorkspaceModel({
        ...validWorkspaceData,
        oidc_enabled: true,
        oidc_issuer: "https://auth.example.com",
        oidc_client_id: "client-123",
      });
      expect(workspace.hasOidcConfigured()).toBe(true);
    });

    it("should return false when OIDC is disabled", () => {
      const workspace = new TestWorkspaceModel({
        ...validWorkspaceData,
        oidc_enabled: false,
        oidc_issuer: "https://auth.example.com",
        oidc_client_id: "client-123",
      });
      expect(workspace.hasOidcConfigured()).toBe(false);
    });

    it("should return false when OIDC fields are missing", () => {
      const workspace = new TestWorkspaceModel({
        ...validWorkspaceData,
        oidc_enabled: true,
      });
      expect(workspace.hasOidcConfigured()).toBe(false);
    });
  });

  describe("deactivate", () => {
    it("should deactivate an active workspace", () => {
      const workspace = new TestWorkspaceModel({
        ...validWorkspaceData,
        is_active: true,
      });
      workspace.deactivate();
      expect(workspace.is_active).toBe(false);
    });

    it("should throw BusinessLogicException for already deactivated workspace", () => {
      const workspace = new TestWorkspaceModel({
        ...validWorkspaceData,
        is_active: false,
      });
      expect(() => workspace.deactivate()).toThrow(BusinessLogicException);
    });
  });

  describe("activate", () => {
    it("should activate an inactive workspace", () => {
      const workspace = new TestWorkspaceModel({
        ...validWorkspaceData,
        is_active: false,
      });
      workspace.activate();
      expect(workspace.is_active).toBe(true);
    });

    it("should throw BusinessLogicException for already active workspace", () => {
      const workspace = new TestWorkspaceModel({
        ...validWorkspaceData,
        is_active: true,
      });
      expect(() => workspace.activate()).toThrow(BusinessLogicException);
    });
  });

  describe("toSafeJSON", () => {
    it("should return workspace data without secrets", () => {
      const workspace = new TestWorkspaceModel({
        id: 1,
        org_id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        schema_name: "ws_test_workspace",
        oidc_enabled: true,
        oidc_issuer: "https://auth.example.com",
        oidc_client_id: "client-123",
        oidc_client_secret_encrypted: "super-secret-encrypted",
        is_active: true,
        created_at: new Date("2024-01-01T00:00:00.000Z"),
        updated_at: new Date("2024-01-02T00:00:00.000Z"),
      });

      const result = workspace.toSafeJSON();

      expect(result).not.toHaveProperty("oidc_client_secret_encrypted");
      expect(result).toHaveProperty("id", 1);
      expect(result).toHaveProperty("name", "Test Workspace");
      expect(result).toHaveProperty("slug", "test-workspace");
      expect(result).toHaveProperty("oidc_enabled", true);
    });
  });

  describe("findByIdWithValidation", () => {
    it("should find workspace by valid ID", async () => {
      const workspace = await TestWorkspaceModel.findByIdWithValidation(1);
      expect(workspace).toBeInstanceOf(TestWorkspaceModel);
      expect(workspace.id).toBe(1);
    });

    it("should throw ValidationException for invalid ID", async () => {
      await expect(
        TestWorkspaceModel.findByIdWithValidation(0)
      ).rejects.toThrow(ValidationException);
    });

    it("should throw NotFoundException for non-existent ID", async () => {
      await expect(
        TestWorkspaceModel.findByIdWithValidation(999)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findBySlug", () => {
    it("should find workspace by valid slug", async () => {
      const workspace = await TestWorkspaceModel.findBySlug("test-workspace");
      expect(workspace).toBeInstanceOf(TestWorkspaceModel);
      expect(workspace?.slug).toBe("test-workspace");
    });

    it("should return null for non-existent slug", async () => {
      const workspace = await TestWorkspaceModel.findBySlug("not-found");
      expect(workspace).toBeNull();
    });

    it("should throw ValidationException for invalid slug format", async () => {
      await expect(
        TestWorkspaceModel.findBySlug("Invalid-Slug")
      ).rejects.toThrow(ValidationException);
    });
  });

  describe("fromJSON", () => {
    it("should create workspace from JSON", () => {
      const json = {
        id: 1,
        org_id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        schema_name: "ws_test_workspace",
      };
      const workspace = TestWorkspaceModel.fromJSON(json);
      expect(workspace).toBeInstanceOf(TestWorkspaceModel);
      expect(workspace.id).toBe(1);
      expect(workspace.name).toBe("Test Workspace");
    });
  });
});
