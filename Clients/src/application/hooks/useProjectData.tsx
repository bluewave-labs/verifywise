import { useContext, useEffect, useState } from "react";
import { getEntityById } from "../repository/entity.repository";
import { VerifyWiseContext } from "../contexts/VerifyWise.context";
import { Project } from "../../domain/types/Project";
import { User } from "../../domain/types/User";

interface UseProjectDataParams {
  projectId: string;
  refreshKey?: any;
}
interface UseProjectDataResult {
  project: Project | null;
  projectOwner: string | null;
  error: string | null;
  isLoading: boolean;
  projectRisks: any; // Add projectRisks to the return type
  setProject: (project: Project | null) => void; // Add setProject to the return type
}

const useProjectData = ({
  projectId,
  refreshKey,
}: UseProjectDataParams): UseProjectDataResult => {
  const [project, setProject] = useState<Project | null>(null);
  const [projectOwner, setProjectOwner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectRisks, setProjectRisks] = useState<any>(null); // Add state for projectRisks
  const { dashboardValues, users } = useContext(VerifyWiseContext);
  const { selectedProjectId } = dashboardValues;

  useEffect(() => {
    if (!projectId) {
      setError("No project ID provided");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    getEntityById({
      routeUrl: `/projects/${projectId}`,
      signal: controller.signal,
    })
      .then(({ data }) => {
        const ownerUser = users.find((user: User) => user.id === data.owner);

        /* 
          ** It should be data.last_updated_by: number instead of string
          // const lastUpdatedByUser = users.find(
          //   (user: User) => user.id === data.last_updated_by
          // );
          // if (lastUpdatedByUser) {
          //   data.last_updated_by =
          //     lastUpdatedByUser.name + ` ` + lastUpdatedByUser.surname;
          // }        
        */

        if (ownerUser) {
          const temp = ownerUser.name + ` ` + ownerUser.surname;
          setProjectOwner(temp);
        }

        setProjectRisks(data.risks); // Set projectRisks from the fetched data
        setProject(data); // Ensure project is set correctly
        setError(null);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(`Failed to fetch project #${projectId}: ${err.message}`);
          setProject(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });
    return () => controller.abort();
  }, [projectId, selectedProjectId, users, refreshKey]);

  return { project, projectOwner, error, isLoading, projectRisks, setProject }; // Return setProject
};

export default useProjectData;
