import { generateReport } from "../repository/entity.repository";
import { downloadFileFromManager } from "../repository/file.repository";
import { triggerBrowserDownload } from "../../presentation/utils/browserDownload.utils";

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
 * Downloads a file by ID and triggers browser download
 *
 * @param fileId - The file ID to download
 * @param fileName - The name to save the file as
 * @throws Error if download fails
 */
export const handleDownload = async (fileId: string, fileName: string): Promise<void> => {
  try {
   const response = await downloadFileFromManager({
      id: typeof fileId === 'string' ? fileId : String(fileId),
    });
    const blob = new Blob([response], { type: response.type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};

/**
 * Generates a report and triggers automatic download
 *
 * @param requestBody - Report generation parameters
 * @returns HTTP status code (200 for success, 500 for error)
 */
export const handleAutoDownload = async (requestBody: GenerateReportProps): Promise<number> => {
  try {
    const response = await generateReport({
      routeUrl: `/reporting/generate-report`,
      body: requestBody
    });

    if (response.status === 200) {
      // Extract filename from Content-Disposition header
      const headerContent = response.headers.get('Content-Disposition');
      // Defensive: safely extract filename from Content-Disposition header
      const fileName = headerContent
        ? ([...headerContent.matchAll(/"([^"]+)"/g)].map(m => m[1])[0] || 'report')
        : 'report';

      // Get blob content and content type
      const blobFileContent = response.data;
      const responseType = response.headers.get('Content-Type');


      // Create blob and trigger download (DRY: using shared utility)
      const blob = new Blob([blobFileContent], { type: responseType || undefined });
      triggerBrowserDownload(blob, fileName[0] || 'report');

      return response.status;
    } else {
      console.error("--- Error downloading report");
      return response.status;
    }
  } catch (error) {
    console.error("*** Error generating report", error);
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
/*
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
*/
