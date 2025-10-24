import { generateReport } from "../repository/entity.repository";
import { getFileById, downloadFileFromManager } from "../repository/file.repository";

interface GenerateReportProps {
  projectId: number | null;
  projectTitle: string;
  projectOwner: string;
  reportType: string;
  reportName: string;
  frameworkId: number;
  projectFrameworkId: number;
}

export const handleDownload = async (fileId: string, fileName: string) => {
  try {
   const response = await getFileById({
      id: typeof fileId === 'string' ? fileId : String(fileId),
      responseType: "blob",
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

export const handleFileManagerDownload = async (
  fileId: string,
  fileName: string,
  onError?: (message: string) => void
) => {
  try {
    const response = await downloadFileFromManager({
      id: typeof fileId === 'string' ? fileId : String(fileId),
    });

    // Check if response is valid
    if (!response || response.size === 0) {
      const errorMsg = "File not found or empty. It may have been deleted.";
      console.error(errorMsg);
      if (onError) onError(errorMsg);
      throw new Error(errorMsg);
    }

    const blob = new Blob([response], { type: response.type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to download file. The file may have been deleted or you don't have permission.";
    console.error("Error downloading file from file manager:", error);

    if (onError) {
      onError(errorMessage);
    } else {
      // Fallback: show browser alert if no error handler provided
      alert(errorMessage);
    }

    throw error;
  }
};

export const handleAutoDownload = async (requestBody: GenerateReportProps) => {
  try {
    const response = await generateReport({
      routeUrl: `/reporting/generate-report`,
      body: requestBody
    });

    if (response.status === 200) {
      const headerContent = response.headers.get('Content-Disposition');
      const fileAttachment = [...headerContent.matchAll(/"([^"]+)"/g)];
      const fileName = fileAttachment.map(m => m[1]);

      const blobFileContent = response.data;
      const responseType = response.headers.get('Content-Type');

      const blob = new Blob([blobFileContent], { type: responseType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName[0];
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
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

