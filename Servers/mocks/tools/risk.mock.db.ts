import { risks } from "../risks/risks.data";

export const getAllMockRisks = (): Array<any> => {
  return risks;
};

export const getMockRiskById = (id: number): object | undefined => {
  return risks.find((vendor) => vendor.id === id);
};

export const createMockRisk = (newRisk: any): object => {
  risks.push(newRisk);
  return newRisk;
};

export const updateMockRiskById = (id: number, updatedRisk: any): object | null => {
  const index = risks.findIndex((vendor) => vendor.id === id);
  if (index !== -1) {
    risks[index] = { ...risks[index], ...updatedRisk };
    return risks[index];
  }
  return null;
};

export const deleteMockRiskById = (id: number): object | null => {
  const index = risks.findIndex((vendor) => vendor.id === id);
  if (index !== -1) {
    const deletedRisk = risks.splice(index, 1)[0];
    return deletedRisk;
  }
  return null;
};
