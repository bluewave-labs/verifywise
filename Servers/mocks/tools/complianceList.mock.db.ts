import { complianceLists } from "../complianceLists/complianceLists.data";

export const getAllMockComplianceLists = (): Array<any> => {
  return complianceLists;
};

export const getMockComplianceListById = (id: number): object | undefined => {
  return complianceLists.find((complianceList) => complianceList.id === id);
};

export const createMockComplianceList = (newComplianceList: any): object => {
  complianceLists.push(newComplianceList);
  return newComplianceList;
};

export const updateMockComplianceListById = (id: number, updatedComplianceList: any): object | null => {
  const index = complianceLists.findIndex((complianceList) => complianceList.id === id);
  if (index !== -1) {
    complianceLists[index] = { ...complianceLists[index], ...updatedComplianceList };
    return complianceLists[index];
  }
  return null;
};

export const deleteMockComplianceListById = (id: number): object | null => {
  const index = complianceLists.findIndex((complianceList) => complianceList.id === id);
  if (index !== -1) {
    const deletedComplianceList = complianceLists.splice(index, 1)[0];
    return deletedComplianceList;
  }
  return null;
};
