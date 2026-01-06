/**
 * Backward Compatibility Tests for Deprecated Change History Utils (Branch 6)
 *
 * Tests that deprecated entity-specific change history utilities properly
 * delegate to the generic base utilities while maintaining backward compatibility.
 *
 * These tests ensure that existing code using the old API continues to work
 * after the refactoring migration.
 *
 * @module tests/refactoring/changeHistory.deprecated
 */

// Mock sequelize to prevent actual database connections
jest.mock("../../database/db", () => ({
  sequelize: {
    query: jest.fn().mockResolvedValue([[], { count: "0" }]),
  },
}));

// Mock the config
jest.mock("../../config/changeHistory.config", () => ({
  EntityType: {
    VENDOR: "vendor",
    VENDOR_RISK: "vendor_risk",
    POLICY: "policy",
    RISK: "risk",
    USE_CASE: "use_case",
    MODEL_INVENTORY: "model_inventory",
    INCIDENT: "incident",
  },
  getEntityConfig: jest.fn((type: string) => ({
    tableName: `${type}_change_history`,
    foreignKeyField: `${type}_id`,
    trackedFields: ["name", "status"],
  })),
  GENERIC_FORMATTERS: {},
}));

// Mock the base utils to track calls
const mockRecordEntityChange = jest.fn().mockResolvedValue(undefined);
const mockRecordMultipleFieldChanges = jest.fn().mockResolvedValue(undefined);
const mockGetEntityChangeHistory = jest.fn().mockResolvedValue({
  data: [],
  hasMore: false,
  total: 0,
});
const mockTrackEntityChanges = jest.fn().mockResolvedValue([]);
const mockRecordEntityCreation = jest.fn().mockResolvedValue(undefined);
const mockRecordEntityDeletion = jest.fn().mockResolvedValue(undefined);

jest.mock("../../utils/changeHistory.base.utils", () => ({
  recordEntityChange: mockRecordEntityChange,
  recordMultipleFieldChanges: mockRecordMultipleFieldChanges,
  getEntityChangeHistory: mockGetEntityChangeHistory,
  trackEntityChanges: mockTrackEntityChanges,
  recordEntityCreation: mockRecordEntityCreation,
  recordEntityDeletion: mockRecordEntityDeletion,
}));

