import { useEffect } from "react";
import { useState } from "react";
import { getEntityById } from "../repository/entity.repository";

interface ProjectData {
  project_title: string;
  owner: string;
  last_updated: string;
  last_updated_by: string;
};

const useProjectData = ({ projectId }: { projectId: string }) => {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    getEntityById({ routeUrl: `/projects/${projectId}` })
      .then(({ data }) => {
        setProject(data);
        console.log('data:', data);
        setError(null);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError("Failed to fetch the project: " + err.message);
          setProject(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });
    return () => controller.abort();
  }, [projectId]);

  return { project, error, isLoading };
}

export default useProjectData;