import React, { createContext } from "react";

// Split contexts by domain responsibility
interface AuthContextProps {
  token: string | null;
  userId: number | null;
  userRoleName: string;
  organizationId: number | null;
}

interface UIContextProps {
  componentsVisible: ComponentVisible;
  changeComponentVisibility: (component: keyof ComponentVisible, value: boolean) => void;
}

interface ProjectContextProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string) => void;
  projectStatus: ProjectStatus;
  loadingProjectStatus: string | boolean;
  errorFetchingProjectStatus: string | boolean;
}

// Create separate contexts
export const AuthContext = createContext<AuthContextProps | null>(null);
export const UIContext = createContext<UIContextProps | null>(null);
export const ProjectContext = createContext<ProjectContextProps | null>(null);