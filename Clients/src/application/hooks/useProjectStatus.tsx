import { useEffect, useState, useMemo, useCallback } from "react";
import { getEntityById } from "../repository/entity.repository";
import { useSelector } from "react-redux";

/**
 * Represents the status of a project, including assessments and controls.
 *
 * @interface ProjectStatus
 * @property {Assessments} assessments - The assessments associated with the project.
 * @property {Controls} controls - The controls associated with the project.
 */

export interface AssessmentsProject {
  projectId: number;
  totalAssessments: number;
  doneAssessments: number;
}

export interface ControlsProject {
  projectId: number;
  totalSubControls: number;
  doneSubControls: number;
}

export interface Assessments {
  percentageComplete: number;
  allDoneAssessments: number;
  allTotalAssessments: number;
  projects: AssessmentsProject[];
}

export interface Controls {
  percentageComplete: number;
  allDoneSubControls: number;
  allTotalSubControls: number;
  projects: ControlsProject[];
}

export interface MetricSectionProps {
  title: string;
  metricType?: "compliance" | "risk";
  assessments: Assessments;
  controls: Controls;
}

export interface ProjectStatus {
  assessments: Assessments;
  controls: Controls;
}

const defaultControlsProject: ControlsProject = {
  projectId: 1,
  totalSubControls: 1,
  doneSubControls: 0,
};

const defaultAssessmentsProject: AssessmentsProject = {
  projectId: 1,
  totalAssessments: 1,
  doneAssessments: 0,
};

export const defaultProjectStatus: ProjectStatus = {
  assessments: {
    percentageComplete: 0,
    allDoneAssessments: 0,
    projects: [defaultAssessmentsProject],
    allTotalAssessments: 0,
  },
  controls: {
    percentageComplete: 0,
    allDoneSubControls: 0,
    allTotalSubControls: 0,
    projects: [defaultControlsProject],
  },
};

const useProjectStatus = ({ userId }: { userId: string }) => {
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>(defaultProjectStatus);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | boolean>(false);
  
  // Get auth token from Redux store
  const authToken = useSelector((state: { auth: { authToken: string } }) => state.auth.authToken);

  const fetchProjectStatus = useCallback(async (signal: AbortSignal) => {
    try {
      const response = await getEntityById({
        routeUrl: `/users/${userId}/calculate-progress`,
        signal,
      });

      setProjectStatus({
        assessments: {
          percentageComplete:
            (response.allDoneAssessments / response.allTotalAssessments) *
            100,
          allDoneAssessments: response.allDoneAssessments,
          allTotalAssessments: response.allTotalAssessments,
          projects: response.assessmentsMetadata,
        },
        controls: {
          percentageComplete:
            (response.allDoneSubControls / response.allTotalSubControls) *
            100,
          allDoneSubControls: response.allDoneSubControls,
          allTotalSubControls: response.allTotalSubControls,
          projects: response.controlsMetadata,
        },
      });
    } catch (error) {
      if (!signal.aborted) {
        setError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setError("No user ID provided");
      setLoading(false);
      return;
    }

    // Only fetch project status if user is logged in (authToken exists)
    if (!authToken) {
      setLoading(false);
      setError("User not authenticated");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(false);

    fetchProjectStatus(controller.signal);

    return () => controller.abort();
  }, [userId, authToken, fetchProjectStatus]);

  // Memoize the returned object to prevent unnecessary re-renders
  const memoizedProjectStatus = useMemo(() => ({
    projectStatus: projectStatus ?? defaultProjectStatus,
    loading,
    error,
  }), [projectStatus, loading, error]);

  return memoizedProjectStatus;
};

export default useProjectStatus;
