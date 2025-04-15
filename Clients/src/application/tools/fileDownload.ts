import { getEntityById } from "../repository/entity.repository";

export const handleDownload = async (fileId: string, fileName: string) => {
  try {
    const response = await getEntityById({
      routeUrl: `/files/${fileId}`,
    });
    const blob = new Blob([response], { type: "application/octet-stream" });
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
