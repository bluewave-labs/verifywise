import { requirements } from "../requirements/requirements.data";

export const getAllMockRequirements = (): Array<any> => {
  return requirements;
};

export const getMockRequirementById = (id: number): object | undefined => {
  return requirements.find((requirement) => requirement.id === id);
};

export const createMockRequirement = (newRequirement: any): object => {
  requirements.push(newRequirement);
  return newRequirement;
};

export const updateMockRequirementById = (id: number, updatedRequirement: any): object | null => {
  const index = requirements.findIndex((requirement) => requirement.id === id);
  if (index !== -1) {
    requirements[index] = { ...requirements[index], ...updatedRequirement };
    return requirements[index];
  }
  return null;
};

export const deleteMockRequirementById = (id: number): object | null => {
  const index = requirements.findIndex((requirement) => requirement.id === id);
  if (index !== -1) {
    const deletedRequirement = requirements.splice(index, 1)[0];
    return deletedRequirement;
  }
  return null;
};
