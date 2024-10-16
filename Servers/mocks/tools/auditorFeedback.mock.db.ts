import { auditorFeedbacks } from "../auditorFeedbacks/auditorFeedbacks.data";

export const getAllMockAuditorFeedbacks = (): Array<any> => {
  return auditorFeedbacks;
};

export const getMockAuditorFeedbackById = (id: number): object | undefined => {
  return auditorFeedbacks.find((complianceTracker) => complianceTracker.id === id);
};

export const createMockAuditorFeedback = (newAuditorFeedback: any): object => {
  auditorFeedbacks.push(newAuditorFeedback);
  return newAuditorFeedback;
};

export const updateMockAuditorFeedbackById = (id: number, updatedAuditorFeedback: any): object | null => {
  const index = auditorFeedbacks.findIndex((complianceTracker) => complianceTracker.id === id);
  if (index !== -1) {
    auditorFeedbacks[index] = { ...auditorFeedbacks[index], ...updatedAuditorFeedback };
    return auditorFeedbacks[index];
  }
  return null;
};

export const deleteMockAuditorFeedbackById = (id: number): object | null => {
  const index = auditorFeedbacks.findIndex((complianceTracker) => complianceTracker.id === id);
  if (index !== -1) {
    const deletedAuditorFeedback = auditorFeedbacks.splice(index, 1)[0];
    return deletedAuditorFeedback;
  }
  return null;
};
