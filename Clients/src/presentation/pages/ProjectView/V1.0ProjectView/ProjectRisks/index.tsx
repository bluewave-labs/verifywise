import { useCallback } from "react";
import { Project } from "../../../../../domain/types/Project";
import { useSearchParams } from "react-router-dom";
import { getAllProjectRisksByProjectId } from "../../../../../application/repository/projectRisk.repository";
import RisksView from "../../../../components/RisksView";
import { RiskModel } from "../../../../../domain/models/Common/risks/risk.model";

const VWProjectRisks = ({ project }: { project?: Project }) => {
  const [searchParams] = useSearchParams();
  const projectId =
    parseInt(searchParams.get("projectId") ?? "0") || project!.id;

  // Create fetch function for use case risks
  const fetchProjectRisks = useCallback(
    async (filter = "active"): Promise<RiskModel[]> => {
      try {
        const response = await getAllProjectRisksByProjectId({
          projectId: String(projectId),
          filter: filter as "active" | "deleted" | "all",
        });
        return response.data || [];
      } catch (error) {
        console.error("Error fetching project risks:", error);
        throw error;
      }
    },
    [projectId]
  );

  return (
    <RisksView
      fetchRisks={fetchProjectRisks}
      title="Use case risks"
    />
  );
};

export default VWProjectRisks;
