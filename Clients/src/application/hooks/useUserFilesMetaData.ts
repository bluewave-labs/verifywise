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
import { getUserFilesMetaData, getFilesWithMetadata } from "../repository/file.repository";
import { transformFilesData } from "../utils/fileTransform.utils";
import CustomException from "../../infrastructure/exceptions/customeException";

/**
 * Check if an error is a rate limit (429) or other critical API error
 * that should be shown to the user
 */
const isCriticalApiError = (error: unknown): boolean => {
  if (error instanceof CustomException) {
    // Rate limit (429), server errors (5xx), or forbidden (403)
    return error.status === 429 || error.status === 403 || (error.status && error.status >= 500);
  }
  return false;
};

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

        // Track errors from each endpoint
        let metadataError: unknown = null;
        let legacyError: unknown = null;

        // First try to get files with full metadata (includes version, status, etc.)
        // Then also get legacy files from the old endpoint
        const [metadataResponse, legacyResponse] = await Promise.all([
          getFilesWithMetadata({ signal: abortController.signal }).catch((err) => {
            metadataError = err;
            return { files: [] };
          }),
          getUserFilesMetaData({ signal: abortController.signal }).catch((err) => {
            legacyError = err;
            return [];
          }),
        ]);

        // If both endpoints failed with critical errors, show the error to the user
        // Prioritize showing rate limit errors
        if (metadataError && legacyError) {
          const criticalError = isCriticalApiError(metadataError) ? metadataError :
                               isCriticalApiError(legacyError) ? legacyError : null;
          if (criticalError) {
            throw criticalError;
          }
        }

        // If one endpoint returned a rate limit error but the other succeeded, still show error
        if (isCriticalApiError(metadataError) || isCriticalApiError(legacyError)) {
          const criticalError = isCriticalApiError(metadataError) ? metadataError : legacyError;
          throw criticalError;
        }

        // Combine files, preferring metadata-enriched files
        const metadataFilesMap = new Map(
          metadataResponse.files.map((f) => [String(f.id), f])
        );

        // Add any legacy files not already in metadata response
        const legacyFilesNotInMetadata = legacyResponse.filter(
          (f) => !metadataFilesMap.has(String(f.id))
        );

        const allFiles = [...metadataResponse.files, ...legacyFilesNotInMetadata];

        if (allFiles.length > 0) {
          setFilesData(transformFilesData(allFiles));
        } else {
          setFilesData([]);
        }
      } catch (error: unknown) {
        // Check if the error is due to aborting the request
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setError(
          error instanceof Error ? error : new Error("Unknown error occurred")
        );
        // Don't clear filesData on error - keep showing existing data
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
