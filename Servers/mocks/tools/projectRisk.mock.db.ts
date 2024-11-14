import mockProjectRisks from "../projectRisks.mock.data";
import { ProjectRisk } from "../../models/projectRisk.model";

export const getAllMockProjectRisks = (): Array<any> => {
  return mockProjectRisks;
};

export const getMockProjectRiskById = (id: number): object | undefined => {
  return mockProjectRisks.find(
    (projectRisk: ProjectRisk) => projectRisk.id === id
  );
};

export const createMockProjectRisk = (newProjectRisk: any): object => {
  mockProjectRisks.push(newProjectRisk);
  return newProjectRisk;
};

export const updateMockProjectRiskById = (
  id: number,
  updatedProjectRisk: any
): object | null => {
  const index = mockProjectRisks.findIndex(
    (projectRisk: ProjectRisk) => projectRisk.id === id
  );
  if (index !== -1) {
    mockProjectRisks[index] = {
      ...mockProjectRisks[index],
      ...updatedProjectRisk,
    };
    return mockProjectRisks[index];
  }
  return null;
};

export const deleteMockProjectRiskById = (id: number): object | null => {
  const index = mockProjectRisks.findIndex(
    (projectRisk: ProjectRisk) => projectRisk.id === id
  );
  if (index !== -1) {
    const deletedProjectRisk = mockProjectRisks.splice(index, 1)[0];
    return deletedProjectRisk;
  }
  return null;
};
