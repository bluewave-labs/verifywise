/**
 * Shadow AI PDF Generator
 *
 * Renders EJS template → PDF via Playwright.
 * Reuses browser singleton from the main reporting service.
 */

import { chromium, Browser, Page } from "playwright";
import * as ejs from "ejs";
import * as path from "path";
import * as fs from "fs";
import { ShadowAIReportData } from "./dataCollector";

export interface ReportGenerationResult {
  success: boolean;
  filename: string;
  content: Buffer;
  mimeType: string;
  error?: string;
}

// Browser singleton
let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

    browserInstance = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      ...(executablePath ? { executablePath } : {}),
    });
  }
  return browserInstance;
}

/**
 * Close the browser singleton for cleanup.
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Generate Shadow AI PDF report
 */
export async function generateShadowAIPDF(
  reportData: ShadowAIReportData,
  charts: Record<string, string>
): Promise<ReportGenerationResult> {
  let page: Page | null = null;

  try {
    const templatePath = path.join(
      __dirname,
      "../../templates/shadow-ai-reports/report-pdf.ejs"
    );
    const pdfCssPath = path.join(
      __dirname,
      "../../templates/shadow-ai-reports/styles/pdf.css"
    );
    const pdfCss = fs.readFileSync(pdfCssPath, "utf-8");
    const templateContent = fs.readFileSync(templatePath, "utf-8");

    const html = ejs.render(templateContent, {
      ...reportData,
      charts,
      include: (filePath: string) => {
        if (filePath.includes("pdf.css")) {
          return pdfCss;
        }
        return "";
      },
    });

    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "0.75in",
        right: "0.75in",
        bottom: "0.75in",
        left: "0.75in",
      },
      printBackground: true,
      displayHeaderFooter: false,
    });

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const filename = `ShadowAI_Report_${timestamp}.pdf`;

    return {
      success: true,
      filename,
      content: Buffer.from(pdfBuffer),
      mimeType: "application/pdf",
    };
  } catch (error) {
    console.error("[ShadowAI PDF] Error generating PDF:", error);
    return {
      success: false,
      filename: "",
      content: Buffer.alloc(0),
      mimeType: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    if (page) {
      await page.close();
    }
  }
}
