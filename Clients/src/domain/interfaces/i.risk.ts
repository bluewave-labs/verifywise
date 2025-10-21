import { ProjectRisk } from "../types/ProjectRisk";

export interface IRisk {
  id: number;
  title: string;
  status: string;
  severity: string;
}

export interface IRiskCategoriesProps {
  risks: ProjectRisk[];
  selectedRisk?: ProjectRisk | null;
  onRiskSelect?: (risk: ProjectRisk) => void;
}
