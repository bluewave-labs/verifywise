import React, { createContext } from "react";
import { defaultProjectStatus, ProjectStatus } from "../hooks/useProjectStatus";
import { Project } from "../../domain/Project";

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
  userId: string;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
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
  userId: "",
  projects: [],
  setProjects: () => {},
});

export { VerifyWiseContext };
