import { vendorRisks } from "../vendorRisks/vendorRisks.data";

export const getAllMockVendorRisks = (): Array<any> => {
  return vendorRisks;
};

export const getMockVendorRiskById = (id: number): object | undefined => {
  return vendorRisks.find((vendorRisk) => vendorRisk.id === id);
};

export const createMockVendorRisk = (newVendorRisk: any): object => {
  vendorRisks.push(newVendorRisk);
  return newVendorRisk;
};

export const updateMockVendorRiskById = (id: number, updatedVendorRisk: any): object | null => {
  const index = vendorRisks.findIndex((vendorRisk) => vendorRisk.id === id);
  if (index !== -1) {
    vendorRisks[index] = { ...vendorRisks[index], ...updatedVendorRisk };
    return vendorRisks[index];
  }
  return null;
};

export const deleteMockVendorRiskById = (id: number): object | null => {
  const index = vendorRisks.findIndex((vendorRisk) => vendorRisk.id === id);
  if (index !== -1) {
    const deletedVendorRisk = vendorRisks.splice(index, 1)[0];
    return deletedVendorRisk;
  }
  return null;
};
