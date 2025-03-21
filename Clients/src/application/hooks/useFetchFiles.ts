import { useState, useEffect } from "react";
import { getEntityById } from "../repository/entity.repository";
import { File} from "../../domain/File"

export const useFetchFiles = (projectID:string) => {
  const [filesData, setFilesData] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllFiles = async () => {
      try {
        setLoading(true);
       const routeUrl = projectID ? `/files?projectID=${projectID}` : "/files";
       const filesResponse = await getEntityById({ routeUrl });

        if (filesResponse && Array.isArray(filesResponse)) {
          setFilesData(
            filesResponse.map((file) => ({
              id: file.id,
              name: file.name,
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
    fetchAllFiles();
  }, [projectID]);

  return { filesData, loading };
};
