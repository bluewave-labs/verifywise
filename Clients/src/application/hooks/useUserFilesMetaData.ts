/**
 * Custom hook to fetch and manage user files metadata
 *
 * @returns {{
 *   filesData: FileModel[],
 *   loading: boolean,
 *   error: Error | null,
 *   refetch: () => void
 * }} - An object containing the files data, loading state, error, and refetch function
 */

import { useState, useEffect, useCallback } from "react";
import { FileModel } from "../../domain/models/Common/file/file.model";
import { getUserFilesMetaData } from "../repository/file.repository";
import { transformFilesData } from "../utils/fileTransform.utils";

export const useUserFilesMetaData = () => {
  const [filesData, setFilesData] = useState<FileModel[]>([]);
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

        if (filesResponse && Array.isArray(filesResponse)) {
          setFilesData(transformFilesData(filesResponse));
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

    // Cleanup function to abort the request when component unmounts or refetch is triggered
    return () => {
      abortController.abort();
    };
  }, [refetchTrigger]);

  /**
   * Trigger a refetch of the files data
   * Useful after file uploads, deletions, or other mutations
   */
  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  return { filesData, loading, error, refetch };
};
