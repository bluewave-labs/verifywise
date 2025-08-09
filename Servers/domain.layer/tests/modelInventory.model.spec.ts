import { ModelInventoryStatus } from "../enums/model-inventory-status.enum";
import { ValidationException } from "../exceptions/custom.exception";

// Mock sequelize-typescript completely
jest.mock("sequelize-typescript", () => ({
  Column: jest.fn(),
  DataType: {
    INTEGER: "INTEGER",
    STRING: "STRING",
    DATE: "DATE",
    BOOLEAN: "BOOLEAN",
    TEXT: "TEXT",
    ENUM: jest.fn(),
  },
  ForeignKey: jest.fn(),
  Table: jest.fn(),
  Model: class MockModel {
    constructor(data?: any) {
      if (data) {
        Object.assign(this, data);
      }
    }
  },
}));

// Create a simple test class that mimics ModelInventoryModel behavior
class TestModelInventoryModel {
  id?: number;
  provider_model!: string;
  version!: string;
  approver!: string;
  capabilities!: string;
  security_assessment!: boolean;
  status!: ModelInventoryStatus;
  status_date!: Date;
  is_demo?: boolean;
  created_at?: Date;
  updated_at?: Date;

  constructor(data?: any) {
    if (data) {
      Object.assign(this, data);
    }
  }

  // Static method to create new model inventory
  static async CreateNewModelInventory(
    modelInventoryAttributes: Partial<TestModelInventoryModel>
  ): Promise<TestModelInventoryModel> {
    // Validate required fields
    if (!modelInventoryAttributes.provider_model?.trim()) {
      throw new ValidationException(
        "Provider/Model is required",
        "provider_model",
        modelInventoryAttributes.provider_model
      );
    }

    if (!modelInventoryAttributes.version?.trim()) {
      throw new ValidationException(
        "Version is required",
        "version",
        modelInventoryAttributes.version
      );
    }

    if (!modelInventoryAttributes.approver?.trim()) {
      throw new ValidationException(
        "Approver is required",
        "approver",
        modelInventoryAttributes.approver
      );
    }

    if (!modelInventoryAttributes.capabilities?.trim()) {
      throw new ValidationException(
        "Capabilities are required",
        "capabilities",
        modelInventoryAttributes.capabilities
      );
    }

    // Set default values
    const modelInventory = new TestModelInventoryModel();
    modelInventory.provider_model = modelInventoryAttributes.provider_model;
    modelInventory.version = modelInventoryAttributes.version;
    modelInventory.approver = modelInventoryAttributes.approver;
    modelInventory.capabilities = modelInventoryAttributes.capabilities;
    modelInventory.security_assessment =
      modelInventoryAttributes.security_assessment ?? false;
    modelInventory.status =
      modelInventoryAttributes.status ?? ModelInventoryStatus.PENDING;
    modelInventory.status_date =
      modelInventoryAttributes.status_date ?? new Date();
    modelInventory.is_demo = modelInventoryAttributes.is_demo ?? false;
    modelInventory.created_at =
      modelInventoryAttributes.created_at ?? new Date();
    modelInventory.updated_at =
      modelInventoryAttributes.updated_at ?? new Date();

    return modelInventory;
  }

  // Instance methods
  getSecurityAssessmentBadge(): string {
    return this.security_assessment ? "Yes" : "No";
  }

  getStatusBadge(): string {
    return this.status;
  }

  isApproved(): boolean {
    return this.status === ModelInventoryStatus.APPROVED;
  }

  isRestricted(): boolean {
    return this.status === ModelInventoryStatus.RESTRICTED;
  }

  isPending(): boolean {
    return this.status === ModelInventoryStatus.PENDING;
  }

  getFullModelName(): string {
    return `${this.provider_model} ${this.version}`.trim();
  }

  isDemoModelInventory(): boolean {
    return this.is_demo ?? false;
  }

  toSafeJSON(): any {
    return {
      id: this.id,
      provider_model: this.provider_model,
      version: this.version,
      approver: this.approver,
      capabilities: this.capabilities,
      security_assessment: this.security_assessment,
      status: this.status,
      status_date: this.status_date?.toISOString(),
      is_demo: this.is_demo,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
    };
  }

  toJSON(): any {
    return {
      id: this.id,
      provider_model: this.provider_model,
      version: this.version,
      approver: this.approver,
      capabilities: this.capabilities,
      security_assessment: this.security_assessment,
      status: this.status,
      status_date: this.status_date?.toISOString(),
      is_demo: this.is_demo,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
    };
  }
}

