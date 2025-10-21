import { ProjectRisk } from "../types/ProjectRisk";
import { IFilterState } from "./i.filter";

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

export interface IRiskFiltersProps {
  risks: ProjectRisk[];
  onFilterChange: (
    filteredRisks: ProjectRisk[],
    activeFilters: IFilterState
  ) => void;
}
