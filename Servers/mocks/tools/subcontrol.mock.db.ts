import { subcontrols } from "../subcontrol.mock.data";
import { Subcontrol } from "../../models/subcontrol.model";

export const getAllMockSubcontrols = (): Array<any> => {
  return subcontrols;
};

export const getMockSubcontrolById = (id: number): object | undefined => {
  return subcontrols.find((subcontrol: Subcontrol) => subcontrol.id === id);
};

export const createMockSubcontrol = (newSubcontrol: any): object => {
  subcontrols.push(newSubcontrol);
  return newSubcontrol;
};

export const updateMockSubcontrolById = (
  id: number,
  updatedSubcontrol: any
): object | null => {
  const index = subcontrols.findIndex(
    (subcontrol: Subcontrol) => subcontrol.id === id
  );
  if (index !== -1) {
    subcontrols[index] = {
      ...subcontrols[index],
      ...updatedSubcontrol,
    };
    return subcontrols[index];
  }
  return null;
};

export const deleteMockSubcontrolById = (id: number): object | null => {
  const index = subcontrols.findIndex(
    (subcontrol: Subcontrol) => subcontrol.id === id
  );
  if (index !== -1) {
    const deletedSubcontrol = subcontrols.splice(index, 1)[0];
    return deletedSubcontrol;
  }
  return null;
};
