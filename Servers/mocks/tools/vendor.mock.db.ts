import { vendors } from "../vendors/vendors.data";

export const getAllMockVendors = (): Array<any> => {
  return vendors;
};

export const getMockVendorById = (id: number): object | undefined => {
  return vendors.find((vendor) => vendor.id === id);
};

export const createMockVendor = (newVendor: any): object => {
  vendors.push(newVendor);
  return newVendor;
};

export const updateMockVendorById = (id: number, updatedVendor: any): object | null => {
  const index = vendors.findIndex((vendor) => vendor.id === id);
  if (index !== -1) {
    vendors[index] = { ...vendors[index], ...updatedVendor };
    return vendors[index];
  }
  return null;
};

export const deleteMockVendorById = (id: number): object | null => {
  const index = vendors.findIndex((vendor) => vendor.id === id);
  if (index !== -1) {
    const deletedVendor = vendors.splice(index, 1)[0];
    return deletedVendor;
  }
  return null;
};