describe("Deprecated Change History Utils - Backward Compatibility (Branch 6)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test vendorChangeHistory.utils.ts delegation
   */
  describe("VendorChangeHistory Utils", () => {
    let vendorUtils: any;

    beforeAll(async () => {
      vendorUtils = await import("../../utils/vendorChangeHistory.utils");
    });

    it("recordVendorChange should delegate to recordEntityChange with 'vendor' type", async () => {
      await vendorUtils.recordVendorChange(
        1,
        "created",
        2,
        "test_tenant",
        "name",
        "old",
        "new"
      );

      expect(mockRecordEntityChange).toHaveBeenCalledWith(
        "vendor",
        1,
        "created",
        2,
        "test_tenant",
        "name",
        "old",
        "new",
        undefined
      );
    });

    it("recordMultipleFieldChanges should delegate to base utils", async () => {
      const changes = [{ fieldName: "name", oldValue: "old", newValue: "new" }];

      await vendorUtils.recordMultipleFieldChanges(1, 2, "tenant", changes);

      expect(mockRecordMultipleFieldChanges).toHaveBeenCalledWith(
        "vendor",
        1,
        2,
        "tenant",
        changes,
        undefined
      );
    });

    it("getVendorChangeHistory should delegate to getEntityChangeHistory", async () => {
      await vendorUtils.getVendorChangeHistory(1, "tenant", 50, 10);

      expect(mockGetEntityChangeHistory).toHaveBeenCalledWith(
        "vendor",
        1,
        "tenant",
        50,
        10
      );
    });

    it("recordVendorCreation should delegate to recordEntityCreation", async () => {
      const vendorData = { vendor_name: "Test" };
      await vendorUtils.recordVendorCreation(1, 2, "tenant", vendorData);

      expect(mockRecordEntityCreation).toHaveBeenCalledWith(
        "vendor",
        1,
        2,
        "tenant",
        vendorData,
        undefined
      );
    });

    it("recordVendorDeletion should delegate to recordEntityDeletion", async () => {
      await vendorUtils.recordVendorDeletion(1, 2, "tenant");

      expect(mockRecordEntityDeletion).toHaveBeenCalledWith(
        "vendor",
        1,
        2,
        "tenant",
        undefined
      );
    });
  });

  /**
   * Test vendorRiskChangeHistory.utils.ts delegation
   */
  describe("VendorRiskChangeHistory Utils", () => {
    let vendorRiskUtils: any;

    beforeAll(async () => {
      vendorRiskUtils = await import("../../utils/vendorRiskChangeHistory.utils");
    });

    it("recordVendorRiskChange should delegate with 'vendor_risk' type", async () => {
      await vendorRiskUtils.recordVendorRiskChange(
        1,
        "updated",
        2,
        "tenant",
        "status",
        "old",
        "new"
      );

      expect(mockRecordEntityChange).toHaveBeenCalledWith(
        "vendor_risk",
        1,
        "updated",
        2,
        "tenant",
        "status",
        "old",
        "new",
        undefined
      );
    });

    it("getVendorRiskChangeHistory should delegate correctly", async () => {
      await vendorRiskUtils.getVendorRiskChangeHistory(1, "tenant");

      expect(mockGetEntityChangeHistory).toHaveBeenCalledWith(
        "vendor_risk",
        1,
        "tenant",
        100,
        0
      );
    });
  });

  /**
   * Test policyChangeHistory.utils.ts delegation
   */
  describe("PolicyChangeHistory Utils", () => {
    let policyUtils: any;

    beforeAll(async () => {
      policyUtils = await import("../../utils/policyChangeHistory.utils");
    });

    it("recordPolicyChange should delegate with 'policy' type", async () => {
      await policyUtils.recordPolicyChange(
        1,
        "deleted",
        2,
        "tenant"
      );

      expect(mockRecordEntityChange).toHaveBeenCalledWith(
        "policy",
        1,
        "deleted",
        2,
        "tenant",
        undefined,
        undefined,
        undefined,
        undefined
      );
    });

    it("getPolicyChangeHistory should use default pagination", async () => {
      await policyUtils.getPolicyChangeHistory(5, "tenant");

      expect(mockGetEntityChangeHistory).toHaveBeenCalledWith(
        "policy",
        5,
        "tenant",
        100,
        0
      );
    });
  });

  /**
   * Test projectRiskChangeHistory.utils.ts delegation
   */
  describe("ProjectRiskChangeHistory Utils", () => {
    let projectRiskUtils: any;

    beforeAll(async () => {
      projectRiskUtils = await import("../../utils/projectRiskChangeHistory.utils");
    });

    it("recordProjectRiskChange should delegate with 'risk' type", async () => {
      await projectRiskUtils.recordProjectRiskChange(
        1,
        "created",
        2,
        "tenant",
        "severity",
        null,
        "high"
      );

      expect(mockRecordEntityChange).toHaveBeenCalledWith(
        "risk",
        1,
        "created",
        2,
        "tenant",
        "severity",
        null,
        "high",
        undefined
      );
    });
  });

  /**
   * Test useCaseChangeHistory.utils.ts delegation
   */
  describe("UseCaseChangeHistory Utils", () => {
    let useCaseUtils: any;

    beforeAll(async () => {
      useCaseUtils = await import("../../utils/useCaseChangeHistory.utils");
    });

    it("recordUseCaseChange should delegate with 'use_case' type", async () => {
      await useCaseUtils.recordUseCaseChange(
        1,
        "updated",
        2,
        "tenant",
        "description",
        "old desc",
        "new desc"
      );

      expect(mockRecordEntityChange).toHaveBeenCalledWith(
        "use_case",
        1,
        "updated",
        2,
        "tenant",
        "description",
        "old desc",
        "new desc",
        undefined
      );
    });
  });

  /**
   * Test transaction propagation for all deprecated utils
   */
  describe("Transaction Propagation", () => {
    let vendorUtils: any;
    const mockTransaction = { id: "test-transaction" } as any;

    beforeAll(async () => {
      vendorUtils = await import("../../utils/vendorChangeHistory.utils");
    });

    it("should propagate transaction to recordVendorChange", async () => {
      await vendorUtils.recordVendorChange(
        1,
        "created",
        2,
        "tenant",
        "name",
        "old",
        "new",
        mockTransaction
      );

      expect(mockRecordEntityChange).toHaveBeenCalledWith(
        "vendor",
        1,
        "created",
        2,
        "tenant",
        "name",
        "old",
        "new",
        mockTransaction
      );
    });

    it("should propagate transaction to recordMultipleFieldChanges", async () => {
      const changes = [{ fieldName: "name", oldValue: "old", newValue: "new" }];

      await vendorUtils.recordMultipleFieldChanges(
        1,
        2,
        "tenant",
        changes,
        mockTransaction
      );

      expect(mockRecordMultipleFieldChanges).toHaveBeenCalledWith(
        "vendor",
        1,
        2,
        "tenant",
        changes,
        mockTransaction
      );
    });

    it("should propagate transaction to recordVendorCreation", async () => {
      await vendorUtils.recordVendorCreation(
        1,
        2,
        "tenant",
        { vendor_name: "Test" },
        mockTransaction
      );

      expect(mockRecordEntityCreation).toHaveBeenCalledWith(
        "vendor",
        1,
        2,
        "tenant",
        { vendor_name: "Test" },
        mockTransaction
      );
    });

    it("should propagate transaction to recordVendorDeletion", async () => {
      await vendorUtils.recordVendorDeletion(1, 2, "tenant", mockTransaction);

      expect(mockRecordEntityDeletion).toHaveBeenCalledWith(
        "vendor",
        1,
        2,
        "tenant",
        mockTransaction
      );
    });
  });

  /**
   * Test return value passthrough
   */
  describe("Return Value Passthrough", () => {
    let vendorUtils: any;

    beforeAll(async () => {
      vendorUtils = await import("../../utils/vendorChangeHistory.utils");
    });

    it("should return history data from getVendorChangeHistory", async () => {
      const expectedData = {
        data: [{ id: 1, action: "created" }],
        hasMore: true,
        total: 10,
      };
      mockGetEntityChangeHistory.mockResolvedValueOnce(expectedData);

      const result = await vendorUtils.getVendorChangeHistory(1, "tenant");

      expect(result).toEqual(expectedData);
    });

    it("should return changes from trackVendorChanges", async () => {
      const expectedChanges = [
        { fieldName: "name", oldValue: "old", newValue: "new" },
      ];
      mockTrackEntityChanges.mockResolvedValueOnce(expectedChanges);

      const result = await vendorUtils.trackVendorChanges(
        { vendor_name: "old" },
        { vendor_name: "new" }
      );

      expect(result).toEqual(expectedChanges);
    });
  });

  /**
   * Test API signature compatibility
   */
  describe("API Signature Compatibility", () => {
    it("vendorChangeHistory exports should have correct function signatures", async () => {
      const vendorUtils = await import("../../utils/vendorChangeHistory.utils");

      expect(typeof vendorUtils.recordVendorChange).toBe("function");
      expect(typeof vendorUtils.recordMultipleFieldChanges).toBe("function");
      expect(typeof vendorUtils.getVendorChangeHistory).toBe("function");
      expect(typeof vendorUtils.trackVendorChanges).toBe("function");
      expect(typeof vendorUtils.recordVendorCreation).toBe("function");
      expect(typeof vendorUtils.recordVendorDeletion).toBe("function");
    });

    it("vendorRiskChangeHistory exports should have correct function signatures", async () => {
      const utils = await import("../../utils/vendorRiskChangeHistory.utils");

      expect(typeof utils.recordVendorRiskChange).toBe("function");
      expect(typeof utils.recordMultipleFieldChanges).toBe("function");
      expect(typeof utils.getVendorRiskChangeHistory).toBe("function");
      expect(typeof utils.trackVendorRiskChanges).toBe("function");
      expect(typeof utils.recordVendorRiskCreation).toBe("function");
      expect(typeof utils.recordVendorRiskDeletion).toBe("function");
    });

    it("policyChangeHistory exports should have correct function signatures", async () => {
      const utils = await import("../../utils/policyChangeHistory.utils");

      expect(typeof utils.recordPolicyChange).toBe("function");
      expect(typeof utils.recordMultipleFieldChanges).toBe("function");
      expect(typeof utils.getPolicyChangeHistory).toBe("function");
      expect(typeof utils.trackPolicyChanges).toBe("function");
      expect(typeof utils.recordPolicyCreation).toBe("function");
      expect(typeof utils.recordPolicyDeletion).toBe("function");
    });
  });
});
