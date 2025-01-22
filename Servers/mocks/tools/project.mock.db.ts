import mockProjects from "../project.mock.data";
import mockProjectRisks from "../projectRisks.mock.data";
import { Project } from "../../models/project.model";
import mockVendorRisks from "../vendorRisk.mock.data";

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

export const calculateMockProjectRisks = (projectId: number): object[] => {
  let projectRisksCalculations: Record<string, number> = {}
  for (let mockProjectRisk of mockProjectRisks) {
    if (mockProjectRisk.project_id !== projectId) {
      continue
    }
    if (projectRisksCalculations[mockProjectRisk.risk_level_autocalculated] === undefined) {
      projectRisksCalculations[mockProjectRisk.risk_level_autocalculated] = 0
    }
    projectRisksCalculations[mockProjectRisk.risk_level_autocalculated] = projectRisksCalculations[mockProjectRisk.risk_level_autocalculated] + 1
  }
  return Object.entries(projectRisksCalculations).map(function ([risk, count]) {
    return { risk_level_autocalculated: risk, count: count.toString() }
  })
}

export const calculateMockVendorRisks = (projectId: number): object[] => {
  let vendorRisksCalculations: Record<string, number> = {}
  for (let mockProjectRisk of mockVendorRisks) {
    if (mockProjectRisk.project_id !== projectId) {
      continue
    }
    if (vendorRisksCalculations[mockProjectRisk.risk_level] === undefined) {
      vendorRisksCalculations[mockProjectRisk.risk_level] = 0
    }
    vendorRisksCalculations[mockProjectRisk.risk_level] = vendorRisksCalculations[mockProjectRisk.risk_level] + 1
  }
  return Object.entries(vendorRisksCalculations).map(function ([risk, count]) {
    return { risk_level: risk, count: count.toString() }
  })
}
