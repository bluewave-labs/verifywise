import { generateReport } from "../repository/entity.repository";
import { getFileById } from "../repository/file.repository";

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

export const handleAutoDownload = async (requestBody: GenerateReportProps): Promise<number> => {
  try {
    const response = await generateReport({
      routeUrl: `/reporting/generate-report`,
      body: requestBody
    });

    if (response.status === 200) {
      // Defensive: safely extract filename from Content-Disposition header
      const headerContent = response.headers.get('Content-Disposition');
      const fileName = headerContent
        ? ([...headerContent.matchAll(/"([^"]+)"/g)].map(m => m[1])[0] || 'report')
        : 'report';

      const blobFileContent = response.data;
      const responseType = response.headers.get('Content-Type');

      const blob = new Blob([blobFileContent], { type: responseType || undefined });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
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
