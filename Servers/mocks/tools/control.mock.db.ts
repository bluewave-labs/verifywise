import { mockControls } from "../control.mock.data";
import { Control } from "../../models/control.model";

export const getAllMockControls = (): Array<any> => {
  return mockControls;
};

export const getMockControlById = (id: number): object | undefined => {
  return mockControls.find((control: Control) => control.id === id);
};

export const createMockControl = (newControl: any): object => {
  const newControlToSave = {
    id: mockControls.length + 1,
    status: newControl.control.status,
    approver: newControl.control.approver,
    riskReview: newControl.control.riskReview,
    owner: newControl.control.owner,
    reviewer: newControl.control.reviewer,
    implementationDetails: newControl.control.description,
    dueDate: newControl.control.date,
    projectId: newControl.controlCategoryId, // it will be controlCategoryId
    controlGroup: newControl.controlGroup, // This field must be removed in anywhere
  };
  mockControls.push(newControlToSave);
  return newControlToSave;
};

export const updateMockControlById = (
  id: number,
  updatedControl: any
): object | null => {
  const index = mockControls.findIndex((control: Control) => control.id === id);
  if (index !== -1) {
    mockControls[index] = { ...mockControls[index], ...updatedControl };
    return mockControls[index];
  }
  return null;
};

export const deleteMockControlById = (id: number): object | null => {
  const index = mockControls.findIndex((control: Control) => control.id === id);
  if (index !== -1) {
    const deletedControl = mockControls.splice(index, 1)[0];
    return deletedControl;
  }
  return null;
};
