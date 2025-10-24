/**
 * @fileoverview File Download and Delete Operations
 *
 * Application layer handlers for file operations.
 * Uses presentation layer utilities for browser download and centralized error handling.
 *
 * @module application/tools/fileDownload
 */

import { generateReport } from "../repository/entity.repository";
import { getFileById, downloadFileFromManager, deleteFileFromManager } from "../repository/file.repository";
import { triggerBrowserDownload, extractFilenameFromHeaders } from "../../presentation/utils/browserDownload.utils";
import { getFileErrorMessage } from "../utils/fileErrorHandler.utils";

interface GenerateReportProps {
  projectId: number | null;
  projectTitle: string;
  projectOwner: string;
  reportType: string;
  reportName: string;
  frameworkId: number;
  projectFrameworkId: number;
}

/**
 * Downloads a file by ID (general file download)
 *
 * @param {string} fileId - The file identifier
 * @param {string} fileName - The name to save the file as
 * @throws {Error} If download fails
 */
export const handleDownload = async (fileId: string, fileName: string) => {
  try {
    const response = await getFileById({
      id: typeof fileId === 'string' ? fileId : String(fileId),
      responseType: "blob",
    });

    const blob = new Blob([response], { type: response.type });
    triggerBrowserDownload(blob, fileName);
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};

/**
 * Downloads a file from the file manager
 *
 * @param {string} fileId - The file identifier
 * @param {string} fileName - The name to save the file as
 * @throws {Error} If download fails
 */
export const handleFileManagerDownload = async (
  fileId: string,
  fileName: string
) => {
  try {
    const response = await downloadFileFromManager({
      id: typeof fileId === 'string' ? fileId : String(fileId),
    });

    // Validate response
    if (!response || response.size === 0) {
      throw new Error("File not found or empty");
    }

    const blob = new Blob([response], { type: response.type });
    triggerBrowserDownload(blob, fileName);
  } catch (error: any) {
    const errorMessage = getFileErrorMessage(error, "download");
    console.error("Error downloading file from file manager:", error);
    alert(errorMessage);
    throw error;
  }
};

/**
 * Generates and auto-downloads a report
 *
 * @param {GenerateReportProps} requestBody - Report generation parameters
 * @returns {Promise<number>} HTTP status code
 */
export const handleAutoDownload = async (requestBody: GenerateReportProps) => {
  try {
    const response = await generateReport({
      routeUrl: `/reporting/generate-report`,
      body: requestBody
    });

    if (response.status === 200) {
      const fileName = extractFilenameFromHeaders(
        response.headers,
        `${requestBody.reportName}.pdf`
      );

      const blob = new Blob([response.data], {
        type: response.headers.get('Content-Type') || 'application/pdf'
      });

      triggerBrowserDownload(blob, fileName);
      return response.status;
    } else {
      console.error("Error downloading report - status:", response.status);
      return response.status;
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return 500;
  }
};

/**
 * Deletes a file from the file manager
 *
 * @param {string} fileId - The file identifier
 * @param {Function} [onSuccess] - Callback to execute on successful deletion
 * @throws {Error} If deletion fails
 */
export const handleFileDelete = async (
  fileId: string,
  onSuccess?: () => void
) => {
  try {
    const response = await deleteFileFromManager({
      id: typeof fileId === "string" ? fileId : String(fileId),
    });

    console.log("File deleted successfully:", response);

    // Call onSuccess callback if provided (e.g., to refresh the file list)
    if (onSuccess) {
      onSuccess();
    }
  } catch (error: any) {
    const errorMessage = getFileErrorMessage(error, "delete");
    console.error("Error deleting file from file manager:", error);
    alert(errorMessage);
    throw error;
  }
};

