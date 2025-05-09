/**
 * Custom hook to fetch and manage generated report data.
 *
 * @param {Object} params - The parameters object.
 * @returns {Object} - The hook returns an object containing:
 * - `generatedReports` {GeneratedReports[]} - The list of generated reports.
 * - `loadingReports` {boolean} - The loading state of the generated reports.
 * - `error` {string | boolean} - The error state of the generated reports request.
 */

import { useEffect, useState } from "react";
import { getEntityById } from "../repository/entity.repository";

export interface GeneratedReports {
  id: number;
  filename: string,
  type: string,
  date: string,
  generated_by: number,
  project: string
}

const useGeneratedReports = ({projectId} : {projectId: string | null}) => {
  const [generatedReports, setGeneratedReports] = useState<GeneratedReports[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(true);
  const [error, setError] = useState<string | boolean>(false);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    
    const fetchGeneratedReports = async () => {
      setLoadingReports(true);
      try{
        const response = await getEntityById({
          routeUrl: `/reporting/generate-report`,
          signal,
        });
        if(response){
          setGeneratedReports(response.data)
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(`Request failed: ${err.message}`);
        } else {
          setError(`Request failed`);
        }
      } finally {
        setLoadingReports(false);
      }
    }

    fetchGeneratedReports();

    return () => {
      controller.abort();
    };
  }, [projectId])

  return{
    generatedReports,
    loadingReports,
    error
  }
}

export default useGeneratedReports;