import { Project } from "../types/Project";
import { Framework } from "../types/Framework";

/**
 * Core risk interface - pure domain type
 */
export interface IRisk {
  id: number;
  title: string;
  status: string;
  severity: string;
}

/**
 * Risk loading status - pure domain type
 */
export interface IRiskLoadingStatus {
  loading: boolean;
  message: string;
}

/**
 * Framework risks props - pure domain type
 */
export interface IFrameworkRisksProps {
  organizationalProject: Project;
  filteredFrameworks: Framework[];
  selectedFramework: number;
  onFrameworkSelect: (index: number) => void;
}

// Note: Presentation-specific interfaces (IRiskCategoriesProps, IRiskFiltersProps,
// IRiskHeatMapProps, IRiskTimelineProps, IRiskVisualizationTabsProps,
// IVWProjectRisksTable, IVWProjectRisksTableRow, IRisksViewProps) have been moved to:
// presentation/types/interfaces/i.risk.ts
