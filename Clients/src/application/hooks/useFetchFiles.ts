import { useState, useEffect } from "react";
import { getEntityById } from "../repository/entity.repository";

interface FileData {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  uploader: string;
}

export const useFetchFiles = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllFiles = async () => {
      try {
        setLoading(true);
        const filesData: FileData[] = await getEntityById({
          routeUrl: "/files",
        });

        if (filesData && Array.isArray(filesData)) {
          const formattedFiles: FileData[] = filesData.map((file) => ({
            id: file.id,
            name: file.name,
            type: file.type || "N/A",
            uploadDate: new Date(file.uploadDate).toLocaleDateString(),
            uploader: file.uploader || "N/A",
          }));
          setFiles(formattedFiles);
        } else {
          setFiles([]);
        }
      } catch (error) {
        console.error("Error fetching files", error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllFiles();
  }, []);

  return { files, loading };
};
