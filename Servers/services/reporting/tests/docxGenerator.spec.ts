/**
 * DOCX Generator Unit Tests
 * Tests for @turbodocx/html-to-docx based generation
 */

// Mock dependencies before importing
jest.mock("ejs", () => ({
  render: jest.fn().mockReturnValue("<html><body>Test</body></html>"),
}));

jest.mock("fs", () => ({
  readFileSync: jest.fn().mockReturnValue("mock content"),
}));

jest.mock("@turbodocx/html-to-docx", () => jest.fn());

import { generateDOCX, generateDOCXWithCharts } from "../docxGenerator";
import HTMLtoDOCX from "@turbodocx/html-to-docx";
import { ReportData } from "../../../domain.layer/interfaces/i.reportGeneration";

describe("DOCX Generator", () => {
  const mockReportData: ReportData = {
    metadata: {
      projectId: 1,
      projectTitle: "Test Project",
      projectOwner: "John Doe",
      frameworkId: 1,
      frameworkName: "EU AI Act",
      projectFrameworkId: 1,
      generatedAt: new Date("2024-01-15"),
      generatedBy: "Test User",
      tenantId: "test-tenant",
    },
    branding: {
      organizationName: "Test Org",
      primaryColor: "#13715B",
      secondaryColor: "#1C2130",
    },
    charts: {},
    renderedCharts: {},
    sections: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (HTMLtoDOCX as jest.Mock).mockResolvedValue(Buffer.from("DOCX content"));
  });

  describe("generateDOCX", () => {
    it("should generate DOCX successfully", async () => {
      const result = await generateDOCX(mockReportData);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      expect(result.content).toBeInstanceOf(Buffer);
    });

    it("should call HTMLtoDOCX with correct options", async () => {
      await generateDOCX(mockReportData);

      expect(HTMLtoDOCX).toHaveBeenCalledWith(
        expect.any(String),
        null,
        expect.objectContaining({
          table: { row: { cantSplit: true } },
          footer: true,
          pageNumber: true,
          font: "Arial",
          margins: expect.objectContaining({
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
          }),
        })
      );
    });

    it("should generate filename with project and framework names", async () => {
      const result = await generateDOCX(mockReportData);

      expect(result.filename).toContain("Test_Project");
      expect(result.filename).toContain("EU_AI_Act");
      expect(result.filename.endsWith(".docx")).toBe(true);
    });

    it("should handle Buffer result", async () => {
      (HTMLtoDOCX as jest.Mock).mockResolvedValue(Buffer.from("test"));

      const result = await generateDOCX(mockReportData);

      expect(result.success).toBe(true);
      expect(result.content).toBeInstanceOf(Buffer);
    });

    it("should handle ArrayBuffer result", async () => {
      const arrayBuffer = new ArrayBuffer(8);
      (HTMLtoDOCX as jest.Mock).mockResolvedValue(arrayBuffer);

      const result = await generateDOCX(mockReportData);

      expect(result.success).toBe(true);
      expect(result.content).toBeInstanceOf(Buffer);
    });

    it("should handle errors gracefully", async () => {
      (HTMLtoDOCX as jest.Mock).mockRejectedValue(
        new Error("DOCX generation failed")
      );

      const result = await generateDOCX(mockReportData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("DOCX generation failed");
    });

    it("should return empty buffer on error", async () => {
      (HTMLtoDOCX as jest.Mock).mockRejectedValue(new Error("Error"));

      const result = await generateDOCX(mockReportData);

      expect(result.content.length).toBe(0);
    });
  });

  describe("generateDOCXWithCharts", () => {
    const mockChartImages = {
      riskChart: "data:image/png;base64,abc123",
      complianceChart: "data:image/png;base64,def456",
    };

    it("should generate DOCX with chart images", async () => {
      const result = await generateDOCXWithCharts(mockReportData, mockChartImages);

      expect(result.success).toBe(true);
      expect(HTMLtoDOCX).toHaveBeenCalled();
    });

    it("should include chart images in rendered HTML", async () => {
      const ejs = require("ejs");

      await generateDOCXWithCharts(mockReportData, mockChartImages);

      // EJS.render should be called with chartImages
      expect(ejs.render).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          chartImages: mockChartImages,
        })
      );
    });

    it("should handle empty chart images", async () => {
      const result = await generateDOCXWithCharts(mockReportData, {});

      expect(result.success).toBe(true);
    });

    it("should handle errors gracefully", async () => {
      (HTMLtoDOCX as jest.Mock).mockRejectedValue(new Error("Error with charts"));

      const result = await generateDOCXWithCharts(mockReportData, mockChartImages);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error with charts");
    });
  });
});
