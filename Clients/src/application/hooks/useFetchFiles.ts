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
              uploaded_time: file.uploaded_time ? new Date(file.uploaded_time).toLocaleDateString() : "Invalid Date",
              uploaded_by: file.uploaded_by || "N/A",
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
