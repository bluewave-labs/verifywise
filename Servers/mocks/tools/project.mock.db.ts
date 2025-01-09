import mockProjects from "../project.mock.data";
import { Project } from "../../models/project.model";

export const getAllMockProjects = (): Array<any> => {
  return mockProjects;
};

export const getMockProjectById = (id: number): object | undefined => {
  return mockProjects.find((project: Project) => project.id === id);
};

export const createMockProject = (newProject: any): object => {
  // mockProjects.push(newProject);
  // return newProject;

  const newId = mockProjects.length + 1;
  newProject.id = newId;
  newProject.last_updated = new Date().toISOString();
  mockProjects.push(newProject);

  return newProject;
};

export const updateMockProjectById = (
  id: number,
  updatedProject: any
): object | null => {
  const index = mockProjects.findIndex((project: Project) => project.id === id);
  if (index !== -1) {
    mockProjects[index] = { ...mockProjects[index], ...updatedProject };
    return mockProjects[index];
  }
  return null;
};

export const deleteMockProjectById = (id: number): object | null => {
  const index = mockProjects.findIndex((project: Project) => project.id === id);
  if (index !== -1) {
    const deletedProject = mockProjects.splice(index, 1)[0];
    return deletedProject;
  }
  return null;
};
