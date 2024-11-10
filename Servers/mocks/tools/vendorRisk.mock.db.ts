import mockVendorRisks from "../vendorRisk.mock.data";

export const getAllMockVendorRisks = (): Array<any> => {
  return mockVendorRisks;
};

export const getMockVendorRiskById = (id: number): object | undefined => {
  return mockVendorRisks.find((vendorRisk) => vendorRisk.id === id);
};

export const createMockVendorRisk = (newVendorRisk: any): object => {
  mockVendorRisks.push(newVendorRisk);
  return newVendorRisk;
};

export const updateMockVendorRiskById = (
  id: number,
  updatedVendorRisk: any
): object | null => {
  const index = mockVendorRisks.findIndex((vendorRisk) => vendorRisk.id === id);
  if (index !== -1) {
    mockVendorRisks[index] = {
      ...mockVendorRisks[index],
      ...updatedVendorRisk,
    };
    return mockVendorRisks[index];
  }
  return null;
};

export const deleteMockVendorRiskById = (id: number): object | null => {
  const index = mockVendorRisks.findIndex((vendorRisk) => vendorRisk.id === id);
  if (index !== -1) {
    const deletedVendorRisk = mockVendorRisks.splice(index, 1)[0];
    return deletedVendorRisk;
  }
  return null;
};
