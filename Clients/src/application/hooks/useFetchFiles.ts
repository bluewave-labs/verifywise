import { useState, useEffect } from "react";
import { getEntityById } from "../repository/entity.repository";
import { FileData} from "../../domain/File"

export const useFetchFiles = (projectID:string) => {
  const [filesData, setFilesData] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFilesData = async () => {
      try {
        setLoading(true);
       const routeUrl = projectID ? `/files/by-projid/${projectID}` : "/files";
       const filesResponse = await getEntityById({ routeUrl });

        if (filesResponse && Array.isArray(filesResponse)) {
          setFilesData(
            filesResponse.map((file) => ({
              id: file.id,
              filename: file.filename,
              type: file.type || "N/A",
              uploadDate: file.uploadDate ? new Date(file.uploadDate).toLocaleDateString() : "Invalid Date",
              uploader: file.uploader || "N/A",
            }))
          );
        } else {
            setFilesData([]);
        }
    } catch (error) {
        console.error("error fetching files",error);
        setFilesData([]);
    } finally {
        setLoading(false);
    }
    };
    fetchFilesData();
  }, [projectID]);

  return { filesData, loading };
};
