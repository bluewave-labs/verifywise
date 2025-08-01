// Type definitions for risk dashboard components
export interface VendorRiskSummary {
  veryHighRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  veryLowRisks: number;
}

export interface ProjectRiskSummary {
  veryHighRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  veryLowRisks: number;
  totalRisks: number;
}

export interface RiskChartData {
  id: string;
  label: string;
  value: number;
  color: string;
}

// Props types
export interface VendorRisksCardProps {
  projectId?: string;
  onViewDetails?: () => void;
}

export interface ProjectRisksCardProps {
  projectId?: string;
  onViewDetails?: () => void;
}

export interface RiskCardProps {
  title: string;
  totalRisks: number;
  chartData: RiskChartData[];
  onViewDetails?: () => void;
  loading?: boolean;
}