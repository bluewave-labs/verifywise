import { assessmentTrackers } from "../assessmentTrackers/assessmentTrackers.data";

export const getAllMockAssessmentTrackers = (): Array<any> => {
  return assessmentTrackers;
};

export const getMockAssessmentTrackerById = (id: number): object | undefined => {
  return assessmentTrackers.find((assessmentTracker) => assessmentTracker.id === id);
};

export const createMockAssessmentTracker = (newAssessmentTracker: any): object => {
  assessmentTrackers.push(newAssessmentTracker);
  return newAssessmentTracker;
};

export const updateMockAssessmentTrackerById = (id: number, updatedAssessmentTracker: any): object | null => {
  const index = assessmentTrackers.findIndex((assessmentTracker) => assessmentTracker.id === id);
  if (index !== -1) {
    assessmentTrackers[index] = { ...assessmentTrackers[index], ...updatedAssessmentTracker };
    return assessmentTrackers[index];
  }
  return null;
};

export const deleteMockAssessmentTrackerById = (id: number): object | null => {
  const index = assessmentTrackers.findIndex((assessmentTracker) => assessmentTracker.id === id);
  if (index !== -1) {
    const deletedAssessmentTracker = assessmentTrackers.splice(index, 1)[0];
    return deletedAssessmentTracker;
  }
  return null;
};
