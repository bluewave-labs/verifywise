import { getEntityById, generateReport } from "../repository/entity.repository";

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
    const response = await getEntityById({
      routeUrl: `/files/${fileId}`,
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

