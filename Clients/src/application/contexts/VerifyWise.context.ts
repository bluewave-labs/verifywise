import React, { createContext } from "react";
import { defaultProjectStatus, ProjectStatus } from "../hooks/useProjectStatus";
import { Project } from "../../domain/types/Project";
import { ComponentVisible } from "../../application/interfaces/ComponentVisible";
import { User } from "../../domain/types/User";

export interface Organization {
  id:number;
  name:string;
  logo?:string;
}

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
  organizationData: Organization | null;
  setOrganizationData: React.Dispatch<
    React.SetStateAction<Organization | null>
  >;
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
  organizationData: null,
  setOrganizationData: () => {},
});

export { VerifyWiseContext };
