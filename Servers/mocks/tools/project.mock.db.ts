import { projects } from "../projects/projects.data";

export const getAllMockProjects = (): Array<any> => {
  return projects;
};

export const getMockProjectById = (id: number): object | undefined => {
  return projects.find((project) => project.id === id);
};

export const createMockProject = (newProject: any): object => {
  projects.push(newProject);
  return newProject;
};

export const updateMockProjectById = (id: number, updatedProject: any): object | null => {
  const index = projects.findIndex((project) => project.id === id);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updatedProject };
    return projects[index];
  }
  return null;
};

export const deleteMockProjectById = (id: number): object | null => {
  const index = projects.findIndex((project) => project.id === id);
  if (index !== -1) {
    const deletedProject = projects.splice(index, 1)[0];
    return deletedProject;
  }
  return null;
};
