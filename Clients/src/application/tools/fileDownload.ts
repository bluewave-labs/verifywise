import { generateReport } from "../repository/entity.repository";
import { getFileById } from "../repository/file.repository";
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
      const fileAttachment = [...headerContent.matchAll(/"([^"]+)"/g)];
      const fileName = fileAttachment.map(m => m[1]);

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