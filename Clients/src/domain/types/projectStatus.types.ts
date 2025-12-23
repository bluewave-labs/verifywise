/**
 * Domain types for project status metrics
 * Pure domain types with zero external dependencies
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
  projects?: AssessmentsProject[];
}

export interface Controls {
  percentageComplete: number;
  allDoneSubControls: number;
  allTotalSubControls: number;
  projects?: ControlsProject[];
}

export interface ProjectStatus {
  assessments: Assessments;
  controls: Controls;
}

export const defaultProjectStatus: ProjectStatus = {
  assessments: {
    percentageComplete: 0,
    allDoneAssessments: 0,
    allTotalAssessments: 0,
  },
  controls: {
    percentageComplete: 0,
    allDoneSubControls: 0,
    allTotalSubControls: 0,
  },
};
