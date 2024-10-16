import { evidences } from "../evidences/evidences.data";

export const getAllMockEvidences = (): Array<any> => {
  return evidences;
};

export const getMockEvidenceById = (id: number): object | undefined => {
  return evidences.find((evidence) => evidence.id === id);
};

export const createMockEvidence = (newEvidence: any): object => {
  evidences.push(newEvidence);
  return newEvidence;
};

export const updateMockEvidenceById = (id: number, updatedEvidence: any): object | null => {
  const index = evidences.findIndex((evidence) => evidence.id === id);
  if (index !== -1) {
    evidences[index] = { ...evidences[index], ...updatedEvidence };
    return evidences[index];
  }
  return null;
};

export const deleteMockEvidenceById = (id: number): object | null => {
  const index = evidences.findIndex((evidence) => evidence.id === id);
  if (index !== -1) {
    const deletedEvidence = evidences.splice(index, 1)[0];
    return deletedEvidence;
  }
  return null;
};
