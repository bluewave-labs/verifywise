/**
 * Custom hook to fetch files data from the server based on project ID.
 *
 * @param {string} projectID - The ID of the project to fetch files for.
 * @returns {{ filesData: FileData[], loading: boolean, error: Error | null }} - An object containing the files data, loading state, and error.
 */

import { useState, useEffect } from "react";
import { FileData } from "../../domain/types/File";
import { getUserFilesMetaData } from "../repository/file.repository";
import { transformFilesData } from "../utils/fileTransform.utils";

export const useUserFilesMetaData = () => {
    const [filesData, setFilesData] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

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

                // Transform and set files data using shared utility (DRY)
                setFilesData(transformFilesData(filesResponse));
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
    }, []);

    return { filesData, loading, error };
};