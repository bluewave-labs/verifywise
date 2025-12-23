import {
  Assessments,
  Controls,
} from "../types/projectStatus.types";
import { Project } from "../types/Project";
import { ProjectRiskMitigation } from "../types/ProjectRisk";

export interface IProjectListProps {
  projects: Project[];
  newProjectButton?: React.ReactNode;
  onFilterChange?: (filteredProjects: Project[], filters: any) => void;
}

export interface IProjectTableViewProps {
  projects: Project[];
  hidePagination?: boolean;
}

export interface IProjectRiskMitigationProps {
  onClose: () => void;
  annexCategories: ProjectRiskMitigation[];
  subClauses: ProjectRiskMitigation[];
  assessments: ProjectRiskMitigation[];
  controls: ProjectRiskMitigation[];
  annexControls_27001: ProjectRiskMitigation[];
  subClauses_27001: ProjectRiskMitigation[];
}

export interface IProjectCardProps {
  id: number;
  uc_id?: string;
  project_title: string;
  owner: string;
  assessments: Assessments;
  controls: Controls;
  last_updated: string;
}
