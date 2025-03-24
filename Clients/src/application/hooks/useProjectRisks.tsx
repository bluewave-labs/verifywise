/**
 * Custom hook to fetch and manage project risks data.
 *
 * @param {Object} params - The parameters object.
 * @param {number} [params.id] - The optional project ID to fetch specific project risks.
 * @returns {Object} - The hook returns an object containing:
 *   - `projectRisks` {ProjectRisk[]} - The list of project risks.
 *   - `loadingProjectRisks` {boolean} - The loading state of the project risks.
 *   - `error` {string | boolean} - The error state of the project risks request.
 *   - `projectRisksSummary` {Object} - The summary of project risks categorized by risk levels.
 */
import { useEffect, useState } from "react";
import { getEntityById } from "../repository/entity.repository";
import { convertToCamelCaseRiskKey } from "../tools/stringUtil";

export interface ProjectRisk {
  id: number;
  project_id: number;
  risk_name: any;
  risk_owner: any;
  ai_lifecycle_phase: any;
  risk_description: any;
  risk_category: any;
  impact: any;
  assessment_mapping: any;
  controls_mapping: any;
  likelihood: any;
  severity: any;
  risk_level_autocalculated: any;
  review_notes: any;
  mitigation_status: any;
  current_risk_level: any;
  deadline: any;
  mitigation_plan: any;
  implementation_strategy: any;
  mitigation_evidence_document: any;
  likelihood_mitigation: any;
  risk_severity: any;
  final_risk_level: any;
  risk_approval: any;
  approval_status: any;
  date_of_assessment: any;
  recommendations?: any;
}

const useProjectRisks = ({ projectId, refreshKey }: { projectId?: string | null, refreshKey?: any }) => {
  const [projectRisks, setProjectRisks] = useState<ProjectRisk[]>([]);
  const [loadingProjectRisks, setLoadingProjectRisks] = useState<boolean>(true);
  const [error, setError] = useState<string | boolean>(false);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const updateProjectRisks = async () => {
      setLoadingProjectRisks(true);
      try {
        const response = await getEntityById({
          routeUrl: `/projectRisks/by-projid/${projectId}`,
          signal,
        });
        if (response.data) {
          const filteredProjectRisks = projectId
            ? response.data.filter(
                (risk: ProjectRisk) => risk.project_id === Number(projectId)
              )
            : response.data;
          setProjectRisks(filteredProjectRisks);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(`Request failed: ${err.message}`);
        } else {
          setError(`Request failed`);
        }
      } finally {
        setLoadingProjectRisks(false);
      }
    };

    updateProjectRisks();

    return () => {
      controller.abort();
    };
  }, [projectId, refreshKey]);

  const projectRisksSummary = projectRisks.reduce(
    (acc, risk) => {
      const _risk = convertToCamelCaseRiskKey(risk.risk_level_autocalculated);
      const key = `${_risk.replace(/risks?$/i, "")}Risks` as keyof typeof acc;
      acc[key] = acc[key] + 1;
      return acc;
    },
    {
      veryHighRisks: 0,
      highRisks: 0,
      mediumRisks: 0,
      lowRisks: 0,
      veryLowRisks: 0,
    }
  );

  return {
    projectRisks,
    loadingProjectRisks,
    error,
    projectRisksSummary,
  };
};

export default useProjectRisks;
