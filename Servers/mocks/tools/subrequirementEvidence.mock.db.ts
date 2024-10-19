import { subrequirementEvidence } from "../subrequirementEvidence/subrequirementEvidence.data";

export const getAllMockSubrequirementEvidences = (): Array<any> => {
  return subrequirementEvidence;
};

export const getMockSubrequirementEvidenceById = (
  id: number
): object | undefined => {
  return subrequirementEvidence.find(
    (subrequirementEvidence) => subrequirementEvidence.id === id
  );
};

export const createMockSubrequirementEvidence = (
  newSubrequirementEvidence: any
): object => {
  subrequirementEvidence.push(newSubrequirementEvidence);
  return newSubrequirementEvidence;
};

export const updateMockSubrequirementEvidenceById = (
  id: number,
  updatedSubrequirementEvidence: any
): object | null => {
  const index = subrequirementEvidence.findIndex(
    (subrequirementEvidence) => subrequirementEvidence.id === id
  );
  if (index !== -1) {
    subrequirementEvidence[index] = {
      ...subrequirementEvidence[index],
      ...updatedSubrequirementEvidence,
    };
    return subrequirementEvidence[index];
  }
  return null;
};

export const deleteMockSubrequirementEvidenceById = (
  id: number
): object | null => {
  const index = subrequirementEvidence.findIndex(
    (subrequirementEvidence) => subrequirementEvidence.id === id
  );
  if (index !== -1) {
    const deletedSubrequirementEvidence = subrequirementEvidence.splice(
      index,
      1
    )[0];
    return deletedSubrequirementEvidence;
  }
  return null;
};
