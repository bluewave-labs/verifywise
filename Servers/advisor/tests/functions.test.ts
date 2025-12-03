import {
  afterEach, 
  beforeEach, 
  describe, 
  expect, 
  it, 
  jest} from '@jest/globals';
import * as riskUtils from "../../utils/risk.utils";
import { availableTools } from "../functions";
import {
  mockRisks,
  mockEmptyRisks,
  mockProjectRisks,
  mockFrameworkRisks,
  createMockRisk,
} from "../mocks/mockRiskData";
import { createMockTenant } from '../mocks/mockTenant';


// Mock the utility modules
jest.mock("../../utils/risk.utils");
jest.mock("../../utils/history/riskHistory.utils");

describe("Advisor Functions", () => {
  const mockTenant = createMockTenant();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("fetchRisks", () => {
    const fetchRisks = availableTools["fetch_risks"];

    describe("Basic Fetching", () => {
      it("should fetch all risks when no filters provided", async () => {
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(mockRisks);

        const result = await fetchRisks({}, mockTenant);

        expect(riskUtils.getAllRisksQuery).toHaveBeenCalledWith(mockTenant, "active");
        expect(result).toEqual(mockRisks);
        expect(result).toHaveLength(mockRisks.length);
      });

      it("should fetch risks by projectId", async () => {
        jest.spyOn(riskUtils, "getRisksByProjectQuery").mockResolvedValue(mockProjectRisks);

        const result = await fetchRisks({ projectId: 1 }, mockTenant);

        expect(riskUtils.getRisksByProjectQuery).toHaveBeenCalledWith(1, mockTenant, "active");
        expect(result).toEqual(mockProjectRisks);
      });

      it("should fetch risks by frameworkId", async () => {
        jest.spyOn(riskUtils, "getRisksByFrameworkQuery").mockResolvedValue(mockFrameworkRisks);

        const result = await fetchRisks({ frameworkId: 1 }, mockTenant);

        expect(riskUtils.getRisksByFrameworkQuery).toHaveBeenCalledWith(1, mockTenant, "active");
        expect(result).toEqual(mockFrameworkRisks);
      });

      it("should return empty array when no risks found", async () => {
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(mockEmptyRisks);

        const result = await fetchRisks({}, mockTenant);

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });
    });

    describe("Filter Validation", () => {
      beforeEach(() => {
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(mockRisks);
      });

      it("should filter by severity correctly", async () => {
        const result = await fetchRisks({ severity: "Catastrophic" }, mockTenant);

        expect(result.every((r: any) => r.severity === "Catastrophic")).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });

      it("should filter by likelihood correctly", async () => {
        const result = await fetchRisks({ likelihood: "Likely" }, mockTenant);

        expect(result.every((r: any) => r.likelihood === "Likely")).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });

      it("should filter by category (case-insensitive)", async () => {
        const result = await fetchRisks({ category: "privacy" }, mockTenant);

        expect(result.every((r: any) =>
          r.risk_category.some((cat: any) => cat.toLowerCase().includes("privacy"))
        )).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });

      it("should filter by mitigation status", async () => {
        const result = await fetchRisks({ mitigationStatus: "In Progress" }, mockTenant);

        expect(result.every((r: any) => r.mitigation_status === "In Progress")).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });

      it("should filter by risk level", async () => {
        const result = await fetchRisks({ riskLevel: "High risk" }, mockTenant);

        expect(result.every((r: any) => r.risk_level_autocalculated === "High risk")).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });

      it("should filter by AI lifecycle phase", async () => {
        const result = await fetchRisks({ aiLifecyclePhase: "Model development & training" }, mockTenant);

        expect(result.every((r: any) => r.ai_lifecycle_phase === "Model development & training")).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });

      it("should apply multiple filters simultaneously", async () => {
        const result = await fetchRisks({
          severity: "Catastrophic",
          mitigationStatus: "In Progress"
        }, mockTenant);

        expect(result.every((r: any) =>
          r.severity === "Catastrophic" && r.mitigation_status === "In Progress"
        )).toBe(true);
      });
    });

    describe("Limit Functionality", () => {
      beforeEach(() => {
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(mockRisks);
      });

      it("should respect limit parameter", async () => {
        const result = await fetchRisks({ limit: 3 }, mockTenant);

        expect(result).toHaveLength(3);
      });

      it("should return all risks when limit not provided", async () => {
        const result = await fetchRisks({}, mockTenant);

        expect(result).toHaveLength(mockRisks.length);
      });

      it("should handle limit greater than result set", async () => {
        const result = await fetchRisks({ limit: 1000 }, mockTenant);

        expect(result).toHaveLength(mockRisks.length);
      });
    });

    describe("Error Handling", () => {
      it("should throw error when database query fails", async () => {
        jest.spyOn(riskUtils, "getAllRisksQuery").mockRejectedValue(new Error("Database error"));

        await expect(fetchRisks({}, mockTenant)).rejects.toThrow("Failed to fetch risks");
      });

      it("should handle invalid projectId gracefully", async () => {
        jest.spyOn(riskUtils, "getRisksByProjectQuery").mockResolvedValue([]);

        const result = await fetchRisks({ projectId: 99999 }, mockTenant);

        expect(result).toEqual([]);
      });

      it("should handle invalid frameworkId gracefully", async () => {
        jest.spyOn(riskUtils, "getRisksByFrameworkQuery").mockResolvedValue([]);

        const result = await fetchRisks({ frameworkId: 99999 }, mockTenant);

        expect(result).toEqual([]);
      });
    });
  });

  describe("getRiskAnalytics", () => {
    const getRiskAnalytics = availableTools["get_risk_analytics"];

    describe("Risk Matrix Generation", () => {
      it("should create 5x5 matrix with all severity-likelihood combinations", async () => {
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(mockRisks);

        const result = await getRiskAnalytics({}, mockTenant);

        // Check structure
        expect(result).toHaveProperty('riskMatrix');
        expect(result).toHaveProperty('categoryDistribution');
        expect(result).toHaveProperty('mitigationStatusBreakdown');
        expect(result).toHaveProperty('lifecyclePhaseDistribution');
        expect(result).toHaveProperty('riskLevelSummary');
        expect(result).toHaveProperty('totalRisks');

        // Check risk matrix is 5x5
        expect(Object.keys(result.riskMatrix)).toHaveLength(5);
        Object.values(result.riskMatrix).forEach((row: any) => {
          expect(Object.keys(row)).toHaveLength(5);
        });

        // Check categoryDistribution is array
        expect(Array.isArray(result.categoryDistribution)).toBe(true);

        // Check each category has required fields
        result.categoryDistribution.forEach((cat: any) => {
          expect(cat).toHaveProperty('category');
          expect(cat).toHaveProperty('count');
          expect(cat).toHaveProperty('percentage');
          expect(typeof cat.count).toBe('number');
          expect(typeof cat.percentage).toBe('number');
        });

        // Check totalRisks is a number
        expect(typeof result.totalRisks).toBe('number');

        const severities = ["Negligible", "Minor", "Moderate", "Major", "Catastrophic"];
        const likelihoods = ["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"];

        severities.forEach(sev => {
          expect(result.riskMatrix[sev]).toBeDefined();
          likelihoods.forEach(like => {
            expect(result.riskMatrix[sev][like]).toBeDefined();
            expect(typeof result.riskMatrix[sev][like]).toBe("number");
          });
        });
      });

      it("should count risks correctly in each matrix cell", async () => {
        const testRisks = [
          createMockRisk({ severity: "Major", likelihood: "Likely" }),
          createMockRisk({ severity: "Major", likelihood: "Likely" }),
          createMockRisk({ severity: "Moderate", likelihood: "Possible" }),
        ];
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(testRisks);

        const result = await getRiskAnalytics({}, mockTenant);

        expect(result.riskMatrix["Major"]["Likely"]).toBe(2);
        expect(result.riskMatrix["Moderate"]["Possible"]).toBe(1);
      });

      it("should initialize all cells to zero when no risks exist", async () => {
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(mockEmptyRisks);

        const result = await getRiskAnalytics({}, mockTenant);

        Object.values(result.riskMatrix).forEach((row: any) => {
          Object.values(row).forEach(count => {
            expect(count).toBe(0);
          });
        });
      });

      it("should handle missing severity or likelihood data", async () => {
        const testRisks = [
          createMockRisk({ severity: "Major", likelihood: "Likely" }),
          { ...createMockRisk({severity: undefined, likelihood: "Possible"}) } as any,
        ];
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(testRisks);

        const result = await getRiskAnalytics({}, mockTenant);

        // Should only count the valid risk
        expect(result.riskMatrix["Major"]["Likely"]).toBe(1);
      });
    });

    describe("Category Distribution", () => {
      it("should calculate correct counts for each category", async () => {
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(mockRisks);

        const result = await getRiskAnalytics({}, mockTenant);

        expect(result.categoryDistribution).toBeInstanceOf(Array);
        result.categoryDistribution.forEach((cat: any) => {
          expect(cat.count).toBeGreaterThan(0);
        });
      });

      it("should calculate correct percentages", async () => {
        const testRisks = [
          createMockRisk({ risk_category: ["Security"] }),
          createMockRisk({ risk_category: ["Security"] }),
          createMockRisk({ risk_category: ["Privacy"] }),
          createMockRisk({ risk_category: ["Privacy"] }),
        ];
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(testRisks);

        const result = await getRiskAnalytics({}, mockTenant);

        // Security Percentage check
        const securityCat = result.categoryDistribution.find((c: any) => c.category === "Security");
        expect(securityCat?.percentage).toBe(50);

        // Privacy Percentage check
        const privacyCat = result.categoryDistribution.find((c: any) => c.category === "Privacy");
        expect(privacyCat?.percentage).toBe(50);
      });

      it("should handle multi-category risks (array of categories)", async () => {
        const testRisks = [
          createMockRisk({ risk_category: ["Security", "Privacy"] }),
        ];
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(testRisks);

        const result = await getRiskAnalytics({}, mockTenant);

        expect(result.categoryDistribution.some((c: any) => c.category === "Security")).toBe(true);
        expect(result.categoryDistribution.some((c: any) => c.category === "Privacy")).toBe(true);
      });

      it("should sort categories by count descending", async () => {
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(mockRisks);

        const result = await getRiskAnalytics({}, mockTenant);

        for (let i = 0; i < result.categoryDistribution.length - 1; i++) {
          expect(result.categoryDistribution[i].count).toBeGreaterThanOrEqual(
            result.categoryDistribution[i + 1].count
          );
        }
      });

      it("should handle empty category arrays", async () => {
        const testRisks = [
          { ...createMockRisk({}), risk_category: [] },
        ];
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(testRisks);

        const result = await getRiskAnalytics({}, mockTenant);

        expect(result.categoryDistribution).toHaveLength(0);
      });
    });

    describe("Mitigation Status Breakdown", () => {
      it("should count all mitigation statuses", async () => {
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(mockRisks);

        const result = await getRiskAnalytics({}, mockTenant);

        expect(result.mitigationStatusBreakdown).toBeDefined();
        expect(typeof result.mitigationStatusBreakdown).toBe("object");
      });

      it("should default to 'Not Started' for missing status", async () => {
        const testRisks = [
          { ...createMockRisk({}), mitigation_status: undefined } as any,
        ];
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(testRisks);

        const result = await getRiskAnalytics({}, mockTenant);

        expect(result.mitigationStatusBreakdown["Not Started"]).toBe(1);
      });
    });

    describe("Lifecycle Phase Distribution", () => {
      it("should count risks by lifecycle phase", async () => {
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(mockRisks);

        const result = await getRiskAnalytics({}, mockTenant);

        expect(result.lifecyclePhaseDistribution).toBeDefined();
        expect(typeof result.lifecyclePhaseDistribution).toBe("object");
      });
    });

    describe("Risk Level Summary", () => {
      it("should count risks by auto-calculated level", async () => {
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(mockRisks);

        const result = await getRiskAnalytics({}, mockTenant);

        expect(result.riskLevelSummary).toBeDefined();
        expect(typeof result.riskLevelSummary).toBe("object");
      });

      it("should handle missing risk level data", async () => {
        const testRisks = [
          createMockRisk({ risk_level_autocalculated: "High risk" }),
          { ...createMockRisk({}), risk_level_autocalculated: undefined } as any,
        ];
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(testRisks);

        const result = await getRiskAnalytics({}, mockTenant);

        expect(result.riskLevelSummary["High risk"]).toBe(1);
      });

      it("should calculate total risks correctly", async () => {
        jest.spyOn(riskUtils, "getAllRisksQuery").mockResolvedValue(mockRisks);

        const result = await getRiskAnalytics({}, mockTenant);

        expect(result.totalRisks).toBe(mockRisks.length);
      });
    });
  });
});
