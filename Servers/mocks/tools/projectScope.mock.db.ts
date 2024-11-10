import { projectScopes } from "../projectScope.mock.data";
import { ProjectScope } from "../../models/projectScope.model";

export const getAllMockProjectScopes = (): Array<any> => {
  return projectScopes;
};

export const getMockProjectScopeById = (id: number): object | undefined => {
  return projectScopes.find(
    (projectScope: ProjectScope) => projectScope.id === id
  );
};

export const createMockProjectScope = (newProjectScope: any): object => {
  projectScopes.push(newProjectScope);
  return newProjectScope;
};

export const updateMockProjectScopeById = (
  id: number,
  updatedProjectScope: any
): object | null => {
  const index = projectScopes.findIndex(
    (projectScope: ProjectScope) => projectScope.id === id
  );
  if (index !== -1) {
    projectScopes[index] = {
      ...projectScopes[index],
      ...updatedProjectScope,
    };
    return projectScopes[index];
  }
  return null;
};

export const deleteMockProjectScopeById = (id: number): object | null => {
  const index = projectScopes.findIndex(
    (projectScope: ProjectScope) => projectScope.id === id
  );
  if (index !== -1) {
    const deletedProjectScope = projectScopes.splice(index, 1)[0];
    return deletedProjectScope;
  }
  return null;
};
