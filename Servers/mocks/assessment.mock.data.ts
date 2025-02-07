import { Assessment } from "../models/assessment.model";

export const Assessments = (projectId1: number, projectId2: number): Assessment[] => {
  return [
    { id: 1, projectId: projectId1 },
    { id: 2, projectId: projectId2 },
  ]
};
