import React, { createContext } from "react";
import { defaultProjectStatus, ProjectStatus } from "../hooks/useProjectStatus";
import { Project } from "../../domain/types/Project";
import { ComponentVisible } from "../../application/interfaces/ComponentVisible";
import { User } from "../../domain/types/User";
import { UIValues, AuthValues, InputValues, DashboardState } from "../interfaces/appStates";

interface VerifyWiseContextProps {
  uiValues: UIValues;
  setUiValues: (values: UIValues | React.SetStateAction<UIValues>) => void;
  authValues: AuthValues;
  setAuthValues: (values: AuthValues | React.SetStateAction<AuthValues>) => void;
  dashboardValues: DashboardState;
  setDashboardValues: (values: DashboardState | React.SetStateAction<DashboardState>) => void;
  inputValues: InputValues;
  setInputValues: (values: InputValues | React.SetStateAction<InputValues>) => void;
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
  organizationId: number | null;
}

const VerifyWiseContext = createContext<VerifyWiseContextProps>({
  uiValues: {},
  setUiValues: () => {},
  authValues: {},
  setAuthValues: () => {},
  dashboardValues: {
    dashboard: {},
    projects: {},
    compliance: {},
    assessments: {},
    vendors: []
  },
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
  organizationId: null,
});

export { VerifyWiseContext };
