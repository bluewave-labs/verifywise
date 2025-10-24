export interface IProjectFilterState {
  riskLevel: string;
  owner: string;
  status: string;
}

export interface IProjectFiltersProps {
  projects: any[];
  onFilterChange: (filteredProjects: any[], filters: IProjectFilterState) => void;
}