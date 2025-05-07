import { useEffect, useState, useCallback } from "react";
import { getEntityById } from "../repository/entity.repository";
import { AssessmentProgress } from "../../domain/interfaces/iAssessment";

/**
 * Custom hook to fetch and manage assessment progress data for a selected project.
 *
 * @param {Object} params - The parameters object.
 * @param {string} params.projectFrameworkId - The ID of the selected project.
 * @returns {Object} - An object containing the assessment progress data and loading state.
 * @returns {AssessmentProgress | null} return.AssessmentProgressData - The fetched assessment progress data or null if not yet fetched.
 * @returns {boolean} return.loading - The loading state indicating whether the data is currently being fetched.
 *
 * @example
 * const { assessmentProgress, loading } = useAssessmentProgress({ projectFrameworkId: 'project-id' });
 */

const defaultAssessmentProgress = {
  totalQuestions: 0,
  answeredQuestions: 0,
};
const useAssessmentProgress = ({
  projectFrameworkId,
  refreshKey,
}: {
  projectFrameworkId: number;
  refreshKey: boolean;
}) => {
  const [assessmentProgress, setAssessmentProgress] =
    useState<AssessmentProgress>(defaultAssessmentProgress);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAssessmentProgress = useCallback(
    async ({ signal }: { signal: AbortSignal }) => {
      if (!projectFrameworkId) return;
      if (signal.aborted) return;

      setLoading(true);
      try {
        const response = await getEntityById({
          routeUrl: `/eu-ai-act/assessments/progress/${projectFrameworkId}`,
          signal,
        });
        // if (!response.ok) {
        //   setAssessmentProgress(defaultAssessmentProgress);
        //   console.error(`Failed to fetch progress data: ${response.message}`);
        // }
        if (response?.data) {
          setAssessmentProgress(response.data);
        } else {
          setAssessmentProgress(defaultAssessmentProgress);
        }
      } catch (error) {
        console.error("Failed to fetch progress data:", error);
        setAssessmentProgress(defaultAssessmentProgress);
      } finally {
        setLoading(false);
      }
    },
    [projectFrameworkId, refreshKey]
  );
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    fetchAssessmentProgress({ signal });
    return () => {
      controller.abort();
    };
  }, [projectFrameworkId, fetchAssessmentProgress]);

  return {
    assessmentProgress,
    loading,
  };
};

export default useAssessmentProgress;
