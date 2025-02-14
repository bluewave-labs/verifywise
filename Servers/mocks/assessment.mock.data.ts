import { Assessment } from "../models/assessment.model";

export const Assessments = (projectId1: number, projectId2: number): Assessment[] => {
  return [
    { id: 1, project_id: projectId1 },
    { id: 2, project_id: projectId2 },
  ]
};
