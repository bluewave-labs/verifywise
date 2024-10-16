import { complianceTrackers } from "../complianceTrackers/complianceTrackers.data";

export const getAllMockComplianceTrackers = (): Array<any> => {
  return complianceTrackers;
};

export const getMockComplianceTrackerById = (id: number): object | undefined => {
  return complianceTrackers.find((complianceTracker) => complianceTracker.id === id);
};

export const createMockComplianceTracker = (newComplianceTracker: any): object => {
  complianceTrackers.push(newComplianceTracker);
  return newComplianceTracker;
};

export const updateMockComplianceTrackerById = (id: number, updatedComplianceTracker: any): object | null => {
  const index = complianceTrackers.findIndex((complianceTracker) => complianceTracker.id === id);
  if (index !== -1) {
    complianceTrackers[index] = { ...complianceTrackers[index], ...updatedComplianceTracker };
    return complianceTrackers[index];
  }
  return null;
};

export const deleteMockComplianceTrackerById = (id: number): object | null => {
  const index = complianceTrackers.findIndex((complianceTracker) => complianceTracker.id === id);
  if (index !== -1) {
    const deletedComplianceTracker = complianceTrackers.splice(index, 1)[0];
    return deletedComplianceTracker;
  }
  return null;
};
