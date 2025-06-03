import React, { createContext } from "react";
import { defaultProjectStatus, ProjectStatus } from "../hooks/useProjectStatus";
import { Project } from "../../domain/types/Project";
import { ComponentVisible } from "../../application/interfaces/ComponentVisible";
import { User } from "../../domain/types/User";

interface VerifyWiseContextProps {
  uiValues: any;
  setUiValues: (values: any) => void;
  authValues: any;
  setAuthValues: (values: any) => void;
  dashboardValues: any;
  setDashboardValues: (values: any) => void;
  inputValues: any;
  setInputValues: (values: any) => void;
  token: string | null;
  projectStatus: ProjectStatus;
  loadingProjectStatus: string | boolean;
  errorFetchingProjectStatus: string | boolean;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string) => void;
  userId: number | null;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  componentsVisible: ComponentVisible;
  changeComponentVisibility: (
    component: keyof ComponentVisible,
    value: boolean
  ) => void;
  users: User[];
  refreshUsers: () => void;
  userRoleName: string;
}

const VerifyWiseContext = createContext<VerifyWiseContextProps>({
  uiValues: {},
  setUiValues: () => {},
  authValues: {},
  setAuthValues: () => {},
  dashboardValues: {},
  setDashboardValues: () => {},
  inputValues: {},
  setInputValues: () => {},
  token: null,
  projectStatus: defaultProjectStatus,
  loadingProjectStatus: false,
  errorFetchingProjectStatus: false,
  currentProjectId: "",
  setCurrentProjectId: () => {},
  userId: null,
  projects: [],
  setProjects: () => {},
  componentsVisible: { home: false, sidebar: false, projectFrameworks: false, compliance: false },
  changeComponentVisibility: () => {},
  users: [],
  refreshUsers: () => {},
  userRoleName: "",
});

export { VerifyWiseContext };
