import { Project } from "../types/Project";

export interface IProjectListProps {
  projects: Project[];
  newProjectButton?: React.ReactNode;
}

export interface IProjectTableViewProps {
  projects: Project[];
}
