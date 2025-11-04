import { ReactNode } from "react";
import { RiskModel } from "../models/Common/risks/risk.model";
import { IFilterState } from "./i.filter";
import { Project } from "../types/Project";
import { Framework } from "../types/Framework";

export interface IRisk {
  id: number;
  title: string;
  status: string;
  severity: string;
}

export interface IRiskCategoriesProps {
  risks: RiskModel[];
  selectedRisk?: RiskModel | null;
  onRiskSelect?: (risk: RiskModel) => void;
}

export interface IRiskFiltersProps {
  risks: RiskModel[];
  onFilterChange: (
    filteredRisks: RiskModel[],
    activeFilters: IFilterState
  ) => void;
}

export interface IRiskHeatMapProps {
  risks: RiskModel[];
  onRiskSelect?: (risk: RiskModel) => void;
  selectedRisk?: RiskModel | null;
}

export interface IRiskTimelineProps {
  risks: RiskModel[];
  selectedRisk?: RiskModel | null;
  onRiskSelect?: (risk: RiskModel) => void;
}

export interface IRiskVisualizationTabsProps {
  risks: RiskModel[];
  selectedRisk?: RiskModel | null;
  onRiskSelect?: (risk: RiskModel) => void;
}

export interface IVWProjectRisksTable {
  rows: RiskModel[];
  setSelectedRow: (risk: RiskModel) => void;
  setAnchor: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  onDeleteRisk: (id: number) => void;
  setPage: (pageNo: number) => void;
  page: number;
  flashRow: number | null;
}

export interface IVWProjectRisksTableRow {
  rows: RiskModel[];
  page: number;
  rowsPerPage: number;
  setSelectedRow: (risk: RiskModel) => void;
  setAnchor: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  onDeleteRisk: (id: number) => void;
  flashRow: number | null;
}

export interface IRisksViewProps {
  // Function to fetch risks - should return Promise<RiskModel[]>
  fetchRisks: (filter?: string) => Promise<RiskModel[]>;
  // Title to display above the risks table
  title: string;
  // Optional header content (e.g., framework toggle)
  headerContent?: ReactNode;
  // Refresh key for forcing re-fetches
  refreshTrigger?: number;
}

export interface IRiskLoadingStatus {
  loading: boolean;
  message: string;
}

export interface IFrameworkRisksProps {
  organizationalProject: Project;
  filteredFrameworks: Framework[];
  selectedFramework: number;
  onFrameworkSelect: (index: number) => void;
}
