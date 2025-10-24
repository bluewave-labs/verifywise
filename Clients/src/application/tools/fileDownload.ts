import { generateReport } from "../repository/entity.repository";
import { getFileById, downloadFileFromManager, deleteFileFromManager } from "../repository/file.repository";

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
  fileName: string
) => {
  try {
    const response = await downloadFileFromManager({
      id: typeof fileId === 'string' ? fileId : String(fileId),
    });

    // Check if response is valid
    if (!response || response.size === 0) {
      const errorMsg = "File not found or empty. It may have been deleted from the server.";
      console.error(errorMsg);
      alert(errorMsg + "\n\nPlease refresh the page to update the file list.");
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
    // Extract user-friendly error message
    let errorMessage = "Failed to download file. The file may have been deleted or you don't have permission.";

    // Check if it's a CustomException with specific message
    if (error?.message?.includes("not found")) {
      errorMessage = "File not found on the server. It may have been manually deleted.\n\nPlease refresh the page to update the file list.";
    } else if (error?.message?.includes("permission")) {
      errorMessage = "You don't have permission to download this file.";
    } else if (error?.statusCode === 404) {
      errorMessage = "File not found on the server. It may have been deleted.\n\nPlease refresh the page to update the file list.";
    } else if (error?.statusCode === 403) {
      errorMessage = "Access denied. You don't have permission to download this file.";
    }

    console.error("Error downloading file from file manager:", error);
    alert(errorMessage);
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
    // Extract user-friendly error message
    let errorMessage = "Failed to delete file. You may not have permission to delete this file.";

    if (error?.message?.includes("not found")) {
      errorMessage = "File not found on the server. It may have already been deleted.\n\nPlease refresh the page to update the file list.";
    } else if (error?.message?.includes("permission") || error?.message?.includes("denied")) {
      errorMessage = "You don't have permission to delete this file.";
    } else if (error?.statusCode === 404) {
      errorMessage = "File not found on the server. It may have already been deleted.\n\nPlease refresh the page to update the file list.";
    } else if (error?.statusCode === 403) {
      errorMessage = "Access denied. You don't have permission to delete this file.";
    }

    console.error("Error deleting file from file manager:", error);
    alert(errorMessage);
    throw error;
  }
};

