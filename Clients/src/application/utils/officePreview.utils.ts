/**
 * @fileoverview Office File Preview Utilities
 *
 * Utilities for extracting text preview from DOCX and XLSX files.
 * These formats are ZIP archives containing XML files with the content.
 *
 * @module application/utils/officePreview
 */

import JSZip from "jszip";

/**
 * Preview result containing extracted text or error
 */
export interface OfficePreviewResult {
  success: boolean;
  text?: string;
  error?: string;
  type: "docx" | "xlsx" | "unknown";
}

/**
 * Maximum characters to extract for preview
 */
const MAX_PREVIEW_LENGTH = 1000;

/**
 * Extract text content from a DOCX file
 *
 * DOCX files are ZIP archives with XML content in word/document.xml
 * The text is contained within <w:t> tags
 */
async function extractDocxText(zip: JSZip): Promise<string> {
  const documentXml = zip.file("word/document.xml");
  if (!documentXml) {
    throw new Error("Invalid DOCX: document.xml not found");
  }

  const xmlContent = await documentXml.async("string");

  // Extract text from <w:t> tags (Word text elements)
  // Also handle paragraph breaks <w:p> by adding newlines
  let text = "";
  let inParagraph = false;

  // Simple XML parsing - extract text between <w:t> tags
  const textMatches = xmlContent.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g);
  const paragraphStarts = [...xmlContent.matchAll(/<w:p[^>]*>/g)].map(
    (m) => m.index
  );
  const paragraphEnds = [...xmlContent.matchAll(/<\/w:p>/g)].map((m) => m.index);

  let lastParagraphEnd = 0;

  for (const match of textMatches) {
    const matchIndex = match.index || 0;

    // Check if we've entered a new paragraph
    for (const pStart of paragraphStarts) {
      if (pStart !== undefined && pStart > lastParagraphEnd && pStart < matchIndex) {
        if (text.length > 0 && !text.endsWith("\n")) {
          text += "\n";
        }
        // Find corresponding paragraph end
        const pEnd = paragraphEnds.find((e) => e !== undefined && e > pStart);
        if (pEnd) {
          lastParagraphEnd = pEnd;
        }
        break;
      }
    }

    text += match[1];
  }

  // Clean up multiple newlines and trim
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return text;
}

/**
 * Extract text content from an XLSX file
 *
 * XLSX files store shared strings in xl/sharedStrings.xml
 * and cell data in xl/worksheets/sheet1.xml
 */
async function extractXlsxText(zip: JSZip): Promise<string> {
  const lines: string[] = [];

  // Try to get shared strings (text values are stored here)
  const sharedStringsFile = zip.file("xl/sharedStrings.xml");
  const sharedStrings: string[] = [];

  if (sharedStringsFile) {
    const sharedStringsXml = await sharedStringsFile.async("string");
    // Extract text from <t> tags within shared strings
    const matches = sharedStringsXml.matchAll(/<t[^>]*>([^<]*)<\/t>/g);
    for (const match of matches) {
      sharedStrings.push(match[1]);
    }
  }

  // Get the first worksheet
  const sheet1 = zip.file("xl/worksheets/sheet1.xml");
  if (!sheet1) {
    // If no sheet1, just return shared strings
    if (sharedStrings.length > 0) {
      return sharedStrings.slice(0, 50).join(" | ");
    }
    throw new Error("Invalid XLSX: no worksheet found");
  }

  const sheetXml = await sheet1.async("string");

  // Extract rows - simplified approach
  // Look for <row> elements and extract cell values
  const rowMatches = sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g);
  let rowCount = 0;

  for (const rowMatch of rowMatches) {
    if (rowCount >= 10) break; // Limit to first 10 rows for preview

    const rowContent = rowMatch[1];
    const cells: string[] = [];

    // Extract cell values
    // Cells with shared string reference have t="s" and <v> contains the index
    // Cells with inline values have the value directly in <v>
    const cellMatches = rowContent.matchAll(/<c[^>]*>([\s\S]*?)<\/c>/g);

    for (const cellMatch of cellMatches) {
      const cellContent = cellMatch[0];
      const valueMatch = cellContent.match(/<v>([^<]*)<\/v>/);

      if (valueMatch) {
        // Check if it's a shared string reference
        if (cellContent.includes('t="s"')) {
          const index = parseInt(valueMatch[1], 10);
          if (sharedStrings[index] !== undefined) {
            cells.push(sharedStrings[index]);
          }
        } else {
          // Direct value (number or inline string)
          cells.push(valueMatch[1]);
        }
      }
    }

    if (cells.length > 0) {
      lines.push(cells.join(" | "));
      rowCount++;
    }
  }

  return lines.join("\n");
}

/**
 * Check if blob is a DOCX file by checking for word/document.xml
 */
async function isDocx(zip: JSZip): Promise<boolean> {
  return zip.file("word/document.xml") !== null;
}

/**
 * Check if blob is an XLSX file by checking for xl/workbook.xml
 */
async function isXlsx(zip: JSZip): Promise<boolean> {
  return zip.file("xl/workbook.xml") !== null;
}

/**
 * Extract preview text from an Office file (DOCX or XLSX)
 *
 * @param blob - The file blob to preview
 * @returns Preview result with extracted text or error
 */
export async function getOfficeFilePreview(
  blob: Blob
): Promise<OfficePreviewResult> {
  try {
    const zip = await JSZip.loadAsync(blob);

    let text: string;
    let type: "docx" | "xlsx" | "unknown";

    if (await isDocx(zip)) {
      type = "docx";
      text = await extractDocxText(zip);
    } else if (await isXlsx(zip)) {
      type = "xlsx";
      text = await extractXlsxText(zip);
    } else {
      return {
        success: false,
        error: "Unsupported file format",
        type: "unknown",
      };
    }

    // Truncate if too long
    if (text.length > MAX_PREVIEW_LENGTH) {
      text = text.substring(0, MAX_PREVIEW_LENGTH) + "...";
    }

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: "No text content found in file",
        type,
      };
    }

    return {
      success: true,
      text,
      type,
    };
  } catch (error) {
    console.error("Error extracting office file preview:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse file",
      type: "unknown",
    };
  }
}

/**
 * Check if a mimetype is a supported Office format
 */
export function isOfficeFile(mimetype?: string): boolean {
  if (!mimetype) return false;

  const officeTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
  ];

  return officeTypes.includes(mimetype);
}

/**
 * Get a friendly label for the office file type
 */
export function getOfficeFileLabel(mimetype?: string): string {
  if (!mimetype) return "Office Document";

  if (mimetype.includes("wordprocessingml")) {
    return "Word Document";
  }
  if (mimetype.includes("spreadsheetml")) {
    return "Excel Spreadsheet";
  }

  return "Office Document";
}
