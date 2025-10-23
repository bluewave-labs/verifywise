/**
 * Custom hook to fetch files data from the server based on project ID.
 *
 * @param {string} projectID - The ID of the project to fetch files for.
 * @returns {{ filesData: FileData[], loading: boolean, error: Error | null }} - An object containing the files data, loading state, and error.
 */

import { useState, useEffect } from "react";
import { FileData } from "../../domain/types/File";
import { getUserFilesMetaData } from "../repository/file.repository";

export const useUserFilesMetaData = () => {
  const [filesData, setFilesData] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    // Create an AbortController for request cancellation
    const abortController = new AbortController();

    const fetchFilesData = async () => {
      try {
        setLoading(true);
        setError(null);
        const filesResponse = await getUserFilesMetaData({
          signal: abortController.signal,
        });

        // Handle file-manager response structure
        if (filesResponse?.success && filesResponse?.data?.files) {
          setFilesData(
            filesResponse.data.files.map((file: any) => ({
              id: file.id,
              fileName: file.filename,
              uploadDate: file.upload_date
                ? new Date(file.upload_date).toLocaleDateString()
                : "Invalid Date",
              uploader:
                `${file.uploader_name ?? ""} ${
                  file.uploader_surname ?? ""
                }`.trim() || "N/A",
              source: "File Manager",
              projectTitle: "N/A",
              projectId: "all",
              parentId: null,
              subId: null,
              metaId: null,
              isEvidence: false,
            })),
          );
        } else {
          setFilesData([]);
        }
      } catch (error: unknown) {
        // Check if the error is due to aborting the request
        if (error instanceof Error && error.name === "AbortError") {
          // Ignore abort errors
          return;
        }
        setError(
          error instanceof Error ? error : new Error("Unknown error occurred"),
        );
        setFilesData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFilesData();

    // Cleanup function to abort the request when component unmounts or projectID changes
    return () => {
      abortController.abort();
    };
  }, [refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  return { filesData, loading, error, refetch };
};
