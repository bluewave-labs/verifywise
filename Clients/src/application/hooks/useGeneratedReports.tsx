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
import { Project } from "../../domain/types/Project";

export interface GeneratedReports {
  id: number;
  filename: string,
  type: string,
  uploaded_time: string,
  project_id: string | number | null,
  project_title: string,
  source: string,
  uploader_name: string,
  uploader_surname: string
}

interface UseGeneratedReportsParams {
  projectId: string;
  projects: Project[];
  refreshKey?: any;
}

const useGeneratedReports = ({
  projectId, 
  projects,
  refreshKey
} : UseGeneratedReportsParams) => {
  const [generatedReports, setGeneratedReports] = useState<GeneratedReports[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(true);
  const [error, setError] = useState<string | boolean>(false);

  useEffect(() => {
    if(projects.length === 0 ) {
      setLoadingReports(false);
      return
    };

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
  }, [projectId, projects, refreshKey])

  return{
    generatedReports,
    loadingReports,
    error
  }
}

export default useGeneratedReports;