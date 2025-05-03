import { getEntityById, generatReport } from "../repository/entity.repository";

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

export const handleAutoDownload = async (requestBody: any) => {
  try {
    const response = await generatReport({
      routeUrl: `/reporting/generate-report`,
      body: requestBody
    });
    console.log('download report - ', response)
    if (response.status === 200) {
      const blobFileContent = response.data;
      const blob = new Blob([blobFileContent.file], { type: response.type });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = blobFileContent.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } else {
      console.error("Error downloading report");
    }
  } catch (error) {
    console.error("Error generating report", error);
  }
};

