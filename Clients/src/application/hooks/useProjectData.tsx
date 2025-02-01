import { useContext, useEffect, useState } from "react";
import { getEntityById } from "../repository/entity.repository";
import { VerifyWiseContext } from "../contexts/VerifyWise.context";

interface ProjectData {
  id: number;
  project_title: string;
  owner: string;
  users: string;
  start_date: Date;
  ai_risk_classification: string;
  type_of_high_risk_role: string;
  goal: string;
  last_updated: string;
  last_updated_by: string;
}
interface UseProjectDataParams {
  projectId: string;
}
interface UseProjectDataResult {
  project: ProjectData | null;
  projectOwner: string | null;
  error: string | null;
  isLoading: boolean;
}
export interface User {
  id: string;
  name: string;
  surname: string;
}

const useProjectData = ({ projectId }: UseProjectDataParams): UseProjectDataResult => {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [projectOwner, setProjectOwner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { dashboardValues } = useContext(VerifyWiseContext);
  const { selectedProjectId, users } = dashboardValues;

  useEffect(() => {
    if (!projectId) {
      setError("No project ID provided");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    getEntityById({ routeUrl: `/projects/${projectId}`, signal: controller.signal })
      .then(({ data }) => {

        const ownerUser = users.find(
          (user: User) => user.id === data.owner
        );
        const lastUpdatedByUser = users.find(
          (user: User) => user.id === data.last_updated_by
        );
        if (lastUpdatedByUser) {
          data.last_updated_by = lastUpdatedByUser.name + ` ` + lastUpdatedByUser.surname;
        }
        if (ownerUser) {
          // data.owner = ownerUser.name + ` ` + ownerUser.surname;
          const temp = ownerUser.name + ` ` + ownerUser.surname;
          setProjectOwner(temp);
        }
        console.log("~~~", data)
        setProject(data);
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
  }, [projectId, selectedProjectId, users]);

  return { project, projectOwner, error, isLoading };
}

export default useProjectData;