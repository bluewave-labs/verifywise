/** 
 * Custom hook to fetch files data from the server based on project ID.
 * 
 * @param {string} projectID - The ID of the project to fetch files for.
 * @returns {{ filesData: FileData[], loading: boolean }} - An object containing the files data and loading state.
 */

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
       console.log("filesResponse", filesResponse);

        if (filesResponse && Array.isArray(filesResponse)) {
          setFilesData(
            filesResponse.map((file) => ({
              id: file.id,
              name: file.name || "N/A",
              type: file.type || "N/A",
              size: file.size || 0,
              fileName: file.filename,
              uploadDate: file.uploadedTime ? new Date(file.uploadedTime).toLocaleDateString() : "Invalid Date",
              uploader: file.uploadedBy || "N/A",
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
