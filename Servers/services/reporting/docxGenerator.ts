/**
 * DOCX Generator Service
 * Uses @turbodocx/html-to-docx for DOCX generation
 * Following VerifyWise clean architecture patterns
 */

import * as ejs from "ejs";
import * as path from "path";
import * as fs from "fs";
import HTMLtoDOCX from "@turbodocx/html-to-docx";
import { ReportData, ReportGenerationResult } from "../../domain.layer/interfaces/i.reportGeneration";
// import { screenshotChart } from "./pdfGenerator"; // For future chart image generation

/**
 * Render EJS template to HTML string for DOCX
 */
async function renderDocxTemplate(
  reportData: ReportData,
  chartImages?: Record<string, string>
): Promise<string> {
  const templatePath = path.join(
    __dirname,
    "../../templates/reports/report-docx.ejs"
  );

  // Read CSS files
  const docxCssPath = path.join(
    __dirname,
    "../../templates/reports/styles/docx.css"
  );
  const docxCss = fs.readFileSync(docxCssPath, "utf-8");

  const templateContent = fs.readFileSync(templatePath, "utf-8");

  // Render with EJS
  const html = ejs.render(templateContent, {
    ...reportData,
    chartImages: chartImages || {},
    // Include helper for CSS inclusion
    include: (filePath: string) => {
      if (filePath.includes("docx.css")) {
        return docxCss;
      }
      return "";
    },
  });

  return html;
}

/**
 * Generate chart images for DOCX embedding
 * Charts need to be rendered as PNG images for DOCX
 */
async function generateChartImages(
  _reportData: ReportData
): Promise<Record<string, string>> {
  const chartImages: Record<string, string> = {};

  // For now, we'll skip chart image generation
  // In the full implementation, this would:
  // 1. Render charts using Recharts on a hidden page
  // 2. Screenshot each chart
  // 3. Convert to base64 data URIs

  // Placeholder - charts will be added in a future iteration
  // when the frontend report preview route is implemented

  return chartImages;
}

/**
 * Generate DOCX from report data
 */
export async function generateDOCX(
  reportData: ReportData
): Promise<ReportGenerationResult> {
  try {
    // Generate chart images (if any charts are needed)
    const chartImages = await generateChartImages(reportData);

    // Render HTML template
    const html = await renderDocxTemplate(reportData, chartImages);

    // Convert HTML to DOCX
    const docxResult = await HTMLtoDOCX(html, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
      font: "Arial",
      margins: {
        top: 1440, // 1 inch in twips (1440 twips = 1 inch)
        right: 1440,
        bottom: 1440,
        left: 1440,
      },
    });

    // Convert result to Buffer (handle different return types)
    let docxBuffer: Buffer;
    if (Buffer.isBuffer(docxResult)) {
      docxBuffer = docxResult;
    } else if (docxResult instanceof ArrayBuffer) {
      docxBuffer = Buffer.from(new Uint8Array(docxResult));
    } else if (docxResult instanceof Blob) {
      const arrayBuffer = await docxResult.arrayBuffer();
      docxBuffer = Buffer.from(new Uint8Array(arrayBuffer));
    } else {
      docxBuffer = Buffer.from(docxResult as any);
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `${reportData.metadata.projectTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${reportData.metadata.frameworkName.replace(/[^a-zA-Z0-9]/g, "_")}_${timestamp}.docx`;

    return {
      success: true,
      filename,
      content: docxBuffer,
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  } catch (error) {
    console.error("Error generating DOCX:", error);
    return {
      success: false,
      filename: "",
      content: Buffer.alloc(0),
      mimeType: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate DOCX with embedded chart images
 * This is used when chart images are pre-generated
 */
export async function generateDOCXWithCharts(
  reportData: ReportData,
  chartImages: Record<string, string>
): Promise<ReportGenerationResult> {
  try {
    // Render HTML template with chart images
    const html = await renderDocxTemplate(reportData, chartImages);

    // Convert HTML to DOCX
    const docxResult = await HTMLtoDOCX(html, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
      font: "Arial",
      margins: {
        top: 1440,
        right: 1440,
        bottom: 1440,
        left: 1440,
      },
    });

    // Convert result to Buffer (handle different return types)
    let docxBuffer: Buffer;
    if (Buffer.isBuffer(docxResult)) {
      docxBuffer = docxResult;
    } else if (docxResult instanceof ArrayBuffer) {
      docxBuffer = Buffer.from(new Uint8Array(docxResult));
    } else if (docxResult instanceof Blob) {
      const arrayBuffer = await docxResult.arrayBuffer();
      docxBuffer = Buffer.from(new Uint8Array(arrayBuffer));
    } else {
      docxBuffer = Buffer.from(docxResult as any);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `${reportData.metadata.projectTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${timestamp}.docx`;

    return {
      success: true,
      filename,
      content: docxBuffer,
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  } catch (error) {
    console.error("Error generating DOCX with charts:", error);
    return {
      success: false,
      filename: "",
      content: Buffer.alloc(0),
      mimeType: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
