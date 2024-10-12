import { risks } from "../risks/risks.data";

<<<<<<< HEAD
/**
 * send the list of risks from the mock data
 * @returns list of risks
 */
=======
>>>>>>> 7aefaf4c211d0559fa2b03488758cc11966e0f20
export const getAllMockRisks = (): Array<any> => {
  return risks;
};

<<<<<<< HEAD
/**
 * send the risk by finding it from the mock data based on the id
 * @param id id of the risk
 * @returns risk object
 */
=======
>>>>>>> 7aefaf4c211d0559fa2b03488758cc11966e0f20
export const getMockRiskById = (id: number): object | undefined => {
  return risks.find((vendor) => vendor.id === id);
};

<<<<<<< HEAD
/**
 * create a new risk entry in the mock data
 * @param newRisk risk object
 * @returns risk object
 */
=======
>>>>>>> 7aefaf4c211d0559fa2b03488758cc11966e0f20
export const createMockRisk = (newRisk: any): object => {
  risks.push(newRisk);
  return newRisk;
};

<<<<<<< HEAD
/**
 * update a risk with the new value based on the id from the mock data
 * @param id id of the risk
 * @param updatedRisk risk object
 * @returns risk object or null object
 */
=======
>>>>>>> 7aefaf4c211d0559fa2b03488758cc11966e0f20
export const updateMockRiskById = (id: number, updatedRisk: any): object | null => {
  const index = risks.findIndex((vendor) => vendor.id === id);
  if (index !== -1) {
    risks[index] = { ...risks[index], ...updatedRisk };
    return risks[index];
  }
  return null;
};

<<<<<<< HEAD
/**
 * delete the risk from the mock data based on the id
 * @param id id of the risk
 * @returns risk object or null object
 */
=======
>>>>>>> 7aefaf4c211d0559fa2b03488758cc11966e0f20
export const deleteMockRiskById = (id: number): object | null => {
  const index = risks.findIndex((vendor) => vendor.id === id);
  if (index !== -1) {
    const deletedRisk = risks.splice(index, 1)[0];
    return deletedRisk;
  }
  return null;
};
