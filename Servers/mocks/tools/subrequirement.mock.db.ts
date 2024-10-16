import { subrequirements } from "../subrequirements/subrequirements.data";

export const getAllMockSubrequirements = (): Array<any> => {
  return subrequirements;
};

export const getMockSubrequirementById = (id: number): object | undefined => {
  return subrequirements.find((subrequirement) => subrequirement.id === id);
};

export const createMockSubrequirement = (newSubrequirement: any): object => {
  subrequirements.push(newSubrequirement);
  return newSubrequirement;
};

export const updateMockSubrequirementById = (id: number, updatedSubrequirement: any): object | null => {
  const index = subrequirements.findIndex((subrequirement) => subrequirement.id === id);
  if (index !== -1) {
    subrequirements[index] = { ...subrequirements[index], ...updatedSubrequirement };
    return subrequirements[index];
  }
  return null;
};

export const deleteMockSubrequirementById = (id: number): object | null => {
  const index = subrequirements.findIndex((subrequirement) => subrequirement.id === id);
  if (index !== -1) {
    const deletedSubrequirement = subrequirements.splice(index, 1)[0];
    return deletedSubrequirement;
  }
  return null;
};