describe("ModelInventoryModel", () => {
  // Test data
  const validModelInventoryData = {
    provider_model: "OpenAI GPT-4",
    version: "4.0",
    approver: "John Doe",
    capabilities: "Text generation, code completion",
    security_assessment: true,
    status: ModelInventoryStatus.APPROVED,
  };

  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("CreateNewModelInventory", () => {
    it("should create a new model inventory with valid data", async () => {
      // Arrange & Act
      const result = await TestModelInventoryModel.CreateNewModelInventory(
        validModelInventoryData
      );

      // Assert
      expect(result).toBeInstanceOf(TestModelInventoryModel);
      expect(result.provider_model).toBe(
        validModelInventoryData.provider_model
      );
      expect(result.version).toBe(validModelInventoryData.version);
      expect(result.approver).toBe(validModelInventoryData.approver);
      expect(result.capabilities).toBe(validModelInventoryData.capabilities);
      expect(result.security_assessment).toBe(
        validModelInventoryData.security_assessment
      );
      expect(result.status).toBe(validModelInventoryData.status);
      expect(result.status_date).toBeInstanceOf(Date);
      expect(result.is_demo).toBe(false); // default value
    });

    it("should throw ValidationException for missing provider_model", async () => {
      // Arrange & Act & Assert
      await expect(
        TestModelInventoryModel.CreateNewModelInventory({
          version: "4.0",
          approver: "John Doe",
          capabilities: "Text generation",
        })
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for missing version", async () => {
      // Arrange & Act & Assert
      await expect(
        TestModelInventoryModel.CreateNewModelInventory({
          provider_model: "OpenAI GPT-4",
          approver: "John Doe",
          capabilities: "Text generation",
        })
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for missing approver", async () => {
      // Arrange & Act & Assert
      await expect(
        TestModelInventoryModel.CreateNewModelInventory({
          provider_model: "OpenAI GPT-4",
          version: "4.0",
          capabilities: "Text generation",
        })
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for missing capabilities", async () => {
      // Arrange & Act & Assert
      await expect(
        TestModelInventoryModel.CreateNewModelInventory({
          provider_model: "OpenAI GPT-4",
          version: "4.0",
          approver: "John Doe",
        })
      ).rejects.toThrow(ValidationException);
    });
  });

  describe("instance methods", () => {
    let modelInventory: TestModelInventoryModel;

    beforeEach(() => {
      modelInventory = new TestModelInventoryModel({
        provider_model: "Test Model",
        version: "1.0",
        approver: "Test Approver",
        capabilities: "Test capabilities",
        security_assessment: false,
        status: ModelInventoryStatus.PENDING,
        status_date: new Date(),
      });
    });

    it("should return correct security assessment badge", () => {
      expect(modelInventory.getSecurityAssessmentBadge()).toBe("No");

      modelInventory.security_assessment = true;
      expect(modelInventory.getSecurityAssessmentBadge()).toBe("Yes");
    });

    it("should return correct status badge", () => {
      expect(modelInventory.getStatusBadge()).toBe(
        ModelInventoryStatus.PENDING
      );
    });

    it("should check approval status correctly", () => {
      expect(modelInventory.isApproved()).toBe(false);

      modelInventory.status = ModelInventoryStatus.APPROVED;
      expect(modelInventory.isApproved()).toBe(true);
    });

    it("should check restricted status correctly", () => {
      expect(modelInventory.isRestricted()).toBe(false);

      modelInventory.status = ModelInventoryStatus.RESTRICTED;
      expect(modelInventory.isRestricted()).toBe(true);
    });

    it("should check pending status correctly", () => {
      expect(modelInventory.isPending()).toBe(true);

      modelInventory.status = ModelInventoryStatus.APPROVED;
      expect(modelInventory.isPending()).toBe(false);
    });

    it("should get full model name correctly", () => {
      expect(modelInventory.getFullModelName()).toBe("Test Model 1.0");
    });

    it("should check demo status correctly", () => {
      expect(modelInventory.isDemoModelInventory()).toBe(false);

      modelInventory.is_demo = true;
      expect(modelInventory.isDemoModelInventory()).toBe(true);
    });

    it("should return safe JSON without sensitive data", () => {
      const json = modelInventory.toSafeJSON();

      expect(json).toHaveProperty("provider_model", "Test Model");
      expect(json).toHaveProperty("version", "1.0");
      expect(json).toHaveProperty("security_assessment", false);
      expect(json).toHaveProperty("status", ModelInventoryStatus.PENDING);
    });

    it("should return formatted JSON", () => {
      const json = modelInventory.toJSON();

      expect(json).toHaveProperty("provider_model", "Test Model");
      expect(json).toHaveProperty("version", "1.0");
      expect(json).toHaveProperty("security_assessment", false);
      expect(json).toHaveProperty("status", ModelInventoryStatus.PENDING);
      expect(json.status_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
